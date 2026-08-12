import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AlertController,
  IonIcon,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  alertCircleOutline,
  createOutline,
  imageOutline,
  refreshOutline,
  restaurantOutline,
  searchOutline,
  trashOutline,
} from 'ionicons/icons';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RestaurantContextService } from '../../core/restaurant-context.service';
import { Food } from '../../models';
import { ApiService } from '../../services/api.service';

type AvailabilityFilter = 'all' | 'available' | 'unavailable';
type SortKey = 'name' | 'price' | 'category' | 'availability';

interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-food-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, IonSpinner],
  templateUrl: './food-management.page.html',
  styleUrls: ['./food-management.page.scss'],
})
export class FoodManagementPage implements OnInit, OnDestroy {
  foods: Food[] = [];
  filteredFoods: Food[] = [];
  categories: string[] = [];

  isLoading = true;
  isUpdating = false;
  loadError: string | null = null;
  updatingFoodId: string | null = null;

  searchTerm = '';
  selectedCategory = 'all';
  availabilityFilter: AvailabilityFilter = 'all';
  sortBy: SortKey = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  viewMode: 'table' | 'grid' = 'table';

  totalFoods = 0;
  availableFoods = 0;
  unavailableFoods = 0;

  readonly availabilityOptions: FilterOption[] = [
    { value: 'all', label: 'All items' },
    { value: 'available', label: 'Available' },
    { value: 'unavailable', label: 'Unavailable' },
  ];

  readonly sortOptions: FilterOption[] = [
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'category', label: 'Category' },
    { value: 'availability', label: 'Availability' },
  ];

  private readonly searchSubject = new Subject<string>();
  private readonly subs = new Subscription();
  private restaurantId = '';

  constructor(
    private readonly apiService: ApiService,
    private readonly restaurantContext: RestaurantContextService,
    private readonly toastController: ToastController,
    private readonly alertController: AlertController,
    private readonly router: Router,
  ) {
    addIcons({
      addOutline,
      alertCircleOutline,
      createOutline,
      imageOutline,
      refreshOutline,
      restaurantOutline,
      searchOutline,
      trashOutline,
    });
  }

  ngOnInit(): void {
    this.subs.add(
      this.searchSubject
        .pipe(debounceTime(250), distinctUntilChanged())
        .subscribe(() => this.applyFilters()),
    );

    this.subs.add(
      this.restaurantContext.restaurant$.subscribe((restaurant) => {
        this.restaurantId = restaurant?._id || '';
        this.loadFoods();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm.trim());
  }

  onFiltersChanged(): void {
    this.applyFilters();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  setViewMode(mode: 'table' | 'grid'): void {
    this.viewMode = mode;
  }

  refresh(): void {
    this.isUpdating = true;
    this.loadFoods(true);
  }

  loadFoods(silent = false): void {
    if (!silent) {
      this.isLoading = true;
    }
    this.loadError = null;

    if (!this.restaurantId) {
      this.foods = [];
      this.filteredFoods = [];
      this.categories = [];
      this.recalculateStats();
      this.isLoading = false;
      this.isUpdating = false;
      this.loadError = 'Select a restaurant to manage its menu.';
      return;
    }

    this.apiService.getRestaurantFoods(this.restaurantId).subscribe({
      next: (foods) => {
        this.foods = foods || [];
        this.categories = this.extractCategories(this.foods);
        this.recalculateStats();
        this.applyFilters();
        this.isLoading = false;
        this.isUpdating = false;
      },
      error: () => {
        this.loadError = 'Failed to load menu items. Please try again.';
        this.isLoading = false;
        this.isUpdating = false;
      },
    });
  }

  toggleAvailability(food: Food, event: Event): void {
    const input = event.target as HTMLInputElement;
    const nextState = input.checked;
    const previousState = !nextState;
    food.available = nextState;
    this.updatingFoodId = food._id;

    this.apiService.updateFood(food._id, { available: nextState }).subscribe({
      next: () => {
        this.updatingFoodId = null;
        this.recalculateStats();
        this.applyFilters();
        void this.showToast(
          `${food.name} marked as ${nextState ? 'available' : 'unavailable'}`,
          'success',
        );
      },
      error: () => {
        food.available = previousState;
        this.updatingFoodId = null;
        this.recalculateStats();
        this.applyFilters();
        void this.showToast('Failed to update availability', 'danger');
      },
    });
  }

  editFood(food: Food): void {
    void this.router.navigate(['/edit-food', food._id]);
  }

  addNewFood(): void {
    void this.router.navigate(['/add-food']);
  }

  async deleteFood(food: Food): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete menu item',
      message: `Remove "${food.name}" from the menu? This cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.performDelete(food),
        },
      ],
    });
    await alert.present();
  }

  get hasRestaurant(): boolean {
    return !!this.restaurantId;
  }

  trackByFoodId(_index: number, food: Food): string {
    return food._id;
  }

  categoryLabel(category: string | undefined): string {
    if (!category) {
      return 'Uncategorized';
    }
    return category
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private performDelete(food: Food): void {
    this.apiService.deleteFood(food._id).subscribe({
      next: () => {
        void this.showToast('Menu item deleted', 'success');
        this.loadFoods(true);
      },
      error: () => {
        void this.showToast('Failed to delete menu item', 'danger');
      },
    });
  }

  private applyFilters(): void {
    let filtered = [...this.foods];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      filtered = filtered.filter(
        (food) =>
          food.name.toLowerCase().includes(term) ||
          (food.description || '').toLowerCase().includes(term) ||
          (food.category || '').toLowerCase().includes(term),
      );
    }

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter((food) => food.category === this.selectedCategory);
    }

    if (this.availabilityFilter === 'available') {
      filtered = filtered.filter((food) => food.available !== false);
    } else if (this.availabilityFilter === 'unavailable') {
      filtered = filtered.filter((food) => food.available === false);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (this.sortBy) {
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'availability':
          comparison = Number(b.available !== false) - Number(a.available !== false);
          break;
        case 'name':
        default:
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
      }
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredFoods = filtered;
  }

  private recalculateStats(): void {
    this.totalFoods = this.foods.length;
    this.availableFoods = this.foods.filter((food) => food.available !== false).length;
    this.unavailableFoods = this.totalFoods - this.availableFoods;
  }

  private extractCategories(foods: Food[]): string[] {
    return [...new Set(foods.map((food) => food.category).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );
  }

  private async showToast(message: string, color: string = 'warning'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2800,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
