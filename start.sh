#!/bin/bash

if [ ! -d "dist" ] || [ "$FORCE_REBUILD" = "1" ]; then
  echo "Building web app..."
  rm -rf dist .expo/web/cache
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="$EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY" bunx expo export --platform web --clear
fi

echo "Starting server..."
bun run server.ts
