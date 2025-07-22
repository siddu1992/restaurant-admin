import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-edit-food',
  templateUrl: './edit-food.page.html',
  styleUrls: ['./edit-food.page.scss'],
  standalone: true,
  providers: [ApiService],
  imports: [IonicModule, CommonModule, HttpClientModule, FormsModule, ReactiveFormsModule]
})
export class EditFoodPage implements OnInit {
  foodForm!: FormGroup;
  isLoading = true;
  foodId!: string;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private fb: FormBuilder,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router
  ) {}

  ngOnInit() {
    this.foodId = this.route.snapshot.paramMap.get('id') || '';
    this.foodForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      category: [''],
      image: [''],
      available: [true]
    });
    this.loadFood();
  }

  loadFood() {
    this.apiService.getFoodById(this.foodId).subscribe(food => {
      this.foodForm.patchValue(food);
      this.isLoading = false;
    }, err => {
      this.showToast('Failed to load food item.');
      this.isLoading = false;
    });
  }

  saveFood() {
    if (this.foodForm.invalid) return;
    this.apiService.updateFood(this.foodId, this.foodForm.value).subscribe(
      () => {
        this.showToast('Food updated successfully.');
        this.router.navigate(['/food-management']);
      },
      err => {
        this.showToast('Failed to update food.');
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