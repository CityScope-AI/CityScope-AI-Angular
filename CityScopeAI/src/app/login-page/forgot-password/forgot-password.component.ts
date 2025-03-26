import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseService } from '../../../../firebase.service';
import { Router } from '@angular/router';
import { ImageModule } from 'primeng/image';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ImageModule,
    FloatLabelModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  value: string | undefined;

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private messageService: MessageService
  ) {}

  async resetPassword() {
    // Clear previous messages.
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email) {
      this.messageService.add({ severity: 'error', summary: 'Password Reset Failed', detail: 'Please enter your email again' });
      return;
    }

    try {
      await sendPasswordResetEmail(this.firebaseService.auth, this.email);
      this.messageService.add({ severity: 'success', summary: 'Reset Email Sent', detail: 'Password reset email sent. Please check your inbox.' });
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
