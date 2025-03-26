import { Component, OnInit, inject } from '@angular/core';
import { ThemeService } from '../../../../services/theme.service';
import { InputSwitchModule } from 'primeng/inputswitch';
import { Router } from '@angular/router';
import { PrimeNGConfig } from 'primeng/api';
import { FormsModule } from '@angular/forms';

import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    InputSwitchModule,
    FormsModule,
    AvatarGroupModule,
    AvatarModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  isDarkMode: boolean = true;

  checked: boolean = true;
  selectedTheme: string = 'dark';
  themeService: ThemeService = inject(ThemeService);

  constructor(    private router: Router,
          private primengConfig: PrimeNGConfig,) {

  }


  ngOnInit(): void {
    this.themeService.setTheme(this.selectedTheme);
    this.primengConfig.ripple = true;

  }

  onThemeChange(theme: string): void {
    this.selectedTheme = theme;
    this.themeService.setTheme(theme);
  }

}
