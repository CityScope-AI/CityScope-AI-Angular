import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Auth, User, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { FirebaseService } from '../../firebase.service'; // Adjust the path as needed

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable(); // Observable to track user state

  constructor(private firebaseService: FirebaseService) {
    onAuthStateChanged(this.firebaseService.auth, (user) => {
      this.userSubject.next(user); // Update user state
    });
  }

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.firebaseService.auth, email, password);
      this.userSubject.next(userCredential.user); // Store logged-in user
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  getUserEmail(): string | null {
    return this.userSubject.value?.email ?? null; // Get user email
  }

  isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

}
