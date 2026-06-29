import { PrismaService } from '../../config/prisma.service';
export declare class PoliciesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(userId: string): Promise<({
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
    findOne(id: string, userId: string): Promise<{
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
    create(data: {
        title: string;
        scope?: string;
        jurisdiction?: string;
    }, userId: string): Promise<{
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
    update(id: string, data: Partial<{
        title: string;
        scope: string;
        jurisdiction: string;
        status: string;
    }>, userId: string): Promise<{
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
    updateStatus(id: string, status: string, userId: string): Promise<{
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
    listVersions(policyId: string, userId: string): Promise<({
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
    uploadDocx(policyId: string, file: Express.Multer.File, userId: string, summary?: string): Promise<{
        id: string;
        createdBy: string;
        createdAt: Date;
        policyId: string;
        versionNo: number;
        docxPath: string | null;
        yjsState: Buffer | null;
        changeSummary: string | null;
    }>;
    saveCurrentDocx(policyId: string, file: Express.Multer.File, userId: string, versionId?: string): Promise<{
        id: string;
        createdBy: string;
        createdAt: Date;
        policyId: string;
        versionNo: number;
        docxPath: string | null;
        yjsState: Buffer | null;
        changeSummary: string | null;
    }>;
    getDocxStream(policyId: string, versionId: string, userId: string): Promise<import("fs").ReadStream>;
    snapshotVersion(policyId: string, summary: string, userId: string): Promise<{
        id: string;
        createdBy: string;
        createdAt: Date;
        policyId: string;
        versionNo: number;
        docxPath: string | null;
        yjsState: Buffer | null;
        changeSummary: string | null;
    }>;
    exportPdf(policyId: string, versionId: string, options: {
        includeTrackedChanges: boolean;
        includeComments: boolean;
    }, userId: string): Promise<Buffer>;
    compareVersions(policyId: string, v1Id: string, v2Id: string, userId: string): Promise<{
        htmlDiff: string;
        v1No: number;
        v2No: number;
    }>;
    restoreVersion(policyId: string, versionId: string, userId: string): Promise<{
        id: string;
        createdBy: string;
        createdAt: Date;
        policyId: string;
        versionNo: number;
        docxPath: string | null;
        yjsState: Buffer | null;
        changeSummary: string | null;
    }>;
    getAuditLog(policyId: string, userId: string): Promise<({
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
