import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  bicycleOutline,
  checkmarkCircleOutline,
  personAddOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-add-delivery-person',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IonIcon],
  templateUrl: './add-delivery-person.page.html',
  styleUrls: ['./add-delivery-person.page.scss'],
})
export class AddDeliveryPersonPage {
  isRegistering = false;
  registrationSuccess = false;
  deliveryForm: FormGroup;

  readonly vehicleTypes = [
    { value: 'bicycle', label: 'Bicycle' },
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'scooter', label: 'Scooter' },
    { value: 'car', label: 'Car' },
  ];

  constructor(
    private readonly router: Router,
    private readonly formBuilder: FormBuilder,
    private readonly toastController: ToastController,
    private readonly apiService: ApiService,
  ) {
    addIcons({
      arrowBackOutline,
      bicycleOutline,
      checkmarkCircleOutline,
      personAddOutline,
    });

    this.deliveryForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      vehicleNumber: [''],
      vehicleType: ['bicycle', Validators.required],
      address: [''],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  isInvalid(fieldName: string): boolean {
    const field = this.deliveryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  fieldError(fieldName: string): string {
    const field = this.deliveryForm.get(fieldName);
    if (!field?.errors) {
      return '';
    }
    if (field.errors['required']) {
      return 'This field is required';
    }
    if (field.errors['email']) {
      return 'Enter a valid email address';
    }
    if (field.errors['minlength']) {
      return `Must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors['pattern']) {
      if (fieldName === 'phone') {
        return 'Enter a valid 10-digit phone number';
      }
      if (fieldName === 'pincode') {
        return 'Enter a valid 6-digit pincode';
      }
      return 'Invalid format';
    }
    return 'Invalid value';
  }

  async registerDeliveryPerson(): Promise<void> {
    this.deliveryForm.markAllAsTouched();
    if (this.deliveryForm.invalid) {
      await this.showToast('Please fill all required fields correctly', 'warning');
      return;
    }

    this.isRegistering = true;
    try {
      const formData = this.deliveryForm.getRawValue() as {
        name: string;
        email: string;
        password: string;
        phone: string;
        vehicleNumber?: string;
        vehicleType?: string;
        address?: string;
        pincode: string;
      };

      await firstValueFrom(
        this.apiService.registerDeliveryPerson({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        }),
      );

      this.registrationSuccess = true;
      await this.showToast('Delivery person registered successfully', 'success');
    } catch {
      await this.showToast('Registration failed. Please try again.', 'danger');
    } finally {
      this.isRegistering = false;
    }
  }

  addAnother(): void {
    this.deliveryForm.reset({
      vehicleType: 'bicycle',
      vehicleNumber: '',
      address: '',
    });
    this.registrationSuccess = false;
  }

  goBack(): void {
    void this.router.navigate(['/dashboard']);
  }

  private async showToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2800,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
