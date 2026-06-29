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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoliciesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const policies_service_1 = require("./policies.service");
let PoliciesController = class PoliciesController {
    constructor(policies) {
        this.policies = policies;
    }
    list(req) {
        return this.policies.list(req.user.id);
    }
    findOne(id, req) {
        return this.policies.findOne(id, req.user.id);
    }
    create(body, req) {
        return this.policies.create(body, req.user.id);
    }
    update(id, body, req) {
        return this.policies.update(id, body, req.user.id);
    }
    updateStatus(id, status, req) {
        return this.policies.updateStatus(id, status, req.user.id);
    }
    listVersions(id, req) {
        return this.policies.listVersions(id, req.user.id);
    }
    uploadDocx(id, file, summary, req) {
        return this.policies.uploadDocx(id, file, req.user.id, summary ?? '');
    }
    saveCurrentDocx(id, file, versionId, req) {
        return this.policies.saveCurrentDocx(id, file, req.user.id, versionId || undefined);
    }
    async getDocx(id, versionId, req, res) {
        const stream = await this.policies.getDocxStream(id, versionId, req.user.id);
        res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': 'attachment; filename="policy.docx"' });
        return new common_1.StreamableFile(stream);
    }
    snapshotVersion(id, summary, req) {
        return this.policies.snapshotVersion(id, summary ?? '', req.user.id);
    }
    async exportPdf(id, versionId, includeTrackedChanges, includeComments, req, res) {
        const opts = { includeTrackedChanges: includeTrackedChanges === 'true', includeComments: includeComments === 'true' };
        const pdfBuffer = await this.policies.exportPdf(id, versionId, opts, req.user.id);
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="policy.pdf"' });
        return new common_1.StreamableFile(pdfBuffer);
    }
    async compareVersions(id, v1, v2, req, res) {
        const buffer = await this.policies.compareVersions(id, v1, v2, req.user.id);
        res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': 'attachment; filename="comparison-redline.docx"' });
        return new common_1.StreamableFile(buffer);
    }
    getAuditLog(id, req) {
        return this.policies.getAuditLog(id, req.user.id);
    }
};
exports.PoliciesController = PoliciesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all accessible policies' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PoliciesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PoliciesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PoliciesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PoliciesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PoliciesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)(':id/versions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PoliciesController.prototype, "listVersions", null);
__decorate([
    (0, common_1.Post)(':id/versions/upload'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('summary')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", void 0)
], PoliciesController.prototype, "uploadDocx", null);
__decorate([
    (0, common_1.Post)(':id/versions/current/docx'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('versionId')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", void 0)
], PoliciesController.prototype, "saveCurrentDocx", null);
__decorate([
    (0, common_1.Get)(':id/versions/:versionId/docx'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('versionId')),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "getDocx", null);
__decorate([
    (0, common_1.Post)(':id/versions/snapshot'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('summary')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PoliciesController.prototype, "snapshotVersion", null);
__decorate([
    (0, common_1.Get)(':id/export/pdf'),
    (0, swagger_1.ApiOperation)({ summary: 'Export policy version to PDF via SuperDoc API' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('versionId')),
    __param(2, (0, common_1.Query)('includeTrackedChanges')),
    __param(3, (0, common_1.Query)('includeComments')),
    __param(4, (0, common_1.Request)()),
    __param(5, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "exportPdf", null);
__decorate([
    (0, common_1.Get)(':id/compare'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('v1')),
    __param(2, (0, common_1.Query)('v2')),
    __param(3, (0, common_1.Request)()),
    __param(4, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "compareVersions", null);
__decorate([
    (0, common_1.Get)(':id/audit-log'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PoliciesController.prototype, "getAuditLog", null);
exports.PoliciesController = PoliciesController = __decorate([
    (0, swagger_1.ApiTags)('policies'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('policies'),
    __metadata("design:paramtypes", [policies_service_1.PoliciesService])
], PoliciesController);
//# sourceMappingURL=policies.controller.js.map