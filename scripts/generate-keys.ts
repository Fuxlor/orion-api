import { generateKeyPairSync } from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const keysDir = join(__dirname, '..', 'keys');

// Créer le dossier keys s'il n'existe pas
if (!existsSync(keysDir)) {
  mkdirSync(keysDir, { recursive: true });
}

console.log('🔐 Génération des clés RSA...');

// Générer la paire de clés RSA
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Sauvegarder les clés
const privateKeyPath = join(keysDir, 'private.pem');
const publicKeyPath = join(keysDir, 'public.pem');

writeFileSync(privateKeyPath, privateKey);
writeFileSync(publicKeyPath, publicKey);

console.log('✅ Clés générées avec succès !');
console.log(`   Clé privée (encrypt/sign): ${privateKeyPath}`);
console.log(`   Clé publique (decrypt/verify): ${publicKeyPath}`);
console.log('');
console.log('⚠️  IMPORTANT:');
console.log('   - Garde la clé privée SECRÈTE');
console.log('   - Ne commite JAMAIS private.pem dans Git');
console.log('   - La clé publique peut être partagée');
