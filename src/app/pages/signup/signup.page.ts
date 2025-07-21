import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  providers: [ApiService],
  imports: [IonicModule, CommonModule, ReactiveFormsModule, HttpClientModule]
})
export class SignupPage {
  signupForm: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.signupForm = this.formBuilder.group({
      ownerName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async signup() {
    if (this.signupForm.invalid) {
      await this.showToast('Please fill all required fields correctly');
      return;
    }
    const loading = await this.loadingController.create({ message: 'Signing up...' });
    await loading.present();
    try {
      const signupData = this.signupForm.value;
      delete signupData.confirmPassword;
      await this.apiService.ownerSignup(signupData).toPromise();
      await this.showToast('Account created successfully! Please login.');
      this.router.navigate(['/login']);
    } catch (error) {
      await this.showToast('Error creating account. Please try again.');
    } finally {
      await loading.dismiss();
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

  goToLogin() {
    this.router.navigate(['/login']);
  }
} 