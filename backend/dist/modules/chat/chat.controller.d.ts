import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chat;
    constructor(chat: ChatService);
    getMessages(policyId: string): Promise<({
        author: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        policyId: string;
        authorId: string;
        body: string;
        mentionsJson: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    postMessage(policyId: string, body: {
        body: string;
        mentions?: string[];
    }, req: any): Promise<{
        author: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
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
