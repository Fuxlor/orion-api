import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../database/db.js';

// Middleware pour vérifier qu'un utilisateur a un rôle spécifique
export const requireRole = (allowedRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Not authenticated'
      });
    }

    const hasRole = request.user.roles.some(role => 
      allowedRoles.includes(role)
    );

    if (!hasRole) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Requires one of: ${allowedRoles.join(', ')}`
      });
    }
  };
};

// Middleware pour vérifier qu'un utilisateur a une permission spécifique
export const requirePermission = (resource: string, action: string) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Not authenticated'
      });
    }

    try {
      // Récupérer les permissions de l'utilisateur depuis la DB
      const result = await db.query(
        `SELECT p.resource, p.action
         FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         JOIN user_roles ur ON ur.role_id = rp.role_id
         WHERE ur.user_id = $1
           AND p.resource = $2
           AND p.action = $3`,
        [request.user.userId, resource, action]
      );

      if (result.rows.length === 0) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: `Missing permission: ${resource}:${action}`
        });
      }
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Permission check failed'
      });
    }
  };
};
