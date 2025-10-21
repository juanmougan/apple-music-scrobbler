# Apple Music Last.fm Scrobbler

A simple command-line scrobbler that submits your Apple Music listening history to Last.fm.

## Features

- ✅ Scrobbles tracks after 50% played (or 4 minutes, whichever comes first)
- ✅ Updates "Now Playing" status on Last.fm
- ✅ Avoids duplicate scrobbles
- ✅ Simple command-line interface
- ✅ TypeScript implementation

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Last.fm API Credentials

1. Go to https://www.last.fm/api/account/create
2. Create a new API application
3. Note down your **API Key** and **API Secret**

### 3. Configure Environment

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

### 4. Get Session Key

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

### Start the scrobbler

```bash
npm start
```

Or for development mode:

```bash
npm run dev
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
