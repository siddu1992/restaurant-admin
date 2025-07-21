import { Component, OnInit } from '@angular/core';
import { ApiService, Restaurant } from '../../services/api.service';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-restaurant-profile',
  templateUrl: './restaurant-profile.page.html',
  styleUrls: ['./restaurant-profile.page.scss'],
  standalone: true,
  providers: [ApiService],
  imports: [IonicModule, CommonModule, HttpClientModule]
})
export class RestaurantProfilePage implements OnInit {
  restaurant: Restaurant | null = null;
  isLoading = true;

  constructor(
    private apiService: ApiService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.loadRestaurantProfile();
  }

  async loadRestaurantProfile() {
    try {
      this.isLoading = true;
      const restaurant = JSON.parse(localStorage.getItem('restaurant') || '{}');
      if (restaurant && restaurant.id) {
        this.apiService.getRestaurant(restaurant.id).subscribe(res => {
          this.restaurant = res;
          this.isLoading = false;
        });
      } else {
        this.restaurant = null;
        this.isLoading = false;
      }
    } catch (error) {
      await this.showToast('Error loading restaurant profile');
      this.isLoading = false;
    }
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: 'warning'
    });
    await toast.present();
  }
} 