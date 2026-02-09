import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/register', authController.register);
  fastify.post('/login', authController.login);

  // Protected routes
  fastify.get('/me', {
    preHandler: [authenticate]
  }, authController.me);
}
