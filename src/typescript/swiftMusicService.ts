import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { EventEmitter } from 'events';

export interface Track {
  name: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  playerPosition: number; // in seconds
  playerState: 'playing' | 'paused' | 'stopped';
}

interface TrackEvent {
  type: string;
  timestamp: number;
  data?: TrackData;
}

interface TrackData {
  name?: string;
  artist?: string;
  album?: string;
  playerState?: string;
  totalTime?: number;
  elapsedTime?: number;
}

export class SwiftMusicService extends EventEmitter {
  private swiftProcess: ChildProcess | null = null;
  private currentTrack: Track | null = null;

  constructor() {
    super();
  }

  start(): void {
    const swiftScriptPath = path.join(process.cwd(), 'src/swift/now_playing.swift');

    console.log('🚀 Starting Swift music listener...');
    this.swiftProcess = spawn('swift', [swiftScriptPath], {
      stdio: ['inherit', 'pipe', 'pipe']
    });

    this.swiftProcess.stdout?.setEncoding('utf8');
    this.swiftProcess.stdout?.on('data', (data: string) => {
      this.handleSwiftOutput(data);
    });

    this.swiftProcess.stderr?.on('data', (data) => {
      console.error('❌ Swift process error:', data.toString());
    });

    this.swiftProcess.on('close', (code) => {
      console.log(`🔴 Swift process exited with code ${code}`);
      this.swiftProcess = null;
    });

    this.swiftProcess.on('error', (error) => {
      console.error('❌ Failed to start Swift process:', error);
      this.swiftProcess = null;
    });
  }

  stop(): void {
    if (this.swiftProcess) {
      console.log('🛑 Stopping Swift music listener...');
      this.swiftProcess.kill();
      this.swiftProcess = null;
    }
  }

  getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  private handleSwiftOutput(data: string): void {
    console.log('🔍 Raw Swift output:', JSON.stringify(data));
    const lines = data.trim().split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      console.log('📄 Processing line:', JSON.stringify(line));

      try {
        const event: TrackEvent = JSON.parse(line);
        console.log('✅ Parsed JSON event:', event);
        this.processEvent(event);
      } catch (error) {
        console.warn('⚠️  Failed to parse Swift JSON:', line, 'Error:', error);
      }
    }
  }

  private processEvent(event: TrackEvent): void {
    console.log('📱 Swift event:', event.type, event.data);

    switch (event.type) {
      case 'music_event':
        this.handleMusicEvent(event);
        break;

      case 'track_info':
      case 'player_state':
        // Legacy support for old event types
        this.handleLegacyEvent(event);
        break;

      case 'unknown':
        console.log('❓ Unknown music event received');
        break;
    }
  }

  private handleMusicEvent(event: TrackEvent): void {
    const data = event.data;
    if (!data) return;

    // Handle player state changes
    if (data.playerState) {
      const state = data.playerState.toLowerCase();
      console.log(`⏯️  Player state: ${state}`);

      if (this.currentTrack) {
        this.currentTrack.playerState = state as 'playing' | 'paused' | 'stopped';
        this.emit('stateChanged', state);
      }

      if (state === 'stopped') {
        this.currentTrack = null;
        this.emit('trackStopped');
        return;
      }
    }

    // Handle track information
    if (data.name && data.artist) {
      console.log(`🎵 Track info: ${data.artist} - ${data.name}`);

      const newTrack: Track = {
        name: data.name,
        artist: data.artist,
        album: data.album || '',
        duration: data.totalTime ? Math.floor(data.totalTime / 1000) : 0,
        playerPosition: data.elapsedTime ? Math.floor(data.elapsedTime / 1000) : 0,
        playerState: data.playerState?.toLowerCase() as 'playing' | 'paused' | 'stopped' || 'playing'
      };

      // Check if this is a new track
      const trackId = `${newTrack.artist}|${newTrack.name}|${newTrack.album}`;
      const currentTrackId = this.currentTrack ?
        `${this.currentTrack.artist}|${this.currentTrack.name}|${this.currentTrack.album}` : null;

      if (trackId !== currentTrackId) {
        console.log(`🎧 New track detected: ${newTrack.artist} - ${newTrack.name}`);
        this.currentTrack = newTrack;
        this.emit('trackChanged', newTrack);
      } else if (this.currentTrack) {
        // Update existing track data
        this.currentTrack = { ...this.currentTrack, ...newTrack };
      }
    }
  }

  private handleLegacyEvent(event: TrackEvent): void {
    // Keep old logic for backward compatibility
    if (event.type === 'track_info' && event.data?.name && event.data?.artist) {
      this.currentTrack = {
        name: event.data.name,
        artist: event.data.artist,
        album: event.data.album || '',
        duration: event.data.totalTime ? Math.floor(event.data.totalTime / 1000) : 0,
        playerPosition: event.data.elapsedTime ? Math.floor(event.data.elapsedTime / 1000) : 0,
        playerState: 'playing'
      };

      console.log(`🎵 Track updated: ${this.currentTrack.artist} - ${this.currentTrack.name}`);
      this.emit('trackChanged', this.currentTrack);
    }

    if (event.type === 'player_state' && event.data?.playerState) {
      const state = event.data.playerState.toLowerCase();

      if (this.currentTrack) {
        this.currentTrack.playerState = state as 'playing' | 'paused' | 'stopped';
        console.log(`⏯️  Player state changed: ${state}`);
        this.emit('stateChanged', state);
      }

      if (state === 'stopped') {
        this.currentTrack = null;
        this.emit('trackStopped');
      }
    }
  }
}