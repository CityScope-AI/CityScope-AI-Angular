// basemap.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root' // Singleton service accessible across the app
})
export class BasemapService {
  private basemapSource = new BehaviorSubject<string>('streets-vector'); // Default basemap
  currentBasemap$ = this.basemapSource.asObservable();

  setBasemap(basemap: string): void {
    console.log("basemap set to: " + basemap)
    this.basemapSource.next(basemap);
  }
}
