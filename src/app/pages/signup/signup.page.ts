import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonLabel,
  IonTitle,
  IonToolbar,
  LoadingController,
  ToastController,
} from '@ionic/angular/standalone';

import { AuthService } from '../../core/auth.service';
import { OwnerSignupRequest } from '../../models';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,

    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
    IonLabel,
  ],
})
export class SignupPage {
  signupForm: FormGroup;
  isLoading = false;

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

        email: [
          '',
          [
            Validators.required,
            Validators.email,
          ],
        ],

        phone: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[0-9]{10}$/),
          ],
        ],

        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
          ],
        ],

        confirmPassword: [
          '',
          Validators.required,
        ],
      },
      {
        validators: this.passwordMatchValidator,
      },
    );
  }

  passwordMatchValidator(
    form: AbstractControl,
  ): ValidationErrors | null {

    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (
      password.value &&
      confirmPassword.value &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({
        ...confirmPassword.errors,
        passwordMismatch: true,
      });

      return {
        passwordMismatch: true,
      };
    }

    if (confirmPassword.hasError('passwordMismatch')) {
      const errors = { ...confirmPassword.errors };

      delete errors['passwordMismatch'];

      confirmPassword.setErrors(
        Object.keys(errors).length > 0 ? errors : null,
      );
    }

    return null;
  }

  async signup(): Promise<void> {

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();

      await this.showToast(
        'Please fill all required fields correctly',
      );

      return;
    }

    this.isLoading = true;

    const loading = await this.loadingController.create({
      message: 'Creating account...',
    });

    await loading.present();

    const formValue = this.signupForm.getRawValue();

    const payload: OwnerSignupRequest = {
      ownerName: formValue.ownerName,
      email: formValue.email,
      phone: formValue.phone,
      password: formValue.password,
    };

    this.auth.signupOwner(payload).subscribe({
      next: async () => {
        this.isLoading = false;

        await loading.dismiss();

        await this.showToast(
          'Account created successfully! Please login.',
        );

        void this.router.navigate(['/login']);
      },

      error: async () => {
        this.isLoading = false;

        await loading.dismiss();

        await this.showToast(
          'Error creating account. Please try again.',
        );
      },
    });
  }

  async showToast(message: string): Promise<void> {

    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'warning',
      position: 'bottom',
    });

    await toast.present();
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }
}