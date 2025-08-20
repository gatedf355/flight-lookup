#!/bin/bash

echo "🚀 Syncing localhost to live domain..."

# Build the project
echo "📦 Building project..."
npm run build

# Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."
npx wrangler pages deploy .next --project-name skynerd-ui --commit-dirty=true

echo "✅ Sync complete! Changes should appear on skynerd.io in a few minutes."
echo "🔍 Check deployment status at: https://dash.cloudflare.com/pages"
