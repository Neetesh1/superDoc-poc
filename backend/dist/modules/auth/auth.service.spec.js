"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("./auth.service");
const prisma_service_1 = require("../../config/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
describe('AuthService', () => {
    let service;
    let prisma;
    let jwtService;
    const mockUser = { id: '1', email: 'test@lrn.com', name: 'Test User', password: '', role: 'editor' };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: prisma_service_1.PrismaService, useValue: { user: { findUnique: jest.fn(), create: jest.fn() } } },
                { provide: jwt_1.JwtService, useValue: { sign: jest.fn().mockReturnValue('mock-token') } },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        prisma = module.get(prisma_service_1.PrismaService);
        jwtService = module.get(jwt_1.JwtService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('login', () => {
        it('throws UnauthorizedException if user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(service.login({ email: 'x@x.com', password: 'pass' })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('throws UnauthorizedException for wrong password', async () => {
            const hashed = await bcrypt.hash('correct', 12);
            prisma.user.findUnique.mockResolvedValue({ ...mockUser, password: hashed });
            await expect(service.login({ email: mockUser.email, password: 'wrong' })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('returns token on valid credentials', async () => {
            const hashed = await bcrypt.hash('correct', 12);
            prisma.user.findUnique.mockResolvedValue({ ...mockUser, password: hashed });
            const result = await service.login({ email: mockUser.email, password: 'correct' });
            expect(result.accessToken).toBe('mock-token');
        });
    });
    describe('register', () => {
        it('throws ConflictException if email taken', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            await expect(service.register({ email: mockUser.email, name: 'X', password: 'pass123' })).rejects.toThrow(common_1.ConflictException);
        });
        it('creates user and returns token', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue(mockUser);
            const result = await service.register({ email: mockUser.email, name: mockUser.name, password: 'pass123' });
            expect(result.accessToken).toBe('mock-token');
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map