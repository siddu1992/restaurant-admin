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
  quantity?: number
}

export interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  items: Item[];
  totalAmount: number;
  status: string;
  restaurant: string;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
  delivery?: { _id: string }; // Optional delivery property for assignment
}

export interface Item {
  food: Food
  quantity: number
  price: number
  _id: string
}

// Dashboard Interfaces
export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  activeDeliveries: number;
  totalDeliveryPeople: number;
  averageOrderValue: number;
}

export interface OrderAnalytics {
  ordersByStatus: {
    pending: number;
    confirmed: number;
    preparing: number;
    ready_for_pickup: number;
    out_for_delivery: number;
    delivered: number;
    cancelled: number;
  };
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topItems: Array<{
    foodId: string;
    foodName: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface DeliveryPerson {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  currentDeliveries: number;
  totalDeliveries: number;
  rating: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://192.168.1.7:3000'; // WiFi IP for mobile app access

  constructor(private http: HttpClient) {}

  // Authentication
  login(loginData: { email: string; password: string }): Observable<any> {
    console.log('[ApiService] POST', `${this.baseUrl}/auth/login`);
    return this.http.post(`${this.baseUrl}/auth/login`, loginData);
  }

  restaurantOwnerSignup(signupData: any): Observable<any> {
    console.log('[ApiService] POST', `${this.baseUrl}/auth/restaurant-owner/signup`);
    return this.http.post(`${this.baseUrl}/auth/restaurant-owner/signup`, signupData);
  }

  ownerSignup(signupData: any): Observable<any> {
    console.log('[ApiService] POST', `${this.baseUrl}/auth/owner/signup`);
    return this.http.post(`${this.baseUrl}/auth/owner/signup`, signupData);
  }

  getProfile(): Observable<any> {
    console.log('[ApiService] GET', `${this.baseUrl}/auth/profile`);
    return this.http.get(`${this.baseUrl}/auth/profile`);
  }

  // Restaurant Management
  getRestaurant(restaurantId: string): Observable<Restaurant> {
    console.log('[ApiService] GET', `${this.baseUrl}/restaurants/${restaurantId}`);
    return this.http.get<Restaurant>(`${this.baseUrl}/restaurants/${restaurantId}`);
  }

  updateRestaurant(restaurantId: string, data: any): Observable<Restaurant> {
    console.log('[ApiService] PUT', `${this.baseUrl}/restaurants/${restaurantId}`);
    return this.http.put<Restaurant>(`${this.baseUrl}/restaurants/${restaurantId}`, data);
  }

  createRestaurant(restaurantData: any): Observable<any> {
    console.log('[ApiService] POST', `${this.baseUrl}/restaurants`);
    return this.http.post(`${this.baseUrl}/restaurants`, restaurantData);
  }

  getRestaurantByOwner(ownerId: string): Observable<Restaurant[]> {
    console.log('[ApiService] GET', `${this.baseUrl}/restaurants/owner/${ownerId}`);
    return this.http.get<Restaurant[]>(`${this.baseUrl}/restaurants/owner/${ownerId}`);
  }

  getAllRestaurants(): Observable<Restaurant[]> {
    console.log('[ApiService] GET', `${this.baseUrl}/restaurants`);
    return this.http.get<Restaurant[]>(`${this.baseUrl}/restaurants`);
  }

  // Food Management
  getRestaurantFoods(restaurantId: string): Observable<Food[]> {
    console.log('[ApiService] GET', `${this.baseUrl}/foods/restaurant/${restaurantId}`);
    return this.http.get<Food[]>(`${this.baseUrl}/foods/restaurant/${restaurantId}`);
  }

  createFood(foodData: any): Observable<Food> {
    console.log('[ApiService] POST', `${this.baseUrl}/foods`);
    return this.http.post<Food>(`${this.baseUrl}/foods`, foodData);
  }

  updateFood(foodId: string, foodData: any): Observable<Food> {
    console.log('[ApiService] PUT', `${this.baseUrl}/foods/${foodId}`);
    return this.http.put<Food>(`${this.baseUrl}/foods/${foodId}`, foodData);
  }

  deleteFood(foodId: string): Observable<any> {
    console.log('[ApiService] DELETE', `${this.baseUrl}/foods/${foodId}`);
    return this.http.delete(`${this.baseUrl}/foods/${foodId}`);
  }

  addFood(foodData: any) {
    console.log('[ApiService] POST', `${this.baseUrl}/foods`);
    return this.http.post(`${this.baseUrl}/foods`, foodData);
  }

  getFoodById(foodId: string) {
    console.log('[ApiService] GET', `${this.baseUrl}/foods/${foodId}`);
    return this.http.get<any>(`${this.baseUrl}/foods/${foodId}`);
  }

  // Order Management
  getRestaurantOrders(restaurantId: string): Observable<Order[]> {
    console.log('[ApiService] GET', `${this.baseUrl}/orders/restaurant/${restaurantId}`);
    return this.http.get<Order[]>(`${this.baseUrl}/orders/restaurant/${restaurantId}`);
  }

  updateOrderStatus(orderId: string, status: string): Observable<Order> {
    console.log('[ApiService] PUT', `${this.baseUrl}/orders/${orderId}/status`);
    return this.http.put<Order>(`${this.baseUrl}/orders/${orderId}/status`, { status });
  }

  // Dashboard Analytics
  getDashboardStats(restaurantId: string): Observable<DashboardStats> {
    console.log('[ApiService] GET', `${this.baseUrl}/restaurants/${restaurantId}/dashboard/stats`);
    return this.http.get<DashboardStats>(`${this.baseUrl}/restaurants/${restaurantId}/dashboard/stats`);
  }

  getOrderAnalytics(restaurantId: string, period: string = '7days'): Observable<OrderAnalytics> {
    console.log('[ApiService] GET', `${this.baseUrl}/restaurants/${restaurantId}/analytics?period=${period}`);
    return this.http.get<OrderAnalytics>(`${this.baseUrl}/restaurants/${restaurantId}/analytics?period=${period}`);
  }

  getRecentOrders(restaurantId: string, limit: number = 10): Observable<Order[]> {
    console.log('[ApiService] GET', `${this.baseUrl}/orders/restaurant/${restaurantId}/recent?limit=${limit}`);
    return this.http.get<Order[]>(`${this.baseUrl}/orders/restaurant/${restaurantId}/recent?limit=${limit}`);
  }

  getPendingOrders(restaurantId: string): Observable<Order[]> {
    console.log('[ApiService] GET', `${this.baseUrl}/orders/restaurant/${restaurantId}/pending`);
    return this.http.get<Order[]>(`${this.baseUrl}/orders/restaurant/${restaurantId}/pending`);
  }

  // Analytics
  getRestaurantAnalytics(restaurantId: string): Observable<any> {
    console.log('[ApiService] GET', `${this.baseUrl}/restaurants/${restaurantId}/analytics`);
    return this.http.get(`${this.baseUrl}/restaurants/${restaurantId}/analytics`);
  }

  // Delivery Management
  assignDeliveryPerson(deliveryId: string, deliveryPersonId: string): Observable<any> {
    console.log('[ApiService] PUT', `${this.baseUrl}/delivery/${deliveryId}/assign`);
    return this.http.put(`${this.baseUrl}/delivery/${deliveryId}/assign`, { deliveryPersonId });
  }

  getAllDeliveryPeople(): Observable<DeliveryPerson[]> {
    console.log('[ApiService] GET', `${this.baseUrl}/users?role=delivery`);
    return this.http.get<DeliveryPerson[]>(`${this.baseUrl}/users?role=delivery`);
  }

  getActiveDeliveries(restaurantId: string): Observable<any[]> {
    console.log('[ApiService] GET', `${this.baseUrl}/delivery/restaurant/${restaurantId}/active`);
    return this.http.get<any[]>(`${this.baseUrl}/delivery/restaurant/${restaurantId}/active`);
  }

  getDeliveryStats(restaurantId: string): Observable<any> {
    console.log('[ApiService] GET', `${this.baseUrl}/delivery/restaurant/${restaurantId}/stats`);
    return this.http.get<any>(`${this.baseUrl}/delivery/restaurant/${restaurantId}/stats`);
  }

  registerDeliveryPerson(data: { name: string; email: string; password: string; phone?: string }): Observable<any> {
    const payload = { ...data, role: 'delivery' };
    console.log('[ApiService] POST', `${this.baseUrl}/auth/signup`, payload);
    return this.http.post(`${this.baseUrl}/auth/signup`, payload);
  }

  // Real-time updates (WebSocket or polling)
  getRealTimeUpdates(restaurantId: string): Observable<any> {
    console.log('[ApiService] GET', `${this.baseUrl}/restaurants/${restaurantId}/realtime`);
    return this.http.get(`${this.baseUrl}/restaurants/${restaurantId}/realtime`);
  }
} 