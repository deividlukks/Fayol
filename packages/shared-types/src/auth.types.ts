export enum InvestorProfile {
  CONSERVATIVE = 'CONSERVATIVE',
  MODERATE = 'MODERATE',
  AGGRESSIVE = 'AGGRESSIVE',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  investorProfile: InvestorProfile;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: Omit<User, 'password' | 'isActive' | 'updatedAt'>;
  accessToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  investorProfile: InvestorProfile;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}
