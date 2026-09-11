#!/bin/bash
# ==============================================================================
# Local $0.00 Serving Script for PhysioTwin LLM Model (Ollama & vLLM)
# ==============================================================================

echo "=========================================="
echo "🤖 PhysioTwin AI Local Serving Options"
echo "=========================================="

# Option 1: Register and Serve with Ollama
echo ""
echo "--- Option A: Serving via Ollama ---"
echo "Step 1: Create local Ollama model registry entry"
echo "$ ollama create physiotwin -f ./Modelfile"
echo ""
echo "Step 2: Run interactive session or API server"
echo "$ ollama run physiotwin"
echo ""
echo "API Endpoint will be live at: http://localhost:11434/api/chat"

# Option 2: High-Throughput Serving via vLLM
echo ""
echo "--- Option B: Serving via vLLM (High-Throughput OpenAI API Compatible) ---"
echo "$ python -m vllm.entrypoints.openai.api_server \\"
echo "    --model ./quantized_gguf/physiotwin-q4_k_m.gguf \\"
echo "    --port 8000 \\"
echo "    --max-model-len 4096"
echo ""
echo "API Endpoint will be live at: http://localhost:8000/v1/chat/completions"
