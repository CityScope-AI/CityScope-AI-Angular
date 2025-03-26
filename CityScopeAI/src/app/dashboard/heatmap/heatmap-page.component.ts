import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { Component, AfterViewInit, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { HeatmapComponent } from "./heatmap/heatmap.component";
import { VoronoiMapComponent } from "./voronoi-map/voronoi-map.component"; // ✅ Ensure Basemap is imported
import { CommonModule } from '@angular/common';
import { ZipcodeMapComponent } from './zipcode-map/zipcode-map.component';
import { StateMapComponent } from "./state-map/state-map.component";
import { BasemapService } from '../../../services/basemap.service';
export interface Map {
  name: string;
}

interface Basemap {
  name: string;
  label: string;
}

@Component({
  selector: 'app-heatmap-page',
  standalone: true,
  imports: [
    DropdownModule,
    ButtonModule,
    HeatmapComponent,
    VoronoiMapComponent,
    CommonModule,
    ZipcodeMapComponent,
    FormsModule,
    StateMapComponent
],
  templateUrl: './heatmap-page.component.html',
  styleUrl: './heatmap-page.component.css'

})
export class HeatmapPageComponent implements OnInit{

  @Output() zipSelected = new EventEmitter<any>();

  onZipSelectedFromMap(data: any) {
    console.log('📡 Forwarding zipSelected from HeatmapPage to Dashboard:', data);
    this.zipSelected.emit(data);
  }

  maps: Map[] = [];
  selectedMap: Map | undefined;

  basemaps: Basemap[] = [];
  selectedBasemap: Basemap | undefined;

  constructor(private basemapService: BasemapService) {} // ✅ Inject service

  ngOnInit() {
    this.maps = [
        { name: 'heatmap'},
        { name: 'voronoi'},
        { name: 'zipcodes'},
        { name: 'states'},

    ];

    this.basemaps = [
      { name: 'streets-vector', label: 'Streets' },
      { name: 'satellite', label: 'Satellite' },
      { name: 'topo-vector', label: 'Topographic' },
      { name: 'gray-vector', label: 'Gray' },
      { name: 'dark-gray-vector', label: 'Dark Gray' },
      { name: 'oceans', label: 'Oceans' },
      { name: 'terrain', label: 'Terrain' }
    ];
}


activeMap: 'heatmap' | 'voronoi' | 'zipcodes' | 'states' = 'heatmap'; // ✅ Added 'zipcode' as an option

   // ✅ Called when user selects a map from the dropdown
   onMapChange(): void {
    if (this.selectedMap) {
      this.activeMap = this.selectedMap.name as 'heatmap' | 'voronoi' | 'zipcodes' | 'states';
    }
  }

  resetMap(): void {
    const previousMap = this.activeMap; // ✅ Store the current map selection
    this.activeMap = null as any; // ✅ Temporarily set to null to trigger a full re-render

    setTimeout(() => {
      this.activeMap = previousMap; // ✅ Restore the previous map selection
    }, 0); // ✅ Forces Angular to detect changes
  }


  activeBasemap: string = 'streets-vector';

  onBasemapChange(): void {
    if (this.selectedBasemap) {
      console.log("selected basemap: " + this.selectedBasemap.name)
      this.basemapService.setBasemap(this.selectedBasemap.name); // ✅ Use service to update basemap
    }
  }

  resetBasemap(): void {
    this.basemapService.setBasemap('streets-vector');
    this.selectedBasemap = this.basemaps[0];
  }
}
