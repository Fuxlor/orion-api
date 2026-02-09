import { FastifyRequest, FastifyReply } from 'fastify';
import { usersService } from './users.service.js';

export const usersController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const users = await usersService.getAll();
    return reply.send({ users });
  },

  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const id = parseInt(request.params.id);
    
    if (isNaN(id)) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid user ID'
      });
    }

    const user = await usersService.getById(id);
    
    if (!user) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    return reply.send({ user });
  },

  async assignRole(
    request: FastifyRequest<{ 
      Params: { id: string };
      Body: { roleId: number }
    }>,
    reply: FastifyReply
  ) {
    const userId = parseInt(request.params.id);
    const { roleId } = request.body;

    if (isNaN(userId) || !roleId) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid user ID or role ID'
      });
    }

    await usersService.assignRole(userId, roleId);
    
    return reply.status(200).send({
      message: 'Role assigned successfully'
    });
  }
};
