#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="com.apple-music-lastfm-scrobbler"
PLIST_PATH="$HOME/Library/LaunchAgents/${SERVICE_NAME}.plist"

echo "🎵 Apple Music Last.fm Scrobbler Installer"
echo "=========================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to compare version numbers
version_ge() {
    [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$2" ]
}

# Check if Node.js is installed
if ! command_exists node; then
    echo "❌ Node.js is not installed."
    echo "📥 Please install Node.js from https://nodejs.org/"
    echo "   Minimum required version: 18.x"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if ! version_ge "$NODE_VERSION" "$REQUIRED_VERSION"; then
    echo "❌ Node.js version $NODE_VERSION is too old."
    echo "📥 Please upgrade to Node.js $REQUIRED_VERSION or higher."
    echo "   Current version: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js $NODE_VERSION detected"

# Check if npm is available
if ! command_exists npm; then
    echo "❌ npm is not available."
    echo "📥 Please ensure npm is installed with Node.js"
    exit 1
fi

echo "✅ npm detected"

# Install dependencies
echo "📦 Installing dependencies..."
cd "$SCRIPT_DIR"
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if the built file exists
if [ ! -f "$SCRIPT_DIR/dist/index.js" ]; then
    echo "❌ Build failed - dist/index.js not found"
    exit 1
fi

echo "✅ Project built successfully"

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "⚠️  .env file not found."
    echo "📋 You'll need to set up your Last.fm credentials later."
    echo "   Run: cp .env.example .env"
    echo "   Then edit .env with your API credentials"
fi

# Stop existing service if running
if launchctl list | grep -q "$SERVICE_NAME"; then
    echo "🛑 Stopping existing service..."
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
fi

# Create LaunchAgents directory if it doesn't exist
mkdir -p "$HOME/Library/LaunchAgents"

# Create launchd plist
echo "📋 Creating launchd service..."
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${SERVICE_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which node)</string>
        <string>${SCRIPT_DIR}/dist/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${SCRIPT_DIR}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${HOME}/Library/Logs/${SERVICE_NAME}.log</string>
    <key>StandardErrorPath</key>
    <string>${HOME}/Library/Logs/${SERVICE_NAME}.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
EOF

# Load the service
echo "🚀 Loading service..."
launchctl load "$PLIST_PATH"

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Set up your .env file with Last.fm credentials (if not done already)"
echo "   2. Run authentication: npm run auth"
echo "   3. The service will start automatically on system boot"
echo ""
echo "🔧 Service management:"
echo "   • Check status: launchctl list | grep $SERVICE_NAME"
echo "   • View logs: tail -f ~/Library/Logs/${SERVICE_NAME}.log"
echo "   • Stop service: launchctl unload $PLIST_PATH"
echo "   • Start service: launchctl load $PLIST_PATH"
echo ""
echo "🚀 Service is now running in the background!"