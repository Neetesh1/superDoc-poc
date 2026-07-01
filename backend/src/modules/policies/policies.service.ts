import {
  Injectable, NotFoundException, ForbiddenException, InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { join, resolve } from 'path';
import { createReadStream, existsSync, copyFileSync, mkdirSync, statSync } from 'fs';
import axios from 'axios';
import * as FormData from 'form-data';
import * as mammoth from 'mammoth';
import { diffWords } from 'diff';

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly uploadRoot = resolve(process.env.UPLOAD_DIR ?? './uploads');

  async list(userId: string) {
    return this.prisma.policy.findMany({
      where: {
        permissions: { some: { userId } },
      },
      include: { permissions: { include: { user: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: { permissions: { include: { user: true } } },
    });
    if (!policy) throw new NotFoundException('Policy not found');
    const hasPerm = policy.permissions.some(p => p.userId === userId);
    if (!hasPerm) throw new ForbiddenException('No access to this policy');
    return policy;
  }

  async create(data: { title: string; scope?: string; jurisdiction?: string }, userId: string) {
    const policy = await this.prisma.policy.create({
      data: {
        title: data.title,
        scope: data.scope,
        jurisdiction: data.jurisdiction,
        createdBy: userId,
        permissions: {
          create: { userId, role: 'editor' },
        },
      },
    });
    await this.prisma.auditLog.create({
      data: { policyId: policy.id, userId, action: 'policy.created', metadataJson: { title: data.title } },
    });
    return policy;
  }

  async update(id: string, data: Partial<{ title: string; scope: string; jurisdiction: string; status: string }>, userId: string) {
    await this.findOne(id, userId);
    const policy = await this.prisma.policy.update({ where: { id }, data: data as any });
    await this.prisma.auditLog.create({
      data: { policyId: id, userId, action: 'policy.updated', metadataJson: data },
    });
    return policy;
  }

  async updateStatus(id: string, status: string, userId: string) {
    await this.findOne(id, userId);
    const policy = await this.prisma.policy.update({ where: { id }, data: { status: status as any } });
    await this.prisma.auditLog.create({
      data: { policyId: id, userId, action: 'policy.status_changed', metadataJson: { status } },
    });
    return policy;
  }

  async listVersions(policyId: string, userId: string) {
    await this.findOne(policyId, userId);
    return this.prisma.policyVersion.findMany({
      where: { policyId },
      orderBy: { versionNo: 'desc' },
      include: { creator: { select: { id: true, name: true } } },
    });
  }

  async uploadDocx(policyId: string, file: Express.Multer.File, userId: string, summary = '') {
    await this.findOne(policyId, userId);
    const lastVersion = await this.prisma.policyVersion.findFirst({
      where: { policyId },
      orderBy: { versionNo: 'desc' },
    });
    const versionNo = (lastVersion?.versionNo ?? 0) + 1;
    const version = await this.prisma.policyVersion.create({
      data: { policyId, versionNo, docxPath: file.path, changeSummary: summary || undefined, createdBy: userId },
    });
    await this.prisma.policy.update({ where: { id: policyId }, data: { currentVersionId: version.id } });
    await this.prisma.auditLog.create({
      data: { policyId, userId, action: 'version.uploaded', metadataJson: { versionNo, file: file.originalname, summary } },
    });
    return version;
  }

  async saveCurrentDocx(policyId: string, file: Express.Multer.File, userId: string, versionId?: string) {
    const policy = await this.findOne(policyId, userId);
    const targetVersionId = versionId || policy.currentVersionId;

    if (targetVersionId) {
      const existing = await this.prisma.policyVersion.findUnique({ where: { id: targetVersionId } });
      if (!existing || existing.policyId !== policyId) throw new NotFoundException('Policy version not found');
      const changeSummary = this.buildChangeSummary(existing.docxPath, file.size);

      const version = await this.prisma.policyVersion.update({
        where: { id: targetVersionId },
        data: { docxPath: file.path },
      });
      await this.prisma.policy.update({ where: { id: policyId }, data: { currentVersionId: version.id } });
      await this.prisma.auditLog.create({
        data: {
          policyId,
          userId,
          action: 'version.autosaved',
          metadataJson: { versionId: version.id, file: file.originalname, ...changeSummary },
        },
      });
      return version;
    }

    const version = await this.prisma.policyVersion.create({
      data: { policyId, versionNo: 1, docxPath: file.path, changeSummary: 'Autosaved draft', createdBy: userId },
    });
    await this.prisma.policy.update({ where: { id: policyId }, data: { currentVersionId: version.id } });
    await this.prisma.auditLog.create({
      data: { policyId, userId, action: 'version.autosaved', metadataJson: { versionId: version.id, file: file.originalname } },
    });
    return version;
  }

  async getDocxStream(policyId: string, versionId: string, userId: string) {
    await this.findOne(policyId, userId);
    const version = await this.prisma.policyVersion.findUnique({ where: { id: versionId } });
    if (!version?.docxPath) throw new NotFoundException('DOCX file not found');
    if (!existsSync(version.docxPath)) throw new NotFoundException('DOCX file missing from storage');
    await this.prisma.auditLog.create({
      data: { policyId, userId, action: 'version.downloaded', metadataJson: { versionId } },
    });
    return createReadStream(version.docxPath);
  }

  async snapshotVersion(policyId: string, summary: string, userId: string) {
    await this.findOne(policyId, userId);
    const lastVersion = await this.prisma.policyVersion.findFirst({
      where: { policyId },
      orderBy: { versionNo: 'desc' },
    });
    const versionNo = (lastVersion?.versionNo ?? 0) + 1;
    // Copy current DOCX to new version path
    let docxPath: string | undefined;
    if (lastVersion?.docxPath && existsSync(lastVersion.docxPath)) {
      const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
      mkdirSync(uploadDir, { recursive: true });
      const newPath = join(uploadDir, `snapshot-${policyId}-v${versionNo}-${Date.now()}.docx`);
      copyFileSync(lastVersion.docxPath, newPath);
      docxPath = newPath;
    }
    const version = await this.prisma.policyVersion.create({
      data: { policyId, versionNo, docxPath, changeSummary: summary, createdBy: userId },
    });
    await this.prisma.auditLog.create({
      data: { policyId, userId, action: 'version.snapshot', metadataJson: { versionNo, summary } },
    });
    return version;
  }

  async exportPdf(
    policyId: string,
    versionId: string,
    options: { includeTrackedChanges: boolean; includeComments: boolean },
    userId: string,
  ): Promise<Buffer> {
    await this.findOne(policyId, userId);
    const version = await this.prisma.policyVersion.findUnique({ where: { id: versionId } });
    if (!version?.docxPath || !existsSync(version.docxPath)) {
      throw new NotFoundException('DOCX not available for export');
    }

    const apiKey = process.env.SUPERDOC_API_KEY;
    const hasRealKey = apiKey && apiKey !== 'sd_your_api_key_here';
    let pdfBuffer: Buffer;

    if (hasRealKey) {
      // Use SuperDoc REST API
      const apiUrl = `${process.env.SUPERDOC_API_URL ?? 'https://api.superdoc.dev/v1'}/convert?from=docx&to=pdf`;
      const fd = new FormData();
      fd.append('file', createReadStream(version.docxPath), { filename: 'policy.docx' });
      try {
        const response = await axios.post(apiUrl, fd, {
          headers: { ...fd.getHeaders(), Authorization: `Bearer ${apiKey}` },
          responseType: 'arraybuffer',
          timeout: 60000,
        });
        pdfBuffer = Buffer.from(response.data);
      } catch (err: any) {
        throw new InternalServerErrorException(`PDF conversion failed: ${err.message}`);
      }
    } else {
      // Fallback: use Gotenberg (LibreOffice) running locally
      const gotenbergUrl = `${process.env.GOTENBERG_URL ?? 'http://localhost:3030'}/forms/libreoffice/convert`;
      const fd = new FormData();
      fd.append('files', createReadStream(version.docxPath), { filename: 'policy.docx' });
      try {
        const response = await axios.post(gotenbergUrl, fd, {
          headers: fd.getHeaders(),
          responseType: 'arraybuffer',
          timeout: 60000,
        });
        pdfBuffer = Buffer.from(response.data);
      } catch (err: any) {
        throw new InternalServerErrorException(`PDF conversion via Gotenberg failed: ${err.message}`);
      }
    }

    // Log export
    await this.prisma.pdfExport.create({
      data: { policyId, versionId, optionsJson: options, createdBy: userId },
    });
    await this.prisma.auditLog.create({
      data: { policyId, userId, action: 'pdf.exported', metadataJson: { versionId, ...options } },
    });

    return pdfBuffer;
  }

  async compareVersions(
    policyId: string,
    v1Id: string,
    v2Id: string,
    userId: string,
  ): Promise<{ htmlDiff: string; v1No: number; v2No: number }> {
    await this.findOne(policyId, userId);
    const [v1, v2] = await Promise.all([
      this.prisma.policyVersion.findUnique({ where: { id: v1Id } }),
      this.prisma.policyVersion.findUnique({ where: { id: v2Id } }),
    ]);
    if (!v1?.docxPath || !existsSync(v1.docxPath)) throw new NotFoundException('Base version file not found');
    if (!v2?.docxPath || !existsSync(v2.docxPath)) throw new NotFoundException('Revised version file not found');

    const [r1, r2] = await Promise.all([
      mammoth.extractRawText({ path: v1.docxPath }),
      mammoth.extractRawText({ path: v2.docxPath }),
    ]);

    const parts = diffWords(r1.value, r2.value);
    let htmlDiff = '';
    for (const part of parts) {
      const safe = part.value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r\n|\r|\n/g, '<br>');
      if (part.removed) {
        htmlDiff += `<del>${safe}</del>`;
      } else if (part.added) {
        htmlDiff += `<ins>${safe}</ins>`;
      } else {
        htmlDiff += safe;
      }
    }

    await this.prisma.auditLog.create({
      data: { policyId, userId, action: 'versions.compared', metadataJson: { v1Id, v2Id } },
    });
    return { htmlDiff, v1No: v1.versionNo, v2No: v2.versionNo };
  }

  async restoreVersion(policyId: string, versionId: string, userId: string) {
    await this.findOne(policyId, userId);
    const source = await this.prisma.policyVersion.findUnique({ where: { id: versionId } });
    if (!source?.docxPath || !existsSync(source.docxPath)) throw new NotFoundException('Version file not found');

    const lastVersion = await this.prisma.policyVersion.findFirst({
      where: { policyId },
      orderBy: { versionNo: 'desc' },
    });
    const versionNo = (lastVersion?.versionNo ?? 0) + 1;
    const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
    mkdirSync(uploadDir, { recursive: true });
    const newPath = join(uploadDir, `restore-${policyId}-v${versionNo}-${Date.now()}.docx`);
    copyFileSync(source.docxPath, newPath);

    const version = await this.prisma.policyVersion.create({
      data: {
        policyId,
        versionNo,
        docxPath: newPath,
        changeSummary: `Restored from V${source.versionNo}`,
        createdBy: userId,
      },
    });
    await this.prisma.policy.update({ where: { id: policyId }, data: { currentVersionId: version.id } });
    await this.prisma.auditLog.create({
      data: {
        policyId,
        userId,
        action: 'version.restored',
        metadataJson: { fromVersionId: versionId, fromVersionNo: source.versionNo, newVersionNo: versionNo },
      },
    });
    return version;
  }

  async getAuditLog(policyId: string, userId: string) {
    await this.findOne(policyId, userId);
    return this.prisma.auditLog.findMany({
      where: { policyId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async listComments(policyId: string, userId: string) {
    await this.findOne(policyId, userId);
    return this.prisma.comment.findMany({
      where: { policyId, parentCommentId: null },
      include: {
        author: { select: { id: true, name: true, role: true } },
        replies: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createComment(
    policyId: string,
    userId: string,
    data: { body: string; versionId?: string; parentCommentId?: string; anchorJson?: unknown },
  ) {
    await this.findOne(policyId, userId);
    const comment = await this.prisma.comment.create({
      data: {
        policyId,
        versionId: data.versionId,
        parentCommentId: data.parentCommentId,
        anchorJson: data.anchorJson as any,
        authorId: userId,
        body: data.body,
      },
      include: { author: { select: { id: true, name: true, role: true } } },
    });
    await this.prisma.auditLog.create({
      data: {
        policyId,
        userId,
        action: 'comment.created',
        metadataJson: { commentId: comment.id, versionId: data.versionId ?? null, parentCommentId: data.parentCommentId ?? null },
      },
    });
    return comment;
  }

  private buildChangeSummary(previousPath?: string | null, nextSizeBytes = 0): {
    contentDelta?: { previousSizeBytes: number; nextSizeBytes: number; deltaBytes: number };
  } {
    if (!previousPath || !this.isAllowedUploadPath(previousPath) || !existsSync(previousPath)) {
      return {};
    }
    try {
      const previousSizeBytes = statSync(previousPath).size;
      return {
        contentDelta: {
          previousSizeBytes,
          nextSizeBytes,
          deltaBytes: nextSizeBytes - previousSizeBytes,
        },
      };
    } catch {
      return {};
    }
  }

  private isAllowedUploadPath(filePath: string): boolean {
    const absolutePath = resolve(filePath);
    return absolutePath === this.uploadRoot || absolutePath.startsWith(`${this.uploadRoot}/`);
  }
}
