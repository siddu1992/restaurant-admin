import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  AlertController,
  IonIcon,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  cameraOutline,
  checkmarkCircleOutline,
  imageOutline,
  restaurantOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { RestaurantContextService } from '../../core/restaurant-context.service';
import { CreateFoodRequest } from '../../models';
import { ApiService } from '../../services/api.service';
import { UploadService } from '../../services/upload.service';

@Component({
  selector: 'app-add-food',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IonIcon, IonSpinner],
  templateUrl: './add-food.page.html',
  styleUrls: ['./add-food.page.scss'],
})
export class AddFoodPage implements OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  foodForm: FormGroup;
  isLoading = false;
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  readonly categories = [
    { value: 'main-course', label: 'Main Course' },
    { value: 'appetizer', label: 'Appetizer' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'beverage', label: 'Beverage' },
    { value: 'south-indian', label: 'South Indian' },
    { value: 'north-indian', label: 'North Indian' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'snacks', label: 'Snacks' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly apiService: ApiService,
    private readonly uploadService: UploadService,
    private readonly restaurantContext: RestaurantContextService,
    private readonly router: Router,
    private readonly toastController: ToastController,
    private readonly alertController: AlertController,
  ) {
    addIcons({
      alertCircleOutline,
      arrowBackOutline,
      cameraOutline,
      checkmarkCircleOutline,
      imageOutline,
      restaurantOutline,
    });

    this.foodForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      price: [null as number | null, [Validators.required, Validators.min(1), Validators.max(10000)]],
      image: [''],
      available: [true],
      category: ['', Validators.required],
    });
  }

  ngOnDestroy(): void {
    // no-op; kept for symmetry with other admin forms
  }

  get hasRestaurant(): boolean {
    return !!this.restaurantContext.restaurantId;
  }

  get previewImage(): string {
    return this.imagePreview || (this.foodForm.get('image')?.value as string) || '';
  }

  isInvalid(field: string): boolean {
    const control = this.foodForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  fieldError(field: string): string {
    const control = this.foodForm.get(field);
    if (!control?.errors) {
      return '';
    }
    if (control.errors['required']) {
      return 'This field is required';
    }
    if (control.errors['minlength']) {
      return `Must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    if (control.errors['maxlength']) {
      return `Must be under ${control.errors['maxlength'].requiredLength} characters`;
    }
    if (control.errors['min']) {
      return 'Must be at least ₹1';
    }
    if (control.errors['max']) {
      return 'Must be ₹10,000 or less';
    }
    return 'Invalid value';
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
      header: 'Discard changes?',
      message: 'You have unsaved changes. Leave without saving?',
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
      this.foodForm.markAsDirty();
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.imagePreview = null;
    this.selectedFile = null;
    this.foodForm.patchValue({ image: '' });
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  async submit(): Promise<void> {
    this.foodForm.markAllAsTouched();
    if (this.foodForm.invalid) {
      await this.showToast('Please complete required fields', 'warning');
      return;
    }

    const restaurant = this.restaurantContext.selectedRestaurant;
    if (!restaurant?._id) {
      await this.showToast('Select a restaurant first', 'danger');
      return;
    }

    this.isLoading = true;
    try {
      const formValue = this.foodForm.getRawValue();
      let imageUrl = formValue.image || undefined;

      // Upload file if selected
      if (this.selectedFile) {
        imageUrl = await this.uploadService.uploadFoodImage(this.selectedFile);
      }

      const foodData: CreateFoodRequest = {
        name: String(formValue.name).trim(),
        description: String(formValue.description || '').trim(),
        price: Number(formValue.price),
        category: formValue.category,
        available: !!formValue.available,
        restaurant: restaurant._id,
        image: imageUrl,
      };

      await firstValueFrom(this.apiService.addFood(foodData));
      await this.showToast('Menu item added', 'success');
      void this.router.navigate(['/food-management']);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to add menu item. Please try again.';
      await this.showToast(errorMsg, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async showToast(message: string, color: string = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2800,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
