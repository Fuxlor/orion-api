import { db } from '../../shared/database/db.js';
import { UserWithRoles } from '../../shared/types/index.js';

export const usersService = {
  async getAll(): Promise<UserWithRoles[]> {
    const result = await db.query(`
      SELECT 
        u.id, u.email, u.created_at, u.updated_at,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', r.id, 'name', r.name)
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) as roles,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', p.id, 
              'name', p.name,
              'resource', p.resource,
              'action', p.action
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    return result.rows;
  },

  async getById(id: number): Promise<UserWithRoles | null> {
    const result = await db.query(`
      SELECT 
        u.id, u.email, u.created_at, u.updated_at,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', r.id, 'name', r.name)
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) as roles,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', p.id, 
              'name', p.name,
              'resource', p.resource,
              'action', p.action
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = $1
      GROUP BY u.id
    `, [id]);

    return result.rows[0] || null;
  },

  async assignRole(userId: number, roleId: number): Promise<void> {
    await db.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId]
    );
  },

  async removeRole(userId: number, roleId: number): Promise<void> {
    await db.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );
  }
};
