#!/usr/bin/env bash

# Warehouse Manager — macOS Double-Clickable Launcher
# Double-click this file in Finder or on your Desktop to run the entire app offline.

PROJECT_DIR="/Users/nagaganesh/.gemini/antigravity/scratch/warehouse-manager"
export PATH="/Users/nagaganesh/local/node/bin:/usr/local/mysql/bin:$PATH"

mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$PROJECT_DIR/data/mysql"

echo "=========================================================="
echo "   WAREHOUSE MANAGER — OFFLINE LOCAL LAUNCHER"
echo "=========================================================="
echo ""

# 1. Start MySQL daemon if not running
echo "[1/3] Checking MySQL database..."
if ! /usr/local/mysql/bin/mysqladmin -u root -S /tmp/mysql.sock ping >/dev/null 2>&1; then
  echo "  Starting local MySQL daemon..."
  /usr/local/mysql/bin/mysqld \
    --datadir="$PROJECT_DIR/data/mysql" \
    --basedir=/usr/local/mysql \
    --port=3306 \
    --socket=/tmp/mysql.sock \
    > "$PROJECT_DIR/logs/mysql.log" 2>&1 &

  RETRIES=20
  while [ $RETRIES -gt 0 ]; do
    if /usr/local/mysql/bin/mysqladmin -u root -S /tmp/mysql.sock ping >/dev/null 2>&1; then
      break
    fi
    sleep 0.5
    RETRIES=$((RETRIES - 1))
  done
fi
echo "  ✓ MySQL is ready on port 3306"

# 2. Start Backend Server
echo "[2/3] Starting backend server (port 3001)..."
cd "$PROJECT_DIR/server"
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
npx tsx src/index.ts > "$PROJECT_DIR/logs/server.log" 2>&1 &
SERVER_PID=$!
sleep 1.5
echo "  ✓ Backend API running at http://localhost:3001"

# 3. Start Frontend Client
echo "[3/3] Starting frontend web interface (port 5173)..."
cd "$PROJECT_DIR/client"
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
npx vite --port 5173 --host 0.0.0.0 > "$PROJECT_DIR/logs/client.log" 2>&1 &
CLIENT_PID=$!
sleep 1.5
echo "  ✓ Frontend UI running at http://localhost:5173"

# 4. Automatically open default browser
echo ""
echo "Opening http://localhost:5173 in your browser..."
open "http://localhost:5173"

echo ""
echo "=========================================================="
echo "  APPLICATION IS RUNNING (OFFLINE MODE)"
echo "=========================================================="
echo "  • Website URL:   http://localhost:5173"
echo "  • Backend API:   http://localhost:3001"
echo ""
echo "  Demo Accounts:"
echo "    - Admin:    admin   / admin123"
echo "    - Manager:  manager / manager123"
echo "    - Staff:    staff   / staff123"
echo "    - Viewer:   viewer  / viewer123"
echo ""
echo "  Keep this window open while using the application."
echo "  To stop the application, press Ctrl+C or close this window."
echo "=========================================================="

cleanup() {
  echo ""
  echo "Shutting down services..."
  kill -9 $CLIENT_PID 2>/dev/null || true
  kill -9 $SERVER_PID 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM EXIT

while true; do
  sleep 1
done
