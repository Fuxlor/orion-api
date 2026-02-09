import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../shared/database/db.js';
import { getPrivateKey, getPublicKey } from '../../shared/crypto/keys.js';
import { 
  User, 
  AuthTokens, 
  LoginRequest, 
  RegisterRequest,
  JWTPayload 
} from '../../shared/types/index.js';

const SALT_ROUNDS = 10;

export const authService = {
  // Register new user
  async register(data: RegisterRequest): Promise<AuthTokens> {
    // Vérifier si l'email existe déjà
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already exists');
    }

    const existingPseudo = await db.query(
      'SELECT id FROM users WHERE pseudo = $1',
      [data.pseudo]
    );

    if (existingPseudo.rows.length > 0) {
      throw new Error('Pseudo already exists');
    }
    // Hash le mot de passe
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Créer l'utilisateur
    const result = await db.query<User>(
      `INSERT INTO users (first_name, last_name, pseudo, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, first_name, last_name, pseudo, email, created_at, updated_at`,
      [data.firstName, data.lastName, data.pseudo, data.email, passwordHash]
    );

    const user = result.rows[0];

    // Générer token (signé avec clé PRIVÉE)
    const accessToken = this.generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        pseudo: user.pseudo,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };
  },

  // Login user
  async login(data: LoginRequest): Promise<AuthTokens> {
    // Récupérer l'utilisateur
    const result = await db.query<User>(
      `SELECT id, first_name, last_name, pseudo, email, password_hash, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [data.email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(data.password, user.password_hash);
    
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Générer token (signé avec clé PRIVÉE)
    const accessToken = this.generateToken({
      userId: user.id,
      email: user.email
    });

    return {
      accessToken,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        pseudo: user.pseudo,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };
  },

  // Générer JWT token avec clé PRIVÉE (RS256)
  generateToken(payload: string | Buffer | object): string {
    const privateKey = getPrivateKey();

    return jwt.sign(payload, privateKey, {
      algorithm: 'RS256',  // Asymétrique (au lieu de HS256)
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    } as jwt.SignOptions);
  },

  // Vérifier token avec clé PUBLIQUE (RS256)
  verifyToken(token: string): JWTPayload {
    const publicKey = getPublicKey();

    return jwt.verify(token, publicKey, {
      algorithms: ['RS256']  // Seulement RS256 accepté
    }) as JWTPayload;
  }
};
