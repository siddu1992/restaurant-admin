import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

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

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async login() {
    if (this.loginForm.invalid) {
      await this.showToast('Please enter valid credentials');
      return;
    }
    const loading = await this.loadingController.create({ message: 'Logging in...' });
    await loading.present();
    try {
      const loginData = this.loginForm.value;
      this.apiService.login(loginData).subscribe({
        next: async (response) => {
          await loading.dismiss();
          await this.showToast('Login successful!');
          localStorage.setItem('authUser', JSON.stringify(response.user));
          localStorage.setItem('restaurant', JSON.stringify(response.restaurant));
          localStorage.setItem('authToken', response.token || 'demo-token');
          this.router.navigate(['/dashboard']);
        },
        error: async (error) => {
          await loading.dismiss();
          await this.showToast('Login failed. Please check your credentials.');
        }
      });
    } catch (error) {
      await loading.dismiss();
      await this.showToast('Login failed. Please check your credentials.');
    }
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: 'warning'
    });
    await toast.present();
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }
} 