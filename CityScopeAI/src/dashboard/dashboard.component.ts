import { ButtonModule } from 'primeng/button';
import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { TabMenuModule } from 'primeng/tabmenu';
import { SplitterModule } from 'primeng/splitter';
import { CardModule } from 'primeng/card';
import { HeaderComponent } from "../header/header.component";
import { TabViewModule } from 'primeng/tabview';
import { SettingsPageComponent } from "../settings-page/settings-page.component";
import { HeatmapPageComponent } from "../heatmap/heatmap-page.component";
import { IframeService } from '../services/iframe.service';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DataTablesComponent } from "../data-tables/data-tables.component";
import { DemographicsComponent } from "../demographics/demographics.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    TabMenuModule,
    SplitterModule,
    CardModule,
    HeaderComponent,
    TabViewModule,
    SettingsPageComponent,
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


  constructor(private iframeService: IframeService) {
    // Define tabs for the top tab menu
    this.menuItems = [
      {
        label: 'Tab 1',
        icon: 'pi pi-fw pi-home',
        command: () => {
          // Handle Tab 1 click
        }
      },
      {
        label: 'Tab 2',
        icon: 'pi pi-fw pi-calendar',
        command: () => {
          // Handle Tab 2 click
        }
      },
      {
        label: 'Tab 3',
        icon: 'pi pi-fw pi-pencil',
        command: () => {
          // Handle Tab 3 click
        }
      }
    ];
  }

}
