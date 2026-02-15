#!/bin/bash
# Start both Next.js and Socket.IO servers concurrently
npx concurrently \
  --names "next,socket" \
  --prefix-colors "blue,green" \
  "next dev --turbopack" \
  "npx tsx server/index.ts"
