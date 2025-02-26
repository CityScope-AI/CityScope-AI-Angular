import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { HeatmapComponent } from "./heatmap/heatmap.component";
import { VoronoiMapComponent } from "./voronoi-map/voronoi-map.component"; // ✅ Ensure Basemap is imported
import { CommonModule } from '@angular/common';
import { ZipcodeMapComponent } from "./zipcode-map/zipcode-map.component";
import { StateMapComponent } from "./state-map/state-map.component";

interface Map {
  name: string;
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

  maps: Map[] = [];
  selectedMap: Map | undefined;
  ngOnInit() {
    this.maps = [
        { name: 'heatmap'},
        { name: 'voronoi'},
        { name: 'zipcodes'},
        { name: 'states'},

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
    // ✅ Reset to default view (heatmap)
    this.activeMap = 'heatmap';
    this.selectedMap = this.maps[0];
  }
}
