#!/usr/bin/env bash

# Stop Warehouse Manager offline services (ports 3001, 5173 and optional MySQL shutdown)

echo "Stopping Warehouse Manager services..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

if [ "$1" == "--all" ] || [ "$1" == "--mysql" ]; then
  echo "Shutting down MySQL daemon..."
  /usr/local/mysql/bin/mysqladmin -u root -S /tmp/mysql.sock shutdown 2>/dev/null || true
fi

echo "All services stopped."
