import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastController, LoadingController, IonButton, IonContent, IonHeader, IonInput, IonSpinner, IonTitle, IonToolbar ,IonIcon} from '@ionic/angular/standalone';
import { ApiService } from '../../services/api.service';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-restaurant',
  templateUrl: './add-restaurant.page.html',
  styleUrls: ['./add-restaurant.page.scss'],
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
    HttpClientModule, 
    IonContent, ],  providers: [ApiService],
    schemas:[CUSTOM_ELEMENTS_SCHEMA]

})
export class AddRestaurantPage {
  restaurantForm: FormGroup;
  isLoading = false;
  latitude: number | null = null;
  longitude: number | null = null;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.restaurantForm = this.formBuilder.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      cuisine: ['', Validators.required],
      description: [''],
      deliveryTime: ['25-35 min', Validators.required],
      minOrder: [15, [Validators.required, Validators.min(0)]],
      latitude: ['', Validators.required],
      longitude: ['', Validators.required]
    });

    this.restaurantForm.get('address')?.valueChanges.subscribe(address => {
      if (address && address.length > 5) {
        this.geocodeAddress(address);
      }
    });
  }

  async geocodeAddress(address: string) {
    try {
      const apiKey = 'AIzaSyCNjjVsk2kU8IwgtoQ81fsDnfnNvHVCuwU';
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'OK') {
        const location = data.results[0].geometry.location;
        this.latitude = location.lat;
        this.longitude = location.lng;
        this.restaurantForm.patchValue({ latitude: location.lat, longitude: location.lng });
      }
    } catch (e) {}
  }

  async addRestaurant() {
    if (this.restaurantForm.invalid) {
      await this.showToast('Please fill all required fields');
      return;
    }
    const loading = await this.loadingController.create({ message: 'Adding restaurant...' });
    await loading.present();
    try {
      const restaurantData = this.restaurantForm.value;
      // Attach ownerId from localStorage or auth
      const owner = JSON.parse(localStorage.getItem('authUser') || '{}');
      restaurantData.owner = owner.id;
      await this.apiService.createRestaurant(restaurantData).toPromise();
      await this.showToast('Restaurant added successfully!');
      this.router.navigate(['/dashboard']);
    } catch (error) {
      await this.showToast('Error adding restaurant');
    } finally {
      await loading.dismiss();
    }
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: 'success'
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
} 