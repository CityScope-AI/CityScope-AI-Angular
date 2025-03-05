// Import the functions you need from the SDKs you need
import { Injectable } from '@angular/core';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD8i-4ZDnHzDJa9rRuF1QTTKhX3x4RFVZk",
  authDomain: "cityscopeai.firebaseapp.com",
  projectId: "cityscopeai",
  storageBucket: "cityscopeai.firebasestorage.app",
  messagingSenderId: "1060544253230",
  appId: "1:1060544253230:web:8685e8c8d1be407994bebf",
  measurementId: "G-VJYTRB4X7P"
};

@Injectable({
    providedIn: 'root' // This ensures the service is available application-wide
})

// Initialize Firebase
export class FirebaseService {
    app = initializeApp(firebaseConfig);
    auth = getAuth(this.app);
  }
