import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import Color from '@arcgis/core/Color';


@Component({
  selector: 'app-state-map',
  standalone: true,
  imports: [

  ],
  templateUrl: './state-map.component.html',
  styleUrl: './state-map.component.css'
})
export class StateMapComponent {
  private mapView!: MapView;

  ngAfterViewInit(): void {
    // 1) Create the WebMap
    const webmap = new WebMap({ basemap: 'streets-vector' });

    // 2) Create the MapView
    this.mapView = new MapView({
      container: 'stateMapView', // Must match the div id in HTML
      map: webmap,
      zoom: 4,
      center: [-98.5795, 39.8283], // Center of the US
    });

    // 3) Load GeoJSON Layer
    const usStatesLayer = new GeoJSONLayer({
      url: '../../assets/data/us-states.geojson', // <-- Updated to use us-states.geojson in the same folder
      renderer: this.getStatesRenderer(),
      popupTemplate: {
        title: 'State: {NAME}',
        content: `
          <b>State Abbreviation:</b> {STUSPS}<br>
          <b>Population:</b> {POPULATION}<br>
          <b>Area:</b> {AREA} km²
        `,
      },
    });

    webmap.add(usStatesLayer);

    // 4) Zoom to layer once loaded
    usStatesLayer.when(() => {
      this.mapView.goTo(usStatesLayer.fullExtent);
    });
  }

  // ✅ Simple renderer to visualize state boundaries
  private getStatesRenderer(): SimpleRenderer {
    return new SimpleRenderer({
      symbol: new SimpleFillSymbol({
        color: new Color([0, 128, 0, 0.4]), // ✅ Green fill with transparency
        outline: {
          color: '#000000',
          width: 1,
        },
      }),
    });
  }

  ngOnDestroy(): void {
    if (this.mapView) {
      this.mapView.destroy();
    }
  }

}
