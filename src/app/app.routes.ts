import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';
import { restaurantSelectedGuard } from './core/restaurant.guard';
import { AdminShellComponent } from './layout/admin-shell/admin-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/signup/signup.page').then((m) => m.SignupPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    component: AdminShellComponent,
    children: [
      {
        path: '',
        redirectTo: 'restaurants',
        pathMatch: 'full',
      },
      {
        path: 'restaurants',
        loadComponent: () =>
          import('./pages/restaurants-list/restaurants-list.page').then(
            (m) => m.RestaurantsListPage,
          ),
      },
      {
        path: 'restaurants-list',
        redirectTo: 'restaurants',
        pathMatch: 'full',
      },
      {
        path: 'add-restaurant',
        loadComponent: () =>
          import('./pages/add-restaurant/add-restaurant.page').then((m) => m.AddRestaurantPage),
      },
      {
        path: 'dashboard',
        canActivate: [restaurantSelectedGuard],
        loadComponent: () =>
          import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'food-management',
        canActivate: [restaurantSelectedGuard],
        loadComponent: () =>
          import('./pages/food-management/food-management.page').then(
            (m) => m.FoodManagementPage,
          ),
      },
      {
        path: 'add-food',
        canActivate: [restaurantSelectedGuard],
        loadComponent: () =>
          import('./pages/add-food/add-food.page').then((m) => m.AddFoodPage),
      },
      {
        path: 'edit-food/:id',
        canActivate: [restaurantSelectedGuard],
        loadComponent: () =>
          import('./pages/edit-food/edit-food.page').then((m) => m.EditFoodPage),
      },
      {
        path: 'orders',
        canActivate: [restaurantSelectedGuard],
        loadComponent: () =>
          import('./pages/orders/orders.page').then((m) => m.OrdersPage),
      },
      {
        path: 'restaurant-profile',
        canActivate: [restaurantSelectedGuard],
        loadComponent: () =>
          import('./pages/restaurant-profile/restaurant-profile.page').then(
            (m) => m.RestaurantProfilePage,
          ),
      },
      {
        path: 'analytics',
        canActivate: [restaurantSelectedGuard],
        loadComponent: () =>
          import('./pages/analytics/analytics.page').then((m) => m.AnalyticsPage),
      },
      {
        path: 'add-delivery-person',
        loadComponent: () =>
          import('./pages/add-delivery-person/add-delivery-person.page').then(
            (m) => m.AddDeliveryPersonPage,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'restaurants',
  },
];
