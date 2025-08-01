import { Component, OnInit } from '@angular/core';
import { ApiService, Restaurant } from '../../services/api.service';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-restaurant-profile',
  templateUrl: './restaurant-profile.page.html',
  styleUrls: ['./restaurant-profile.page.scss'],
  standalone: true,
  providers: [ApiService],
  imports: [IonicModule, CommonModule, HttpClientModule, FormsModule, ReactiveFormsModule]
})
export class RestaurantProfilePage implements OnInit {
  restaurantForm!: FormGroup;
  isLoading = true;
  isSaving = false;
  restaurantId!: string;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private toastController: ToastController,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get restaurantId from navigation state
    const nav = this.router.getCurrentNavigation();
    this.restaurantId = nav?.extras?.state?.['restaurantId'];
    if (!this.restaurantId) {
      this.isLoading = false;
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
      longitude: [null]
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
      const apiKey = 'AIzaSyCNjjVsk2kU8IwgtoQ81fsDnfnNvHVCuwU';
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

  onImageError(event: any) {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMyMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNjAgODBDMTQzLjQzMSA4MCAxMzAgOTMuNDMxIDgzIDEzMEMxMzAgMTY2LjU2OSAxNDMuNDMxIDE4MCAxNjAgMTgwQzE3Ni41NjkgMTgwIDE5MCAxNjYuNTY5IDE5MCAxNTBDMTkwIDEzMy40MzEgMTc2LjU2OSAxMjAgMTYwIDEyMEMxNDMuNDMxIDEyMCAxMzAgMTA2LjU2OSAxMzAgOTBDMTMwIDczLjQxIDE0My40MzEgNjAgMTYwIDYwQzE3Ni41NjkgNjAgMTkwIDczLjQzMSAxOTAgOTBDMTkwIDEwNi41NjkgMTc2LjU2OSAxMjAgMTYwIDEyMEMxNDMuNDMxIDEyMCAxMzAgMTMzLjQzMSAxMzAgMTUwQzEzMCAxNjYuNTY5IDE0My40MzEgMTgwIDE2MCAxODBDMTc2LjU2OSAxODAgMTkwIDE2Ni41NjkgMTkwIDE1MEMxOTAgMTMzLjQzMSAxNzYuNTY5IDEyMCAxNjAgMTIwQzE0My40MzEgMTIwIDEzMCAxMDYuNTY5IDEzMCA5MEMxMzAgNzMuNDMxIDE0My40MzEgNjAgMTYwIDYwWiIgZmlsbD0iI0Q3RDdENyIvPgo8c3ZnIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMzIgOEMxOS4xNjMgOC4wMDAwMiA4LjAwMDAyIDE5LjE2MyA4IDMyQzguMDAwMDIgNDQuODM3MiAxOS4xNjMgNTYgMzIgNTZDNDQuODM3MiA1NiA1NiA0NC44MzcgNTYgMzJDNTYgMTkuMTYzIDQ0LjgzNzIgOC4wMDAwMiAzMiA4Wk0zMiA0OEMyNC4yNjggNDggMTggNDEuNzMyIDE4IDM0QzE4IDI2LjI2OCAyNC4yNjggMjAgMzIgMjBDMzkuNzMyIDIwIDQ2IDI2LjI2OCA0NiAzNEM0NiA0MS43MzIgMzkuNzMyIDQ4IDMyIDQ4WiIgZmlsbD0iI0M3QzdDNyIvPgo8L3N2Zz4KPC9zdmc+';
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