#!/bin/sh
echo "Building static web files..."
npm run build --prefix ./client
echo "Running server..."
gunicorn -b 10.0.0.176:8080 --chdir ./backend --worker-class eventlet -w 1 server:app