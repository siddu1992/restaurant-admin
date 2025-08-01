import { Component, OnInit, OnDestroy } from '@angular/core';
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
  imports: [IonicModule, CommonModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit, OnDestroy {
  restaurant: Restaurant | null = null;
  isLoading = true;
  
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

  constructor(
    private router: Router,
    private toastController: ToastController,
    private apiService: ApiService
  ) {}

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

  navigateToAddDeliveryPerson() {
    this.router.navigate(['/add-delivery-person']);
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



  // Helper methods for template
  getAverageOrderValue(): number {
    if (this.dashboardStats && this.dashboardStats.totalOrders > 0) {
      return this.dashboardStats.totalRevenue / this.dashboardStats.totalOrders;
    }
    return 0;
  }

  getRevenuePercentage(): number {
    if (!this.orderStats?.revenue || !this.orderStats?.total) return 0;
    return Math.round((this.orderStats.revenue / this.orderStats.total) * 100);
  }

  onImageError(event: any) {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMyMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNjAgODBDMTQzLjQzMSA4MCAxMzAgOTMuNDMxIDgzIDEzMEMxMzAgMTY2LjU2OSAxNDMuNDMxIDE4MCAxNjAgMTgwQzE3Ni41NjkgMTgwIDE5MCAxNjYuNTY5IDE5MCAxNTBDMTkwIDEzMy40MzEgMTc2LjU2OSAxMjAgMTYwIDEyMEMxNDMuNDMxIDEyMCAxMzAgMTA2LjU2OSAxMzAgOTBDMTMwIDczLjQzMSAxNDMuNDMxIDYwIDE2MCA2MEMxNzYuNTY5IDYwIDE5MCA3My40MzEgMTkwIDkwQzE5MCAxMDYuNTY5IDE3Ni41NjkgMTIwIDE2MCAxMjBDMTQzLjQzMSAxMjAgMTMwIDEzMy40MzEgMTMwIDE1MEMxMzAgMTY2LjU2OSAxNDMuNDMxIDE4MCAxNjAgMTgwQzE3Ni41NjkgMTgwIDE5MCAxNjYuNTY5IDE5MCAxNTBDMTkwIDEzMy40MzEgMTc2LjU2OSAxMjAgMTYwIDEyMEMxNDMuNDMxIDEyMCAxMzAgMTA2LjU2OSAxMzAgOTBDMTMwIDczLjQzMSAxNDMuNDMxIDYwIDE2MCA2MFoiIGZpbGw9IiNEN0Q3RDciLz4KPHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMyIDhDMTkuMTYzIDggOCAxOS4xNjMgOCAzMkM4IDQ0LjgzNyAxOS4xNjMgNTYgMzIgNTZDNDQuODM3IDU2IDU2IDQ0LjgzNyA1NiAzMkM1NiAxOS4xNjMgMzIgOCAzMiA4Wk0zMiA0OEMyNC4yNjggNDggMTggNDEuNzMyIDE4IDM0QzE4IDI2LjI2OCAyNC4yNjggMjAgMzIgMjBDMzkuNzMyIDIwIDQ2IDI2LjI2OCA0NiAzNEM0NiA0MS43MzIgMzkuNzMyIDQ4IDMyIDQ4WiIgZmlsbD0iI0M3QzdDNyIvPgo8L3N2Zz4KPC9zdmc+';
  }
} 