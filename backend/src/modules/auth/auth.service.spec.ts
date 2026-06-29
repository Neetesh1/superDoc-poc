import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../config/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = { id: '1', email: 'test@lrn.com', name: 'Test User', password: '', role: 'editor' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: { user: { findUnique: jest.fn(), create: jest.fn() } } },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('mock-token') } },
      ],
    }).compile();

    service = module.get(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('throws UnauthorizedException if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', password: 'pass' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const hashed = await bcrypt.hash('correct', 12);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, password: hashed });
      await expect(service.login({ email: mockUser.email, password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });

    it('returns token on valid credentials', async () => {
      const hashed = await bcrypt.hash('correct', 12);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, password: hashed });
      const result = await service.login({ email: mockUser.email, password: 'correct' });
      expect(result.accessToken).toBe('mock-token');
    });
  });

  describe('register', () => {
    it('throws ConflictException if email taken', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      await expect(service.register({ email: mockUser.email, name: 'X', password: 'pass123' })).rejects.toThrow(ConflictException);
    });

    it('creates user and returns token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      const result = await service.register({ email: mockUser.email, name: mockUser.name, password: 'pass123' });
      expect(result.accessToken).toBe('mock-token');
    });
  });
});
