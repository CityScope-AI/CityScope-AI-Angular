import { InputSwitchModule } from 'primeng/inputswitch';
import { AvatarModule } from 'primeng/avatar';
import { Component, OnInit, inject } from '@angular/core';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Router } from '@angular/router';
import { PrimeNGConfig } from 'primeng/api';
import { ThemeService } from '../../../../services/theme.service'; // Make sure the path is correct
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    AvatarModule,
    InputSwitchModule,
    FormsModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'] // <-- This was incorrect ("styleUrl" → "styleUrls")
})
export class SidebarComponent implements OnInit {
  defaultImage = 'https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png';
  profileImageUrl: string | null = null;

  isDarkMode = true;
  checked = true;
  selectedTheme = 'dark';

  // `inject()` is valid here in Angular 14+ standalone components
  themeService = inject(ThemeService);

  constructor(
    private router: Router,
    private primengConfig: PrimeNGConfig
  ) {}

  async ngOnInit(): Promise<void> {
    this.primengConfig.ripple = true;
    this.themeService.setTheme(this.selectedTheme);
    await this.loadProfileImage();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const storage = getStorage();
    const storageRef = ref(storage, `profilePictures/${user.uid}`);

    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      this.profileImageUrl = downloadURL;

      // Save URL to Firestore
      const db = getFirestore();
      await setDoc(doc(db, 'users', user.uid), {
        profileImageUrl: downloadURL
      }, { merge: true });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    }
  }

  async loadProfileImage(): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (userDoc.exists()) {
      this.profileImageUrl = userDoc.data()?.['profileImageUrl'] ?? null;
    }
  }

  onThemeChange(theme: string): void {
    this.selectedTheme = theme;
    this.themeService.setTheme(theme);
  }
}
