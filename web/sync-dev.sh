#!/bin/bash

echo "🔄 Starting development sync mode..."
echo "📁 Watching for changes in current directory..."
echo "🌐 Changes will automatically sync to skynerd.io"
echo "⏹️  Press Ctrl+C to stop"

# Function to sync changes
sync_changes() {
    echo "🔄 Changes detected! Syncing to live domain..."
    npm run sync
    echo "✅ Sync complete! Changes should appear on skynerd.io in a few minutes."
}

# Watch for changes and sync
fswatch -o . | while read f; do
    sync_changes
done
