import { Component, inject, OnInit, signal } from '@angular/core';
import { OrderSummaryComponent } from "../../shared/components/order-summary/order-summary.component";
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { EventType, Router, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { StripeService } from '../../core/services/stripe.service';
import { ConfirmationToken, StripeAddressElement, StripeAddressElementChangeEvent, StripeElementChangeEvent, StripePaymentElement, StripePaymentElementChangeEvent } from '@stripe/stripe-js';
import { SnackbarService } from '../../core/services/snackbar.service';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Address } from '../../shared/models/user';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '../../core/services/account.service';
import { CheckoutDeliveryComponent } from "./checkout-delivery/checkout-delivery.component";
import { CheckoutReviewComponent } from "./checkout-review/checkout-review.component";
import { CartService } from '../../core/services/cart.service';
import { CurrencyPipe, JsonPipe } from '@angular/common';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    OrderSummaryComponent,
    MatStepperModule,
    MatButton,
    RouterLink,
    MatCheckboxModule,
    CheckoutDeliveryComponent,
    CheckoutReviewComponent,
    CurrencyPipe,
    JsonPipe,
    MatProgressSpinnerModule
],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  private snackbar = inject(SnackbarService);
  private stripeService = inject(StripeService);
  private accountService = inject(AccountService);
  private router = inject(Router);

  cartService = inject(CartService);
  addressElement?: StripeAddressElement;
  paymentElement?: StripePaymentElement;
  saveAddress = false;
  completionStatus = signal<{address: boolean, card: boolean, delivery: boolean}>(
    {address: false, card: false, delivery: false}
  )
  confirmationToken?: ConfirmationToken;
  loading: boolean = false;

  async ngOnInit() {
    try{
      this.addressElement = await this.stripeService.createAddressElement();
      this.addressElement.mount('#address-element');
      this.addressElement.on('change' , this.handleAddressChange as unknown as (event: StripeAddressElementChangeEvent) => any);

      this.paymentElement = await this.stripeService.createPaymentElement();
      this.paymentElement.mount('#payment-element');
      this.paymentElement.on('change', this.handlePaymentChange as unknown as (event: StripePaymentElementChangeEvent) => any);
    } catch(error: any){
      this.snackbar.error(error.message);
    }
  }

  handleAddressChange = (event: StripeElementChangeEvent) => {
    this.completionStatus.update(state =>{
      state.address = event.complete;
      return state;
    })
  }

  handlePaymentChange = (event: StripeElementChangeEvent) => {
    this.completionStatus.update(state =>{
      state.card = event.complete;
      return state;
    })
  }

  handleDeliveryChange(event: boolean){
    this.completionStatus.update(state => {
      state.delivery = event;
      return state;
    })
  }

  private async getAddressFromStripeAddress(): Promise<Address | null>{
    const result = await this.addressElement?.getValue();
    const address = result?.value.address;

    if(address){
      return {
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city,
        country: address.country,
        postalCode: address.postal_code,
        state: address.state
      }
    }
    else return null;
  }

  async getConfirmationToken(){
    try{
      if(Object.values(this.completionStatus()).every(status => status === true)){
        const result = await this.stripeService.createConfirmationToken();
        if(result.error) throw new Error(result.error.message);
        this.confirmationToken = result.confirmationToken;
        console.log(this.confirmationToken);
      }
    } catch (error: any){
      this.snackbar.error(error.message);
    }
    
  }
  async onStepChange(event: StepperSelectionEvent){
    if(event.selectedIndex === 1) {
      if(this.saveAddress){
        const address = await this.getAddressFromStripeAddress();
        address && firstValueFrom(this.accountService.updateAddress(address));
      }
    }
    if(event.selectedIndex === 2){
      await firstValueFrom(this.stripeService.createOrUpdatePaymentIntent());
    }
    if (event.selectedIndex === 3){
      await this.getConfirmationToken();
    }
  }

  async confirmPayment(stepper: MatStepper) {
    this.loading = true;
    try {
      if(this.confirmationToken){
        const result = await this.stripeService.confirmPayment(this.confirmationToken);
        if(result.error) throw new Error(result.error.message);
        else{
          this.cartService.deleteCart();
          this.cartService.selectedDelivery.set(null);
          this.router.navigateByUrl('/checkout/success');
        }
      }
    } catch(error: any){
      this.snackbar.error(error.message || "Something went wrong!!!");
      stepper.previous();
    } finally{
      this.loading = false;
    }
  }

  onSaveAddressCheckboxChanged(event: MatCheckboxChange){
    this.saveAddress = event.checked;
  }

  ngOnDestroy(): void {
    this.stripeService.disposeElements();
  }
}


