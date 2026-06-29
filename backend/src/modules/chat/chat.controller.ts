import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('policies/:id/chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  getMessages(@Param('id') policyId: string) {
    return this.chat.getMessages(policyId);
  }

  @Post()
  postMessage(
    @Param('id') policyId: string,
    @Body() body: { body: string; mentions?: string[] },
    @Request() req: any,
  ) {
    return this.chat.postMessage(policyId, req.user.id, body.body, body.mentions ?? []);
  }
}
