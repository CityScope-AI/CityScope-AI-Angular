import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Graphic from '@arcgis/core/Graphic';
import Polygon from '@arcgis/core/geometry/Polygon';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import Basemap from '@arcgis/core/Basemap';
import { zipCodeData } from '../../assets/data/ZipCodeData'; // <-- Update path if needed
import { voronoi } from 'd3-voronoi'; // Use d3-voronoi to generate the polygons
import Color from '@arcgis/core/Color';
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer';
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';

import { BasemapService } from './../../services/basemap.service';
import { Subscription } from 'rxjs';
import { Map } from '../../app/models/map.model';
import { BaseMapOption } from '../../app/models/basemap.model';


@Component({
  selector: 'app-voronoi-map',
  standalone: true,
  imports: [],
  templateUrl: './voronoi-map.component.html',
  styleUrls: ['./voronoi-map.component.css']
})
export class VoronoiMapComponent implements AfterViewInit, OnDestroy {
  private mapView!: MapView;
  private featureLayer!: FeatureLayer;
  private baseMap = 'streets';

  private basemapSubscription!: Subscription;
  map!: Map;
  basemaps: BaseMapOption[] = []; // ✅ Use the imported Map interface
  basemap: string = ''; // Default

  constructor(private basemapService: BasemapService) {}


  ngOnInit(): void {
  }

  basemapOptions = [
    { label: 'Streets', value: 'streets' },
    { label: 'Satellite', value: 'satellite' },
    { label: 'Hybrid', value: 'hybrid' },
    { label: 'Topographic', value: 'topo' },
    { label: 'Dark Gray', value: 'dark-gray' },
    { label: 'Gray', value: 'gray' },
    { label: 'National Geographic', value: 'national-geographic' },
  ];

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

  /**
   * Make ngAfterViewInit async so we can await loading the US boundary
   */
  async ngAfterViewInit(): Promise<void> {
    // 1) Create the WebMap
    const webmap = new WebMap({ basemap: this.baseMap });

    // ✅ Subscribe to BasemapService AFTER initializing the map
    this.basemapSubscription = this.basemapService.currentBasemap$.subscribe((basemap) => {
      this.basemap = basemap;
      this.updateBasemap();
    });

    // 2) Create the MapView
    this.mapView = new MapView({
      container: 'voronoiView',
      map: webmap,
      zoom: 4,
      center: [-117.201757, 34.872701],
    });

    // 3) Load the U.S. boundary geometry
    const usBoundaryGeometry = await this.loadUSBoundaryGeometries();

    // 4) Generate & clip Voronoi polygons by the US boundary
    const voronoiPolygons = this.generateClippedVoronoiPolygons(usBoundaryGeometry);

    // 5) Create a FeatureLayer from the clipped polygons
    this.featureLayer = new FeatureLayer({
      source: voronoiPolygons,
      objectIdField: 'ObjectID',
      geometryType: 'polygon',
      spatialReference: { wkid: 4326 },
      fields: [
        { name: 'ObjectID', alias: 'ObjectID', type: 'oid' },
        { name: 'Zip_Code', alias: 'Zip Code', type: 'string' },
        { name: 'Count', alias: 'Student Count', type: 'integer' },
      ],
      popupTemplate: {
        title: 'Zip Code: {Zip_Code}',
        content: 'Student Count: {Count}',
      },
      renderer: this.createVoronoiRenderer(),
    });

    webmap.add(this.featureLayer);

    // 6) Optionally, zoom to the US boundary
    // if (usBoundaryGeometry.extent) {
    //   this.mapView.goTo(usBoundaryGeometry.extent);
    // }
  }

 /**
 * Loads a GeoJSONLayer for the US boundary and returns the geometry of all features.
 * Adjust the "url" path to your actual US boundary file.
 */
private async loadUSBoundaryGeometries(): Promise<Polygon[]> {
    const usLayer = new GeoJSONLayer({
        // <-- Update this path if your GeoJSON is in a different location
        url: '../../assets/data/us-states.geojson',
    });

    await usLayer.load();

    // Query all features in the boundary file
    const queryResult = await usLayer.queryFeatures();
    if (queryResult.features.length === 0) {
        throw new Error('No features found in US boundary GeoJSON.');
    }

    // Return all geometries as an array of Polygons
    return queryResult.features.map(feature => feature.geometry as Polygon);
}


  /**
   * Generates Voronoi polygons from zipCodeData and intersects each
   * polygon with the US boundary to ensure they stay within the US.
   */
  private generateClippedVoronoiPolygons(usBoundary: Polygon[]): Graphic[] {
    // 1) Create [lng, lat] arrays from the zipCodeData
    const points: [number, number][] = zipCodeData
        .filter(entry => entry.LNG !== null && entry.LAT !== null)
        .map(entry => [entry.LNG as number, entry.LAT as number]);

    if (points.length === 0) {
        return [];
    }

    // 2) Determine bounding box (min/max lat/lng)
    const minLng = Math.min(...points.map(([lng]) => lng));
    const maxLng = Math.max(...points.map(([lng]) => lng));
    const minLat = Math.min(...points.map(([, lat]) => lat));
    const maxLat = Math.max(...points.map(([, lat]) => lat));

    // 3) Create Voronoi polygons via d3-voronoi
    const voronoiDiagram = voronoi()
        .extent([[minLng, minLat], [maxLng, maxLat]])
        .polygons(points);

    // 4) Build ArcGIS Graphics, clipped to US boundary
    const clippedGraphics: Graphic[] = voronoiDiagram
        .map((polygon: number[][], index: number) => {
            // Convert to an ArcGIS Polygon
            const fullPoly = new Polygon({
                rings: [polygon],
                spatialReference: { wkid: 4326 },
            });

            // Intersect with US boundary
            const clippedGeometries = usBoundary
                .filter(polygon => polygon instanceof Polygon) // ✅ Ensure only Polygons are used
                .map((polygon) => geometryEngine.intersect(fullPoly, polygon) as Polygon)
                .filter((geom): geom is Polygon => geom !== null); // ✅ Type guard to filter out null intersections

            // ✅ If no intersections, return null (to be filtered out later)
            if (clippedGeometries.length === 0) {
                return null;
            }

            // ✅ Combine all polygons using union with an array
const combinedGeometry = clippedGeometries.length > 1
? geometryEngine.union(clippedGeometries) as Polygon // <-- Pass array directly
: clippedGeometries[0]; // Use single polygon if only one


            return new Graphic({
                geometry: combinedGeometry, // ✅ Use single Polygon (not an array)
                attributes: {
                    ObjectID: index,
                    Zip_Code: zipCodeData[index]?.Zip_Code || '', // ✅ Optional chaining
                    Count: zipCodeData[index]?.Count || 0,
                },
            });
        })
        .filter((graphic): graphic is Graphic => graphic !== null); // ✅ Filter removes null values

    return clippedGraphics; // ✅ Return final array of Graphics
}


  /**
   * Creates a renderer to color each Voronoi polygon uniquely based on its Zip_Code.
   */
  private createVoronoiRenderer(): UniqueValueRenderer {
    return new UniqueValueRenderer({
      field: 'Zip_Code',
      uniqueValueInfos: zipCodeData.map((entry) => ({
        value: entry.Zip_Code,
        symbol: {
          type: 'simple-fill',
          color: new Color([
            Math.random() * 255,
            Math.random() * 255,
            Math.random() * 255,
            0.5
          ]),
          outline: {
            color: 'black',
            width: 1,
          },
        },
      })),
    });
  }
}
