import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastController, IonButton, IonContent, IonInput, IonSpinner, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { addIcons } from 'ionicons';
import {
  restaurant,
  logIn,
  logoGoogle,
  alertCircle,
  close,
} from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';
import { RestaurantContextService } from '../../core/restaurant-context.service';
import { ApiService } from '../../services/api.service';
import { GoogleLoginRequest } from '../../models';

interface GoogleProfileResult {
  profile?: {
    email?: string;
    displayName?: string;
    name?: string;
    photoUrl?: string;
    id?: string;
    sub?: string;
  };
  picture?: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonInput,
    IonButton,
    IonSpinner,
    IonIcon,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginPage {
  loginForm: FormGroup;
  isLoading = false;
  isLoggingIn = false;
  isGoogleLoggingIn = false;

  constructor(
    private readonly router: Router,
    private readonly formBuilder: FormBuilder,
    private readonly auth: AuthService,
    private readonly restaurantContext: RestaurantContextService,
    private readonly api: ApiService,
    private readonly toastController: ToastController,
  ) {
    addIcons({ restaurant, logIn, logoGoogle, alertCircle, close });

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async login(): Promise<void> {
    if (this.loginForm.invalid) {
      await this.showToast('Please enter valid credentials');
      this.markFormGroupTouched();
      return;
    }

    this.isLoggingIn = true;
    this.auth.login(this.loginForm.value).subscribe({
      next: async () => {
        await this.showToast('Login successful!', 'success');
        await this.routeAfterLogin();
        this.isLoggingIn = false;
      },
      error: async () => {
        await this.showToast('Login failed. Please check your credentials.', 'danger');
        this.isLoggingIn = false;
      },
    });
  }

  async googleLogin(): Promise<void> {
    try {
      this.isGoogleLoggingIn = true;
      await this.performNativeGoogleSignIn();
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      await this.showToast('Google login failed. Please try again.', 'danger');
    } finally {
      this.isGoogleLoggingIn = false;
    }
  }

  private async performNativeGoogleSignIn(): Promise<void> {
    await SocialLogin.initialize({
      google: {
        webClientId:
          '165799531253-rfm5v23nv4i8igk97cno4s33bp2qrivp.apps.googleusercontent.com',
        iOSServerClientId:
          '165799531253-rfm5v23nv4i8igk97cno4s33bp2qrivp.apps.googleusercontent.com',
      },
    });

    const response = await SocialLogin.login({
      provider: 'google',
      options: {
        scopes: ['profile', 'email'],
      },
    });

    if (!response?.result) {
      throw new Error('No login result from Google Sign-In');
    }

    const result = response.result as GoogleProfileResult;
    const googleLoginData: GoogleLoginRequest = {
      email: result.profile?.email || '',
      name: result.profile?.displayName || result.profile?.name || 'Google User',
      picture: result.profile?.photoUrl || result.picture || '',
      googleId: result.profile?.id || result.profile?.sub || '',
    };

    this.auth.googleLogin(googleLoginData).subscribe({
      next: async () => {
        await this.showToast('Google login successful!', 'success');
        await this.routeAfterLogin();
      },
      error: async () => {
        await this.showToast('Google login failed. Please try again.', 'danger');
      },
    });
  }

  private async routeAfterLogin(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user?.id) {
      void this.router.navigate(['/restaurants']);
      return;
    }

    this.api.getRestaurantByOwner(user.id).subscribe({
      next: (restaurants) => {
        if (restaurants?.length === 1) {
          this.restaurantContext.selectRestaurant(restaurants[0]);
          void this.router.navigate(['/dashboard']);
          return;
        }
        void this.router.navigate(['/restaurants']);
      },
      error: () => {
        void this.router.navigate(['/restaurants']);
      },
    });
  }

  markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
    }
    return '';
  }

  async showToast(message: string, color: string = 'warning'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      buttons: [{ icon: 'close', role: 'cancel' }],
    });
    await toast.present();
  }

  goToSignup(): void {
    void this.router.navigate(['/signup']);
  }
}
