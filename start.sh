#!/bin/sh
echo "Building static web files..."
npm run build --prefix ./client
echo "Running server..."
gunicorn -b localhost:8080 --chdir ./backend --worker-class eventlet -w 1 server:app