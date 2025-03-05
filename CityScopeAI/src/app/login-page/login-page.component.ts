import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { RippleModule } from 'primeng/ripple';
import { PrimeNGConfig } from 'primeng/api';
import { Router } from '@angular/router';
import { ImageModule } from 'primeng/image';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { FirebaseService } from '../../../firebase.service'; // adjust the path as needed

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    PasswordModule,
    FormsModule,
    InputTextModule,
    FloatLabelModule,
    RippleModule,
    ImageModule
  ],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private primengConfig: PrimeNGConfig,
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit() {
    this.primengConfig.ripple = true;
  }

  async login() {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.firebaseService.auth,
        this.email,
        this.password
      );
      console.log('User logged in:', userCredential);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage = 'Invalid credentials. Please try again.';
      console.error('Login error:', error);
    }
  }

  async signUp() {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.firebaseService.auth,
        this.email,
        this.password
      );
      console.log('User signed up:', userCredential);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage = 'Sign up failed. Please try again.';
      console.error('Sign up error:', error);
    }
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.firebaseService.auth, provider);
      console.log('Google login result:', result);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage = 'Failed to sign in with Google. Please try again.';
      console.error('Google sign in error:', error);
    }
  }

  async forgotPassword() {
    // Reset any previous messages
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email) {
      this.errorMessage = 'Please enter your email address to reset your password.';
      return;
    }

    try {
      await sendPasswordResetEmail(this.firebaseService.auth, this.email);
      this.successMessage = 'Password reset email sent. Please check your inbox.';
      console.log('Password reset email sent.');
    } catch (error) {
      this.errorMessage = 'Failed to send password reset email. Please try again.';
      console.error('Forgot password error:', error);
    }
  }
}
