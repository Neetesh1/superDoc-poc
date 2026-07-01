import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
  UploadedFile, UseInterceptors, Res, StreamableFile, Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PoliciesService } from './policies.service';

@ApiTags('policies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policies: PoliciesService) {}

  @Get()
  @ApiOperation({ summary: 'List all accessible policies' })
  list(@Request() req: any) {
    return this.policies.list(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.policies.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() body: { title: string; scope?: string; jurisdiction?: string }, @Request() req: any) {
    return this.policies.create(body, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.policies.update(id, body, req.user.id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
    return this.policies.updateStatus(id, status, req.user.id);
  }

  @Get(':id/versions')
  listVersions(@Param('id') id: string, @Request() req: any) {
    return this.policies.listVersions(id, req.user.id);
  }

  @Post(':id/versions/upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocx(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body('summary') summary: string, @Body('contributors') contributors: string, @Request() req: any) {
    const parsedContributors = contributors ? JSON.parse(contributors) : [];
    return this.policies.uploadDocx(id, file, req.user.id, summary ?? '', parsedContributors);
  }

  @Post(':id/versions/current/docx')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  saveCurrentDocx(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body('versionId') versionId: string, @Body('contributors') contributors: string, @Request() req: any) {
    const parsedContributors = contributors ? JSON.parse(contributors) : [];
    return this.policies.saveCurrentDocx(id, file, req.user.id, versionId || undefined, parsedContributors);
  }

  @Get(':id/versions/:versionId/docx')
  async getDocx(@Param('id') id: string, @Param('versionId') versionId: string, @Request() req: any, @Res({ passthrough: true }) res: Response) {
    const stream = await this.policies.getDocxStream(id, versionId, req.user.id);
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': 'attachment; filename="policy.docx"' });
    return new StreamableFile(stream);
  }

  @Post(':id/versions/snapshot')
  snapshotVersion(@Param('id') id: string, @Body('summary') summary: string, @Request() req: any) {
    return this.policies.snapshotVersion(id, summary ?? '', req.user.id);
  }

  @Get(':id/export/pdf')
  @ApiOperation({ summary: 'Export policy version to PDF via SuperDoc API' })
  async exportPdf(
    @Param('id') id: string,
    @Query('versionId') versionId: string,
    @Query('includeTrackedChanges') includeTrackedChanges: string,
    @Query('includeComments') includeComments: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const opts = { includeTrackedChanges: includeTrackedChanges === 'true', includeComments: includeComments === 'true' };
    const pdfBuffer = await this.policies.exportPdf(id, versionId, opts, req.user.id);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="policy.pdf"' });
    return new StreamableFile(pdfBuffer);
  }

  @Get(':id/compare')
  compareVersions(
    @Param('id') id: string,
    @Query('v1') v1: string,
    @Query('v2') v2: string,
    @Request() req: any,
  ) {
    return this.policies.compareVersions(id, v1, v2, req.user.id);
  }

  @Post(':id/versions/:versionId/restore')
  restoreVersion(@Param('id') id: string, @Param('versionId') versionId: string, @Request() req: any) {
    return this.policies.restoreVersion(id, versionId, req.user.id);
  }

  @Get(':id/audit-log')
  getAuditLog(@Param('id') id: string, @Request() req: any) {
    return this.policies.getAuditLog(id, req.user.id);
  }
}
