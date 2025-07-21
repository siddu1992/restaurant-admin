import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Restaurant {
  _id: string;
  name: string;
  address: string;
  cuisine: string;
  image: string;
  rating: number;
  deliveryTime: string;
  minOrder: number;
  description?: string;
  owner: string;
  foodItems: string[];
  latitude: number;
  longitude: number;
}

export interface Food {
  _id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  available?: boolean;
  restaurant: string;
}

export interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    food: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  restaurant: string;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Authentication
  login(loginData: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, loginData);
  }

  restaurantOwnerSignup(signupData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/restaurant-owner/signup`, signupData);
  }

  ownerSignup(signupData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/owner/signup`, signupData);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/profile`);
  }

  // Restaurant Management
  getRestaurant(restaurantId: string): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.baseUrl}/restaurants/${restaurantId}`);
  }

  updateRestaurant(restaurantId: string, data: any): Observable<Restaurant> {
    return this.http.put<Restaurant>(`${this.baseUrl}/restaurants/${restaurantId}`, data);
  }

  createRestaurant(restaurantData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/restaurants`, restaurantData);
  }

  getRestaurantByOwner(ownerId: string): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.baseUrl}/restaurants/owner/${ownerId}`);
  }

  getAllRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.baseUrl}/restaurants`);
  }

  // Food Management
  getRestaurantFoods(restaurantId: string): Observable<Food[]> {
    return this.http.get<Food[]>(`${this.baseUrl}/foods/restaurant/${restaurantId}`);
  }

  createFood(foodData: any): Observable<Food> {
    return this.http.post<Food>(`${this.baseUrl}/foods`, foodData);
  }

  updateFood(foodId: string, foodData: any): Observable<Food> {
    return this.http.put<Food>(`${this.baseUrl}/foods/${foodId}`, foodData);
  }

  deleteFood(foodId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/foods/${foodId}`);
  }

  // Order Management
  getRestaurantOrders(restaurantId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders/restaurant/${restaurantId}`);
  }

  updateOrderStatus(orderId: string, status: string): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/orders/${orderId}/status`, { status });
  }

  // Analytics
  getRestaurantAnalytics(restaurantId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/restaurants/${restaurantId}/analytics`);
  }
} 