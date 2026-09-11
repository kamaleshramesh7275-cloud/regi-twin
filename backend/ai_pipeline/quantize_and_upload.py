"""
Model Quantization & Cloud Backup Script
----------------------------------------
Converts fine-tuned PyTorch / QLoRA weights into:
1. GGUF 4-bit Medium (`q4_k_m`) - Optimal balance of memory & speed for local serving
2. GGUF 8-bit (`q8_0`) - Maximum precision for production servers

Then automatically uploads model files directly to your private Hugging Face Hub repository.
"""

import os
import shutil
import argparse
from huggingface_hub import HfApi

def quantize_gguf(model_path: str, output_dir: str):
    """Uses Unsloth's native GGUF conversion routines."""
    print("\n==========================================")
    print("📦 Starting Model Quantization to GGUF Formats")
    print("==========================================")
    
    try:
        from unsloth import FastLanguageModel
    except ImportError:
        print("Error: Unsloth is required for native GGUF conversion.")
        print("Run: pip install unsloth")
        return
        
    print(f"Loading aligned model from {model_path}...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=model_path,
        max_seq_length=4096,
        load_in_4bit=True
    )
    
    # 1. Save 4-bit GGUF (q4_k_m)
    q4_path = os.path.join(output_dir, "physiotwin-q4_k_m.gguf")
    print(f"--> Exporting 4-bit GGUF (q4_k_m) to: {q4_path}")
    model.save_pretrained_gguf(
        output_dir, 
        tokenizer, 
        quantization_method="q4_k_m"
    )
    
    # 2. Save 8-bit GGUF (q8_0)
    q8_path = os.path.join(output_dir, "physiotwin-q8_0.gguf")
    print(f"--> Exporting 8-bit GGUF (q8_0) to: {q8_path}")
    model.save_pretrained_gguf(
        output_dir, 
        tokenizer, 
        quantization_method="q8_0"
    )
    
    print("[OK] Quantization complete!")

def upload_to_huggingface(output_dir: str, repo_id: str, token: str):
    """Uploads quantized GGUF models, adapter configs, and ONNX pose model to HF Hub."""
    print("\n==========================================")
    print(f"Uploading Fine-Tuned Weights to Hugging Face Hub: {repo_id}")
    print("==========================================")
    
    api = HfApi()
    
    # Create private repository if it doesn't exist
    try:
        api.create_repo(repo_id=repo_id, token=token, private=True, exist_ok=True)
        print(f"[OK] Target Repository '{repo_id}' ready (Private).")
    except Exception as e:
        print(f"Note creating repo: {e}")
        
    # Copy model.onnx to output folder if present in frontend/public/
    onnx_src = os.path.abspath(os.path.join(output_dir, "../../frontend/public/model.onnx"))
    if os.path.exists(onnx_src):
        shutil.copy(onnx_src, os.path.join(output_dir, "model.onnx"))
        print(f"[OK] Copied ONNX pose model to upload directory.")
        
    print(f"Uploading files from '{output_dir}'...")
    api.upload_folder(
        folder_path=output_dir,
        repo_id=repo_id,
        repo_type="model",
        token=token,
    )
    print(f"\n[OK] Permanent Cloud Backup Complete! Accessible at: https://huggingface.co/{repo_id}")

def main():
    parser = argparse.ArgumentParser(description="Quantize and Upload Fine-Tuned Model")
    parser.add_argument("--model_path", type=str, default="./outputs/final_aligned_model", help="Path to aligned PyTorch model")
    parser.add_argument("--output_dir", type=str, default="./quantized_gguf", help="Output directory for GGUF files")
    parser.add_argument("--repo_id", type=str, help="Hugging Face Repo ID (e.g. username/physiotwin-7b-gguf)")
    parser.add_argument("--hf_token", type=str, help="Hugging Face API Write Token (HF_TOKEN)")
    
    args = parser.parse_args()
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Run Quantization
    quantize_gguf(args.model_path, args.output_dir)
    
    # Run HF Upload if credentials provided
    token = args.hf_token or os.getenv("HF_TOKEN")
    if args.repo_id and token:
        upload_to_huggingface(args.output_dir, args.repo_id, token)
    else:
        print("\n💡 Skipping Hugging Face cloud backup (No --repo_id or HF_TOKEN provided).")
        print("To upload later, run:")
        print(f"  python quantize_and_upload.py --repo_id YOUR_USERNAME/physiotwin-gguf --hf_token hf_xxxxx")

if __name__ == "__main__":
    main()
