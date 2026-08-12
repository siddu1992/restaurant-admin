import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  ToastController,
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonTitle,
  IonToolbar,
  IonToggle,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-food',
  templateUrl: './edit-food.page.html',
  styleUrls: ['./edit-food.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonInput,
    IonButton,
    IonToggle,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class EditFoodPage implements OnInit {
  foodForm!: FormGroup;
  isLoading = true;
  foodId!: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService,
    private readonly fb: FormBuilder,
    private readonly toastController: ToastController,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.foodId = this.route.snapshot.paramMap.get('id') || '';
    this.foodForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      category: [''],
      image: [''],
      available: [true],
    });
    this.loadFood();
  }

  loadFood(): void {
    this.apiService.getFoodById(this.foodId).subscribe({
      next: (food) => {
        this.foodForm.patchValue(food);
        this.isLoading = false;
      },
      error: () => {
        void this.showToast('Failed to load food item.');
        this.isLoading = false;
      },
    });
  }

  saveFood(): void {
    if (this.foodForm.invalid) {
      return;
    }
    this.apiService.updateFood(this.foodId, this.foodForm.value).subscribe({
      next: () => {
        void this.showToast('Food updated successfully.');
        void this.router.navigate(['/food-management']);
      },
      error: () => {
        void this.showToast('Failed to update food.');
      },
    });
  }

  async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
    });
    await toast.present();
  }
}
