import axios from 'axios';
import crypto from 'crypto';

export interface LastFmConfig {
  apiKey: string;
  apiSecret: string;
  sessionKey: string;
}

export interface ScrobbleTrack {
  artist: string;
  track: string;
  album?: string;
  timestamp: number;
}

export class LastFmClient {
  private apiKey: string;
  private apiSecret: string;
  private sessionKey: string;
  private baseUrl = 'https://ws.audioscrobbler.com/2.0/';

  constructor(config: LastFmConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.sessionKey = config.sessionKey;
  }

  private generateSignature(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort();
    const signatureString = sortedKeys
      .map(key => `${key}${params[key]}`)
      .join('');
    
    return crypto
      .createHash('md5')
      .update(signatureString + this.apiSecret)
      .digest('hex');
  }

  async scrobble(track: ScrobbleTrack): Promise<boolean> {
    const params: Record<string, string> = {
      method: 'track.scrobble',
      api_key: this.apiKey,
      sk: this.sessionKey,
      artist: track.artist,
      track: track.track,
      timestamp: track.timestamp.toString(),
    };

    if (track.album) {
      params.album = track.album;
    }

    const signature = this.generateSignature(params);
    params.api_sig = signature;
    params.format = 'json';

    console.log('📡 Sending scrobble request to Last.fm...');
    console.log('📋 Request params:', {
      method: params.method,
      artist: params.artist,
      track: params.track,
      album: params.album,
      timestamp: params.timestamp,
    });

    try {
      const response = await axios.post(this.baseUrl, null, {
        params,
      });

      console.log('📬 Last.fm scrobble response:', response.data);

      if (response.data.error) {
        console.error('❌ Last.fm API error:', response.data.message);
        return false;
      }

      console.log('✅ Scrobble request successful');
      return true;
    } catch (error: any) {
      console.error('❌ Error scrobbling to Last.fm:', error);
      if (error.response) {
        console.error('📬 Response status:', error.response.status);
        console.error('📬 Response data:', error.response.data);
      }
      return false;
    }
  }

  async updateNowPlaying(artist: string, track: string, album?: string): Promise<boolean> {
    const params: Record<string, string> = {
      method: 'track.updateNowPlaying',
      api_key: this.apiKey,
      sk: this.sessionKey,
      artist,
      track,
    };

    if (album) {
      params.album = album;
    }

    const signature = this.generateSignature(params);
    params.api_sig = signature;
    params.format = 'json';

    console.log('📡 Sending "Now Playing" update to Last.fm...');
    console.log('📋 Request params:', {
      method: params.method,
      artist: params.artist,
      track: params.track,
      album: params.album,
    });

    try {
      const response = await axios.post(this.baseUrl, null, { params });
      console.log('📬 Last.fm "Now Playing" response:', response.data);

      if (response.data.error) {
        console.error('❌ Last.fm API error:', response.data.message);
        return false;
      }

      console.log('✅ "Now Playing" update successful');
      return true;
    } catch (error: any) {
      console.error('❌ Error updating now playing:', error);
      if (error.response) {
        console.error('📬 Response status:', error.response.status);
        console.error('📬 Response data:', error.response.data);
      }
      return false;
    }
  }
}
