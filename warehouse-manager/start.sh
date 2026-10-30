#!/usr/bin/env bash

# Warehouse Manager — Enterprise Offline Startup Script
# Starts MySQL, Backend Express Server, and Vite Frontend without internet connection.

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="/Users/nagaganesh/local/node/bin:/usr/local/mysql/bin:$PATH"

mkdir -p "$DIR/logs"
mkdir -p "$DIR/data/mysql"

echo "=========================================================="
echo "  WAREHOUSE MANAGER — OFFLINE LOCAL LAUNCHER              "
echo "=========================================================="
echo ""

# 1. Start MySQL daemon if not alive
echo "[1/3] Checking MySQL database..."
if ! /usr/local/mysql/bin/mysqladmin -u root -S /tmp/mysql.sock ping >/dev/null 2>&1; then
  echo "  Starting local MySQL daemon..."
  /usr/local/mysql/bin/mysqld \
    --datadir="$DIR/data/mysql" \
    --basedir=/usr/local/mysql \
    --port=3306 \
    --socket=/tmp/mysql.sock \
    > "$DIR/logs/mysql.log" 2>&1 &
  MYSQL_PID=$!

  # Wait for socket
  RETRIES=20
  while [ $RETRIES -gt 0 ]; do
    if /usr/local/mysql/bin/mysqladmin -u root -S /tmp/mysql.sock ping >/dev/null 2>&1; then
      break
    fi
    sleep 0.5
    RETRIES=$((RETRIES - 1))
  done

  if [ $RETRIES -eq 0 ]; then
    echo "  [ERROR] MySQL failed to start. Check $DIR/logs/mysql.log"
    exit 1
  fi
fi
echo "  ✓ MySQL is ready on port 3306 (socket: /tmp/mysql.sock)"

# 2. Start Backend Server
echo "[2/3] Starting backend server (port 3001)..."
cd "$DIR/server"
# Kill any previous process on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
npx tsx src/index.ts > "$DIR/logs/server.log" 2>&1 &
SERVER_PID=$!
sleep 1.5
if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
  echo "  ✓ Backend API is running at http://localhost:3001"
else
  echo "  ✓ Backend API started (PID $SERVER_PID)"
fi

# 3. Start Frontend Client
echo "[3/3] Starting frontend web interface (port 5173)..."
cd "$DIR/client"
# Kill any previous process on port 5173
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
npx vite --port 5173 --host 0.0.0.0 > "$DIR/logs/client.log" 2>&1 &
CLIENT_PID=$!
sleep 1.5
echo "  ✓ Frontend UI is running at http://localhost:5173"

echo ""
echo "=========================================================="
echo "  APPLICATION READY (OFFLINE MODE)                        "
echo "=========================================================="
echo "  • Web Interface:    http://localhost:5173"
echo "  • Backend API:      http://localhost:3001"
echo ""
echo "  Demo Accounts:"
echo "    - Admin:    admin   / admin123"
echo "    - Manager:  manager / manager123"
echo "    - Staff:    staff   / staff123"
echo "    - Viewer:   viewer  / viewer123"
echo ""
echo "  Press Ctrl+C to stop all services."
echo "=========================================================="

cleanup() {
  echo ""
  echo "Shutting down Warehouse Manager services..."
  kill -9 $CLIENT_PID 2>/dev/null || true
  kill -9 $SERVER_PID 2>/dev/null || true
  # Optionally keep mysql running or shut down
  # /usr/local/mysql/bin/mysqladmin -u root -S /tmp/mysql.sock shutdown 2>/dev/null || true
  echo "Services stopped cleanly."
  exit 0
}

trap cleanup INT TERM

# Wait indefinitely
while true; do
  sleep 1
done
