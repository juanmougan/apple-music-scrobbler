import { SwiftMusicService, Track } from './swiftMusicService';
import { LastFmClient } from './lastfm';

interface ScrobbleState {
  trackId: string;
  scrobbled: boolean;
  startTime: number;
}

export class Scrobbler {
  private lastFm: LastFmClient;
  private musicService: SwiftMusicService;
  private currentState: ScrobbleState | null = null;

  constructor(lastFm: LastFmClient) {
    this.lastFm = lastFm;
    this.musicService = new SwiftMusicService();
  }

  private getTrackId(track: Track): string {
    return `${track.artist}|${track.name}|${track.album}`;
  }

  private shouldScrobble(track: Track, state: ScrobbleState): boolean {
    const playedDuration = Date.now() - state.startTime;
    const playedSeconds = Math.floor(playedDuration / 1000);
    
    // Scrobble after 50% of duration or 4 minutes, whichever comes first
    const requiredDuration = Math.min(track.duration * 0.5, 240);
    
    return playedSeconds >= requiredDuration && !state.scrobbled;
  }

  async run(): Promise<void> {
    console.log('🎵 Apple Music Last.fm Scrobbler started');
    console.log('🚀 Starting Swift-based music detection...\n');

    // Set up event listeners
    this.musicService.on('trackChanged', (track: Track) => {
      this.handleTrackChanged(track);
    });

    this.musicService.on('stateChanged', (state: string) => {
      this.handleStateChanged(state);
    });

    this.musicService.on('trackStopped', () => {
      this.handleTrackStopped();
    });

    // Start the Swift music service
    this.musicService.start();

    // Set up periodic scrobble checking
    setInterval(() => {
      this.checkScrobbleStatus();
    }, 10000); // Check every 10 seconds
  }

  stop(): void {
    this.musicService.stop();
  }

  private async handleTrackChanged(track: Track): Promise<void> {
    const trackId = this.getTrackId(track);

    console.log(`\n🎧 Now playing: ${track.artist} - ${track.name}`);
    console.log(`   Album: ${track.album}`);
    console.log(`   Duration: ${Math.floor(track.duration)}s`);

    this.currentState = {
      trackId,
      scrobbled: false,
      startTime: Date.now(),
    };

    // Update "Now Playing" on Last.fm
    const success = await this.lastFm.updateNowPlaying(track.artist, track.name, track.album);
    if (success) {
      console.log('📡 Updated "Now Playing" on Last.fm');
    }
  }

  private handleStateChanged(state: string): void {
    if (state !== 'playing' && this.currentState) {
      console.log(`⏸️  Playback ${state}, pausing scrobble tracking`);
    }
  }

  private handleTrackStopped(): void {
    if (this.currentState) {
      console.log('⏹️  Playback stopped, clearing state');
      this.currentState = null;
    }
  }

  private async checkScrobbleStatus(): Promise<void> {
    const track = this.musicService.getCurrentTrack();

    if (!track || !this.currentState || track.playerState !== 'playing') {
      return;
    }

    // Check if we should scrobble
    if (this.shouldScrobble(track, this.currentState)) {
      console.log(`\n✅ Scrobbling: ${track.artist} - ${track.name}`);

      const success = await this.lastFm.scrobble({
        artist: track.artist,
        track: track.name,
        album: track.album,
        timestamp: Math.floor(this.currentState.startTime / 1000),
      });

      if (success) {
        console.log('✨ Successfully scrobbled to Last.fm!');
        this.currentState.scrobbled = true;
      } else {
        console.log('❌ Failed to scrobble');
      }
    } else {
      const playedSeconds = Math.floor((Date.now() - this.currentState.startTime) / 1000);
      const requiredSeconds = Math.floor(Math.min(track.duration * 0.5, 240));
      console.log(`⏱️  Progress: ${playedSeconds}/${requiredSeconds}s until scrobble`);
    }
  }
}
