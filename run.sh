#!/usr/bin/env bash
#
# Pramaan AI — start the FastAPI backend and the Next.js frontend together.
#
#   ./run.sh
#
# Backend  : http://localhost:8000  (API docs at /docs)
# Frontend : http://localhost:3000
#
# Ctrl-C stops both.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# Resolve the Python interpreter: prefer the project venv, fall back to python3.
if [ -x "$ROOT_DIR/.venv/bin/python" ]; then
  PYTHON="$ROOT_DIR/.venv/bin/python"
else
  PYTHON="$(command -v python3 || true)"
  if [ -z "$PYTHON" ]; then
    echo "error: no Python interpreter found (looked for .venv/bin/python and python3)" >&2
    exit 1
  fi
  echo "note: .venv not found, using $PYTHON"
fi

if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
  echo "==> Installing frontend dependencies (first run)…"
  (cd "$ROOT_DIR/frontend" && npm install)
fi

# Track child PIDs so a single Ctrl-C tears down both servers.
PIDS=()

cleanup() {
  echo ""
  echo "==> Shutting down…"
  for pid in "${PIDS[@]:-}"; do
    # Kill the whole process group: uvicorn --reload and next dev both fork.
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "==> Starting backend on http://localhost:$BACKEND_PORT"
setsid "$PYTHON" -m uvicorn src.api:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload &
PIDS+=($!)

echo "==> Starting frontend on http://localhost:$FRONTEND_PORT"
(cd "$ROOT_DIR/frontend" && setsid npm run dev -- --port "$FRONTEND_PORT") &
PIDS+=($!)

echo ""
echo "    Backend   http://localhost:$BACKEND_PORT  (docs: /docs)"
echo "    Frontend  http://localhost:$FRONTEND_PORT"
echo "    Ctrl-C to stop both."
echo ""

# Exit as soon as either server dies, so a crashed backend doesn't go unnoticed.
wait -n
echo "==> A server exited; stopping the other."
