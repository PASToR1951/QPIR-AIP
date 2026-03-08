#!/bin/bash

# QPIR-AIP Development Launcher
# Starts both the React frontend and Deno backend server

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Starting QPIR-AIP Development Environment..."
echo ""

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Deno is not installed. Please install it first: curl -fsSL https://deno.land/install.sh | sh"
    exit 1
fi

# Check if Node.js/npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Node.js/npm is not installed. Please install it first."
    exit 1
fi

# Start the backend server in background
echo "📦 Starting backend server..."
cd "$SCRIPT_DIR/server"
deno run --allow-net --allow-read --allow-env server.ts > /dev/null 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# Start the frontend dev server
echo "🎨 Starting React frontend..."
cd "$SCRIPT_DIR/react-app"
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to initialize
sleep 5

echo ""
echo "✅ Both servers started!"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:5173 (or next available port)"
echo ""
echo "Press Ctrl+C to stop all servers"

# Handle shutdown
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    wait
    echo "✅ All servers stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
