import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Food } from '../../models';
import {
  ToastController,
  IonButton,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
  IonIcon,
  AlertController,
  IonFabButton,
  IonFab,
  IonLabel,
  IonCardContent,
  IonCardSubtitle,
  IonCardTitle,
  IonCardHeader,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { RestaurantContextService } from '../../core/restaurant-context.service';

@Component({
  selector: 'app-food-management',
  templateUrl: './food-management.page.html',
  styleUrls: ['./food-management.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonSpinner,
    IonIcon,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonLabel,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    RouterModule,
    IonFabButton,
    IonFab,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FoodManagementPage implements OnInit, OnDestroy {
  foods: Food[] = [];
  filteredFoods: Food[] = [];
  isLoading = true;
  isUpdating = false;

  searchTerm = '';
  selectedCategory = 'all';
  availabilityFilter = 'all';

  totalFoods = 0;
  availableFoods = 0;
  unavailableFoods = 0;

  private updateSubscription?: Subscription;

  constructor(
    private readonly apiService: ApiService,
    private readonly restaurantContext: RestaurantContextService,
    private readonly toastController: ToastController,
    private readonly alertController: AlertController,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadFoods();
    this.startRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.updateSubscription?.unsubscribe();
  }

  startRealTimeUpdates(): void {
    this.updateSubscription = interval(30000).subscribe(() => {
      this.refreshData();
    });
  }

  loadFoods(): void {
    this.isLoading = true;
    const restaurant = this.restaurantContext.selectedRestaurant;
    if (restaurant?._id) {
      this.apiService.getRestaurantFoods(restaurant._id).subscribe({
        next: (foods) => {
          this.foods = foods;
          this.calculateStats();
          this.filterFoods();
          this.isLoading = false;
        },
        error: () => {
          void this.showToast('Failed to load foods', 'danger');
          this.isLoading = false;
        },
      });
    } else {
      this.foods = [];
      this.filteredFoods = [];
      this.calculateStats();
      this.isLoading = false;
    }
  }

  refreshData(): void {
    this.isUpdating = true;
    this.loadFoods();
    setTimeout(() => {
      this.isUpdating = false;
    }, 1000);
  }

  calculateStats(): void {
    this.totalFoods = this.foods.length;
    this.availableFoods = this.foods.filter((food) => food.available !== false).length;
    this.unavailableFoods = this.totalFoods - this.availableFoods;
  }

  filterFoods(): void {
    let filtered = [...this.foods];

    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (food) =>
          food.name.toLowerCase().includes(searchLower) ||
          (food.description || '').toLowerCase().includes(searchLower) ||
          (food.category || '').toLowerCase().includes(searchLower),
      );
    }

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter((food) => food.category === this.selectedCategory);
    }

    if (this.availabilityFilter === 'available') {
      filtered = filtered.filter((food) => food.available);
    } else if (this.availabilityFilter === 'unavailable') {
      filtered = filtered.filter((food) => !food.available);
    }

    this.filteredFoods = filtered;
  }

  toggleAvailability(food: Food): void {
    const originalState = food.available;

    this.apiService.updateFood(food._id, { available: food.available }).subscribe({
      next: () => {
        void this.showToast(
          `Food ${food.available ? 'enabled' : 'disabled'} successfully`,
          'success',
        );
        this.calculateStats();
      },
      error: () => {
        void this.showToast('Failed to update availability', 'danger');
        food.available = originalState;
        this.calculateStats();
      },
    });
  }

  editFood(food: Food): void {
    void this.router.navigate(['/edit-food', food._id]);
  }

  addNewFood(): void {
    void this.router.navigate(['/add-food']);
  }

  async deleteFood(food: Food): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete "${food.name}"? This action cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel', cssClass: 'secondary' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.performDelete(food);
          },
        },
      ],
    });

    await alert.present();
  }

  private performDelete(food: Food): void {
    this.apiService.deleteFood(food._id).subscribe({
      next: () => {
        void this.showToast('Food deleted successfully', 'success');
        this.loadFoods();
      },
      error: () => {
        void this.showToast('Failed to delete food', 'danger');
      },
    });
  }

  async showToast(message: string, color: string = 'warning'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      buttons: [{ icon: 'close', role: 'cancel' }],
    });
    await toast.present();
  }
}
