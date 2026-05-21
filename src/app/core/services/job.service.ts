import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationStatus, JobApplication, JobOffer } from '../models/job.model';

@Injectable({ providedIn: 'root' })
export class JobService {
  private readonly jobsUrl = `${environment.apiUrl}job-offers`;
  private readonly applicationsUrl = `${environment.apiUrl}job-applications`;

  constructor(private readonly http: HttpClient) {}

  getAllJobs(): Observable<JobOffer[]> {
    return this.http.get<JobOffer[]>(this.jobsUrl);
  }

  getMyJobs(): Observable<JobOffer[]> {
    return this.http.get<JobOffer[]>(`${this.jobsUrl}/mine`);
  }

  getPendingJobs(): Observable<JobOffer[]> {
    return this.http.get<JobOffer[]>(`${this.jobsUrl}/pending`);
  }

  getJobById(jobId: string): Observable<JobOffer> {
    return this.http.get<JobOffer>(`${this.jobsUrl}/${jobId}`);
  }

  createJob(job: JobOffer): Observable<JobOffer> {
    return this.http.post<JobOffer>(this.jobsUrl, job);
  }

  updateJob(jobId: string, job: JobOffer): Observable<JobOffer> {
    return this.http.put<JobOffer>(`${this.jobsUrl}/${jobId}`, job);
  }

  uploadJobImage(jobId: string, file: File): Observable<JobOffer> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<JobOffer>(`${this.jobsUrl}/${jobId}/image`, formData);
  }

  deleteJob(jobId: string): Observable<void> {
    return this.http.delete<void>(`${this.jobsUrl}/${jobId}`);
  }

  approveJob(jobId: string): Observable<JobOffer> {
    return this.http.patch<JobOffer>(`${this.jobsUrl}/${jobId}/approve`, {});
  }

  rejectJob(jobId: string): Observable<JobOffer> {
    return this.http.patch<JobOffer>(`${this.jobsUrl}/${jobId}/reject`, {});
  }

  apply(jobApplication: JobApplication): Observable<JobApplication> {
    return this.http.post<JobApplication>(this.applicationsUrl, jobApplication);
  }

  uploadApplicationCv(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.applicationsUrl}/upload-cv`, formData, { responseType: 'text' });
  }

  getMyApplications(): Observable<JobApplication[]> {
    return this.http.get<JobApplication[]>(`${this.applicationsUrl}/mine`);
  }

  getApplicationsByOffer(jobOfferId: string): Observable<JobApplication[]> {
    return this.http.get<JobApplication[]>(`${this.applicationsUrl}/by-offer/${jobOfferId}`);
  }

  updateApplicationStatus(applicationId: string, status: ApplicationStatus): Observable<JobApplication> {
    return this.http.patch<JobApplication>(`${this.applicationsUrl}/${applicationId}/status?status=${status}`, {});
  }
}
