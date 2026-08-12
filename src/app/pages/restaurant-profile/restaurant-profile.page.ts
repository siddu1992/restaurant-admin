import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { IonIcon, IonSpinner, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  businessOutline,
  checkmarkCircleOutline,
  imageOutline,
  locationOutline,
  saveOutline,
  storefrontOutline,
} from 'ionicons/icons';
import { Subject, Subscription, firstValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RestaurantContextService } from '../../core/restaurant-context.service';
import { Restaurant, UpdateRestaurantRequest } from '../../models';
import { ApiService } from '../../services/api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-restaurant-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IonIcon, IonSpinner],
  templateUrl: './restaurant-profile.page.html',
  styleUrls: ['./restaurant-profile.page.scss'],
})
export class RestaurantProfilePage implements OnInit, OnDestroy {
  restaurantForm!: FormGroup;
  restaurant: Restaurant | null = null;
  isLoading = true;
  isSaving = false;
  loadError: string | null = null;
  geoStatus: 'idle' | 'loading' | 'success' | 'failed' = 'idle';
  imageBroken = false;

  private restaurantId = '';
  private readonly addressSubject = new Subject<string>();
  private readonly subs = new Subscription();
  private skipNextGeocode = false;

  constructor(
    private readonly apiService: ApiService,
    private readonly fb: FormBuilder,
    private readonly toastController: ToastController,
    private readonly restaurantContext: RestaurantContextService,
  ) {
    addIcons({
      alertCircleOutline,
      businessOutline,
      checkmarkCircleOutline,
      imageOutline,
      locationOutline,
      saveOutline,
      storefrontOutline,
    });
  }

  ngOnInit(): void {
    this.restaurantForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', [Validators.required, Validators.minLength(6)]],
      cuisine: ['', Validators.required],
      image: [''],
      minOrder: [0, [Validators.required, Validators.min(0)]],
      deliveryTime: ['', Validators.required],
      description: [''],
      available: [true],
      latitude: [null as number | null, Validators.required],
      longitude: [null as number | null, Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });

    this.subs.add(
      this.addressSubject
        .pipe(debounceTime(650), distinctUntilChanged())
        .subscribe((address) => {
          void this.geocodeAddress(address);
        }),
    );

    this.subs.add(
      this.restaurantForm.get('address')!.valueChanges.subscribe((address: string) => {
        if (this.skipNextGeocode) {
          this.skipNextGeocode = false;
          return;
        }
        if (address && address.trim().length > 5) {
          this.addressSubject.next(address.trim());
        }
      }),
    );

    this.subs.add(
      this.restaurantForm.get('image')!.valueChanges.subscribe(() => {
        this.imageBroken = false;
      }),
    );

    this.subs.add(
      this.restaurantContext.restaurant$.subscribe((selected) => {
        const nextId = selected?._id || '';
        if (!nextId) {
          this.restaurantId = '';
          this.restaurant = null;
          this.isLoading = false;
          this.loadError = 'Select a restaurant to edit its profile.';
          return;
        }
        if (nextId !== this.restaurantId) {
          this.restaurantId = nextId;
          this.loadRestaurant();
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get hasRestaurant(): boolean {
    return !!this.restaurantId;
  }

  get previewImage(): string {
    return (this.restaurantForm?.get('image')?.value as string) || '';
  }

  get isOpen(): boolean {
    return !!this.restaurantForm?.get('available')?.value;
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

  onImageError(): void {
    this.imageBroken = true;
  }

  refresh(): void {
    if (this.restaurantId) {
      this.loadRestaurant();
    }
  }

  async saveRestaurant(): Promise<void> {
    this.restaurantForm.markAllAsTouched();
    if (!this.restaurantId) {
      await this.showToast('Select a restaurant first', 'warning');
      return;
    }
    if (this.restaurantForm.invalid) {
      await this.showToast('Please complete all required fields', 'warning');
      return;
    }

    this.isSaving = true;
    try {
      const formValue = this.restaurantForm.getRawValue();
      const payload: UpdateRestaurantRequest = {
        name: formValue.name,
        address: formValue.address,
        cuisine: formValue.cuisine,
        description: formValue.description || undefined,
        deliveryTime: formValue.deliveryTime,
        minOrder: Number(formValue.minOrder),
        latitude: formValue.latitude != null ? Number(formValue.latitude) : null,
        longitude: formValue.longitude != null ? Number(formValue.longitude) : null,
        pincode: String(formValue.pincode),
        image: formValue.image || undefined,
        available: !!formValue.available,
      };

      const updated = await firstValueFrom(
        this.apiService.updateRestaurant(this.restaurantId, payload),
      );

      this.restaurant = updated;
      this.restaurantContext.selectRestaurant(updated);
      await this.showToast('Restaurant profile saved', 'success');
    } catch {
      await this.showToast('Failed to update restaurant', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  private loadRestaurant(): void {
    this.isLoading = true;
    this.loadError = null;

    this.apiService.getRestaurant(this.restaurantId).subscribe({
      next: (restaurant) => {
        this.restaurant = restaurant;
        this.skipNextGeocode = true;
        this.restaurantForm.patchValue({
          name: restaurant.name || '',
          address: restaurant.address || '',
          cuisine: restaurant.cuisine || '',
          image: restaurant.image || '',
          minOrder: restaurant.minOrder ?? 0,
          deliveryTime: restaurant.deliveryTime || '',
          description: restaurant.description || '',
          available: restaurant.available !== false,
          latitude: restaurant.latitude ?? null,
          longitude: restaurant.longitude ?? null,
          pincode: restaurant.pincode || '',
        });
        this.imageBroken = false;
        this.geoStatus = restaurant.latitude && restaurant.longitude ? 'success' : 'idle';
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Failed to load restaurant details.';
        this.isLoading = false;
      },
    });
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
