import { Component, OnInit } from '@angular/core';
import { ApiService, Restaurant } from '../../services/api.service';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-food-management',
  templateUrl: './food-management.page.html',
  styleUrls: ['./food-management.page.scss'],
  standalone: true,
  providers: [ApiService],
  imports: [IonicModule, CommonModule, HttpClientModule]
})
export class FoodManagementPage implements OnInit {
  foods: any[] = [];
  isLoading = true;

  constructor(
    private apiService: ApiService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.loadFoods();
  }

  async loadFoods() {
    try {
      this.isLoading = true;
      // Replace with actual restaurant ID logic
      const restaurant = JSON.parse(localStorage.getItem('restaurant') || '{}');
      if (restaurant && restaurant.id) {
        this.apiService.getRestaurantFoods(restaurant.id).subscribe(foods => {
          this.foods = foods;
          this.isLoading = false;
        });
      } else {
        this.foods = [];
        this.isLoading = false;
      }
    } catch (error) {
      await this.showToast('Error loading foods');
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