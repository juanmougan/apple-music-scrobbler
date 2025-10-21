import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Track {
  name: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  playerPosition: number; // in seconds
  playerState: 'playing' | 'paused' | 'stopped';
}

export async function getCurrentTrack(): Promise<Track | null> {
  const script = `
    tell application "Music"
      try
        set currentState to player state as string
        if currentState is "stopped" then
          return "stopped"
        end if

        try
          set trackName to name of current track
          set trackArtist to artist of current track
          set trackAlbum to album of current track
          set trackDuration to duration of current track
          set trackPosition to player position

          return trackName & "|" & trackArtist & "|" & trackAlbum & "|" & trackDuration & "|" & trackPosition & "|" & currentState
        on error trackError
          return "no_track_access"
        end try
      on error generalError
        return "general_error"
      end try
    end tell
  `;

  try {
    console.log('🔍 Checking Apple Music...');
    const { stdout } = await execAsync(`osascript -e '${script}'`);
    const result = stdout.trim();
    console.log('📱 AppleScript response:', result);

    if (result === 'stopped') {
      console.log('⏹️  Apple Music is stopped');
      return null;
    }

    if (result === 'no_track') {
      console.log('❌ No current track available');
      return null;
    }

    if (result === 'no_track_access') {
      console.log('🚫 Cannot access current track (may be radio/podcast/stream)');
      return null;
    }

    if (result === 'error' || result === 'general_error') {
      console.log('⚠️  AppleScript error occurred');
      return null;
    }

    const parts = result.split('|');
    if (parts.length !== 6) {
      console.warn('⚠️  Unexpected AppleScript response format:', result);
      return null;
    }

    const [name, artist, album, duration, position, state] = parts;

    const track = {
      name,
      artist,
      album,
      duration: Math.floor(parseFloat(duration)),
      playerPosition: Math.floor(parseFloat(position)),
      playerState: state.toLowerCase() as 'playing' | 'paused' | 'stopped',
    };

    console.log(`🎵 Track detected: ${artist} - ${name} [${state}]`);
    console.log(`📀 Album: ${album}, Duration: ${track.duration}s, Position: ${track.playerPosition}s`);

    return track;
  } catch (error) {
    console.error('❌ Error getting current track:', error);
    return null;
  }
}
