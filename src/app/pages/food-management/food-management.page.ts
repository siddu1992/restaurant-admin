import { Component, OnInit } from '@angular/core';
import { ApiService, Restaurant } from '../../services/api.service';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-food-management',
  templateUrl: './food-management.page.html',
  styleUrls: ['./food-management.page.scss'],
  standalone: true,
  providers: [ApiService],
  imports: [IonicModule, CommonModule, HttpClientModule, RouterModule, FormsModule]
})
export class FoodManagementPage implements OnInit {
  foods: any[] = [];
  isLoading = true;

  constructor(
    private apiService: ApiService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadFoods();
  }

  loadFoods() {    
      this.isLoading = true;
      // Replace with actual restaurant ID logic
        const restaurant = JSON.parse(localStorage.getItem('selectedRestaurant') || '{}'); 
             if (restaurant && restaurant._id) {
        this.apiService.getRestaurantFoods(restaurant._id).subscribe((foods) => {
          this.foods = foods;
          this.isLoading = false;
        });
      } else {
        this.foods = [];
        this.isLoading = false;
      
    }
  }

  toggleAvailability(food: any) {
    // Call API to update food availability
    this.apiService.updateFood(food._id, { available: food.available }).subscribe(
      () => {
        this.showToast(`Food ${food.available ? 'enabled' : 'disabled'} successfully.`);
      },
      (err) => {
        this.showToast('Failed to update availability.');
        food.available = !food.available; // revert toggle on error
      }
    );
  }

  editFood(food: any) {
    this.router.navigate(['/edit-food', food._id]);
  }

  async deleteFood(food: any) {
    const confirmed = confirm(`Are you sure you want to delete ${food.name}?`);
    if (!confirmed) return;
    this.apiService.deleteFood(food._id).subscribe(
      () => {
        this.showToast('Food deleted successfully.');
        this.loadFoods();
      },
      (err) => {
        this.showToast('Failed to delete food.');
      }
    );
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