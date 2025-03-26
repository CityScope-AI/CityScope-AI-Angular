import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { IframeService } from '../../services/iframe.service';
import { HeaderComponent } from "./header/header.component";
import { TabMenuModule } from 'primeng/tabmenu';
import { SplitterModule } from 'primeng/splitter';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { HeatmapPageComponent } from "./heatmap/heatmap-page.component";
import { ButtonModule } from 'primeng/button';
import { DataTablesComponent } from "./data-tables/data-tables.component";
import { DemographicsComponent } from "./demographics/demographics.component";
import { ZipcodeMapComponent } from './heatmap/zipcode-map/zipcode-map.component';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TabMenuModule,
    SplitterModule,
    CardModule,
    HeaderComponent,
    TabViewModule,
    HeatmapPageComponent,
    ButtonModule,
    DataTablesComponent,
    DemographicsComponent,
    ZipcodeMapComponent 
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  menuItems: MenuItem[];
  sidebarVisible: boolean = true;
  selectedAreaData: any;
  demographicData: any = null;

  private allDemographicRows: any[] = [];

  constructor(private iframeService: IframeService, private http: HttpClient) {
    this.menuItems = [
      { label: 'Tab 1', icon: 'pi pi-fw pi-home', command: () => {} },
      { label: 'Tab 2', icon: 'pi pi-fw pi-calendar', command: () => {} },
      { label: 'Tab 3', icon: 'pi pi-fw pi-pencil', command: () => {} }
    ];
  }

  ngOnInit(): void {
    this.loadDemographics();
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar() {
    this.sidebarVisible = false;
  }

  // Called when a ZIP code is selected in ZipcodeMapComponent
  onZipSelected(data: any) {
    console.log('📥 Dashboard received ZIP selection:', data); // Add this!
    this.selectedAreaData = data;
    this.sidebarVisible = true;
  
    const match = this.allDemographicRows.find(row => row.Zip_Code === data.zip_code);
    console.log('🔍 Matching row in CSV:', match); // Add this too
  
    if (match) {
      this.demographicData = match;
    } else {
      this.demographicData = null;
      console.warn('⚠️ No demographic data found for ZIP:', data.zip_code);
    }
  }
  

  private loadDemographics(): void {
    this.http.get('assets/data/final_census_with_images.csv', { responseType: 'text' })
      .subscribe(csvData => {
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: result => {
            this.allDemographicRows = result.data;
            console.log('✅ Final CSV loaded:', result.data);
          },
          error: (error: any) => {
            console.error('❌ CSV parsing error:', error);
          }          
        });
      });
  }
  generateTSNE(selectedZip: string) {
    if (!selectedZip) return;
  
    // Redirect to Dash app with query param
    const dashURL = `http://127.0.0.1:8050/?selected_zip=${selectedZip}`;  // adjust if hosted remotely
    window.open(dashURL, '_blank');
  }  

  generate3DTSNE(selectedZip: string) {
    if (!selectedZip) return;
  
    const dashURL3D = `http://127.0.0.1:8051/?selected_zip=${selectedZip}`;
    window.open(dashURL3D, '_blank');
  }
  
}
