# Apple Music Last.fm Scrobbler

A simple command-line scrobbler that submits your Apple Music listening history to Last.fm.

## Human remark

All the code, and the rest of this README, was written by Claude, with ChatGPT doing the Swift script. I just created this tool to solve a very particular issue (scrobble Last.fm's songs from Apple Music), so no refactoring will be done here in the foreseeable future.

## Features

- ✅ Scrobbles tracks after 50% played (or 4 minutes, whichever comes first)
- ✅ Updates "Now Playing" status on Last.fm
- ✅ Avoids duplicate scrobbles
- ✅ Simple command-line interface
- ✅ TypeScript implementation

## Quick Installation

### Automated Installation (Recommended)

Run the installer script to automatically set up the scrobbler as a macOS daemon that starts on boot:

```bash
./install.sh
```

The installer will:
- ✅ Check Node.js version (requires 18.0.0+)
- ✅ Install dependencies
- ✅ Build the project
- ✅ Set up macOS daemon service
- ✅ Configure automatic startup

After installation, follow the setup instructions to configure your Last.fm credentials.

### Manual Installation

If you prefer to install manually:

#### 1. Check Requirements

- Node.js 18.0.0 or higher
- macOS (for Apple Music integration)

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Build Project

```bash
npm run build
```

## Setup

### 1. Get Last.fm API Credentials

1. Go to https://www.last.fm/api/account/create
2. Create a new API application
3. Note down your **API Key** and **API Secret**

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your API credentials:

```env
LASTFM_API_KEY=your_api_key_here
LASTFM_API_SECRET=your_api_secret_here
LASTFM_SESSION_KEY=  # Leave empty for now
```

### 3. Get Session Key

Run the authentication helper:

```bash
npm run auth
```

This will:
1. Generate an authentication URL
2. Open it in your browser (or copy/paste)
3. Ask you to authorize the app
4. Generate your session key

Copy the session key to your `.env` file.

## Usage

### After Automated Installation

The scrobbler runs automatically in the background as a macOS daemon. No need to manually start it!

### Manual Start (Development)

For development or manual testing:

```bash
npm start
```

Or for development mode:

```bash
npm run dev
```

### Service Management

If you used the automated installer, you can manage the daemon service:

```bash
# Check if service is running
launchctl list | grep com.apple-music-lastfm-scrobbler

# View logs
tail -f ~/Library/Logs/com.apple-music-lastfm-scrobbler.log

# Stop service
launchctl unload ~/Library/LaunchAgents/com.apple-music-lastfm-scrobbler.plist

# Start service
launchctl load ~/Library/LaunchAgents/com.apple-music-lastfm-scrobbler.plist

# Uninstall service completely
./uninstall.sh
```

### Grant Permissions

The first time you run the scrobbler, macOS will ask for permission to control the Music app. Click **OK** to allow.

## How It Works

1. Polls Apple Music every 5 seconds to check what's playing
2. When a new track starts, updates "Now Playing" on Last.fm
3. Tracks playback time for each song
4. Scrobbles the track to Last.fm after 50% of the duration (or 4 minutes)
5. Avoids duplicate scrobbles for the same track

## Troubleshooting

**"Error getting current track"**
- Make sure Apple Music is running
- Grant Automation permissions in System Settings → Privacy & Security → Automation

**"Last.fm API error"**
- Check your API credentials in `.env`
- Verify your session key is valid by running `npm run auth` again

**Tracks not scrobbling**
- Songs need to play for at least 50% of their duration
- Check console output for progress updates

## License

MIT
