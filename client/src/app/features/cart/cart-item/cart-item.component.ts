import { Component, input, inject } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { CartItem } from '../../../shared/models/cart';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [
    RouterLink,
    MatButton,
    MatIcon,
    CurrencyPipe
  ],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.scss'
})
export class CartItemComponent {
  item = input.required<CartItem>();
  cartService = inject(CartService);

  incrementQuantity() {
    this.cartService.addItemToCart(this.item());
  }

  decrementQuantity() {
    this.cartService.removeItemFromCart(this.item().productId);
  }
  removeItemFromCart(){
    this.cartService.removeItemFromCart(this.item().productId, this.item().quantity);
  }
}