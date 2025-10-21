import axios from 'axios';
import crypto from 'crypto';
import { config } from 'dotenv';

config();

const API_KEY = process.env.LASTFM_API_KEY!;
const API_SECRET = process.env.LASTFM_API_SECRET!;

function generateSignature(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys
    .map(key => `${key}${params[key]}`)
    .join('');
  
  return crypto
    .createHash('md5')
    .update(signatureString + API_SECRET)
    .digest('hex');
}

async function getToken(): Promise<string> {
  const response = await axios.get('https://ws.audioscrobbler.com/2.0/', {
    params: {
      method: 'auth.getToken',
      api_key: API_KEY,
      format: 'json',
    },
  });
  return response.data.token;
}

async function getSession(token: string): Promise<string> {
  const params = {
    method: 'auth.getSession',
    api_key: API_KEY,
    token,
  };

  const signature = generateSignature(params);

  const response = await axios.get('https://ws.audioscrobbler.com/2.0/', {
    params: {
      ...params,
      api_sig: signature,
      format: 'json',
    },
  });

  return response.data.session.key;
}

async function main() {
  if (!API_KEY || !API_SECRET) {
    console.error('❌ Error: Missing API credentials');
    console.error('Please set LASTFM_API_KEY and LASTFM_API_SECRET in .env file');
    console.error('Get them from: https://www.last.fm/api/account/create');
    process.exit(1);
  }

  try {
    console.log('🔑 Getting authentication token...');
    const token = await getToken();
    
    const authUrl = `http://www.last.fm/api/auth/?api_key=${API_KEY}&token=${token}`;
    
    console.log('\n🔐 Please authorize the application by visiting this URL:');
    console.log('\x1b[36m%s\x1b[0m', authUrl);
    console.log('\n👆 Click the link above, then press ENTER after authorizing...');
    
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('\n⏳ Getting session key...');
    const sessionKey = await getSession(token);
    
    console.log('\n✅ Success! Your session key is:');
    console.log('\x1b[32m%s\x1b[0m', sessionKey);
    console.log('\n📝 Add this to your .env file as:');
    console.log('LASTFM_SESSION_KEY=' + sessionKey);
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

main();
