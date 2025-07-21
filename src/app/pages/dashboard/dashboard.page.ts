import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, Restaurant } from '../../services/api.service';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  providers: [ApiService],
  imports: [IonicModule, CommonModule, HttpClientModule]
})
export class DashboardPage implements OnInit {
  restaurant: Restaurant | null = null;
  isLoading = true;

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

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: 'warning'
    });
    await toast.present();
  }
} 