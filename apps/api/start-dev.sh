#!/bin/bash
# Development server startup script
# Handles the monorepo build path issue

cd "$(dirname "$0")"

echo "Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "Build failed!"
  exit 1
fi

# Find the actual main.js location
MAIN_FILE=$(find dist -name "main.js" -type f | head -1)

if [ -z "$MAIN_FILE" ]; then
  echo "Error: Could not find main.js in dist directory"
  exit 1
fi

echo "Starting server from: $MAIN_FILE"
echo ""

node "$MAIN_FILE"

