#!/bin/bash

# Launch script to start both backend and frontend simultaneously
# This script runs both services in background with proper logging

echo "🚀 Launching Live Trader AI - Full Stack"
echo "=========================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Create logs directory if it doesn't exist
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

# Log files
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
BACKEND_PID_FILE="$LOG_DIR/backend.pid"
FRONTEND_PID_FILE="$LOG_DIR/frontend.pid"

# Clean up function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
            kill "$BACKEND_PID" 2>/dev/null
            echo "✅ Backend stopped"
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
            kill "$FRONTEND_PID" 2>/dev/null
            echo "✅ Frontend stopped"
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup SIGINT SIGTERM

# Make sure the individual launch scripts are executable
chmod +x "$SCRIPT_DIR/launch-backend.sh"
chmod +x "$SCRIPT_DIR/launch-frontend.sh"

# Check if we're running in a graphical environment with terminal emulator
if [ -n "$DISPLAY" ] || [ -n "$WAYLAND_DISPLAY" ]; then
    # Try to launch in separate terminal windows
    if command_exists gnome-terminal; then
        echo "🖥️  Launching in GNOME Terminal windows..."
        gnome-terminal -- bash -c "$SCRIPT_DIR/launch-backend.sh; exec bash" &
        sleep 2
        gnome-terminal -- bash -c "$SCRIPT_DIR/launch-frontend.sh; exec bash" &
        echo ""
        echo "✅ Launch complete!"
        echo "📍 Backend: Running in separate terminal"
        echo "📍 Frontend: Running in separate terminal"
        exit 0
    elif command_exists konsole; then
        echo "🖥️  Launching in Konsole windows..."
        konsole -e bash -c "$SCRIPT_DIR/launch-backend.sh; exec bash" &
        sleep 2
        konsole -e bash -c "$SCRIPT_DIR/launch-frontend.sh; exec bash" &
        echo ""
        echo "✅ Launch complete!"
        echo "📍 Backend: Running in separate terminal"
        echo "📍 Frontend: Running in separate terminal"
        exit 0
    elif command_exists xterm; then
        echo "🖥️  Launching in xterm windows..."
        xterm -e bash -c "$SCRIPT_DIR/launch-backend.sh; exec bash" &
        sleep 2
        xterm -e bash -c "$SCRIPT_DIR/launch-frontend.sh; exec bash" &
        echo ""
        echo "✅ Launch complete!"
        echo "📍 Backend: Running in separate terminal"
        echo "📍 Frontend: Running in separate terminal"
        exit 0
    fi
fi

# Check for tmux or screen
if command_exists tmux; then
    echo "🖥️  Launching in tmux session..."
    tmux new-session -d -s livetrader "$SCRIPT_DIR/launch-backend.sh"
    tmux split-window -h "$SCRIPT_DIR/launch-frontend.sh"
    echo ""
    echo "✅ Launch complete in tmux!"
    echo "📍 To view: tmux attach-session -t livetrader"
    echo "📍 To detach: Press Ctrl+B, then D"
    echo "📍 To stop: tmux kill-session -t livetrader"
    echo ""
    echo "Attaching to tmux session..."
    sleep 1
    tmux attach-session -t livetrader
    exit 0
elif command_exists screen; then
    echo "🖥️  Launching in screen session..."
    screen -dmS livetrader-backend bash -c "$SCRIPT_DIR/launch-backend.sh"
    screen -dmS livetrader-frontend bash -c "$SCRIPT_DIR/launch-frontend.sh"
    echo ""
    echo "✅ Services launched in screen sessions:"
    echo "   Backend: screen -r livetrader-backend"
    echo "   Frontend: screen -r livetrader-frontend"
    echo "📍 To stop: screen -X -S livetrader-backend quit && screen -X -S livetrader-frontend quit"
    exit 0
fi

# Fallback: Launch in background with logging
echo "🖥️  Launching services in background with logging..."
echo ""

# Start backend
echo "🐍 Starting backend..."
"$SCRIPT_DIR/launch-backend.sh" > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$BACKEND_PID_FILE"
echo "   Backend PID: $BACKEND_PID"
echo "   Backend log: $BACKEND_LOG"

sleep 3

# Start frontend
echo "⚡ Starting frontend..."
"$SCRIPT_DIR/launch-frontend.sh" > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
echo "   Frontend PID: $FRONTEND_PID"
echo "   Frontend log: $FRONTEND_LOG"

echo ""
echo "✅ Services launched in background!"
echo ""
echo "📊 Monitor logs with:"
echo "   Backend:  tail -f $BACKEND_LOG"
echo "   Frontend: tail -f $FRONTEND_LOG"
echo ""
echo "🛑 To stop services:"
echo "   Press Ctrl+C or run: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📍 Tailing logs (Press Ctrl+C to stop)..."
echo "=========================================="
echo ""

# Tail both logs
tail -f "$BACKEND_LOG" "$FRONTEND_LOG" &
TAIL_PID=$!

# Wait for user interrupt
wait $TAIL_PID
