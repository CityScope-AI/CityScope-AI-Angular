import { Component, AfterViewInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import Color from '@arcgis/core/Color';

import { BasemapService } from '../../../../services/basemap.service';
import { Subscription } from 'rxjs';
import { Map } from '../../../models/map.model';
import { BaseMapOption } from '../../../models/basemap.model';
import Basemap from '@arcgis/core/Basemap';
import { HttpClient } from '@angular/common/http';
import Extent from '@arcgis/core/geometry/Extent';
import TimeExtent from '@arcgis/core/TimeExtent';
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter';
import FeatureEffect from '@arcgis/core/layers/support/FeatureEffect';





interface SimilarZip {
  zip_code: string;
  population: number;
  median_income: number;
  similarity: number;
}

interface ZipSimilarityData {
  zip_code: string;
  count: number;
  similar_zips: SimilarZip[];
}

@Component({
  selector: 'app-zipcode-map',
  standalone: true,
  templateUrl: './zipcode-map.component.html',
  styleUrls: ['./zipcode-map.component.css'],
})
export class ZipcodeMapComponent implements AfterViewInit, OnDestroy {

  @Output() zipSelected = new EventEmitter<ZipSimilarityData>();
  private mapView!: MapView;
  private zipCodeLayer!: GeoJSONLayer;

  private basemapSubscription!: Subscription;
  map!: Map;
  basemaps: BaseMapOption[] = [];
  basemap: string = 'streets-vector';

  private zipSimilarityData: ZipSimilarityData[] = [];

  constructor(private basemapService: BasemapService, private http: HttpClient) {}

  ngOnInit(): void {
    this.basemapSubscription = this.basemapService.currentBasemap$.subscribe((basemap) => {
      this.basemap = basemap;
      this.updateBasemap();
    });

    this.loadZipSimilarityData();
  }

  ngOnDestroy(): void {
    if (this.basemapSubscription) {
      this.basemapSubscription.unsubscribe();
    }
    if (this.mapView) {
      this.mapView.destroy();
    }
  }

  private loadZipSimilarityData(): void {
    const jsonPath = 'assets/data/zip_code_similarities.json';
    this.http.get<ZipSimilarityData[]>(jsonPath).subscribe(
      (data) => {
        this.zipSimilarityData = data;
        console.log('Similarity data loaded', data);
      },
      (error) => {
        console.error('Error loading zip code similarities:', error);
      }
    );
  }

  updateBasemap(): void {
    if (this.mapView && this.mapView.map) {
      this.mapView.map.basemap = Basemap.fromId(this.basemap);
    }
  }

  ngAfterViewInit(): void {
    const webmap = new WebMap({ basemap: Basemap.fromId(this.basemap) });

    this.basemapSubscription = this.basemapService.currentBasemap$.subscribe((basemap) => {
        this.basemap = basemap;
        this.updateBasemap();
    });

    this.mapView = new MapView({
        container: 'zipcodeMapView',
        map: webmap,
        zoom: 4,
        center: [-98.5795, 39.8283],
    });

    this.zipCodeLayer = new GeoJSONLayer({
      url: 'assets/data/zip-codes.geojson',
      outFields: ['ZCTA5CE10', 'STATEFP10', 'GEOID10', 'ALAND10', 'AWATER10'],
      popupTemplate: {
          title: 'ZIP Code: {ZCTA5CE10}',
          content: `
              <b>State FIPS Code:</b> {STATEFP10}<br>
              <b>Geographic ID:</b> {GEOID10}<br>
              <b>Land Area:</b> {ALAND10} m²<br>
              <b>Water Area:</b> {AWATER10} m²
          `,
      },
      // Add a renderer to set the default color of all ZIP codes
      renderer: new SimpleRenderer({
          symbol: new SimpleFillSymbol({
              color: new Color([0, 92, 230, 0.3]), // Light gray with 30% opacity
              outline: {
                  color: '#000000',
                  width: 0.25,
              },
          }),
      }),
  });
  

    webmap.add(this.zipCodeLayer);

    this.zipCodeLayer.when(() => {
        this.mapView.goTo(this.zipCodeLayer.fullExtent);
        // Initialize map with default opacity for all zip codes
          // ✅ Highlight top 50 on load
        this.highlightInitialTop50ZipCodes();
        this.highlightSimilarZipCodes('');
    });

    this.mapView.on('click', (event) => {
        this.mapView.hitTest(event).then((response) => {
            console.log('Hit test response:', response);

            const feature = response.results.find((result) => result.type === 'graphic') as __esri.GraphicHit;

            if (feature?.graphic) {
                console.log('Graphic object:', feature.graphic);
                console.log('Graphic attributes:', feature.graphic.attributes);

                const selectedZipCode = feature.graphic.attributes?.['ZCTA5CE10'];
                console.log('Selected ZIP Code:', selectedZipCode);

                const zipData = this.zipSimilarityData.find((zip) => zip.zip_code === selectedZipCode);
                console.log('Fetched zip data:', zipData);

                if (zipData) {
                    const similarZips = zipData.similar_zips;
                    console.log('Similar ZIP Codes:', similarZips);
                    console.log('📤 Emitting zipSelected with data:', zipData);
                    this.zipSelected.emit(zipData);

                    this.highlightSimilarZipCodes(selectedZipCode);
                } else {
                    console.warn(`No similar zip codes found for ${selectedZipCode}`);
                }
            } else {
                console.warn('No graphic found in hit test response.');
            }
        });
    });
}

private highlightInitialTop50ZipCodes(): void {
  const top50Zips = this.zipSimilarityData.map(z => z.zip_code);

  if (!top50Zips.length) return;

  this.zipCodeLayer.queryFeatures().then((result) => {
    const availableZips = result.features.map(f => f.attributes['ZCTA5CE10']);
    const missing = top50Zips.filter(z => !availableZips.includes(z));
    if (missing.length > 0) {
      console.warn('Some top 50 ZIPs missing in map data:', missing);
    }

    // Apply highlight effect to top 50 ZIPs
    this.zipCodeLayer.featureEffect = new FeatureEffect({
      filter: new FeatureFilter({
        where: `ZCTA5CE10 IN (${top50Zips.map(z => `'${z}'`).join(',')})`,
      }),
      includedEffect: 'drop-shadow(2px, 2px, 2px) brightness(1.3)', // customize as needed
      excludedEffect: 'opacity(40%)',
      excludedLabelsVisible: false,
    });

    console.log('🌟 Highlighted initial top 50 ZIPs:', top50Zips);
  });
}



  private highlightSimilarZipCodes(selectedZipCode: string): void {
    const zipData = this.zipSimilarityData.find((zip) => zip.zip_code === selectedZipCode);
    if (!zipData) return;

    const similarZipCodes = zipData.similar_zips.map((zip) => zip.zip_code);

    console.log('Highlighting ZIP Code:', selectedZipCode);
    console.log('Similar ZIP Codes to highlight:', similarZipCodes);

    // Query all available ZIP codes on the map
    this.zipCodeLayer.queryFeatures().then((result) => {
        const allZipCodes = result.features.map(feature => feature.attributes['ZCTA5CE10']);
        console.log('All ZIP Codes available on the map:', allZipCodes);

        // Check which ZIP codes are not on the map
        const missingZips = [selectedZipCode, ...similarZipCodes].filter(zip => !allZipCodes.includes(zip));
        if (missingZips.length > 0) {
            console.warn('These ZIP Codes were not found on the map:', missingZips);
        }

        // Apply the feature effect to highlight the correct zip codes
        this.zipCodeLayer.featureEffect = new FeatureEffect({
            filter: new FeatureFilter({
                where: `ZCTA5CE10 IN (${[selectedZipCode, ...similarZipCodes].map(zip => `'${zip}'`).join(',')})`,
            }),
            excludedEffect: 'opacity(30%)',
            includedEffect: 'opacity(100%)',
            excludedLabelsVisible: false,
        });

        console.log('Feature filter applied with WHERE clause:', 
            `ZCTA5CE10 IN (${[selectedZipCode, ...similarZipCodes].map(zip => `'${zip}'`).join(',')})`);
    }).catch((error) => {
        console.error('Error querying features:', error);
    });

    // Force a refresh of the GeoJSONLayer to avoid stale data
    this.zipCodeLayer.refresh();
}






}
