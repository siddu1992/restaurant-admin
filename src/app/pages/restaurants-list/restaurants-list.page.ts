import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../core/auth.service';
import { RestaurantContextService } from '../../core/restaurant-context.service';
import { Restaurant } from '../../models';

@Component({
  selector: 'app-restaurants-list',
  templateUrl: './restaurants-list.page.html',
  styleUrls: ['./restaurants-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class RestaurantsListPage implements OnInit {
  restaurants: Restaurant[] = [];
  isLoading = true;

  constructor(
    private readonly apiService: ApiService,
    private readonly auth: AuthService,
    private readonly restaurantContext: RestaurantContextService,
    public readonly router: Router,
    private readonly toastController: ToastController,
  ) {}

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.isLoading = true;
    const owner = this.auth.currentUser;
    if (!owner?.id) {
      this.isLoading = false;
      this.auth.logout();
      return;
    }

    this.apiService.getRestaurantByOwner(owner.id).subscribe({
      next: (restaurant) => {
        this.isLoading = false;
        if (restaurant?.length > 0) {
          this.restaurants = restaurant;
        } else {
          void this.router.navigate(['/add-restaurant']);
        }
      },
      error: () => {
        this.isLoading = false;
        void this.showToast('Failed to load restaurants');
      },
    });
  }

  refreshRestaurants(): void {
    this.loadRestaurants();
    void this.showToast('Restaurants refreshed');
  }

  addNewRestaurant(): void {
    void this.router.navigate(['/add-restaurant']);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.src =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMyMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjwvc3ZnPg==';
    }
  }

  goToDashboard(restaurant: Restaurant): void {
    this.restaurantContext.selectRestaurant(restaurant);
    void this.router.navigate(['/dashboard']);
  }

  editRestaurant(restaurant: Restaurant): void {
    this.restaurantContext.selectRestaurant(restaurant);
    void this.router.navigate(['/restaurant-profile'], {
      state: { restaurantId: restaurant._id },
    });
  }

  async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'success',
    });
    await toast.present();
  }
}
