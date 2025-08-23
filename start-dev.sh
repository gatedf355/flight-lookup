#!/bin/bash

# FlightLookup Development Startup Script
# This script starts both the backend and frontend servers

echo "🚀 Starting FlightLookup Development Environment..."

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
echo "📡 Starting backend server on port 4000..."
cd server
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting frontend server on port 3000..."
cd web
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Both servers are starting up..."
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:4000"
echo "🏥 Health Check: http://localhost:3000/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
