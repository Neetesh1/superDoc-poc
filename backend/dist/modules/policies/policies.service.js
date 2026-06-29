"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoliciesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const path_1 = require("path");
const fs_1 = require("fs");
const axios_1 = require("axios");
const form_data_1 = require("form-data");
let PoliciesService = class PoliciesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(userId) {
        return this.prisma.policy.findMany({
            where: {
                permissions: { some: { userId } },
            },
            include: { permissions: { include: { user: true } } },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async findOne(id, userId) {
        const policy = await this.prisma.policy.findUnique({
            where: { id },
            include: { permissions: { include: { user: true } } },
        });
        if (!policy)
            throw new common_1.NotFoundException('Policy not found');
        const hasPerm = policy.permissions.some(p => p.userId === userId);
        if (!hasPerm)
            throw new common_1.ForbiddenException('No access to this policy');
        return policy;
    }
    async create(data, userId) {
        const policy = await this.prisma.policy.create({
            data: {
                title: data.title,
                scope: data.scope,
                jurisdiction: data.jurisdiction,
                createdBy: userId,
                permissions: {
                    create: { userId, role: 'editor' },
                },
            },
        });
        await this.prisma.auditLog.create({
            data: { policyId: policy.id, userId, action: 'policy.created', metadataJson: { title: data.title } },
        });
        return policy;
    }
    async update(id, data, userId) {
        await this.findOne(id, userId);
        const policy = await this.prisma.policy.update({ where: { id }, data: data });
        await this.prisma.auditLog.create({
            data: { policyId: id, userId, action: 'policy.updated', metadataJson: data },
        });
        return policy;
    }
    async updateStatus(id, status, userId) {
        await this.findOne(id, userId);
        const policy = await this.prisma.policy.update({ where: { id }, data: { status: status } });
        await this.prisma.auditLog.create({
            data: { policyId: id, userId, action: 'policy.status_changed', metadataJson: { status } },
        });
        return policy;
    }
    async listVersions(policyId, userId) {
        await this.findOne(policyId, userId);
        return this.prisma.policyVersion.findMany({
            where: { policyId },
            orderBy: { versionNo: 'desc' },
            include: { creator: { select: { id: true, name: true } } },
        });
    }
    async uploadDocx(policyId, file, userId, summary = '') {
        await this.findOne(policyId, userId);
        const lastVersion = await this.prisma.policyVersion.findFirst({
            where: { policyId },
            orderBy: { versionNo: 'desc' },
        });
        const versionNo = (lastVersion?.versionNo ?? 0) + 1;
        const version = await this.prisma.policyVersion.create({
            data: { policyId, versionNo, docxPath: file.path, changeSummary: summary || undefined, createdBy: userId },
        });
        await this.prisma.policy.update({ where: { id: policyId }, data: { currentVersionId: version.id } });
        await this.prisma.auditLog.create({
            data: { policyId, userId, action: 'version.uploaded', metadataJson: { versionNo, file: file.originalname, summary } },
        });
        return version;
    }
    async saveCurrentDocx(policyId, file, userId, versionId) {
        const policy = await this.findOne(policyId, userId);
        const targetVersionId = versionId || policy.currentVersionId;
        if (targetVersionId) {
            const existing = await this.prisma.policyVersion.findUnique({ where: { id: targetVersionId } });
            if (!existing || existing.policyId !== policyId)
                throw new common_1.NotFoundException('Policy version not found');
            const version = await this.prisma.policyVersion.update({
                where: { id: targetVersionId },
                data: { docxPath: file.path },
            });
            await this.prisma.policy.update({ where: { id: policyId }, data: { currentVersionId: version.id } });
            await this.prisma.auditLog.create({
                data: { policyId, userId, action: 'version.autosaved', metadataJson: { versionId: version.id, file: file.originalname } },
            });
            return version;
        }
        const version = await this.prisma.policyVersion.create({
            data: { policyId, versionNo: 1, docxPath: file.path, changeSummary: 'Autosaved draft', createdBy: userId },
        });
        await this.prisma.policy.update({ where: { id: policyId }, data: { currentVersionId: version.id } });
        await this.prisma.auditLog.create({
            data: { policyId, userId, action: 'version.autosaved', metadataJson: { versionId: version.id, file: file.originalname } },
        });
        return version;
    }
    async getDocxStream(policyId, versionId, userId) {
        await this.findOne(policyId, userId);
        const version = await this.prisma.policyVersion.findUnique({ where: { id: versionId } });
        if (!version?.docxPath)
            throw new common_1.NotFoundException('DOCX file not found');
        if (!(0, fs_1.existsSync)(version.docxPath))
            throw new common_1.NotFoundException('DOCX file missing from storage');
        await this.prisma.auditLog.create({
            data: { policyId, userId, action: 'version.downloaded', metadataJson: { versionId } },
        });
        return (0, fs_1.createReadStream)(version.docxPath);
    }
    async snapshotVersion(policyId, summary, userId) {
        await this.findOne(policyId, userId);
        const lastVersion = await this.prisma.policyVersion.findFirst({
            where: { policyId },
            orderBy: { versionNo: 'desc' },
        });
        const versionNo = (lastVersion?.versionNo ?? 0) + 1;
        let docxPath;
        if (lastVersion?.docxPath && (0, fs_1.existsSync)(lastVersion.docxPath)) {
            const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
            (0, fs_1.mkdirSync)(uploadDir, { recursive: true });
            const newPath = (0, path_1.join)(uploadDir, `snapshot-${policyId}-v${versionNo}-${Date.now()}.docx`);
            (0, fs_1.copyFileSync)(lastVersion.docxPath, newPath);
            docxPath = newPath;
        }
        const version = await this.prisma.policyVersion.create({
            data: { policyId, versionNo, docxPath, changeSummary: summary, createdBy: userId },
        });
        await this.prisma.auditLog.create({
            data: { policyId, userId, action: 'version.snapshot', metadataJson: { versionNo, summary } },
        });
        return version;
    }
    async exportPdf(policyId, versionId, options, userId) {
        await this.findOne(policyId, userId);
        const version = await this.prisma.policyVersion.findUnique({ where: { id: versionId } });
        if (!version?.docxPath || !(0, fs_1.existsSync)(version.docxPath)) {
            throw new common_1.NotFoundException('DOCX not available for export');
        }
        const apiKey = process.env.SUPERDOC_API_KEY;
        const hasRealKey = apiKey && apiKey !== 'sd_your_api_key_here';
        let pdfBuffer;
        if (hasRealKey) {
            const apiUrl = `${process.env.SUPERDOC_API_URL ?? 'https://api.superdoc.dev/v1'}/convert?from=docx&to=pdf`;
            const fd = new form_data_1.default();
            fd.append('file', (0, fs_1.createReadStream)(version.docxPath), { filename: 'policy.docx' });
            try {
                const response = await axios_1.default.post(apiUrl, fd, {
                    headers: { ...fd.getHeaders(), Authorization: `Bearer ${apiKey}` },
                    responseType: 'arraybuffer',
                    timeout: 60000,
                });
                pdfBuffer = Buffer.from(response.data);
            }
            catch (err) {
                throw new common_1.InternalServerErrorException(`PDF conversion failed: ${err.message}`);
            }
        }
        else {
            const gotenbergUrl = `${process.env.GOTENBERG_URL ?? 'http://localhost:3030'}/forms/libreoffice/convert`;
            const fd = new form_data_1.default();
            fd.append('files', (0, fs_1.createReadStream)(version.docxPath), { filename: 'policy.docx' });
            try {
                const response = await axios_1.default.post(gotenbergUrl, fd, {
                    headers: fd.getHeaders(),
                    responseType: 'arraybuffer',
                    timeout: 60000,
                });
                pdfBuffer = Buffer.from(response.data);
            }
            catch (err) {
                throw new common_1.InternalServerErrorException(`PDF conversion via Gotenberg failed: ${err.message}`);
            }
        }
        await this.prisma.pdfExport.create({
            data: { policyId, versionId, optionsJson: options, createdBy: userId },
        });
        await this.prisma.auditLog.create({
            data: { policyId, userId, action: 'pdf.exported', metadataJson: { versionId, ...options } },
        });
        return pdfBuffer;
    }
    async compareVersions(policyId, v1Id, v2Id, userId) {
        await this.findOne(policyId, userId);
        const [v1, v2] = await Promise.all([
            this.prisma.policyVersion.findUnique({ where: { id: v1Id } }),
            this.prisma.policyVersion.findUnique({ where: { id: v2Id } }),
        ]);
        if (!v1?.docxPath || !v2?.docxPath)
            throw new common_1.NotFoundException('Version files not found');
        const v2Buffer = (0, fs_1.readFileSync)(v2.docxPath);
        await this.prisma.auditLog.create({
            data: { policyId, userId, action: 'versions.compared', metadataJson: { v1Id, v2Id } },
        });
        return v2Buffer;
    }
    async getAuditLog(policyId, userId) {
        await this.findOne(policyId, userId);
        return this.prisma.auditLog.findMany({
            where: { policyId },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 500,
        });
    }
};
exports.PoliciesService = PoliciesService;
exports.PoliciesService = PoliciesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PoliciesService);
//# sourceMappingURL=policies.service.js.map