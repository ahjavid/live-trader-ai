#!/bin/bash

# Launch script for Aistock Python backend
# This script activates the virtual environment and starts the Python application

echo "🚀 Launching Aistock Backend..."
echo "================================"

# Navigate to Aistock directory
cd /home/codepulse/Projects/Aistock || { echo "❌ Error: Aistock directory not found"; exit 1; }

# Activate virtual environment
echo "📦 Activating virtual environment..."
source /home/codepulse/Projects/Aistock/.venv/bin/activate || { echo "❌ Error: Failed to activate .venv"; exit 1; }

# Verify activation
if [ -z "$VIRTUAL_ENV" ]; then
    echo "❌ Error: Virtual environment not activated"
    exit 1
fi

echo "✅ Virtual environment activated: $VIRTUAL_ENV"

# Launch the Python application
echo "🐍 Starting Python application..."
python -m src.main

# Deactivate on exit (optional)
# deactivate
