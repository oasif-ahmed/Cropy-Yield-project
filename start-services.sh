#!/usr/bin/env bash
# Start all three services: ML, backend, frontend
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
ML_PORT=8001
BACKEND_PORT=5001
FRONTEND_PORT=5173

# Start ML service
echo "Starting ML service (port $ML_PORT)..."
if [ -d "$ROOT/ml-service/venv" ]; then
  (cd "$ROOT/ml-service" && exec ./venv/bin/uvicorn main:app --host 0.0.0.0 --port "$ML_PORT") &
else
  echo "  ⚠️  ML service venv not found. Run: cd ml-service && bash setup.sh"
fi
ML_PID=$!

# Start backend
echo "Starting backend (port $BACKEND_PORT)..."
(cd "$ROOT/backend" && exec npm run start) &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend (port $FRONTEND_PORT)..."
(cd "$ROOT/frontend" && exec npm run dev) &
FRONTEND_PID=$!

echo ""
echo "All services starting:"
echo "  ML:       http://localhost:$ML_PORT  (health: /api/health)"
echo "  Backend:  http://localhost:$BACKEND_PORT  (health: /api/health)"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "Press Ctrl+C to stop all services..."

trap 'kill $ML_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null || true' INT TERM EXIT

wait