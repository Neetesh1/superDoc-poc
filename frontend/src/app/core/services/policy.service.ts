import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Policy, PolicyVersion, PdfExportOptions, AuditLogEntry } from '../models/policy.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/policies`;

  list(): Observable<Policy[]> {
    return this.http.get<Policy[]>(this.base);
  }

  get(id: string): Observable<Policy> {
    return this.http.get<Policy>(`${this.base}/${id}`);
  }

  create(payload: Partial<Policy>): Observable<Policy> {
    return this.http.post<Policy>(this.base, payload);
  }

  update(id: string, payload: Partial<Policy>): Observable<Policy> {
    return this.http.patch<Policy>(`${this.base}/${id}`, payload);
  }

  listVersions(policyId: string): Observable<PolicyVersion[]> {
    return this.http.get<PolicyVersion[]>(`${this.base}/${policyId}/versions`);
  }

  getDocx(policyId: string, versionId: string): Observable<Blob> {
    return this.http.get(`${this.base}/${policyId}/versions/${versionId}/docx`, { responseType: 'blob' });
  }

  uploadDocx(policyId: string, file: File, summary = ''): Observable<PolicyVersion> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('summary', summary);
    return this.http.post<PolicyVersion>(`${this.base}/${policyId}/versions/upload`, fd);
  }

  saveCurrentDocx(policyId: string, file: File, versionId = ''): Observable<PolicyVersion> {
    const fd = new FormData();
    fd.append('file', file);
    if (versionId) fd.append('versionId', versionId);
    return this.http.post<PolicyVersion>(`${this.base}/${policyId}/versions/current/docx`, fd);
  }

  exportPdf(policyId: string, options: PdfExportOptions): Observable<Blob> {
    const params = new HttpParams()
      .set('versionId', options.versionId)
      .set('includeTrackedChanges', String(options.includeTrackedChanges))
      .set('includeComments', String(options.includeComments));
    return this.http.get(`${this.base}/${policyId}/export/pdf`, { params, responseType: 'blob' });
  }

  compareVersions(policyId: string, v1Id: string, v2Id: string): Observable<{ htmlDiff: string; v1No: number; v2No: number }> {
    const params = new HttpParams().set('v1', v1Id).set('v2', v2Id);
    return this.http.get<{ htmlDiff: string; v1No: number; v2No: number }>(`${this.base}/${policyId}/compare`, { params });
  }

  restoreVersion(policyId: string, versionId: string): Observable<PolicyVersion> {
    return this.http.post<PolicyVersion>(`${this.base}/${policyId}/versions/${versionId}/restore`, {});
  }

  getAuditLog(policyId: string): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.base}/${policyId}/audit-log`);
  }

  snapshotVersion(policyId: string, summary: string): Observable<PolicyVersion> {
    return this.http.post<PolicyVersion>(`${this.base}/${policyId}/versions/snapshot`, { summary });
  }

  updateStatus(policyId: string, status: Policy['status']): Observable<Policy> {
    return this.http.patch<Policy>(`${this.base}/${policyId}/status`, { status });
  }
}
