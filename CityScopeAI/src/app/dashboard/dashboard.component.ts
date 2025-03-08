import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,  // <-- Add this import
    TabMenuModule,
    SplitterModule,
    CardModule,
    HeaderComponent,
    TabViewModule,
    HeatmapPageComponent,
    ButtonModule,
    DataTablesComponent,
    DemographicsComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  menuItems: MenuItem[];
  sidebarVisible: boolean = true;
  selectedAreaData: any;

  constructor(private iframeService: IframeService) {
    this.menuItems = [
      { label: 'Tab 1', icon: 'pi pi-fw pi-home', command: () => {} },
      { label: 'Tab 2', icon: 'pi pi-fw pi-calendar', command: () => {} },
      { label: 'Tab 3', icon: 'pi pi-fw pi-pencil', command: () => {} }
    ];
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar() {
    this.sidebarVisible = false;
  }
}
