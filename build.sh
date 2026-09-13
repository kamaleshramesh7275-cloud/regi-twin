#!/usr/bin/env bash
# Render Unified Build Script for PhysioTwin (Backend + Frontend)
set -o errexit

echo "==> 1. Installing backend Python dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "==> 2. Installing frontend Node dependencies & building PWA dist..."
npm --prefix frontend install
npm --prefix frontend run build

echo "==> 3. Build completed successfully!"
