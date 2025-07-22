import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup.page').then((m) => m.SignupPage),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'food-management',
    loadComponent: () => import('./pages/food-management/food-management.page').then((m) => m.FoodManagementPage),
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders.page').then((m) => m.OrdersPage),
  },
  {
    path: 'restaurant-profile',
    loadComponent: () => import('./pages/restaurant-profile/restaurant-profile.page').then((m) => m.RestaurantProfilePage),
  },
  {
    path: 'analytics',
    loadComponent: () => import('./pages/analytics/analytics.page').then((m) => m.AnalyticsPage),
  },
  {
    path: 'add-restaurant',
    loadComponent: () => import('./pages/add-restaurant/add-restaurant.page').then((m) => m.AddRestaurantPage),
  },
  {
    path: 'restaurants-list',
    loadComponent: () => import('./pages/restaurants-list/restaurants-list.page').then(m => m.RestaurantsListPage),
  },
  {
    path: 'add-food',
    loadComponent: () => import('./pages/add-food/add-food.page').then((m) => m.AddFoodPage),
  },
  {
    path: 'edit-food/:id',
    loadComponent: () => import('./pages/edit-food/edit-food.page').then(m => m.EditFoodPage)
  },
];
