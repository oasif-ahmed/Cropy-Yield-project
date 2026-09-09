#!/usr/bin/env bash
# Setup script for the ML Python microservice
set -e

cd "$(dirname "$0")"

# --- Locate a working Python 3 interpreter ---------------------------------
# Prefer Homebrew python3.12 (works without Xcode Command Line Tools).
find_python() {
  for p in \
    /opt/homebrew/opt/python@3.12/libexec/bin/python3 \
    /opt/homebrew/bin/python3.12 \
    /usr/local/bin/python3 \
    /usr/bin/python3 \
    "$(command -v python3 2>/dev/null)"; do
    if [ -n "$p" ] && [ -x "$p" ]; then
      if "$p" -c 'import sys; sys.exit(0)' 2>/dev/null; then
        echo "$p"
        return 0
      fi
    fi
  done
  echo ""
}

PYTHON_BIN="$(find_python)"
if [ -z "$PYTHON_BIN" ]; then
  echo "ERROR: No working Python 3 found."
  echo "Install one of:"
  echo "  brew install python@3.12   (recommended)"
  echo "  xcode-select --install     (for /usr/bin/python3)"
  exit 1
fi
echo "Using Python: $PYTHON_BIN"

# --- OpenMP runtime (required by xgboost on macOS) --------------------------
if [ "$(uname)" = "Darwin" ] && [ ! -e /opt/homebrew/opt/libomp/lib/libomp.dylib ]; then
  if [ -x "$(command -v brew)" ]; then
    echo "=== Installing libomp (OpenMP runtime required by XGBoost) ==="
    brew install libomp || echo "  ⚠️  Unable to install libomp. XGBoost may fail to load."
  else
    echo "  ⚠️  Homebrew not found. XGBoost may fail to load without libomp."
    echo "     Install manually: brew install libomp"
  fi
fi

echo "=== Creating Python virtual environment ==="
"$PYTHON_BIN" -m venv venv

echo "=== Installing dependencies ==="
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

echo "=== Copying .env.example to .env ==="
if [ ! -f .env ]; then
  cp .env.example .env
fi

echo ""
echo "ML service setup complete!"
echo "To start the ML service:"
echo "  cd ml-service"
echo "  ./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001"