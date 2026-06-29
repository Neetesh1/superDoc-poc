import { PrismaService } from '../../config/prisma.service';
export declare class ChatService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMessages(policyId: string): Promise<({
        author: {
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        policyId: string;
        authorId: string;
        body: string;
        mentionsJson: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    postMessage(policyId: string, authorId: string, body: string, mentions?: string[]): Promise<{
        author: {
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        policyId: string;
        authorId: string;
        body: string;
        mentionsJson: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
