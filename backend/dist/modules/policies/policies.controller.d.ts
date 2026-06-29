import { StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { PoliciesService } from './policies.service';
export declare class PoliciesController {
    private readonly policies;
    constructor(policies: PoliciesService);
    list(req: any): Promise<({
        permissions: ({
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                role: import(".prisma/client").$Enums.UserRole;
                email: string;
                password: string;
            };
        } & {
            id: string;
            userId: string;
            policyId: string;
            role: import(".prisma/client").$Enums.UserRole;
        })[];
    } & {
        id: string;
        tenantId: string;
        title: string;
        scope: string | null;
        jurisdiction: string | null;
        status: import(".prisma/client").$Enums.PolicyStatus;
        parentId: string | null;
        currentVersionId: string | null;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string, req: any): Promise<{
        permissions: ({
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                role: import(".prisma/client").$Enums.UserRole;
                email: string;
                password: string;
            };
        } & {
            id: string;
            userId: string;
            policyId: string;
            role: import(".prisma/client").$Enums.UserRole;
        })[];
    } & {
        id: string;
        tenantId: string;
        title: string;
        scope: string | null;
        jurisdiction: string | null;
        status: import(".prisma/client").$Enums.PolicyStatus;
        parentId: string | null;
        currentVersionId: string | null;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(body: {
        title: string;
        scope?: string;
        jurisdiction?: string;
    }, req: any): Promise<{
        id: string;
        tenantId: string;
        title: string;
        scope: string | null;
        jurisdiction: string | null;
        status: import(".prisma/client").$Enums.PolicyStatus;
        parentId: string | null;
        currentVersionId: string | null;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, body: any, req: any): Promise<{
        id: string;
        tenantId: string;
        title: string;
        scope: string | null;
        jurisdiction: string | null;
        status: import(".prisma/client").$Enums.PolicyStatus;
        parentId: string | null;
        currentVersionId: string | null;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateStatus(id: string, status: string, req: any): Promise<{
        id: string;
        tenantId: string;
        title: string;
        scope: string | null;
        jurisdiction: string | null;
        status: import(".prisma/client").$Enums.PolicyStatus;
        parentId: string | null;
        currentVersionId: string | null;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listVersions(id: string, req: any): Promise<({
        creator: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdBy: string;
        createdAt: Date;
        policyId: string;
        versionNo: number;
        docxPath: string | null;
        yjsState: Buffer | null;
        changeSummary: string | null;
    })[]>;
    uploadDocx(id: string, file: Express.Multer.File, summary: string, req: any): Promise<{
        id: string;
        createdBy: string;
        createdAt: Date;
        policyId: string;
        versionNo: number;
        docxPath: string | null;
        yjsState: Buffer | null;
        changeSummary: string | null;
    }>;
    saveCurrentDocx(id: string, file: Express.Multer.File, versionId: string, req: any): Promise<{
        id: string;
        createdBy: string;
        createdAt: Date;
        policyId: string;
        versionNo: number;
        docxPath: string | null;
        yjsState: Buffer | null;
        changeSummary: string | null;
    }>;
    getDocx(id: string, versionId: string, req: any, res: Response): Promise<StreamableFile>;
    snapshotVersion(id: string, summary: string, req: any): Promise<{
        id: string;
        createdBy: string;
        createdAt: Date;
        policyId: string;
        versionNo: number;
        docxPath: string | null;
        yjsState: Buffer | null;
        changeSummary: string | null;
    }>;
    exportPdf(id: string, versionId: string, includeTrackedChanges: string, includeComments: string, req: any, res: Response): Promise<StreamableFile>;
    compareVersions(id: string, v1: string, v2: string, req: any): Promise<{
        htmlDiff: string;
        v1No: number;
        v2No: number;
    }>;
    restoreVersion(id: string, versionId: string, req: any): Promise<{
        id: string;
        createdBy: string;
        createdAt: Date;
        policyId: string;
        versionNo: number;
        docxPath: string | null;
        yjsState: Buffer | null;
        changeSummary: string | null;
    }>;
    getAuditLog(id: string, req: any): Promise<({
        user: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        policyId: string;
        action: string;
        metadataJson: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
}
