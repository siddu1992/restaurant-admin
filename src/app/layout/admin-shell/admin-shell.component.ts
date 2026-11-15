import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonIcon,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  analyticsOutline,
  bicycleOutline,
  chevronDownOutline,
  chevronForwardOutline,
  gridOutline,
  listOutline,
  logOutOutline,
  menuOutline,
  notificationsOutline,
  personCircleOutline,
  restaurantOutline,
  searchOutline,
  settingsOutline,
  storefrontOutline,
} from 'ionicons/icons';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { RestaurantContextService } from '../../core/restaurant-context.service';
import { AuthUser, Restaurant } from '../../models';
import { ApiService } from '../../services/api.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  requiresRestaurant: boolean;
}

interface BreadcrumbItem {
  label: string;
  path?: string;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IonIcon,
    IonSearchbar,
  ],
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.scss'],
  host: {
    class: 'admin-shell-host',
  },
})
export class AdminShellComponent implements OnInit, OnDestroy {
  sidebarCollapsed = false;
  mobileNavOpen = false;
  profileMenuOpen = false;
  restaurantMenuOpen = false;
  searchQuery = '';

  user: AuthUser | null = null;
  selectedRestaurant: Restaurant | null = null;
  restaurants: Restaurant[] = [];
  breadcrumbs: BreadcrumbItem[] = [];
  pageTitle = 'Dashboard';

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'grid-outline', requiresRestaurant: true },
    { label: 'Orders', path: '/orders', icon: 'list-outline', requiresRestaurant: true },
    { label: 'Menu', path: '/food-management', icon: 'restaurant-outline', requiresRestaurant: true },
    { label: 'Reports', path: '/analytics', icon: 'analytics-outline', requiresRestaurant: true },
    { label: 'Staff', path: '/add-delivery-person', icon: 'bicycle-outline', requiresRestaurant: false },
    { label: 'Restaurants', path: '/restaurants', icon: 'storefront-outline', requiresRestaurant: false },
    { label: 'Settings', path: '/restaurant-profile', icon: 'settings-outline', requiresRestaurant: true },
  ];

  private subs = new Subscription();

  constructor(
    private readonly auth: AuthService,
    private readonly restaurantContext: RestaurantContextService,
    private readonly api: ApiService,
    private readonly router: Router,
  ) {
    addIcons({
      analyticsOutline,
      bicycleOutline,
      chevronDownOutline,
      chevronForwardOutline,
      gridOutline,
      listOutline,
      logOutOutline,
      menuOutline,
      notificationsOutline,
      personCircleOutline,
      restaurantOutline,
      searchOutline,
      settingsOutline,
      storefrontOutline,
    });
  }

  ngOnInit(): void {
    this.subs.add(
      this.auth.user$.subscribe((user) => {
        this.user = user;
        if (user?.id) {
          this.loadRestaurants(user.id);
        }
      }),
    );

    this.subs.add(
      this.restaurantContext.restaurant$.subscribe((restaurant) => {
        this.selectedRestaurant = restaurant;
      }),
    );

    this.subs.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event) => {
          this.updateBreadcrumbs(event.urlAfterRedirects);
          this.mobileNavOpen = false;
          this.profileMenuOpen = false;
          this.restaurantMenuOpen = false;
        }),
    );

    this.updateBreadcrumbs(this.router.url);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get visibleNavItems(): NavItem[] {
    if (this.selectedRestaurant) {
      return this.navItems;
    }
    return this.navItems.filter((item) => !item.requiresRestaurant);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleMobileNav(): void {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
    this.restaurantMenuOpen = false;
  }

  toggleRestaurantMenu(): void {
    this.restaurantMenuOpen = !this.restaurantMenuOpen;
    this.profileMenuOpen = false;
  }

  selectRestaurant(restaurant: Restaurant): void {
    this.restaurantContext.selectRestaurant(restaurant);
    this.restaurantMenuOpen = false;
    void this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.restaurantContext.clear();
    this.auth.logout();
  }

  onSearchSubmit(): void {
    const q = this.searchQuery.trim();
    if (!q) {
      return;
    }
    void this.router.navigate(['/orders'], { queryParams: { q } });
  }

  closeMenus(): void {
    this.profileMenuOpen = false;
    this.restaurantMenuOpen = false;
  }

  private loadRestaurants(ownerId: string): void {
    this.api.getRestaurantByOwner(ownerId).subscribe({
      next: (restaurants) => {
        this.restaurants = restaurants ?? [];
        if (!this.selectedRestaurant && this.restaurants.length === 1) {
          this.restaurantContext.selectRestaurant(this.restaurants[0]);
        }
      },
      error: () => {
        this.restaurants = [];
      },
    });
  }

  private updateBreadcrumbs(url: string): void {
    const path = url.split('?')[0];
    const match = this.navItems.find((item) => path.startsWith(item.path));

    if (path.startsWith('/edit-food')) {
      this.pageTitle = 'Edit Menu Item';
      this.breadcrumbs = [
        { label: 'Menu', path: '/food-management' },
        { label: 'Edit Item' },
      ];
      return;
    }

    if (path.startsWith('/add-food')) {
      this.pageTitle = 'Add Menu Item';
      this.breadcrumbs = [
        { label: 'Menu', path: '/food-management' },
        { label: 'Add Item' },
      ];
      return;
    }

    if (path.startsWith('/add-restaurant')) {
      this.pageTitle = 'Add Restaurant';
      this.breadcrumbs = [
        { label: 'Restaurants', path: '/restaurants' },
        { label: 'Add Restaurant' },
      ];
      return;
    }

    this.pageTitle = match?.label ?? 'Admin';
    this.breadcrumbs = [{ label: 'Home', path: '/restaurants' }, { label: this.pageTitle }];
  }
}
