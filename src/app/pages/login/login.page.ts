import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastController, LoadingController, IonButton, IonContent, IonHeader, IonInput, IonSpinner, IonTitle, IonToolbar ,IonIcon} from '@ionic/angular/standalone';
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
 imports: [
  IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonInput, 
    IonButton, 
    IonSpinner, 
    IonIcon,
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule, 
   IonContent, ],
    providers:[ApiService],
    schemas:[CUSTOM_ELEMENTS_SCHEMA]})
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
      await this.performNativeGoogleSignIn();
      
    } catch (error) {
      console.error('Google Sign-In failed, falling back to demo:', error);
      // Fallback to demo login
     // await this.simulateGoogleLogin();
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
      scopes: ['profile', 'email']
  }
    });

    if (response && response.result) {
      const result = response.result as any;

      const googleLoginData = {
        email: result.profile.email || '',
        name: result.profile.displayName || result.profile.name || 'Google User',
        picture: result.profile.photoUrl || result.picture || '',
        googleId: result.profile.id || result.profile.sub || '',
      };

      console.log('Sending Google login data to backend:', googleLoginData);

      this.apiService.googleLogin(googleLoginData).subscribe({
        next: async (apiResponse) => {
          await this.showToast('Google login successful!', 'success');
          localStorage.setItem('authUser', JSON.stringify(apiResponse.user));
          localStorage.setItem('restaurant', JSON.stringify(apiResponse.restaurant));
          localStorage.setItem('authToken', apiResponse.token || 'demo-token');
          this.router.navigate(['/restaurants-list']);
        },
        error: async (error) => {
          console.error('Backend Google login error:', error);
          await this.showToast('Google login failed. Please try again.', 'danger');
        }
      });
    } else {
      throw new Error('No login result from Google Sign-In');
    }
  } catch (error) {
    console.error('Native Google Sign-In error:', error);
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