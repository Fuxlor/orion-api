import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let privateKey: string;
let publicKey: string;

export const loadKeys = () => {
  try {
    const privateKeyPath = join(__dirname, '../../../keys/private.pem');
    const publicKeyPath = join(__dirname, '../../../keys/public.pem');

    privateKey = readFileSync(privateKeyPath, 'utf8');
    publicKey = readFileSync(publicKeyPath, 'utf8');

    console.log('✅ RSA keys loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load RSA keys');
    console.error('   Run: npm run generate-keys');
    throw new Error('RSA keys not found. Generate them with: npm run generate-keys');
  }
};

export const getPrivateKey = (): string => {
  if (!privateKey) {
    throw new Error('Private key not loaded. Call loadKeys() first.');
  }
  return privateKey;
};

export const getPublicKey = (): string => {
  if (!publicKey) {
    throw new Error('Public key not loaded. Call loadKeys() first.');
  }
  return publicKey;
};
