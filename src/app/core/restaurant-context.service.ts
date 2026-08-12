import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Restaurant } from '../models';

const SELECTED_RESTAURANT_KEY = 'selectedRestaurant';

@Injectable({ providedIn: 'root' })
export class RestaurantContextService {
  private readonly restaurantSubject = new BehaviorSubject<Restaurant | null>(
    this.readSelected(),
  );
  readonly restaurant$ = this.restaurantSubject.asObservable();

  get selectedRestaurant(): Restaurant | null {
    return this.restaurantSubject.value;
  }

  get restaurantId(): string | null {
    return this.restaurantSubject.value?._id ?? null;
  }

  selectRestaurant(restaurant: Restaurant): void {
    localStorage.setItem(SELECTED_RESTAURANT_KEY, JSON.stringify(restaurant));
    this.restaurantSubject.next(restaurant);
  }

  clear(): void {
    localStorage.removeItem(SELECTED_RESTAURANT_KEY);
    this.restaurantSubject.next(null);
  }

  private readSelected(): Restaurant | null {
    try {
      const raw = localStorage.getItem(SELECTED_RESTAURANT_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Restaurant;
      return parsed?._id ? parsed : null;
    } catch {
      return null;
    }
  }
}
