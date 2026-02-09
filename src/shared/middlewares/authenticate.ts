import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/index.js';

// Étendre le type FastifyRequest pour inclure user
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    // Récupérer le token depuis le header
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier le token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    // Attacher l'utilisateur à la requête
    request.user = decoded;

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Token expired'
      });
    }
    
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};
