// login-page.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { RippleModule } from 'primeng/ripple';
import { PrimeNGConfig } from 'primeng/api';
import { Router } from '@angular/router';
import { ImageModule } from 'primeng/image';
import { signInWithEmailAndPassword } from 'firebase/auth';
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
}
