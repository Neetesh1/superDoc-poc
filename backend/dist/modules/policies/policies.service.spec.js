"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const policies_service_1 = require("./policies.service");
describe('PoliciesService', () => {
    let service;
    let prisma;
    beforeEach(() => {
        prisma = {
            policy: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
            policyVersion: {
                findFirst: jest.fn(),
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            auditLog: {
                create: jest.fn(),
            },
        };
        service = new policies_service_1.PoliciesService(prisma);
    });
    describe('uploadDocx', () => {
        it('creates a new current version from the uploaded DOCX', async () => {
            const policyId = 'policy-1';
            const userId = 'user-1';
            const summary = 'Updated exclusions';
            const file = {
                path: './uploads/policy-1.docx',
                originalname: 'policy.docx',
            };
            const createdVersion = {
                id: 'version-2',
                policyId,
                versionNo: 2,
                docxPath: file.path,
                changeSummary: summary,
                createdBy: userId,
                createdAt: new Date(),
            };
            prisma.policy.findUnique.mockResolvedValue({
                id: policyId,
                permissions: [{ userId }],
            });
            prisma.policyVersion.findFirst.mockResolvedValue({ versionNo: 1 });
            prisma.policyVersion.create.mockResolvedValue(createdVersion);
            prisma.policy.update.mockResolvedValue({ id: policyId });
            prisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });
            await expect(service.uploadDocx(policyId, file, userId, summary)).resolves.toBe(createdVersion);
            expect(prisma.policyVersion.create).toHaveBeenCalledWith({
                data: {
                    policyId,
                    versionNo: 2,
                    docxPath: file.path,
                    changeSummary: summary,
                    createdBy: userId,
                },
            });
            expect(prisma.policy.update).toHaveBeenCalledWith({
                where: { id: policyId },
                data: { currentVersionId: createdVersion.id },
            });
            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: {
                    policyId,
                    userId,
                    action: 'version.uploaded',
                    metadataJson: { versionNo: 2, file: file.originalname, summary },
                },
            });
        });
    });
    describe('saveCurrentDocx', () => {
        it('updates the existing current version without creating a new version', async () => {
            const policyId = 'policy-1';
            const userId = 'user-1';
            const versionId = 'version-1';
            const file = {
                path: './uploads/policy-1-autosave.docx',
                originalname: 'autosave.docx',
            };
            const updatedVersion = {
                id: versionId,
                policyId,
                versionNo: 1,
                docxPath: file.path,
                changeSummary: null,
                createdBy: userId,
                createdAt: new Date(),
            };
            prisma.policy.findUnique.mockResolvedValue({
                id: policyId,
                currentVersionId: versionId,
                permissions: [{ userId }],
            });
            prisma.policyVersion.findUnique.mockResolvedValue({ id: versionId, policyId });
            prisma.policyVersion.update.mockResolvedValue(updatedVersion);
            prisma.policy.update.mockResolvedValue({ id: policyId });
            prisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });
            await expect(service.saveCurrentDocx(policyId, file, userId, versionId)).resolves.toBe(updatedVersion);
            expect(prisma.policyVersion.update).toHaveBeenCalledWith({
                where: { id: versionId },
                data: { docxPath: file.path },
            });
            expect(prisma.policyVersion.create).not.toHaveBeenCalled();
            expect(prisma.policy.update).toHaveBeenCalledWith({
                where: { id: policyId },
                data: { currentVersionId: versionId },
            });
            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: {
                    policyId,
                    userId,
                    action: 'version.autosaved',
                    metadataJson: { versionId, file: file.originalname },
                },
            });
        });
    });
});
//# sourceMappingURL=policies.service.spec.js.map