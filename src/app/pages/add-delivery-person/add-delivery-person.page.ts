import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-add-delivery-person',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './add-delivery-person.page.html',
  styleUrls: ['./add-delivery-person.page.scss']
})
export class AddDeliveryPersonPage implements OnInit {
  isLoading = false;
  isRegistering = false;
  registrationSuccess = false;
  
  deliveryForm: FormGroup;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private toastController: ToastController,
    private apiService: ApiService
  ) {
    this.deliveryForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      vehicleNumber: [''],
      vehicleType: ['bicycle'],
      address: ['']
    });
  }

  ngOnInit() {
    // Page initialization logic if needed
  }

  async registerDeliveryPerson() {
    if (this.deliveryForm.invalid) {
      await this.showToast('Please fill all required fields correctly', 'warning');
      this.markFormGroupTouched();
      return;
    }

    try {
      this.isRegistering = true;
      
      const formData = this.deliveryForm.value;
      console.log('Registering delivery person:', formData);
      
      await this.apiService.registerDeliveryPerson(formData).toPromise();
      
      // Show success state
      this.registrationSuccess = true;
      
      await this.showToast('Delivery person registered successfully!', 'success');
      
    } catch (error) {
      console.error('Error registering delivery person:', error);
      await this.showToast('Error registering delivery person. Please try again.', 'danger');
    } finally {
      this.isRegistering = false;
    }
  }

  addAnother() {
    // Reset form and success state
    this.deliveryForm.reset();
    this.deliveryForm.patchValue({
      vehicleType: 'bicycle'
    });
    this.registrationSuccess = false;
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  // Form validation helpers
  markFormGroupTouched() {
    Object.keys(this.deliveryForm.controls).forEach(key => {
      const control = this.deliveryForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.deliveryForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.deliveryForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid phone number (10 digits)';
      }
    }
    return '';
  }

  // Utility methods
  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
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

  // Form field getters for template
  get nameField() {
    return this.deliveryForm.get('name');
  }

  get emailField() {
    return this.deliveryForm.get('email');
  }

  get passwordField() {
    return this.deliveryForm.get('password');
  }

  get phoneField() {
    return this.deliveryForm.get('phone');
  }
} 