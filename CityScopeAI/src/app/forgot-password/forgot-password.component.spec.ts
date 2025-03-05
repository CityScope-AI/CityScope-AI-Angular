import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { Router } from '@angular/router';
import { FirebaseService } from '../../../firebase.service';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;

  // Minimal stub for FirebaseService; extend as needed
  const firebaseServiceStub = {
    auth: {} // Stubbed auth object
  };

  // Minimal stub for Router
  const routerStub = {
    navigate: jasmine.createSpy('navigate')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        { provide: FirebaseService, useValue: firebaseServiceStub },
        { provide: Router, useValue: routerStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the ForgotPasswordComponent', () => {
    expect(component).toBeTruthy();
  });
});
