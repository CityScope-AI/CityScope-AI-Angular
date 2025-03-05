import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseService } from '../../../firebase.service'; // adjust the path as needed
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  template: `
    <div class="forgot-password-container">
      <h2>Forgot Password</h2>
      <p>Please enter your email address to receive a password reset link:</p>
      <div class="inputBx">
        <input 
          type="email" 
          [(ngModel)]="email" 
          placeholder="Enter your email" 
          class="email-input"
        />
      </div>
      <div class="button-container">
        <button 
          pButton 
          pRipple 
          label="Reset Password" 
          (click)="resetPassword()">
        </button>
        <button 
          pButton 
          pRipple 
          label="Back to Login" 
          (click)="goBack()">
        </button>
      </div>
      <div *ngIf="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="success-message">
        {{ successMessage }}
      </div>
    </div>
  `,
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  async resetPassword() {
    // Clear previous messages.
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    try {
      await sendPasswordResetEmail(this.firebaseService.auth, this.email);
      this.successMessage = 'Password reset email sent. Please check your inbox.';
      console.log('Password reset email sent.');
    } catch (error) {
      this.errorMessage = 'Failed to send password reset email. Please try again.';
      console.error('Reset password error:', error);
    }
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
