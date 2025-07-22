import { Component, OnInit } from '@angular/core';
import { ApiService, Restaurant } from '../../services/api.service';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-restaurant-profile',
  templateUrl: './restaurant-profile.page.html',
  styleUrls: ['./restaurant-profile.page.scss'],
  standalone: true,
  providers: [ApiService],
  imports: [IonicModule, CommonModule, HttpClientModule, FormsModule, ReactiveFormsModule]
})
export class RestaurantProfilePage implements OnInit {
  restaurantForm!: FormGroup;
  isLoading = true;
  restaurantId!: string;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private toastController: ToastController,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get restaurantId from navigation state
    const nav = this.router.getCurrentNavigation();
    this.restaurantId = nav?.extras?.state?.['restaurantId'];
    if (!this.restaurantId) {
      this.isLoading = false;
      return;
    }
    this.restaurantForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      cuisine: [''],
      image: ['',Validators.required],
      minOrder: [0],
      deliveryTime: ['',Validators.required],
      description: ['',Validators.required],
      available: [true]
    });
    this.loadRestaurant();
  }

  loadRestaurant() {
    this.apiService.getRestaurant(this.restaurantId).subscribe((restaurant: Restaurant) => {
      this.restaurantForm.patchValue(restaurant);
      this.isLoading = false;
    }, err => {
      this.showToast('Failed to load restaurant.');
      this.isLoading = false;
    });
  }

  saveRestaurant() {
    if (this.restaurantForm.invalid) return;
    this.apiService.updateRestaurant(this.restaurantId, this.restaurantForm.value).subscribe(
      () => {
        this.showToast('Restaurant updated successfully.');
        this.router.navigate(['/restaurants-list']);
      },
      err => {
        this.showToast('Failed to update restaurant.');
      }
    );
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success'
    });
    await toast.present();
  }
} 