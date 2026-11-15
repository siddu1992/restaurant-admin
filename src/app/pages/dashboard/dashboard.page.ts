import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonIcon, IonSpinner, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  bicycleOutline,
  cartOutline,
  cashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  pricetagOutline,
  refreshOutline,
  restaurantOutline,
  timeOutline,
  trendingUpOutline,
  walletOutline,
} from 'ionicons/icons';
import { firstValueFrom, Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { RestaurantContextService } from '../../core/restaurant-context.service';
import {
  DashboardKpis,
  DashboardOverview,
  DashboardRecentOrder,
  DashboardSales,
  OrdersByStatus,
  PaymentSummary,
  Restaurant,
  SalesPeriod,
  TopCategoryStat,
  TopItemStat,
} from '../../models';
import { ApiService } from '../../services/api.service';

interface PeriodOption {
  value: SalesPeriod;
  label: string;
}

interface StatusSlice {
  key: keyof OrdersByStatus;
  label: string;
  count: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, IonSpinner],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  restaurant: Restaurant | null = null;
  isLoading = true;
  isSalesLoading = false;
  loadError: string | null = null;

  kpis: DashboardKpis | null = null;
  sales: DashboardSales | null = null;
  recentOrders: DashboardRecentOrder[] = [];
  topItems: TopItemStat[] = [];
  topCategories: TopCategoryStat[] = [];
  ordersByStatus: OrdersByStatus | null = null;
  paymentSummary: PaymentSummary | null = null;

  selectedPeriod: SalesPeriod = '7days';
  customFrom = '';
  customTo = '';

  readonly periodOptions: PeriodOption[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: 'custom', label: 'Custom' },
  ];

  private restaurantId = '';
  private contextSub?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly toastController: ToastController,
    private readonly apiService: ApiService,
    private readonly auth: AuthService,
    private readonly restaurantContext: RestaurantContextService,
  ) {
    addIcons({
      alertCircleOutline,
      bicycleOutline,
      cartOutline,
      cashOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      pricetagOutline,
      refreshOutline,
      restaurantOutline,
      timeOutline,
      trendingUpOutline,
      walletOutline,
    });
  }

  ngOnInit(): void {
    this.contextSub = this.restaurantContext.restaurant$.subscribe((restaurant) => {
      if (restaurant?._id && restaurant._id !== this.restaurantId) {
        this.restaurant = restaurant;
        this.restaurantId = restaurant._id;
        void this.loadDashboard();
      }
    });

    if (!this.restaurantId) {
      void this.bootstrapRestaurant();
    }
  }

  ngOnDestroy(): void {
    this.contextSub?.unsubscribe();
  }

  async refreshData(): Promise<void> {
    await this.loadDashboard();
    await this.showToast('Dashboard refreshed', 'success');
  }

  async onPeriodChange(period: SalesPeriod): Promise<void> {
    this.selectedPeriod = period;
    if (period !== 'custom') {
      await this.loadSales();
    }
  }

  async applyCustomRange(): Promise<void> {
    if (!this.customFrom || !this.customTo) {
      await this.showToast('Select both start and end dates', 'warning');
      return;
    }
    this.selectedPeriod = 'custom';
    await this.loadSales();
  }

  get maxRevenue(): number {
    if (!this.sales?.revenueByDay?.length) {
      return 1;
    }
    return Math.max(...this.sales.revenueByDay.map((d) => d.revenue), 1);
  }

  get statusSlices(): StatusSlice[] {
    if (!this.ordersByStatus) {
      return [];
    }
    const mapping: Array<{ key: keyof OrdersByStatus; label: string; color: string }> = [
      { key: 'pending', label: 'Pending', color: '#d97706' },
      { key: 'confirmed', label: 'Confirmed', color: '#0ea5e9' },
      { key: 'preparing', label: 'Preparing', color: '#0f766e' },
      { key: 'ready_for_pickup', label: 'Ready', color: '#16a34a' },
      { key: 'out_for_delivery', label: 'Out for delivery', color: '#7c3aed' },
      { key: 'delivered', label: 'Completed', color: '#15803d' },
      { key: 'cancelled', label: 'Cancelled', color: '#dc2626' },
      { key: 'assigned', label: 'Assigned', color: '#64748b' },
    ];

    return mapping
      .map((item) => ({
        ...item,
        count: this.ordersByStatus?.[item.key] || 0,
      }))
      .filter((item) => item.count > 0);
  }

  get statusTotal(): number {
    return this.statusSlices.reduce((sum, item) => sum + item.count, 0) || 1;
  }

  getCategoryWidth(revenue: number): number {
    const max = Math.max(...this.topCategories.map((c) => c.revenue), 1);
    return Math.max(8, Math.round((revenue / max) * 100));
  }

  formatCurrency(value: number | undefined | null): string {
    const amount = value || 0;
    return `₹${amount.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  statusClass(status: string): string {
    const normalized = status === 'ready' ? 'ready_for_pickup' : status;
    return `status-${normalized}`;
  }

  navigateToOrders(): void {
    void this.router.navigate(['/orders']);
  }

  navigateToMenu(): void {
    void this.router.navigate(['/food-management']);
  }

  navigateToStaff(): void {
    void this.router.navigate(['/add-delivery-person']);
  }

  addRestaurant(): void {
    void this.router.navigate(['/add-restaurant']);
  }

  private async bootstrapRestaurant(): Promise<void> {
    const selected = this.restaurantContext.selectedRestaurant;
    const user = this.auth.currentUser;

    if (selected?._id) {
      this.restaurant = selected;
      this.restaurantId = selected._id;
      await this.loadDashboard();
      return;
    }

    if (!user?.id) {
      this.isLoading = false;
      this.loadError = 'Please sign in again.';
      return;
    }

    try {
      this.isLoading = true;
      const restaurants = await firstValueFrom(
        this.apiService.getRestaurantByOwner(user.id),
      );
      if (restaurants?.length) {
        this.restaurantContext.selectRestaurant(restaurants[0]);
        this.restaurant = restaurants[0];
        this.restaurantId = restaurants[0]._id;
        await this.loadDashboard();
      } else {
        this.isLoading = false;
        this.restaurant = null;
      }
    } catch {
      this.isLoading = false;
      this.loadError = 'Unable to load restaurant context.';
    }
  }

  private async loadDashboard(): Promise<void> {
    if (!this.restaurantId) {
      return;
    }

    this.isLoading = true;
    this.loadError = null;

    try {
      const overview: DashboardOverview = await firstValueFrom(
        this.apiService.getDashboardOverview(this.restaurantId),
      );
      this.applyOverview(overview);
      this.selectedPeriod = (overview.sales.period as SalesPeriod) || '7days';
    } catch (error) {
      console.error('Dashboard overview failed', error);
      this.loadError = 'Failed to load dashboard data. Check your connection and try again.';
      // Fallback: still show restaurant shell with zeros if possible
      try {
        const stats = await firstValueFrom(
          this.apiService.getDashboardStats(this.restaurantId),
        );
        this.kpis = {
          todayRevenue: stats.todayRevenue || 0,
          todayOrders: stats.todayOrders || 0,
          averageOrderValue: stats.averageOrderValue || 0,
          pendingOrders: stats.pendingOrders || 0,
          completedOrders: stats.completedOrders || 0,
          cancelledOrders: stats.cancelledOrders || 0,
          lowStockItems: stats.lowStockItems || 0,
          totalOrders: stats.totalOrders || 0,
          totalRevenue: stats.totalRevenue || 0,
          activeDeliveries: stats.activeDeliveries || 0,
          totalDeliveryPeople: stats.totalDeliveryPeople || 0,
        };
        this.loadError = null;
        await this.loadSales();
      } catch {
        await this.showToast('Error loading dashboard data', 'danger');
      }
    } finally {
      this.isLoading = false;
    }
  }

  private async loadSales(): Promise<void> {
    if (!this.restaurantId) {
      return;
    }

    this.isSalesLoading = true;
    try {
      const sales = await firstValueFrom(
        this.apiService.getDashboardSales(
          this.restaurantId,
          this.selectedPeriod,
          this.selectedPeriod === 'custom' ? this.customFrom : undefined,
          this.selectedPeriod === 'custom' ? this.customTo : undefined,
        ),
      );
      this.sales = sales;
      this.topItems = sales.topItems || [];
      this.topCategories = sales.topCategories || [];
      this.ordersByStatus = sales.ordersByStatus;
      this.paymentSummary = sales.paymentSummary;
    } catch (error) {
      console.error('Sales load failed', error);
      await this.showToast('Failed to load sales analytics', 'danger');
    } finally {
      this.isSalesLoading = false;
    }
  }

  private applyOverview(overview: DashboardOverview): void {
    this.kpis = overview.kpis;
    this.sales = overview.sales;
    this.recentOrders = overview.recentOrders || [];
    this.topItems = overview.topItems || overview.sales?.topItems || [];
    this.topCategories =
      overview.topCategories || overview.sales?.topCategories || [];
    this.ordersByStatus = overview.ordersByStatus || overview.sales?.ordersByStatus;
    this.paymentSummary =
      overview.paymentSummary || overview.sales?.paymentSummary || null;
  }

  private async showToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
