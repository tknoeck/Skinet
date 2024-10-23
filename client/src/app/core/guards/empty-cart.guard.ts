import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SnackbarService } from '../services/snackbar.service';
import { CartService } from '../services/cart.service';
import { of } from 'rxjs';

export const emptyCartGuard: CanActivateFn = (route, state) => {
  const snack = inject(SnackbarService);
  const cartService = inject(CartService);
  const router = inject(Router);

  if(!cartService.cart() || cartService.cart()?.items.length === 0){
    snack.error('Must have an item in your cart before proceeding to checkout');
    router.navigateByUrl('/cart');
    return false;
  }
  return true;
};
