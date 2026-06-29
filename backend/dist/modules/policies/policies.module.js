"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoliciesModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const policies_controller_1 = require("./policies.controller");
const policies_service_1 = require("./policies.service");
const prisma_module_1 = require("../../config/prisma.module");
let PoliciesModule = class PoliciesModule {
};
exports.PoliciesModule = PoliciesModule;
exports.PoliciesModule = PoliciesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            platform_express_1.MulterModule.register({
                storage: (0, multer_1.diskStorage)({
                    destination: process.env.UPLOAD_DIR ?? './uploads',
                    filename: (_req, file, cb) => {
                        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                        cb(null, `${unique}${(0, path_1.extname)(file.originalname)}`);
                    },
                }),
                fileFilter: (_req, file, cb) => {
                    const allowed = /\.(docx)$/i;
                    cb(null, allowed.test(file.originalname));
                },
                limits: { fileSize: 25 * 1024 * 1024 },
            }),
        ],
        controllers: [policies_controller_1.PoliciesController],
        providers: [policies_service_1.PoliciesService],
        exports: [policies_service_1.PoliciesService],
    })
], PoliciesModule);
//# sourceMappingURL=policies.module.js.map