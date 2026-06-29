"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const form_data_1 = require("form-data");
const fs_1 = require("fs");
let ExportService = class ExportService {
    async convertDocxToPdf(docxPath) {
        const apiUrl = `${process.env.SUPERDOC_API_URL ?? 'https://api.superdoc.dev/v1'}/convert?from=docx&to=pdf`;
        const fd = new form_data_1.default();
        fd.append('file', (0, fs_1.createReadStream)(docxPath), { filename: 'policy.docx' });
        try {
            const response = await axios_1.default.post(apiUrl, fd, {
                headers: {
                    ...fd.getHeaders(),
                    Authorization: `Bearer ${process.env.SUPERDOC_API_KEY}`,
                },
                responseType: 'arraybuffer',
                timeout: 60_000,
                maxBodyLength: 26_000_000,
            });
            return Buffer.from(response.data);
        }
        catch (err) {
            const detail = err.response?.data
                ? Buffer.from(err.response.data).toString('utf8')
                : err.message;
            throw new common_1.InternalServerErrorException(`SuperDoc PDF conversion failed: ${detail}`);
        }
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)()
], ExportService);
//# sourceMappingURL=export.service.js.map