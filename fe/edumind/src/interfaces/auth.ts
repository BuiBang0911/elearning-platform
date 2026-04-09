export interface LoginRequest {
  email: string
  password: string
  role: UserRole
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
}

export interface RegisterRequest {
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
}

export interface UserResponse {
  id: number; 
  email: string;
  fullName: string;
  role: UserRole;
  isDelete: boolean;
  createdAt: string; 
}

export const UserRole = {
  STUDENT: 1,
  INSTRUCTOR: 2,
  ADMIN: 3
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];