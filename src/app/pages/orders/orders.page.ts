import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  IonIcon,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  closeOutline,
  refreshOutline,
  searchOutline,
} from 'ionicons/icons';
import { Subject, Subscription, firstValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RestaurantContextService } from '../../core/restaurant-context.service';
import {
  Order,
  OrderStatus,
  PaymentFilter,
  getNextOrderStatuses,
  getOrderItemName,
  getOrderItemUnitPrice,
  isIncomingOrder,
} from '../../models';
import { ApiService } from '../../services/api.service';
import { WebSocketService } from '../../services/websocket.service';

interface StatusOption {
  value: string;
  label: string;
}

interface SortOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, IonSpinner],
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit, OnDestroy {
  orders: Order[] = [];
  selectedOrder: Order | null = null;
  isLoading = true;
  isUpdating = false;
  loadError: string | null = null;

  searchTerm = '';
  statusFilter = 'all';
  paymentFilter: PaymentFilter = 'all';
  customerFilter = '';
  dateFrom = '';
  dateTo = '';
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  statusCounts: Record<string, number> = {};

  readonly statusOptions: StatusOption[] = [
    { value: 'all', label: 'All tickets' },
    { value: 'pending', label: 'Incoming' },
    { value: 'preparing', label: 'In kitchen' },
    { value: 'ready_for_pickup', label: 'Ready for courier' },
    { value: 'assigned', label: 'Courier assigned' },
    { value: 'out_for_delivery', label: 'Out with courier' },
    { value: 'delivered', label: 'Completed' },
    { value: 'cancelled', label: 'Declined / cancelled' },
  ];

  readonly paymentOptions: StatusOption[] = [
    { value: 'all', label: 'All payments' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
  ];

  readonly sortOptions: SortOption[] = [
    { value: 'createdAt', label: 'Created date' },
    { value: 'totalAmount', label: 'Amount' },
    { value: 'status', label: 'Status' },
    { value: 'customerName', label: 'Customer' },
  ];

  private restaurantId = '';
  private readonly searchSubject = new Subject<string>();
  private subs = new Subscription();
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly restaurantContext: RestaurantContextService,
    private readonly wsService: WebSocketService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toastController: ToastController,
    private readonly alertController: AlertController,
  ) {
    addIcons({
      alertCircleOutline,
      closeOutline,
      refreshOutline,
      searchOutline,
    });
  }

  ngOnInit(): void {
    this.subs.add(
      this.searchSubject
        .pipe(debounceTime(350), distinctUntilChanged())
        .subscribe(() => {
          this.page = 1;
          void this.loadOrders();
        }),
    );

    this.subs.add(
      this.route.queryParamMap.subscribe((params) => {
        const q = params.get('q');
        if (q) {
          this.searchTerm = q;
        }
      }),
    );

    this.subs.add(
      this.restaurantContext.restaurant$.subscribe((restaurant) => {
        if (restaurant?._id) {
          this.restaurantId = restaurant._id;
          this.wsService.joinRestaurantRoom(restaurant._id);
          void this.loadOrders();
        }
      }),
    );

    const selected = this.restaurantContext.selectedRestaurant;
    if (selected?._id) {
      this.restaurantId = selected._id;
      this.wsService.joinRestaurantRoom(selected._id);
      void this.loadOrders();
    } else {
      this.isLoading = false;
      void this.router.navigate(['/restaurants']);
    }

    // Auto refresh list immediately when WebSocket new order event arrives
    this.subs.add(
      this.wsService.getNewOrderUpdates().subscribe(() => {
        console.log('🔄 New order received in OrdersPage, refreshing order list...');
        void this.loadOrders(true);
      }),
    );

    this.pollTimer = setInterval(() => {
      if (this.restaurantId && !this.isUpdating) {
        void this.loadOrders(true);
      }
    }, 12000);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm.trim());
  }

  onFiltersChanged(): void {
    this.page = 1;
    void this.loadOrders();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    void this.loadOrders();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) {
      return;
    }
    this.page = page;
    void this.loadOrders();
  }

  async refresh(): Promise<void> {
    await this.loadOrders();
    await this.showToast('Orders refreshed', 'success');
  }

  openOrder(order: Order): void {
    this.selectedOrder = order;
  }

  closeDetail(): void {
    this.selectedOrder = null;
  }

  getNextActions(order: Order): OrderStatus[] {
    return getNextOrderStatuses(order.status);
  }

  getPrimaryActions(order: Order): OrderStatus[] {
    return this.getNextActions(order).filter(
      (status: OrderStatus) => status !== 'cancelled',
    );
  }

  canCancel(order: Order): boolean {
    return this.getNextActions(order).includes('cancelled');
  }

  isIncoming(order: Order): boolean {
    return isIncomingOrder(order.status);
  }

  isInKitchen(order: Order): boolean {
    return order.status === 'preparing';
  }

  courierStatus(order: Order): string | null {
    const status = order.status;
    if (status === 'ready_for_pickup' || status === 'ready') {
      return 'Waiting for courier to pick up';
    }
    if (status === 'assigned') {
      return 'Courier assigned — heading to restaurant';
    }
    if (status === 'out_for_delivery' || status === 'picked_up') {
      return 'Courier is delivering to the customer';
    }
    return null;
  }

  async applyStatus(order: Order, nextStatus: OrderStatus): Promise<void> {
    if (!this.getNextActions(order).includes(nextStatus) && nextStatus !== 'cancelled') {
      await this.showToast('Invalid status transition', 'danger');
      return;
    }

    if (nextStatus === 'cancelled') {
      await this.confirmCancel(order);
      return;
    }

    await this.performStatusUpdate(order, nextStatus);
  }

  async acceptOrder(order: Order, event?: Event): Promise<void> {
    event?.stopPropagation();
    await this.performStatusUpdate(order, 'preparing');
  }

  async confirmCancel(order: Order, event?: Event): Promise<void> {
    event?.stopPropagation();
    const incoming = this.isIncoming(order);
    const alert = await this.alertController.create({
      header: incoming ? 'Decline this order?' : 'Cancel order',
      message: incoming
        ? `Decline #${this.orderNumber(order)}? The customer will be notified.`
        : `Cancel order #${this.orderNumber(order)}? This cannot be undone.`,
      buttons: [
        { text: incoming ? 'Keep ticket' : 'Keep order', role: 'cancel' },
        {
          text: incoming ? 'Decline order' : 'Cancel order',
          role: 'destructive',
          handler: () => {
            void this.performStatusUpdate(order, 'cancelled');
          },
        },
      ],
    });
    await alert.present();
  }

  orderNumber(order: Order): string {
    return order._id.slice(-6).toUpperCase();
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'Incoming',
      confirmed: 'Incoming',
      preparing: 'In kitchen',
      ready_for_pickup: 'Ready for courier',
      ready: 'Ready for courier',
      assigned: 'Courier assigned',
      out_for_delivery: 'Out with courier',
      picked_up: 'Out with courier',
      delivered: 'Completed',
      cancelled: 'Declined',
    };
    return map[status] || status.replace(/_/g, ' ');
  }

  statusClass(status: string): string {
    if (status === 'confirmed') {
      return 'status-pending';
    }
    const normalized = status === 'ready' ? 'ready_for_pickup' : status;
    return `status-${normalized}`;
  }

  actionLabel(status: OrderStatus): string {
    const map: Partial<Record<OrderStatus, string>> = {
      preparing: 'Accept order',
      ready_for_pickup: 'Food is ready',
      cancelled: 'Decline',
    };
    return map[status] || this.formatStatus(status);
  }

  itemName(item: Order['items'][number]): string {
    return getOrderItemName(item);
  }

  itemPrice(item: Order['items'][number]): number {
    return getOrderItemUnitPrice(item);
  }

  itemLineTotal(item: Order['items'][number]): number {
    return this.itemPrice(item) * (item.quantity || 0);
  }

  formatCurrency(value: number): string {
    return `₹${(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }

  get countPending(): number {
    return (this.statusCounts['pending'] || 0) + (this.statusCounts['confirmed'] || 0);
  }

  get countPreparing(): number {
    return this.statusCounts['preparing'] || 0;
  }

  get countReady(): number {
    return (
      (this.statusCounts['ready_for_pickup'] || 0) + (this.statusCounts['ready'] || 0)
    );
  }

  get countCompleted(): number {
    return this.statusCounts['delivered'] || 0;
  }

  private async loadOrders(silent = false): Promise<void> {
    if (!this.restaurantId) {
      return;
    }

    if (!silent) {
      this.isLoading = true;
    }
    this.loadError = null;

    try {
      const response = await firstValueFrom(
        this.api.searchRestaurantOrders(this.restaurantId, {
          status: this.statusFilter,
          payment: this.paymentFilter,
          q: this.searchTerm.trim() || undefined,
          customer: this.customerFilter.trim() || undefined,
          from: this.dateFrom || undefined,
          to: this.dateTo || undefined,
          page: this.page,
          limit: this.limit,
          sortBy: this.sortBy,
          sortOrder: this.sortOrder,
        }),
      );

      this.orders = response.data || [];
      this.total = response.total || 0;
      this.page = response.page || 1;
      this.limit = response.limit || this.limit;
      this.totalPages = response.totalPages || 1;
      this.statusCounts = response.statusCounts || {};

      if (this.selectedOrder) {
        const updated = this.orders.find((o) => o._id === this.selectedOrder?._id);
        this.selectedOrder = updated || this.selectedOrder;
      }
    } catch (error) {
      console.error('Failed to load orders', error);
      this.loadError = 'Failed to load orders. Please retry.';
      this.orders = [];
    } finally {
      this.isLoading = false;
    }
  }

  private async performStatusUpdate(order: Order, nextStatus: OrderStatus): Promise<void> {
    this.isUpdating = true;
    try {
      const updated = await firstValueFrom(
        this.api.updateOrderStatus(order._id, nextStatus),
      );
      order.status = updated.status;
      order.updatedAt = updated.updatedAt;
      if (this.selectedOrder?._id === order._id) {
        this.selectedOrder = { ...this.selectedOrder, ...updated };
      }
      const success =
        nextStatus === 'preparing'
          ? 'Order accepted — kitchen started. Couriers are being notified.'
          : nextStatus === 'ready_for_pickup'
            ? 'Marked ready — waiting for courier pickup.'
            : nextStatus === 'cancelled'
              ? this.isIncoming(order)
                ? 'Order declined.'
                : 'Order cancelled.'
              : `Order marked as ${this.formatStatus(nextStatus)}`;
      await this.showToast(success, 'success');
      await this.loadOrders();
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error &&
        'error' in error &&
        typeof (error as { error?: { message?: string } }).error?.message === 'string'
          ? (error as { error: { message: string } }).error.message
          : 'Failed to update order status';
      await this.showToast(message, 'danger');
    } finally {
      this.isUpdating = false;
    }
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
