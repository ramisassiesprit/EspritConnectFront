import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EspritProfile, WorkExperience, OtherEducation, Skill, WillingToHelp } from '../models/profile.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly apiUrl = `${environment.apiUrl}profile`;
  private http = inject(HttpClient);

  // --- Esprit Profile ---
  getMyEspritProfile(): Observable<EspritProfile> {
    return this.http.get<EspritProfile>(`${this.apiUrl}/esprit`);
  }

  updateEspritProfile(profile: EspritProfile): Observable<EspritProfile> {
    return this.http.put<EspritProfile>(`${this.apiUrl}/esprit`, profile);
  }

  // --- Work Experience ---
  getMyExperiences(): Observable<WorkExperience[]> {
    return this.http.get<WorkExperience[]>(`${this.apiUrl}/experience`);
  }

  addExperience(experience: WorkExperience): Observable<WorkExperience> {
    return this.http.post<WorkExperience>(`${this.apiUrl}/experience`, experience);
  }

  deleteExperience(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/experience/${id}`);
  }

  // --- Education ---
  getMyEducations(): Observable<OtherEducation[]> {
    return this.http.get<OtherEducation[]>(`${this.apiUrl}/education`);
  }

  addEducation(education: OtherEducation): Observable<OtherEducation> {
    return this.http.post<OtherEducation>(`${this.apiUrl}/education`, education);
  }
    deleteEducation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/education/${id}`);
  }


  // --- Skills ---
  getMySkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.apiUrl}/skills`);
  }

  addSkill(name: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/skills`, null, { params: { name } });
  }

  deleteSkill(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/skills/${id}`);
  }
  updateSkill(id: string, name: string): Observable<Skill> {
  const payload = { name }; // conforme à @RequestBody SkillDTO côté backend
  return this.http.put<Skill>(`${this.apiUrl}/skills/${id}`, payload);
}

  // --- Willing to Help ---
  getMyHelps(): Observable<WillingToHelp[]> {
    return this.http.get<WillingToHelp[]>(`${this.apiUrl}/help`);
  }

  addHelp(help: WillingToHelp): Observable<WillingToHelp> {
    return this.http.post<WillingToHelp>(`${this.apiUrl}/help`, help);
  }

  updateHelp(id: string, help: WillingToHelp): Observable<WillingToHelp> {
    return this.http.put<WillingToHelp>(`${this.apiUrl}/help/${id}`, help);
  }

  deleteHelp(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/help/${id}`);
  }

  // --- Public profile by userId ---
  getEspritProfileByUserId(userId: string): Observable<EspritProfile> {
    return this.http.get<EspritProfile>(`${this.apiUrl}/users/${userId}/esprit`);
  }

  getWorkExperiencesByUserId(userId: string): Observable<WorkExperience[]> {
    return this.http.get<WorkExperience[]>(`${this.apiUrl}/users/${userId}/experience`);
  }

  getEducationsByUserId(userId: string): Observable<OtherEducation[]> {
    return this.http.get<OtherEducation[]>(`${this.apiUrl}/users/${userId}/education`);
  }

  getSkillsByUserId(userId: string): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.apiUrl}/users/${userId}/skills`);
  }

  getWillingToHelpsByUserId(userId: string): Observable<WillingToHelp[]> {
    return this.http.get<WillingToHelp[]>(`${this.apiUrl}/users/${userId}/help`);
  }
}
