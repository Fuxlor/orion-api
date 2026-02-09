import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../shared/database/db.js';
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

    // Hash le mot de passe
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Créer l'utilisateur
    const result = await db.query<User>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at, updated_at`,
      [data.email, passwordHash]
    );

    const user = result.rows[0];

    // Assigner le rôle 'user' par défaut
    await db.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE name = 'user'`,
      [user.id]
    );

    // Générer token
    const accessToken = this.generateToken({
      userId: user.id,
      email: user.email,
      roles: ['user']
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };
  },

  // Login user
  async login(data: LoginRequest): Promise<AuthTokens> {
    // Récupérer l'utilisateur avec ses rôles
    const result = await db.query<User & { roles: string[] }>(
      `SELECT u.id, u.email, u.password_hash, u.created_at, u.updated_at,
              ARRAY_AGG(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.email = $1
       GROUP BY u.id`,
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

    // Générer token
    const accessToken = this.generateToken({
      userId: user.id,
      email: user.email,
      roles: user.roles || []
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };
  },

  // Générer JWT token
  generateToken(payload: JWTPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  },

  // Vérifier token
  verifyToken(token: string): JWTPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    return jwt.verify(token, secret) as JWTPayload;
  }
};
