import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getMessages(policyId: string) {
    return this.prisma.chatMessage.findMany({
      where: { policyId },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  async postMessage(policyId: string, authorId: string, body: string, mentions: string[] = []) {
    const msg = await this.prisma.chatMessage.create({
      data: { policyId, authorId, body, mentionsJson: mentions },
      include: { author: { select: { id: true, name: true, role: true } } },
    });
    await this.prisma.auditLog.create({
      data: { policyId, userId: authorId, action: 'chat.message_sent' },
    });
    return msg;
  }
}
