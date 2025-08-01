import { Component, OnInit } from '@angular/core';
import { ApiService, Restaurant } from '../../services/api.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-restaurants-list',
  templateUrl: './restaurants-list.page.html',
  styleUrls: ['./restaurants-list.page.scss'],
  standalone: true,
  providers: [ApiService],
  imports: [IonicModule, CommonModule, HttpClientModule]
})
export class RestaurantsListPage implements OnInit {
  restaurants: Restaurant[] = [];
  isLoading = true;

  constructor(
    private apiService: ApiService, 
    public router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadRestaurants();
  }

  loadRestaurants() {
    this.isLoading = true;
    const owner = JSON.parse(localStorage.getItem('authUser') || '{}');
    this.apiService.getRestaurantByOwner(owner.id).subscribe({
      next: (restaurant) => {
        this.isLoading = false;
        if (restaurant && restaurant.length > 0) {
          this.restaurants = restaurant;
        } else {
          this.router.navigate(['/add-restaurant']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.showToast('Failed to load restaurants');
      }
    });
  }

  refreshRestaurants() {
    this.loadRestaurants();
    this.showToast('Restaurants refreshed');
  }

  addNewRestaurant() {
    this.router.navigate(['/add-restaurant']);
  }

  onImageError(event: any) {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMyMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNjAgODBDMTQzLjQzMSA4MCAxMzAgOTMuNDMxIDgzIDEzMEMxMzAgMTY2LjU2OSAxNDMuNDMxIDE4MCAxNjAgMTgwQzE3Ni41NjkgMTgwIDE5MCAxNjYuNTY5IDE5MCAxNTBDMTkwIDEzMy40MzEgMTc2LjU2OSAxMjAgMTYwIDEyMEMxNDMuNDMxIDEyMCAxMzAgMTA2LjU2OSAxMzAgOTBDMTMwIDczLjQzMSAxNDMuNDMxIDYwIDE2MCA2MEMxNzYuNTY5IDYwIDE5MCA3My40MzEgMTkwIDkwQzE5MCAxMDYuNTY5IDE3Ni41NjkgMTIwIDE2MCAxMjBDMTQzLjQzMSAxMjAgMTMwIDEzMy40MzEgMTMwIDE1MEMxMzAgMTY2LjU2OSAxNDMuNDMxIDE4MCAxNjAgMTgwQzE3Ni41NjkgMTgwIDE5MCAxNjYuNTY5IDE5MCAxNTBDMTkwIDEzMy40MzEgMTc2LjU2OSAxMjAgMTYwIDEyMEMxNDMuNDMxIDEyMCAxMzAgMTA2LjU2OSAxMzAgOTBDMTMwIDczLjQzMSAxNDMuNDMxIDYwIDE2MCA2MFoiIGZpbGw9IiNEN0Q3RDciLz4KPHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMyIDhDMTkuMTYzIDggOCAxOS4xNjMgOCAzMkM4IDQ0LjgzNyAxOS4xNjMgNTYgMzIgNTZDNDQuODM3IDU2IDU2IDQ0LjgzNyA1NiAzMkM1NiAxOS4xNjMgMzIgOCAzMiA4Wk0zMiA0OEMyNC4yNjggNDggMTggNDEuNzMyIDE4IDM0QzE4IDI2LjI2OCAyNC4yNjggMjAgMzIgMjBDMzkuNzMyIDIwIDQ2IDI2LjI2OCA0NiAzNEM0NiA0MS43MzIgMzkuNzMyIDQ4IDMyIDQ4WiIgZmlsbD0iI0M3QzdDNyIvPgo8L3N2Zz4KPC9zdmc+';
  }

  goToDashboard(restaurant: Restaurant) {
    localStorage.setItem('selectedRestaurant', JSON.stringify(restaurant));
    this.router.navigate(['/dashboard']);
  }

  editRestaurant(restaurant: Restaurant) {
    this.router.navigate(['/restaurant-profile'], { state: { restaurantId: restaurant._id } });
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  }
} 