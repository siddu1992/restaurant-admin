import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Restaurant } from '../../models';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  ToastController,
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonToggle,
  IonTextarea,
} from '@ionic/angular/standalone';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { RestaurantContextService } from '../../core/restaurant-context.service';

@Component({
  selector: 'app-restaurant-profile',
  templateUrl: './restaurant-profile.page.html',
  styleUrls: ['./restaurant-profile.page.scss'],
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
    IonToggle,
    IonTextarea,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RestaurantProfilePage implements OnInit {
  restaurantForm!: FormGroup;
  isLoading = true;
  isSaving = false;
  restaurantId!: string;

  constructor(
    private readonly apiService: ApiService,
    private readonly fb: FormBuilder,
    private readonly toastController: ToastController,
    private readonly router: Router,
    private readonly restaurantContext: RestaurantContextService,
  ) {}

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    this.restaurantId =
      (nav?.extras?.state?.['restaurantId'] as string | undefined) ||
      this.restaurantContext.restaurantId ||
      '';
    if (!this.restaurantId) {
      this.isLoading = false;
      void this.router.navigate(['/restaurants']);
      return;
    }
    this.restaurantForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      cuisine: [''],
      image: ['',Validators.required],
      minOrder: [0],
      deliveryTime: ['',Validators.required],
      description: ['',Validators.required],
      available: [true],
      latitude: [null],
      longitude: [null],
      pincode:['',Validators.required]
    });
    this.loadRestaurant();
  }

  loadRestaurant() {
    this.apiService.getRestaurant(this.restaurantId).subscribe((restaurant: Restaurant) => {
      this.restaurantForm.patchValue(restaurant);
      // If restaurant has lat/lng, patch them
      if (restaurant.latitude) this.restaurantForm.get('latitude')?.setValue(restaurant.latitude);
      if (restaurant.longitude) this.restaurantForm.get('longitude')?.setValue(restaurant.longitude);
      this.isLoading = false;
    }, err => {
      this.showToast('Failed to load restaurant.');
      this.isLoading = false;
    });
  }

  async geocodeAddress(address: string): Promise<{ lat: number, lon: number } | null> {
    try {
      const apiKey = 'AIzaSyDpTR0s1xZGwjOnKbMe65CuV0QQQM2F8FU';
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'OK') {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lon: location.lng };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async saveRestaurant() {
    if (this.restaurantForm.invalid) return;
    
    this.isSaving = true;
    const formValue = this.restaurantForm.value;
    
    // Geocode if address changed or lat/lng missing
    if (!formValue.latitude || !formValue.longitude) {
      const geo = await this.geocodeAddress(formValue.address);
      if (geo) {
        formValue.latitude = geo.lat;
        formValue.longitude = geo.lon;
        this.restaurantForm.patchValue({ latitude: geo.lat, longitude: geo.lon });
      }
    }
    
    this.apiService.updateRestaurant(this.restaurantId, formValue).subscribe(
      () => {
        this.isSaving = false;
        this.showToast('Restaurant updated successfully.');
        this.router.navigate(['/restaurants-list']);
      },
      err => {
        this.isSaving = false;
        this.showToast('Failed to update restaurant.');
      }
    );
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.src =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMyMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjwvc3ZnPg==';
    }
  }

  updateImage() {
    // This method can be expanded to handle image upload functionality
    // For now, it just focuses on the image URL input
    const imageInput = document.querySelector('ion-input[formControlName="image"]') as HTMLIonInputElement;
    if (imageInput) {
      imageInput.setFocus();
    }
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success'
    });
    await toast.present();
  }
} 