#!/bin/bash

# Launch script for Live Trader AI Frontend
# This script activates the conda environment and starts the Vite dev server

echo "🚀 Launching Live Trader AI Frontend..."
echo "======================================="

# Navigate to project directory
cd /home/codepulse/Projects/Live\ Trader\ AI || { echo "❌ Error: Live Trader AI directory not found"; exit 1; }

# Initialize conda for bash (if not already done)
if [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
    source "$HOME/miniconda3/etc/profile.d/conda.sh"
elif [ -f "$HOME/anaconda3/etc/profile.d/conda.sh" ]; then
    source "$HOME/anaconda3/etc/profile.d/conda.sh"
else
    echo "⚠️  Warning: Conda initialization script not found. Trying direct conda command..."
fi

# Activate conda environment
echo "📦 Activating conda environment 'live-trader-ai'..."
conda activate live-trader-ai || { echo "❌ Error: Failed to activate conda environment 'live-trader-ai'"; exit 1; }

# Verify activation
if [ -z "$CONDA_DEFAULT_ENV" ]; then
    echo "❌ Error: Conda environment not activated"
    exit 1
fi

echo "✅ Conda environment activated: $CONDA_DEFAULT_ENV"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install || { echo "❌ Error: Failed to install dependencies"; exit 1; }
fi

# Launch the Vite dev server (it will automatically open the browser)
echo "⚡ Starting Vite dev server..."
echo "🌐 Browser will open automatically at http://localhost:3000"
echo ""
npm run dev
