#!/bin/bash

if [ ! -d "dist" ]; then
  echo "Building web app..."
  bunx expo export --platform web
fi

echo "Starting server..."
bun run server.ts
