declare var google: any;
import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
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
  navigateOutline,
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
export class RestaurantProfilePage implements OnInit, OnDestroy, AfterViewInit {
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
  private map: any = null;
  private mapMarker: any = null;
  private mapReady = false;

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
      navigateOutline,
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

  ngAfterViewInit(): void {
    // Delay to ensure the DOM container exists
    setTimeout(() => this.initMap(), 500);
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

        // Update map marker after load
        setTimeout(() => {
          if (!this.mapReady) {
            this.initMap();
          }
          if (restaurant.latitude && restaurant.longitude) {
            this.updateMapMarker(restaurant.latitude, restaurant.longitude);
          }
        }, 300);
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

  // ─── Map integration ───────────────────────────────────────────

  private initMap(): void {
    if (typeof google === 'undefined' || !google.maps) {
      // Retry after a short delay (script might still be loading)
      setTimeout(() => this.initMap(), 1000);
      return;
    }

    const container = document.getElementById('profile-map');
    if (!container) return;

    const lat = this.restaurantForm.get('latitude')?.value || 17.385;
    const lng = this.restaurantForm.get('longitude')?.value || 78.4867;

    this.map = new google.maps.Map(container, {
      center: { lat: Number(lat), lng: Number(lng) },
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    });

    // Restaurant icon SVG for the marker
    const restaurantSvg = {
      url:
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="#0F766E"/>
            <path transform="translate(8, 8)" fill="#fff" d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
          </svg>`
        ),
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20),
    };

    this.mapMarker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      draggable: true,
      icon: restaurantSvg,
      title: 'Restaurant location',
    });

    // Click on map → move marker + reverse geocode
    this.map.addListener('click', (event: any) => {
      if (!event.latLng) return;
      const clickLat = event.latLng.lat();
      const clickLng = event.latLng.lng();
      this.updateMapMarker(clickLat, clickLng);
      this.applyLocationToForm(clickLat, clickLng);
    });

    // Drag marker → reverse geocode
    this.mapMarker.addListener('dragend', (event: any) => {
      if (!event.latLng) return;
      const dragLat = event.latLng.lat();
      const dragLng = event.latLng.lng();
      this.applyLocationToForm(dragLat, dragLng);
    });

    this.mapReady = true;
  }

  private updateMapMarker(lat: number, lng: number): void {
    const pos = { lat, lng };
    if (this.mapMarker) {
      this.mapMarker.setPosition(pos);
    }
    if (this.map) {
      this.map.panTo(pos);
      this.map.setZoom(16);
    }
  }

  private applyLocationToForm(lat: number, lng: number): void {
    this.skipNextGeocode = true;
    this.restaurantForm.patchValue({
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
    });
    this.geoStatus = 'success';
    void this.reverseGeocode(lat, lng);
  }

  detectCurrentLocation(): void {
    if (!navigator.geolocation) {
      void this.showToast('Geolocation is not supported by your browser', 'warning');
      this.geoStatus = 'failed';
      return;
    }

    this.geoStatus = 'loading';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.updateMapMarker(lat, lng);
        this.applyLocationToForm(lat, lng);
      },
      () => {
        this.geoStatus = 'failed';
        void this.showToast('Could not detect your location', 'warning');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    const apiKey = environment.googleMapsApiKey;
    if (!apiKey) return;

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json() as {
        status: string;
        results?: Array<{
          formatted_address: string;
          address_components: Array<{
            long_name: string;
            short_name: string;
            types: string[];
          }>;
        }>;
      };

      if (data.status === 'OK' && data.results?.[0]) {
        const result = data.results[0];
        const address = result.formatted_address;

        // Extract pincode from address components
        const pincodeComponent = result.address_components.find(
          (c) => c.types.includes('postal_code')
        );
        const pincode = pincodeComponent?.long_name || '';

        this.skipNextGeocode = true;
        this.restaurantForm.patchValue({
          address: address,
          ...(pincode ? { pincode } : {}),
        });
      }
    } catch {
      console.warn('Reverse geocode failed');
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
