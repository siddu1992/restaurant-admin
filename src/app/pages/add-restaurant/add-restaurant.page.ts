import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cameraOutline,
  checkmarkCircleOutline,
  imageOutline,
  locationOutline,
  storefrontOutline,
} from 'ionicons/icons';
import { Subject, Subscription, firstValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { RestaurantContextService } from '../../core/restaurant-context.service';
import { CreateRestaurantRequest } from '../../models';
import { ApiService } from '../../services/api.service';
import { UploadService } from '../../services/upload.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-restaurant',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IonIcon],
  templateUrl: './add-restaurant.page.html',
  styleUrls: ['./add-restaurant.page.scss'],
})
export class AddRestaurantPage implements OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  restaurantForm: FormGroup;
  isSubmitting = false;
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  geoStatus: 'idle' | 'loading' | 'success' | 'failed' = 'idle';
  private readonly addressSubject = new Subject<string>();
  private readonly subs = new Subscription();

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly uploadService: UploadService,
    private readonly auth: AuthService,
    private readonly restaurantContext: RestaurantContextService,
    private readonly formBuilder: FormBuilder,
    private readonly toastController: ToastController,
  ) {
    addIcons({
      arrowBackOutline,
      cameraOutline,
      checkmarkCircleOutline,
      imageOutline,
      locationOutline,
      storefrontOutline,
    });

    this.restaurantForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', [Validators.required, Validators.minLength(6)]],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      cuisine: ['', Validators.required],
      description: [''],
      image: [''],
      deliveryTime: ['25-35 min', Validators.required],
      minOrder: [15, [Validators.required, Validators.min(0)]],
      latitude: [null as number | null, Validators.required],
      longitude: [null as number | null, Validators.required],
    });

    this.subs.add(
      this.addressSubject
        .pipe(debounceTime(600), distinctUntilChanged())
        .subscribe((address) => {
          void this.geocodeAddress(address);
        }),
    );

    this.subs.add(
      this.restaurantForm.get('address')!.valueChanges.subscribe((address: string) => {
        if (address && address.trim().length > 5) {
          this.addressSubject.next(address.trim());
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get previewImage(): string {
    return this.imagePreview || (this.restaurantForm.get('image')?.value as string) || '';
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
      this.restaurantForm.patchValue({ image: this.imagePreview });
      this.restaurantForm.markAsDirty();
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.imagePreview = null;
    this.selectedFile = null;
    this.restaurantForm.patchValue({ image: '' });
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  isInvalid(field: string): boolean {
    const control = this.restaurantForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  fieldError(field: string): string {
    const control = this.restaurantForm.get(field);
    if (!control?.errors) {
      return '';
    }
    if (control.errors['required']) {
      return 'This field is required';
    }
    if (control.errors['minlength']) {
      return `Must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    if (control.errors['pattern']) {
      return 'Enter a valid 6-digit pincode';
    }
    if (control.errors['min']) {
      return 'Must be 0 or greater';
    }
    return 'Invalid value';
  }

  async submit(): Promise<void> {
    this.restaurantForm.markAllAsTouched();
    if (this.restaurantForm.invalid) {
      await this.showToast('Please complete all required fields', 'warning');
      return;
    }

    const owner = this.auth.currentUser;
    if (!owner?.id) {
      await this.showToast('Please sign in again', 'danger');
      this.auth.logout();
      return;
    }

    this.isSubmitting = true;
    try {
      const formValue = this.restaurantForm.getRawValue();
      let imageUrl = formValue.image || undefined;

      // Upload file if selected
      if (this.selectedFile) {
        imageUrl = await this.uploadService.uploadRestaurantImage(this.selectedFile);
      }

      const restaurantData: CreateRestaurantRequest = {
        name: formValue.name,
        address: formValue.address,
        cuisine: formValue.cuisine,
        description: formValue.description || undefined,
        image: imageUrl,
        deliveryTime: formValue.deliveryTime,
        minOrder: Number(formValue.minOrder),
        latitude: Number(formValue.latitude),
        longitude: Number(formValue.longitude),
        pincode: String(formValue.pincode),
        owner: owner.id,
      };

      const created = await firstValueFrom(
        this.apiService.createRestaurant(restaurantData),
      );
      if (created?._id) {
        this.restaurantContext.selectRestaurant(created);
      }
      await this.showToast('Restaurant added successfully', 'success');
      void this.router.navigate(['/dashboard']);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Could not add restaurant. Please try again.';
      await this.showToast(errorMsg, 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }

  private async geocodeAddress(address: string): Promise<void> {
    const apiKey = environment.googleMapsApiKey;
    if (!apiKey) {
      this.geoStatus = 'failed';
      return;
    }

    this.geoStatus = 'loading';
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = (await response.json()) as {
        status: string;
        results?: Array<{ geometry: { location: { lat: number; lng: number } } }>;
      };

      if (data.status === 'OK' && data.results?.[0]) {
        const location = data.results[0].geometry.location;
        this.restaurantForm.patchValue({
          latitude: location.lat,
          longitude: location.lng,
        });
        this.geoStatus = 'success';
      } else {
        this.geoStatus = 'failed';
      }
    } catch {
      this.geoStatus = 'failed';
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
