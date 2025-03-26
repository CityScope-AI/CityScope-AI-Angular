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
  apiKey: "AIzaSyClgoR6scqGBY6E-9Jqod_YvxmFf3fR1lY",
  authDomain: "cityscope-ai-angular.firebaseapp.com",
  projectId: "cityscope-ai-angular",
  storageBucket: "cityscope-ai-angular.firebasestorage.app",
  messagingSenderId: "959489279737",
  appId: "1:959489279737:web:4b027ffd9b44d062a60428",
  measurementId: "G-253YG8TMCM"
};

@Injectable({
    providedIn: 'root' // This ensures the service is available application-wide
})

// Initialize Firebase
export class FirebaseService {
    app = initializeApp(firebaseConfig);
    auth = getAuth(this.app);
  }
