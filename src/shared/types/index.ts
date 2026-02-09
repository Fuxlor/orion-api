export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
}

export interface UserWithRoles extends Omit<User, 'password_hash'> {
  roles: Role[];
  permissions: Permission[];
}

export interface JWTPayload {
  userId: number;
  email: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  user: Omit<User, 'password_hash'>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}
