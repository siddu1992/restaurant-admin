import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ApiService, Restaurant, DashboardStats, OrderAnalytics, DeliveryPerson } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit, OnDestroy {
  restaurant: Restaurant | null = null;
  isLoading = true;
  registeringDelivery = false;
  
  // Stats data
  orderStats: any = {
    total: 0,
    pending: 0,
    revenue: 0
  };
  
  deliveryStats: any = {
    active: 0
  };

  // Real-time data
  dashboardStats: DashboardStats | null = null;
  recentOrders: any[] = [];
  pendingOrders: any[] = [];
  deliveryPeople: DeliveryPerson[] = [];
  
  // Auto-refresh subscription
  private refreshSubscription: Subscription | null = null;
  private restaurantId: string = '';
  
  // Reactive Form
  deliveryForm: FormGroup;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private toastController: ToastController,
    private apiService: ApiService
  ) {
    this.deliveryForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
    });
  }

  ngOnInit() {
    this.loadDashboardData();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  async loadDashboardData() {
    try {
      this.isLoading = true;
      
      // Get restaurant ID from localStorage or user profile
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const selectedRestaurant = JSON.parse(localStorage.getItem('selectedRestaurant') || '{}');
      
      if (selectedRestaurant._id) {
        this.restaurantId = selectedRestaurant._id;
        this.restaurant = selectedRestaurant;
      } else if (userProfile.restaurant) {
        this.restaurantId = userProfile.restaurant;
        await this.loadRestaurantDetails();
      } else {
        // Get restaurant by owner
        const restaurants = await this.apiService.getRestaurantByOwner(userProfile._id).toPromise();
        if (restaurants && restaurants.length > 0) {
          this.restaurantId = restaurants[0]._id;
          this.restaurant = restaurants[0];
          localStorage.setItem('selectedRestaurant', JSON.stringify(restaurants[0]));
        } else {
          throw new Error('No restaurant found for this user');
        }
      }

      if (this.restaurantId) {
        await Promise.all([
          this.loadDashboardStats(),
          this.loadRecentOrders(),
          this.loadPendingOrders(),
          this.loadDeliveryStats(),
          this.loadDeliveryPeople()
        ]);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      await this.showToast('Error loading dashboard data', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadRestaurantDetails() {
    try {
      const restaurant = await this.apiService.getRestaurant(this.restaurantId).toPromise();
      if (restaurant) {
        this.restaurant = restaurant;
        localStorage.setItem('selectedRestaurant', JSON.stringify(this.restaurant));
      }
    } catch (error) {
      console.error('Error loading restaurant details:', error);
    }
  }

  private async loadDashboardStats() {
    try {
      const stats = await this.apiService.getDashboardStats(this.restaurantId).toPromise();
      if (stats) {
        this.dashboardStats = stats;
        
        // Update order stats
        this.orderStats = {
          total: stats.totalOrders || 0,
          pending: stats.pendingOrders || 0,
          revenue: stats.totalRevenue || 0
        };
        
        // Update delivery stats
        this.deliveryStats = {
          active: stats.activeDeliveries || 0
        };
      }
      
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Use fallback data
      this.orderStats = { total: 0, pending: 0, revenue: 0 };
      this.deliveryStats = { active: 0 };
    }
  }

  private async loadRecentOrders() {
    try {
      const orders = await this.apiService.getRecentOrders(this.restaurantId, 5).toPromise();
      this.recentOrders = orders || [];
    } catch (error) {
      console.error('Error loading recent orders:', error);
      this.recentOrders = [];
    }
  }

  private async loadPendingOrders() {
    try {
      const orders = await this.apiService.getPendingOrders(this.restaurantId).toPromise();
      this.pendingOrders = orders || [];
    } catch (error) {
      console.error('Error loading pending orders:', error);
      this.pendingOrders = [];
    }
  }

  private async loadDeliveryStats() {
    try {
      const deliveryStats = await this.apiService.getDeliveryStats(this.restaurantId).toPromise();
      this.deliveryStats = {
        ...this.deliveryStats,
        ...deliveryStats
      };
    } catch (error) {
      console.error('Error loading delivery stats:', error);
    }
  }

  private async loadDeliveryPeople() {
    try {
      const people = await this.apiService.getAllDeliveryPeople().toPromise();
      this.deliveryPeople = people || [];
    } catch (error) {
      console.error('Error loading delivery people:', error);
      this.deliveryPeople = [];
    }
  }

  startAutoRefresh() {
    // Refresh data every 30 seconds
    this.refreshSubscription = interval(30000).pipe(
      switchMap(() => {
        if (this.restaurantId) {
          return this.apiService.getDashboardStats(this.restaurantId);
        }
        return of(null);
      }),
      catchError(error => {
        console.error('Auto-refresh error:', error);
        return of(null);
      })
    ).subscribe(stats => {
      if (stats) {
        this.dashboardStats = stats;
        this.orderStats = {
          total: stats.totalOrders || 0,
          pending: stats.pendingOrders || 0,
          revenue: stats.totalRevenue || 0
        };
        this.deliveryStats = {
          active: stats.activeDeliveries || 0
        };
      }
    });
  }

  stopAutoRefresh() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = null;
    }
  }

  async refreshData() {
    await this.loadDashboardData();
    await this.showToast('Dashboard refreshed successfully', 'success');
  }

  // Navigation methods
  navigateToFoodManagement() {
    this.router.navigate(['/food-management']);
  }

  navigateToOrders() {
    this.router.navigate(['/orders']);
  }

  navigateToAnalytics() {
    this.router.navigate(['/analytics']);
  }

  navigateToDeliveryManagement() {
    this.router.navigate(['/delivery-management']);
  }

  // Form submission
  async registerDeliveryPerson() {
    if (this.deliveryForm.invalid) {
      await this.showToast('Please fill all required fields correctly', 'warning');
      this.markFormGroupTouched();
      return;
    }

    try {
      this.registeringDelivery = true;
      
      const formData = this.deliveryForm.value;
      console.log('Registering delivery person:', formData);
      
      await this.apiService.registerDeliveryPerson(formData).toPromise();
      
      // Reset form
      this.deliveryForm.reset();
      
      // Refresh delivery people list
      await this.loadDeliveryPeople();
      
      await this.showToast('Delivery person registered successfully!', 'success');
      
    } catch (error) {
      console.error('Error registering delivery person:', error);
      await this.showToast('Error registering delivery person', 'danger');
    } finally {
      this.registeringDelivery = false;
    }
  }

  // Form validation helpers
  markFormGroupTouched() {
    Object.keys(this.deliveryForm.controls).forEach(key => {
      const control = this.deliveryForm.get(key);
      control?.markAsTouched();
    });
  }

  // Form field validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.deliveryForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.deliveryForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid phone number';
      }
    }
    return '';
  }

  // Utility methods
  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
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

  // Form field getters for template
  get nameField() {
    return this.deliveryForm.get('name');
  }

  get emailField() {
    return this.deliveryForm.get('email');
  }

  get passwordField() {
    return this.deliveryForm.get('password');
  }

  get phoneField() {
    return this.deliveryForm.get('phone');
  }

  // Helper methods for template
  getAverageOrderValue(): number {
    if (this.dashboardStats && this.dashboardStats.totalOrders > 0) {
      return this.dashboardStats.totalRevenue / this.dashboardStats.totalOrders;
    }
    return 0;
  }

  getRevenuePercentage(): number {
    if (this.dashboardStats && this.dashboardStats.totalRevenue > 0) {
      return (this.dashboardStats.todayRevenue / this.dashboardStats.totalRevenue) * 100;
    }
    return 0;
  }
} 