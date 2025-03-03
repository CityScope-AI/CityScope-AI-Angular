import { Component } from '@angular/core';
import { IframeService } from '../services/iframe.service';
import { ButtonModule } from 'primeng/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-demographics',
  standalone: true,
  imports: [
    ButtonModule
  ],
  templateUrl: './demographics.component.html',
  styleUrl: './demographics.component.css'
})
export class DemographicsComponent {
  iframeSrc: SafeResourceUrl;

  constructor(private iframeService: IframeService, private sanitizer: DomSanitizer) {
    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl('http://127.0.0.1:8050/');
  }

    changePort(port: number) {
      this.iframeService.updateSrc(port);
    }

    ngOnInit() {
      this.iframeService.currentSrc.subscribe(src => {
        this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(src);
      });
    }
}
