import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemographicsComponent } from './demographics.component';

describe('DemographicsComponent', () => {
  let component: DemographicsComponent;
  let fixture: ComponentFixture<DemographicsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemographicsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DemographicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
