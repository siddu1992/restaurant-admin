import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Capacitor } from '@capacitor/core';
import { addIcons } from 'ionicons';
import { 
  restaurant, 
  logIn, 
  logoGoogle, 
  alertCircle, 
  close 
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  providers: [ApiService],
  imports: [IonicModule, CommonModule, ReactiveFormsModule, HttpClientModule]
})
export class LoginPage {
  loginForm: FormGroup;
  isLoading = false;
  isLoggingIn = false;
  isGoogleLoggingIn = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    // Register icons
    addIcons({ restaurant, logIn, logoGoogle, alertCircle, close });
    
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async login() {
    if (this.loginForm.invalid) {
      await this.showToast('Please enter valid credentials');
      this.markFormGroupTouched();
      return;
    }

    try {
      this.isLoggingIn = true;
      const loginData = this.loginForm.value;
      
      this.apiService.login(loginData).subscribe({
        next: async (response) => {
          await this.showToast('Login successful!', 'success');
          localStorage.setItem('authUser', JSON.stringify(response.user));
          localStorage.setItem('restaurant', JSON.stringify(response.restaurant));
          localStorage.setItem('authToken', response.token || 'demo-token');
          this.router.navigate(['/restaurants-list']);
        },
        error: async (error) => {
          await this.showToast('Login failed. Please check your credentials.', 'danger');
        }
      });
    } catch (error) {
      await this.showToast('Login failed. Please try again.', 'danger');
    } finally {
      this.isLoggingIn = false;
    }
  }

  async googleLogin() {
    console.log('=== GOOGLE LOGIN BUTTON CLICKED ===');
    try {
      this.isGoogleLoggingIn = true;
      
      // Try real Google Sign-In first
      console.log('Attempting real Google Sign-In...');
      if (Capacitor.isNativePlatform()) {
        await this.performNativeGoogleSignIn();
      } else {
        await this.performWebGoogleSignIn();
      }
      
    } catch (error) {
      console.error('Google Sign-In failed, falling back to demo:', error);
      // Fallback to demo login
      await this.simulateGoogleLogin();
    } finally {
      this.isGoogleLoggingIn = false;
    }
  }

  private async performNativeGoogleSignIn() {
    try {
      console.log('Initializing Google Auth for native platform...');
      await SocialLogin.initialize({
        google: {
          webClientId: '165799531253-rfm5v23nv4i8igk97cno4s33bp2qrivp.apps.googleusercontent.com',
          iOSServerClientId: '165799531253-rfm5v23nv4i8igk97cno4s33bp2qrivp.apps.googleusercontent.com'
        }
      });
      
      console.log('Performing Google Sign-In...');
      const response = await SocialLogin.login({
        provider: 'google',
        options: {
          scopes: ['email', 'profile']
        }
      });
      
      if (response && response.result) {
        console.log('Google Sign-In successful:', response.result);
        
        // Send to backend for verification
        const googleLoginData = {
          email: (response.result as any).email,
          name: (response.result as any).displayName || (response.result as any).name || 'Google User',
          picture: (response.result as any).photoUrl || (response.result as any).picture || '',
          googleId: (response.result as any).id || (response.result as any).sub || ''
        };

        console.log('Sending Google login data to backend:', googleLoginData);

        // Call your backend API
        this.apiService.googleLogin(googleLoginData).subscribe({
          next: async (apiResponse) => {
            await this.showToast('Google login successful!', 'success');
            localStorage.setItem('authUser', JSON.stringify(apiResponse.user));
            localStorage.setItem('restaurant', JSON.stringify(apiResponse.restaurant));
            localStorage.setItem('authToken', apiResponse.token || 'demo-token');
            this.router.navigate(['/dashboard']);
          },
          error: async (error) => {
            console.error('Backend Google login error:', error);
            await this.showToast('Google login failed. Please try again.', 'danger');
          }
        });
      }
    } catch (error) {
      console.error('Native Google Sign-In error:', error);
      throw error; // Re-throw to trigger fallback
    }
  }

  private async performWebGoogleSignIn() {
    // For web platform, fallback to demo for now
    console.log('Web platform detected, using demo login');
    await this.simulateGoogleLogin();
  }

  private async simulateGoogleLogin() {
    try {
      console.log('Starting demo login simulation...');
      
      // Simulate Google login for demo purposes
      console.log('Waiting 1.5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Creating mock user data...');
      const mockGoogleUser = {
        email: 'demo@restaurant.com',
        name: 'Demo Restaurant Owner',
        picture: 'https://via.placeholder.com/150',
        googleId: 'demo_google_id'
      };

      console.log('Setting localStorage data...');
      localStorage.setItem('authUser', JSON.stringify(mockGoogleUser));
      localStorage.setItem('authToken', 'demo-google-token');
      localStorage.setItem('restaurant', JSON.stringify({
        _id: 'demo-restaurant-id',
        name: 'Demo Restaurant',
        address: '123 Demo Street',
        cuisine: 'International',
        image: 'https://via.placeholder.com/300x200',
        rating: 4.5,
        deliveryTime: '30-45 min',
        minOrder: 15,
        owner: mockGoogleUser.email
      }));

      console.log('Skipping toast for now...');
      // await this.showToast('Demo login successful! Welcome to Restaurant Admin.', 'success');
      
      console.log('Navigating to dashboard...');
      try {
        await this.router.navigate(['/dashboard']);
        console.log('Navigation to dashboard successful');
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Fallback to restaurants-list if dashboard fails
        console.log('Trying fallback navigation to restaurants-list...');
        try {
          await this.router.navigate(['/restaurants-list']);
          console.log('Fallback navigation successful');
        } catch (fallbackError) {
          console.error('Fallback navigation also failed:', fallbackError);
          // Last resort - try to show a simple alert
          alert('Demo login successful! Navigation failed.');
        }
      }
      
      console.log('Demo login completed successfully!');
    } catch (error) {
      console.error('Error in simulateGoogleLogin:', error);
      throw error;
    }
  }

  // Form validation helpers
  markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
    }
    return '';
  }

  async showToast(message: string, color: string = 'warning') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top',
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }
} 