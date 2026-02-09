import { FastifyInstance } from 'fastify';
import { usersController } from './users.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { requirePermission, requireRole } from '../../shared/middlewares/authorize.js';

export async function usersRoutes(fastify: FastifyInstance) {
  // Toutes les routes nécessitent l'authentification
  fastify.addHook('preHandler', authenticate);

  // GET /api/users - Liste tous les users (nécessite permission users:read)
  fastify.get('/', {
    preHandler: [requirePermission('users', 'read')]
  }, usersController.getAll);

  // GET /api/users/:id - Détails d'un user
  fastify.get('/:id', {
    preHandler: [requirePermission('users', 'read')]
  }, usersController.getById);

  // POST /api/users/:id/roles - Assigner un rôle (nécessite rôle admin)
  fastify.post('/:id/roles', {
    preHandler: [requireRole(['admin'])]
  }, usersController.assignRole);
}
