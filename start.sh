#!/bin/sh
echo "Building static web files..."
npm run build --prefix ./client
echo "Running server..."
gunicorn --chdir ./backend --worker-class eventlet -w 1 server:app