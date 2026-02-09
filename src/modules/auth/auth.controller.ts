import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';
import { LoginRequest, RegisterRequest } from '../../shared/types/index.js';

export const authController = {
  async register(
    request: FastifyRequest<{ Body: RegisterRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { firstName, lastName, pseudo, email, password } = request.body;

      // Validation basique
      if (!email || !password) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Email and password are required'
        });
      }

      if (!firstName || !lastName || !pseudo) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'First name, last name and pseudo are required'
        });
      }

      if (password.length < 8) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Password must be at least 8 characters'
        });
      }

      const result = await authService.register({ firstName, lastName, pseudo, email, password });
      
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Email already exists') {
        return reply.status(409).send({
          error: 'Conflict',
          message: error.message
        });
      } else if (error instanceof Error && error.message === 'Pseudo already exists') {
        return reply.status(409).send({
          error: 'Conflict',
          message: error.message
        });
      }
      throw error;
    }
  },

  async login(
    request: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Email and password are required'
        });
      }

      const result = await authService.login({ email, password });
      
      return reply.send(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: error.message
        });
      }
      throw error;
    }
  },

  async me(request: FastifyRequest, reply: FastifyReply) {
    // Cette route nécessite l'authentification
    return reply.send({
      user: request.user
    });
  }
};
