import bcrypt from 'bcryptjs';
import { prisma } from '../prisma/client';
import { generateToken } from '../utils/jwt';
import { Role } from '../config/constants';
import { AppError } from '../middleware/errorHandler';

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role: Role | string;
  specialty?: string;
  department?: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export class AuthService {
  static async register(dto: RegisterDto) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new AppError('A user with this email address already exists', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        name: dto.name,
        role: dto.role as any,
        ...(dto.role === Role.PROVIDER
          ? {
              provider: {
                create: {
                  specialty: dto.specialty || 'General Practice',
                  department: dto.department || 'Outpatient Clinic',
                  phone: dto.phone,
                },
              },
            }
          : {}),
      },
      include: {
        provider: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      providerId: (user as any).provider?.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        provider: (user as any).provider,
      },
      token,
    };
  }

  static async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: { provider: true },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      providerId: user.provider?.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        provider: user.provider,
      },
      token,
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { provider: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      provider: user.provider,
    };
  }

  static async getAllProviders() {
    return prisma.provider.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { user: { name: 'asc' } },
    });
  }
}
