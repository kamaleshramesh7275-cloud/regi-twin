"""
Unsloth 2-Stage Fine-Tuning Script (Stage 1: SFT, Stage 2: DPO)
--------------------------------------------------------------
Trains open-weights models (Qwen2.5 7B/14B, Llama 3.1 8B) 4x faster with minimal VRAM using QLoRA.
- Stage 1: Supervised Fine-Tuning (SFT) for domain knowledge & structured JSON adherence.
- Stage 2: Direct Preference Optimization (DPO) to eliminate hallucinations and enforce safety guardrails.
"""

import os
import torch
from datasets import load_dataset

# Fallback imports with descriptive instructions
import sys
try:
    from unsloth import FastLanguageModel, PatchDPOTrainer
    from trl import SFTTrainer, DPOTrainer
    from transformers import TrainingArguments
    PatchDPOTrainer() # Apply DPO patch from Unsloth
except ImportError as e:
    print(f"\n[ERROR] Required packages missing or failed to load: {e}")
    print("Please install required dependencies in Colab using:")
    print("!pip install \"unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git\"")
    print("!pip install --no-deps trl peft accelerate bitsandbytes datasets")
    sys.exit(1)

# Model configuration
MAX_SEQ_LENGTH = 4096
DTYPE = None # Auto-detect Float16 / Bfloat16
LOAD_IN_4BIT = True # 4-bit QLoRA for minimal VRAM footprint
DEFAULT_MODEL_NAME = "unsloth/Qwen2.5-7B-Instruct-bnb-4bit"

def train_stage1_sft(model, tokenizer, sft_dataset_path: str, output_dir: str):
    """Stage 1: Supervised Fine-Tuning"""
    print("\n==========================================")
    print("Stage 1: Starting Supervised Fine-Tuning (SFT)")
    print("==========================================")
    
    dataset = load_dataset("json", data_files=sft_dataset_path, split="train")
    
    # Format messages into ChatML prompt string format for SFTTrainer
    def formatting_prompts_func(examples):
        convos = examples["messages"]
        texts = []
        for convo in convos:
            try:
                # Apply model tokenizer chat template if available
                text = tokenizer.apply_chat_template(convo, tokenize=False, add_generation_prompt=False)
            except Exception:
                # Fallback ChatML manual formatter
                text = ""
                for msg in convo:
                    text += f"<|im_start|>{msg['role']}\n{msg['content']}<|im_end|>\n"
            texts.append(text)
        return {"text": texts}

    dataset = dataset.map(formatting_prompts_func, batched=True)
    
    # Target all linear projection modules for QLoRA
    model = FastLanguageModel.get_peft_model(
        model,
        r=16,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_alpha=16,
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=3407,
    )
    
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=MAX_SEQ_LENGTH,
        dataset_num_proc=2,
        packing=False,
        args=TrainingArguments(
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            warmup_steps=5,
            max_steps=30, # Increase for production runs (e.g. 300-1000)
            learning_rate=2e-4,
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            logging_steps=1,
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="cosine",
            seed=3407,
            output_dir=os.path.join(output_dir, "stage1_sft_checkpoints"),
        ),
    )
    
    trainer_stats = trainer.train()
    print("[OK] Stage 1 SFT Completed successfully!")
    
    # Save intermediate SFT model
    sft_model_path = os.path.join(output_dir, "sft_fused_model")
    model.save_pretrained(sft_model_path)
    tokenizer.save_pretrained(sft_model_path)
    return model, tokenizer

def train_stage2_dpo(model, tokenizer, dpo_dataset_path: str, output_dir: str):
    """Stage 2: Direct Preference Optimization (DPO) Alignment"""
    print("\n==========================================")
    print("Stage 2: Starting Direct Preference Optimization (DPO)")
    print("==========================================")
    
    dpo_dataset = load_dataset("json", data_files=dpo_dataset_path, split="train")
    
    dpo_trainer = DPOTrainer(
        model=model,
        ref_model=None, # Unsloth handles implicit reference model without doubling VRAM
        processing_class=tokenizer,
        beta=0.1,
        train_dataset=dpo_dataset,
        max_length=MAX_SEQ_LENGTH,
        max_prompt_length=2048,
        args=TrainingArguments(
            per_device_train_batch_size=1,
            gradient_accumulation_steps=8,
            warmup_ratio=0.1,
            max_steps=20, # Increase for production alignment (e.g. 100-300)
            learning_rate=5e-6,
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            logging_steps=1,
            optim="adamw_8bit",
            seed=3407,
            output_dir=os.path.join(output_dir, "stage2_dpo_checkpoints"),
        ),
    )
    
    dpo_trainer.train()
    print("[OK] Stage 2 DPO Alignment Completed successfully!")
    
    final_model_path = os.path.join(output_dir, "final_aligned_model")
    model.save_pretrained(final_model_path)
    tokenizer.save_pretrained(final_model_path)
    print(f"\nModel training complete! Aligned weights saved to: {final_model_path}")

def main():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    sft_path = os.path.join(base_dir, "dataset_sft.jsonl")
    dpo_path = os.path.join(base_dir, "dataset_dpo.jsonl")
    output_dir = os.path.join(base_dir, "outputs")
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Loading Base Foundation Model: {DEFAULT_MODEL_NAME}...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=DEFAULT_MODEL_NAME,
        max_seq_length=MAX_SEQ_LENGTH,
        dtype=DTYPE,
        load_in_4bit=LOAD_IN_4BIT,
    )
    
    # Run Stage 1 SFT
    model, tokenizer = train_stage1_sft(model, tokenizer, sft_path, output_dir)
    
    # Run Stage 2 DPO
    train_stage2_dpo(model, tokenizer, dpo_path, output_dir)

if __name__ == "__main__":
    main()
