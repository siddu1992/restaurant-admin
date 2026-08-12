import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RestaurantContextService } from '../../core/restaurant-context.service';
import { CreateFoodRequest } from '../../models';

@Component({
  selector: 'app-add-food',
  templateUrl: './add-food.page.html',
  styleUrls: ['./add-food.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class AddFoodPage {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  foodForm: FormGroup;
  isLoading = false;
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly apiService: ApiService,
    private readonly restaurantContext: RestaurantContextService,
    private readonly router: Router,
    private readonly toastController: ToastController,
    private readonly alertController: AlertController,
  ) {
    this.foodForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: [
        '',
        [Validators.required, Validators.minLength(10), Validators.maxLength(200)],
      ],
      price: ['', [Validators.required, Validators.min(1), Validators.max(10000)]],
      image: [''],
      available: [true],
      category: ['', Validators.required],
    });
  }

  goBack(): void {
    if (this.foodForm.dirty) {
      void this.showDiscardConfirmation();
    } else {
      void this.router.navigate(['/food-management']);
    }
  }

  async showDiscardConfirmation(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Discard Changes?',
      message: 'You have unsaved changes. Are you sure you want to leave?',
      buttons: [
        { text: 'Stay', role: 'cancel' },
        {
          text: 'Discard',
          role: 'destructive',
          handler: () => {
            void this.router.navigate(['/food-management']);
          },
        },
      ],
    });
    await alert.present();
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      void this.showToast('Please select a valid image file', 'danger');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      void this.showToast('Image size should be less than 5MB', 'danger');
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = typeof reader.result === 'string' ? reader.result : null;
      this.foodForm.patchValue({ image: this.imagePreview });
    };
    reader.readAsDataURL(file);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.foodForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.foodForm.get(fieldName);
    if (field?.errors) {
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

  async addFood(): Promise<void> {
    if (this.foodForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const restaurant = this.restaurantContext.selectedRestaurant;

    if (!restaurant?._id) {
      await this.showToast('No restaurant selected', 'danger');
      this.isLoading = false;
      return;
    }

    const foodData: CreateFoodRequest = {
      ...this.foodForm.value,
      restaurant: restaurant._id,
      image: this.imagePreview || this.foodForm.value.image,
    };

    this.apiService.addFood(foodData).subscribe({
      next: async () => {
        this.isLoading = false;
        await this.showToast('Food item added successfully!', 'success');
        void this.router.navigate(['/food-management']);
      },
      error: async () => {
        this.isLoading = false;
        await this.showToast('Failed to add food item. Please try again.', 'danger');
      },
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.foodForm.controls).forEach((key) => {
      this.foodForm.get(key)?.markAsTouched();
    });
  }

  async showToast(message: string, color: string = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      buttons: [{ icon: 'close', role: 'cancel' }],
    });
    await toast.present();
  }
}
