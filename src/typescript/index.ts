import { config } from 'dotenv';
import { LastFmClient } from './lastfm';
import { Scrobbler } from './scrobbler';

config();

async function main() {
  const apiKey = process.env.LASTFM_API_KEY;
  const apiSecret = process.env.LASTFM_API_SECRET;
  const sessionKey = process.env.LASTFM_SESSION_KEY;

  if (!apiKey || !apiSecret || !sessionKey) {
    console.error('❌ Error: Missing Last.fm credentials');
    console.error('Please set LASTFM_API_KEY, LASTFM_API_SECRET, and LASTFM_SESSION_KEY in .env file');
    console.error('\nRun: npm run auth to get your session key');
    process.exit(1);
  }

  const lastFm = new LastFmClient({
    apiKey,
    apiSecret,
    sessionKey,
  });

  const scrobbler = new Scrobbler(lastFm);
  await scrobbler.run();
}

main().catch(console.error);
