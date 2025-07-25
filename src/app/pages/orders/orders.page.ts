import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ApiService, Order, Restaurant } from '../../services/api.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: true,
  providers:[ApiService],
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule]
})
export class OrdersPage implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = true;
  selectedStatus = 'all';
  restaurantId = 'demo-restaurant-id';
  deliveryPeople: any[] = [];
  assigningOrderId: string | null = null;
  assigning = false;

  statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' }, // Added assigned
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.loadDeliveryPeople();
  }

  async loadOrders() {
    try {
      this.isLoading = true;
      const selectedRestaurantStr = localStorage.getItem('selectedRestaurant');
      let selectedRestaurant!: Restaurant;
      if (selectedRestaurantStr) {
        selectedRestaurant = JSON.parse(selectedRestaurantStr);
      }
  

       this.apiService.getRestaurantOrders(selectedRestaurant._id).subscribe((res)=>{
        this.orders = res
       this.filterOrders();

      }) || [];
      
      
    } catch (error) {
      console.error('Error loading orders:', error);
      await this.showToast('Error loading orders');
    } finally {
      this.isLoading = false;
    }
  }

  loadDeliveryPeople() {
    // Example: fetch all users with role 'delivery'
    this.apiService.getAllDeliveryPeople?.().subscribe(
      (people) => this.deliveryPeople = people,
      (err) => this.deliveryPeople = []
    );
  }

  assignDelivery(order: Order, deliveryPersonId: string) {
    if (!order || !order.delivery || !deliveryPersonId) return;
    this.assigningOrderId = order._id;
    this.assigning = true;
    this.apiService.assignDeliveryPerson(order.delivery._id, deliveryPersonId).subscribe(
      () => {
        this.assigningOrderId = null;
        this.assigning = false;
        this.showToast('Delivery person assigned!');
        this.loadOrders();
      },
      (err) => {
        this.assigningOrderId = null;
        this.assigning = false;
        this.showToast('Failed to assign delivery person');
      }
    );
  }

  filterOrders() {
    if (this.selectedStatus === 'all') {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === this.selectedStatus);
    }
  }

  onStatusChange() {
    this.filterOrders();
  }

  async updateOrderStatus(order: Order, newStatus: string) {
    const loading = await this.loadingController.create({
      message: 'Updating order status...'
    });
    await loading.present();

    try {
      await this.apiService.updateOrderStatus(order._id, newStatus).toPromise();
      order.status = newStatus;
      order.updatedAt = new Date().toISOString();
      this.filterOrders();
      await this.showToast(`Order status updated to ${this.getStatusText(newStatus)}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      await this.showToast('Error updating order status');
    } finally {
      await loading.dismiss();
    }
  }

  async cancelOrder(order: Order) {
    const alert = await this.alertController.create({
      header: 'Cancel Order',
      message: 'Are you sure you want to cancel this order?',
      buttons: [
        { text: 'No', role: 'cancel' },
        { text: 'Yes, Cancel', handler: () => this.updateOrderStatus(order, 'cancelled') }
      ]
    });
    await alert.present();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'secondary'; // Added assigned
      case 'preparing': return 'primary';
      case 'ready': return 'success';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'assigned': return 'Assigned'; // Added assigned
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }

  getOrderStats() {
    return {
      total: this.orders.length,
      pending: this.orders.filter(o => o.status === 'pending').length,
      assigned: this.orders.filter(o => o.status === 'assigned').length, // Added assigned
      preparing: this.orders.filter(o => o.status === 'preparing').length,
      ready: this.orders.filter(o => o.status === 'ready').length,
      delivered: this.orders.filter(o => o.status === 'delivered').length,
      cancelled: this.orders.filter(o => o.status === 'cancelled').length
    };
  }

  getTotalRevenue(): number {
    return this.orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: 'success'
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
} 