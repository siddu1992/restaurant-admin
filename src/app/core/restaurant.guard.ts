import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RestaurantContextService } from './restaurant-context.service';

/** Requires a selected restaurant context for restaurant-scoped pages. */
export const restaurantSelectedGuard: CanActivateFn = () => {
  const restaurantContext = inject(RestaurantContextService);
  const router = inject(Router);

  if (restaurantContext.restaurantId) {
    return true;
  }

  return router.createUrlTree(['/restaurants']);
};
