import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { PrismaModule } from '../../config/prisma.module';

@Module({ imports: [PrismaModule], providers: [ExportService], exports: [ExportService] })
export class ExportModule {}
