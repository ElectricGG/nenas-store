import { Component, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { DrawerModule } from 'primeng/drawer';
import { CartSidebarComponent } from '../../../features/cart/cart-sidebar/cart-sidebar.component';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ButtonModule, BadgeModule, DrawerModule, CartSidebarComponent, RouterModule],
  template: `
    <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-pink-50 h-[72px] flex items-center justify-between px-4 lg:px-8 transition-all duration-300">
      <div class="flex items-center gap-4">
        <a routerLink="/" class="flex items-center gap-3 group text-3xl font-bold text-palo-rosa font-serif tracking-tight hover:opacity-90 transition-opacity">
          <img src="logo.jpeg" alt="Nenas Store" class="h-12 w-12 rounded-full object-cover shadow-sm border-2 border-white group-hover:border-pink-50 transition-colors">
          <span>Nena's Store</span>
        </a>
      </div>
      
      <div class="flex items-center gap-6">
         <nav class="hidden md:flex items-center gap-6">
            <a routerLink="/" class="text-gray-600 hover:text-palo-rosa font-medium transition text-sm uppercase tracking-wide">Inicio</a>
            <!-- Catalog Link scrolls to catalog or navigates -->
         </nav>
         
         <div class="w-px h-6 bg-gray-200 hidden md:block"></div>

         <button id="cart-icon-target" (click)="displayCart = true" 
            [class.animate-bounce-custom]="animateCart()"
            class="relative group p-2 hover:bg-pink-50 rounded-full transition-colors cursor-pointer border border-transparent hover:border-pink-100">
            <i class="pi pi-shopping-bag text-2xl text-gray-700 group-hover:text-palo-rosa transition-colors"></i>
            <span *ngIf="cartService.count() > 0" class="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white transform translate-x-1 -translate-y-1 shadow-sm">{{cartService.count()}}</span>
         </button>
      </div>
    </header>
    
    <p-drawer [(visible)]="displayCart" position="right" styleClass="!w-full !max-w-[400px]">
        <ng-template pTemplate="header">
            <span class="text-xl font-bold text-gray-800 font-serif">Tu Carrito</span>
        </ng-template>
        <app-cart-sidebar (close)="displayCart = false"></app-cart-sidebar>
    </p-drawer>
  `,
  styles: [`
    @keyframes bounce-custom {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.3); }
    }
    .animate-bounce-custom {
      animation: bounce-custom 0.3s ease-in-out;
    }
  `]
})
export class HeaderComponent {
  cartService = inject(CartService);
  displayCart = false;
  animateCart = signal(false);

  constructor() {
    effect(() => {
      const count = this.cartService.count();
      if (count > 0) {
        this.animateCart.set(true);
        setTimeout(() => this.animateCart.set(false), 300);
      }
    });
  }
}
