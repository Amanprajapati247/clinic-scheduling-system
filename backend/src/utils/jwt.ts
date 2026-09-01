import jwt from 'jsonwebtoken';
import { Role } from '../config/constants';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role | string;
  providerId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'clinic-super-secret-jwt-key-change-in-production-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
