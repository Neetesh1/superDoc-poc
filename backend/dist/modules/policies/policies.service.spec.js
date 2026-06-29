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
                create: jest.fn(),
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
});
//# sourceMappingURL=policies.service.spec.js.map