import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { ChatModule } from './modules/chat/chat.module';
import { ExportModule } from './modules/export/export.module';
import { PrismaModule } from './config/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PoliciesModule,
    ChatModule,
    ExportModule,
  ],
})
export class AppModule {}
