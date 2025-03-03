import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root' // Singleton service accessible across the app
})
export class BasemapService {
  private storageKey = 'selectedBasemap'; // ✅ Local storage key for persistence

  // ✅ Load saved basemap or use default
  private basemapSource = new BehaviorSubject<string>(this.getSavedBasemap());
  currentBasemap$ = this.basemapSource.asObservable();

  constructor() {
    console.log("Loaded basemap:", this.getSavedBasemap());
  }

  setBasemap(basemap: string): void {
    console.log("Basemap set to:", basemap);
    this.basemapSource.next(basemap);
    localStorage.setItem(this.storageKey, basemap); // ✅ Persist to localStorage
  }

  private getSavedBasemap(): string {
    return localStorage.getItem(this.storageKey) || '';
  }
}
