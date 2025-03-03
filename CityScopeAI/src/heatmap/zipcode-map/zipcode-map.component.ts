import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import Color from '@arcgis/core/Color';

import { BasemapService } from './../../services/basemap.service';
import { Subscription } from 'rxjs';
import { Map } from '../../app/models/map.model';
import { BaseMapOption } from '../../app/models/basemap.model';
import Basemap from '@arcgis/core/Basemap';

@Component({
  selector: 'app-zipcode-map',
  standalone: true,
  imports: [],
  templateUrl: './zipcode-map.component.html',
  styleUrl: './zipcode-map.component.css'
})
export class ZipcodeMapComponent implements AfterViewInit, OnDestroy {
  private mapView!: MapView;

  private basemapSubscription!: Subscription;
  map!: Map;
  basemaps: BaseMapOption[] = []; // ✅ Use the imported Map interface
  basemap: string = ''; // Default

  constructor(private basemapService: BasemapService) {}

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    if (this.basemapSubscription) {
      this.basemapSubscription.unsubscribe(); // ✅ Prevent memory leaks
    }
    if (this.mapView) {
      this.mapView.destroy();
    }
  }
  updateBasemap(): void {
    if (this.mapView) {
      this.mapView.map.basemap = Basemap.fromId(this.basemap);
    }
  }

  ngAfterViewInit(): void {
    // 1) Create the WebMap
    const webmap = new WebMap({ basemap: 'streets-vector' });

    // ✅ Subscribe to BasemapService AFTER initializing the map
    this.basemapSubscription = this.basemapService.currentBasemap$.subscribe((basemap) => {
      this.basemap = basemap;
      this.updateBasemap();
    });

    // 2) Create the MapView
    this.mapView = new MapView({
      container: 'zipcodeMapView', // Must match the div id in HTML
      map: webmap,
      zoom: 4,
      center: [-98.5795, 39.8283], // Center of the US
    });

    // 3) Load GeoJSON Layer
    const zipCodeLayer = new GeoJSONLayer({
      url: '../../assets/data/zip-codes.geojson', // <-- Update with the actual path
      renderer: this.getZipCodeRenderer(),
      popupTemplate: {
        title: 'ZIP Code: {ZCTA5CE10}',
        content: `
          <b>State FIPS Code:</b> {STATEFP10}<br>
          <b>Geographic ID:</b> {GEOID10}<br>
          <b>Land Area:</b> {ALAND10} m²<br>
          <b>Water Area:</b> {AWATER10} m²
        `,
      },
    });

    webmap.add(zipCodeLayer);

    // 4) Zoom to layer once loaded
    zipCodeLayer.when(() => {
      this.mapView.goTo(zipCodeLayer.fullExtent);
    });
  }

  // ✅ Simple renderer to visualize ZIP code boundaries
  private getZipCodeRenderer(): SimpleRenderer {
    return new SimpleRenderer({
        symbol: new SimpleFillSymbol({
            color: new Color([0, 92, 230, 0.4]), // ✅ Blue fill with transparency
            outline: {
                color: '#000000',
                width: 0.5,
            },
        }),
    });
  }
}
