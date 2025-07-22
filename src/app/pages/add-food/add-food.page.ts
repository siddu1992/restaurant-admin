import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-add-food',
  templateUrl: './add-food.page.html',
  styleUrls: ['./add-food.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, HttpClientModule, ReactiveFormsModule],
  providers: [ApiService]
})
export class AddFoodPage {
  foodForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.foodForm = this.fb.group({
        name: ['', Validators.required],
        description: ['', Validators.required],
        price: ['', [Validators.required, Validators.min(1)]],
        image: [''],
        available: [true],
        category: ['', Validators.required] // <-- Add this line
      });
  }

  async addFood() {
    if (this.foodForm.invalid) return;
    this.isLoading = true;
    const restaurant = JSON.parse(localStorage.getItem('selectedRestaurant') || '{}');
    const foodData = { ...this.foodForm.value, restaurant: restaurant._id };
    this.apiService.addFood(foodData).subscribe({
      next: async () => {
        this.isLoading = false;
        await this.showToast('Food item added!');
        this.router.navigate(['/food-management']);
      },
      error: async () => {
        this.isLoading = false;
        await this.showToast('Failed to add food item');
      }
    });
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color: 'success'
    });
    await toast.present();
  }
} 