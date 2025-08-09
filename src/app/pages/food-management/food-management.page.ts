import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ApiService, Restaurant } from '../../services/api.service';
import { ToastController, LoadingController, IonButton, IonContent, IonHeader, IonInput, IonSpinner, IonTitle, IonToolbar ,IonIcon, AlertController, IonFabButton, IonFab, IonLabel, IonCardContent, IonCardSubtitle, IonCardTitle, IonCardHeader} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-food-management',
  templateUrl: './food-management.page.html',
  styleUrls: ['./food-management.page.scss'],
  standalone: true,
  providers: [ApiService],
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
    HttpClientModule, 
    IonFabButton,
    IonFab,
   IonContent, ],
   schemas:[CUSTOM_ELEMENTS_SCHEMA]})
export class FoodManagementPage implements OnInit, OnDestroy {
  foods: any[] = [];
  filteredFoods: any[] = [];
  isLoading = true;
  isUpdating = false;
  
  // Search and filter properties
  searchTerm = '';
  selectedCategory = 'all';
  availabilityFilter = 'all';
  
  // Stats properties
  totalFoods = 0;
  availableFoods = 0;
  unavailableFoods = 0;
  
  // Real-time update subscription
  private updateSubscription?: Subscription;

  constructor(
    private apiService: ApiService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadFoods();
    this.startRealTimeUpdates();
  }

  ngOnDestroy() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  startRealTimeUpdates() {
    // Update data every 30 seconds for real-time feel
    this.updateSubscription = interval(30000).subscribe(() => {
      this.refreshData();
    });
  }

  loadFoods() {    
    this.isLoading = true;
    const restaurant = JSON.parse(localStorage.getItem('selectedRestaurant') || '{}'); 
    if (restaurant && restaurant._id) {
      this.apiService.getRestaurantFoods(restaurant._id).subscribe({
        next: (foods) => {
          this.foods = foods;
          this.calculateStats();
          this.filterFoods();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading foods:', error);
          this.showToast('Failed to load foods', 'danger');
          this.isLoading = false;
        }
      });
    } else {
      this.foods = [];
      this.filteredFoods = [];
      this.calculateStats();
      this.isLoading = false;
    }
  }

  refreshData() {
    this.isUpdating = true;
    this.loadFoods();
    setTimeout(() => {
      this.isUpdating = false;
    }, 1000);
  }

  calculateStats() {
    this.totalFoods = this.foods.length;
    this.availableFoods = this.foods.filter(food => food.available).length;
    this.unavailableFoods = this.totalFoods - this.availableFoods;
  }

  filterFoods() {
    let filtered = [...this.foods];

    // Search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(food => 
        food.name.toLowerCase().includes(searchLower) ||
        food.description.toLowerCase().includes(searchLower) ||
        food.category.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(food => food.category === this.selectedCategory);
    }

    // Availability filter
    if (this.availabilityFilter === 'available') {
      filtered = filtered.filter(food => food.available);
    } else if (this.availabilityFilter === 'unavailable') {
      filtered = filtered.filter(food => !food.available);
    }

    this.filteredFoods = filtered;
  }

  toggleAvailability(food: any) {
    const originalState = food.available;
    
    this.apiService.updateFood(food._id, { available: food.available }).subscribe({
      next: () => {
        this.showToast(`Food ${food.available ? 'enabled' : 'disabled'} successfully`, 'success');
        this.calculateStats();
      },
      error: (err) => {
        this.showToast('Failed to update availability', 'danger');
        food.available = originalState; // revert on error
        this.calculateStats();
      }
    });
  }

  editFood(food: any) {
    this.router.navigate(['/edit-food', food._id]);
  }

  addNewFood() {
    this.router.navigate(['/add-food']);
  }

  async deleteFood(food: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete "${food.name}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.performDelete(food);
          }
        }
      ]
    });

    await alert.present();
  }

  private performDelete(food: any) {
    this.apiService.deleteFood(food._id).subscribe({
      next: () => {
        this.showToast('Food deleted successfully', 'success');
        this.loadFoods();
      },
      error: (err) => {
        this.showToast('Failed to delete food', 'danger');
      }
    });
  }

  async showToast(message: string, color: string = 'warning') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top',
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
} 