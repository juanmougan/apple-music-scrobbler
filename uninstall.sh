#!/bin/bash

SERVICE_NAME="com.apple-music-lastfm-scrobbler"
PLIST_PATH="$HOME/Library/LaunchAgents/${SERVICE_NAME}.plist"

echo "🗑️  Apple Music Last.fm Scrobbler Uninstaller"
echo "============================================="

# Check if service is running and stop it
if launchctl list | grep -q "$SERVICE_NAME"; then
    echo "🛑 Stopping service..."
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    echo "✅ Service stopped"
else
    echo "ℹ️  Service is not currently running"
fi

# Remove plist file
if [ -f "$PLIST_PATH" ]; then
    echo "🗑️  Removing service configuration..."
    rm "$PLIST_PATH"
    echo "✅ Service configuration removed"
else
    echo "ℹ️  Service configuration not found"
fi

# Remove log files
LOG_PATH="$HOME/Library/Logs/${SERVICE_NAME}.log"
ERROR_LOG_PATH="$HOME/Library/Logs/${SERVICE_NAME}.error.log"

if [ -f "$LOG_PATH" ]; then
    rm "$LOG_PATH"
    echo "✅ Log file removed"
fi

if [ -f "$ERROR_LOG_PATH" ]; then
    rm "$ERROR_LOG_PATH"
    echo "✅ Error log file removed"
fi

echo ""
echo "✅ Uninstallation complete!"
echo ""
echo "📝 Note: Project files and dependencies remain intact."
echo "   To completely remove the project, delete this directory."
echo ""