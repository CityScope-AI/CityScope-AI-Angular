import { TestBed } from '@angular/core/testing';

import { BasemapService } from './basemap.service';

describe('BasemapService', () => {
  let service: BasemapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BasemapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
