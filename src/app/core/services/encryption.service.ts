import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private readonly secretKey = 'esprit-connect-secret-key-2026'; // Should be in environment.ts

  encrypt(data: any): string {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, this.secretKey).toString();
  }

  decrypt(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedString) return null;
      return JSON.parse(decryptedString);
    } catch (e) {
      console.error('Decryption failed', e);
      return null;
    }
  }

  setItem(key: string, value: any): void {
    const encrypted = this.encrypt(value);
    localStorage.setItem(key, encrypted);
  }

  getItem(key: string): any {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    return this.decrypt(encrypted);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
