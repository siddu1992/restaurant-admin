import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-add-food',
  templateUrl: './add-food.page.html',
  styleUrls: ['./add-food.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, HttpClientModule, ReactiveFormsModule],
  providers: [ApiService]
})
export class AddFoodPage {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  foodForm: FormGroup;
  isLoading = false;
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    this.foodForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      price: ['', [Validators.required, Validators.min(1), Validators.max(10000)]],
      image: [''],
      available: [true],
      category: ['', Validators.required]
    });
  }

  goBack() {
    if (this.foodForm.dirty) {
      this.showDiscardConfirmation();
    } else {
      this.router.navigate(['/food-management']);
    }
  }

  async showDiscardConfirmation() {
    const alert = await this.alertController.create({
      header: 'Discard Changes?',
      message: 'You have unsaved changes. Are you sure you want to leave?',
      buttons: [
        {
          text: 'Stay',
          role: 'cancel'
        },
        {
          text: 'Discard',
          role: 'destructive',
          handler: () => {
            this.router.navigate(['/food-management']);
          }
        }
      ]
    });
    await alert.present();
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showToast('Please select a valid image file', 'danger');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('Image size should be less than 5MB', 'danger');
        return;
      }

      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.foodForm.patchValue({ image: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.foodForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.foodForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be less than ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['min']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be less than ${field.errors['max'].max}`;
      }
    }
    return '';
  }

  async addFood() {
    if (this.foodForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const restaurant = JSON.parse(localStorage.getItem('selectedRestaurant') || '{}');
    
    if (!restaurant._id) {
      this.showToast('No restaurant selected', 'danger');
      this.isLoading = false;
      return;
    }

    const foodData = { 
      ...this.foodForm.value, 
      restaurant: restaurant._id 
    };

    // If we have a selected file, upload it first
    if (this.selectedFile) {
      try {
        // For now, we'll use the base64 data URL
        // In a real app, you'd upload to a cloud service
        foodData.image = this.imagePreview;
      } catch (error) {
        this.showToast('Failed to process image', 'danger');
        this.isLoading = false;
        return;
      }
    }

    this.apiService.addFood(foodData).subscribe({
      next: async () => {
        this.isLoading = false;
        await this.showToast('Food item added successfully! 🎉', 'success');
        this.router.navigate(['/food-management']);
      },
      error: async (error) => {
        this.isLoading = false;
        console.error('Error adding food:', error);
        await this.showToast('Failed to add food item. Please try again.', 'danger');
      }
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.foodForm.controls).forEach(key => {
      const control = this.foodForm.get(key);
      control?.markAsTouched();
    });
  }

  async showToast(message: string, color: string = 'success') {
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
} 
