import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, Restaurant } from '../../services/api.service';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  providers: [ApiService],
  imports: [IonicModule, CommonModule, HttpClientModule, FormsModule, ReactiveFormsModule]
})
export class DashboardPage implements OnInit {
  restaurant: Restaurant | null = null;
  isLoading = true;
  showDeliveryForm = false;
  deliveryForm = {
    name: '',
    email: '',
    password: '',
    phone: ''
  };
  registeringDelivery = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      this.isLoading = true;
      const restaurant = JSON.parse(localStorage.getItem('selectedRestaurant') || '{}');
      if (restaurant && restaurant._id) {
        this.restaurant = restaurant;
        this.isLoading = false;
      } else {
        this.router.navigate(['/restaurants-list']);
      }
    } catch (error) {
      await this.showToast('Error loading dashboard data');
      this.isLoading = false;
    }
  }

  navigateToFoodManagement() {
    this.router.navigate(['/food-management']);
  }
  navigateToOrders() {
    this.router.navigate(['/orders']);
  }
  navigateToAnalytics() {
    this.router.navigate(['/analytics']);
  }

  toggleDeliveryForm() {
    this.showDeliveryForm = !this.showDeliveryForm;
  }

  async registerDeliveryPerson() {
    if (!this.deliveryForm.name || !this.deliveryForm.email || !this.deliveryForm.password) {
      this.showToast('Please fill all required fields');
      return;
    }
    this.registeringDelivery = true;
    try {
      await this.apiService.registerDeliveryPerson(this.deliveryForm).toPromise();
      this.showToast('Delivery person registered!');
      this.deliveryForm = { name: '', email: '', password: '', phone: '' };
      this.showDeliveryForm = false;
    } catch (err) {
      this.showToast('Failed to register delivery person');
    } finally {
      this.registeringDelivery = false;
    }
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