import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  ToastController,
  LoadingController,
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonTitle,
  IonToolbar,
  IonIcon,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { OwnerSignupRequest } from '../../models';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonInput,
    IonButton,
    IonIcon,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SignupPage {
  signupForm: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly toastController: ToastController,
    private readonly loadingController: LoadingController,
  ) {
    this.signupForm = this.formBuilder.group(
      {
        ownerName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async signup(): Promise<void> {
    if (this.signupForm.invalid) {
      await this.showToast('Please fill all required fields correctly');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Signing up...' });
    await loading.present();

    const { confirmPassword, ...rest } = this.signupForm.value as OwnerSignupRequest & {
      confirmPassword: string;
    };
    void confirmPassword;

    const payload: OwnerSignupRequest = {
      ownerName: rest.ownerName,
      email: rest.email,
      password: rest.password,
      phone: rest.phone,
    };

    this.auth.signupOwner(payload).subscribe({
      next: async () => {
        await loading.dismiss();
        await this.showToast('Account created successfully! Please login.');
        void this.router.navigate(['/login']);
      },
      error: async () => {
        await loading.dismiss();
        await this.showToast('Error creating account. Please try again.');
      },
    });
  }

  async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'warning',
    });
    await toast.present();
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }
}
