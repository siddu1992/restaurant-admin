import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  AuthResponse,
  CreateFoodRequest,
  CreateRestaurantRequest,
  DashboardOverview,
  DashboardSales,
  DashboardStats,
  DeliveryPerson,
  DeliveryStats,
  Food,
  GoogleLoginRequest,
  LoginRequest,
  Order,
  OrderAnalytics,
  OrderSearchParams,
  OrderSearchResponse,
  OwnerSignupRequest,
  Restaurant,
  SalesPeriod,
  UpdateFoodRequest,
  UpdateRestaurantRequest,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl || environment.baseUrl;

  constructor(private readonly http: HttpClient) {}

  // Authentication
  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, loginData);
  }

  signup(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/signup`, data);
  }

  googleLogin(googleData: GoogleLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/google-login`, googleData);
  }

  restaurantOwnerSignup(
    signupData: OwnerSignupRequest,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/auth/restaurant-owner/signup`,
      signupData,
    );
  }

  /** @deprecated Use restaurantOwnerSignup */
  ownerSignup(signupData: OwnerSignupRequest): Observable<{ message: string }> {
    return this.restaurantOwnerSignup(signupData);
  }

  getProfile(): Observable<AuthResponse['user']> {
    return this.http.get<AuthResponse['user']>(`${this.baseUrl}/auth/profile`);
  }

  // Restaurant Management
  getRestaurant(restaurantId: string): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.baseUrl}/restaurants/${restaurantId}`);
  }

  updateRestaurant(
    restaurantId: string,
    data: UpdateRestaurantRequest,
  ): Observable<Restaurant> {
    return this.http.put<Restaurant>(`${this.baseUrl}/restaurants/${restaurantId}`, data);
  }

  createRestaurant(restaurantData: CreateRestaurantRequest): Observable<Restaurant> {
    return this.http.post<Restaurant>(`${this.baseUrl}/restaurants`, restaurantData);
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

  createFood(foodData: CreateFoodRequest): Observable<Food> {
    return this.http.post<Food>(`${this.baseUrl}/foods`, foodData);
  }

  updateFood(foodId: string, foodData: UpdateFoodRequest): Observable<Food> {
    return this.http.put<Food>(`${this.baseUrl}/foods/${foodId}`, foodData);
  }

  deleteFood(foodId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/foods/${foodId}`);
  }

  addFood(foodData: CreateFoodRequest): Observable<Food> {
    return this.createFood(foodData);
  }

  getFoodById(foodId: string): Observable<Food> {
    return this.http.get<Food>(`${this.baseUrl}/foods/${foodId}`);
  }

  // Order Management
  getRestaurantOrders(restaurantId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders/restaurant/${restaurantId}`);
  }

  searchRestaurantOrders(
    restaurantId: string,
    params: OrderSearchParams = {},
  ): Observable<OrderSearchResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    });
    const qs = query.toString();
    return this.http.get<OrderSearchResponse>(
      `${this.baseUrl}/orders/restaurant/${restaurantId}/search${qs ? `?${qs}` : ''}`,
    );
  }

  getOrderById(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${orderId}`);
  }

  getRejectedOrders(restaurantId: string): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.baseUrl}/orders/restaurant/${restaurantId}/rejected`,
    );
  }

  updateOrderStatus(orderId: string, status: string): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/orders/${orderId}/status`, { status });
  }

  cancelOrder(orderId: string): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/orders/${orderId}/cancel`, {});
  }

  reassignDelivery(orderId: string, deliveryPersonId: string): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/orders/${orderId}/reassign-delivery`, {
      deliveryPersonId,
    });
  }

  // Dashboard Analytics
  getDashboardOverview(restaurantId: string): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>(
      `${this.baseUrl}/restaurants/${restaurantId}/dashboard`,
    );
  }

  getDashboardStats(restaurantId: string): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(
      `${this.baseUrl}/restaurants/${restaurantId}/dashboard/stats`,
    );
  }

  getDashboardSales(
    restaurantId: string,
    period: SalesPeriod | string = '7days',
    from?: string,
    to?: string,
  ): Observable<DashboardSales> {
    const params = new URLSearchParams({ period });
    if (from) {
      params.set('from', from);
    }
    if (to) {
      params.set('to', to);
    }
    return this.http.get<DashboardSales>(
      `${this.baseUrl}/restaurants/${restaurantId}/dashboard/sales?${params.toString()}`,
    );
  }

  getOrderAnalytics(
    restaurantId: string,
    period: string = '7days',
  ): Observable<OrderAnalytics> {
    return this.http.get<OrderAnalytics>(
      `${this.baseUrl}/restaurants/${restaurantId}/analytics?period=${period}`,
    );
  }

  getRecentOrders(restaurantId: string, limit: number = 10): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.baseUrl}/orders/restaurant/${restaurantId}/recent?limit=${limit}`,
    );
  }

  getPendingOrders(restaurantId: string): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.baseUrl}/orders/restaurant/${restaurantId}/pending`,
    );
  }

  getRestaurantAnalytics(restaurantId: string): Observable<OrderAnalytics> {
    return this.getOrderAnalytics(restaurantId);
  }

  // Delivery Management
  assignDeliveryPerson(
    deliveryId: string,
    deliveryPersonId: string,
  ): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.baseUrl}/delivery/${deliveryId}/assign`,
      { deliveryPersonId },
    );
  }

  getAllDeliveryPeople(): Observable<DeliveryPerson[]> {
    return this.http.get<DeliveryPerson[]>(`${this.baseUrl}/users?role=delivery`);
  }

  getActiveDeliveries(restaurantId: string): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.baseUrl}/delivery/restaurant/${restaurantId}/active`,
    );
  }

  getDeliveryStats(restaurantId: string): Observable<DeliveryStats> {
    return this.http.get<DeliveryStats>(
      `${this.baseUrl}/delivery/restaurant/${restaurantId}/stats`,
    );
  }

  registerDeliveryPerson(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Observable<{ message: string }> {
    const payload = { ...data, role: 'delivery' };
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/signup`, payload);
  }

  getRealTimeUpdates(restaurantId: string): Observable<{
    recentOrders: number;
    recentDeliveries: number;
  }> {
    return this.http.get<{ recentOrders: number; recentDeliveries: number }>(
      `${this.baseUrl}/restaurants/${restaurantId}/realtime`,
    );
  }
}
