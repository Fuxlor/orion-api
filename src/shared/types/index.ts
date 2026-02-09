export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  pseudo: string;
  created_at: Date;
  updated_at: Date;
}

export interface JWTPayload {
  userId: number;
  email: string;
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
  firstName: string;
  lastName: string;
  pseudo: string;
  email: string;
  password: string;
}
