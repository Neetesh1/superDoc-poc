import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';

@Injectable()
export class ExportService {
  /**
   * Convert a DOCX file to PDF using the SuperDoc REST API.
   * POST https://api.superdoc.dev/v1/convert?from=docx&to=pdf
   */
  async convertDocxToPdf(docxPath: string): Promise<Buffer> {
    const apiUrl = `${process.env.SUPERDOC_API_URL ?? 'https://api.superdoc.dev/v1'}/convert?from=docx&to=pdf`;
    const fd = new FormData();
    fd.append('file', createReadStream(docxPath), { filename: 'policy.docx' });

    try {
      const response = await axios.post<ArrayBuffer>(apiUrl, fd, {
        headers: {
          ...fd.getHeaders(),
          Authorization: `Bearer ${process.env.SUPERDOC_API_KEY}`,
        },
        responseType: 'arraybuffer',
        timeout: 60_000,
        maxBodyLength: 26_000_000,
      });
      return Buffer.from(response.data);
    } catch (err: any) {
      const detail = err.response?.data
        ? Buffer.from(err.response.data).toString('utf8')
        : err.message;
      throw new InternalServerErrorException(`SuperDoc PDF conversion failed: ${detail}`);
    }
  }
}
