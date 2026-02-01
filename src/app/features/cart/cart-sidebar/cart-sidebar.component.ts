import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';

@Component({
    selector: 'app-cart-sidebar',
    standalone: true,
    imports: [CommonModule, ButtonModule, ImageModule],
    template: `
    <div class="flex flex-col h-full">
        <div class="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div *ngIf="cartService.cartItems().length === 0" class="text-center py-10 text-gray-500">
                <i class="pi pi-shopping-cart text-4xl mb-3 opacity-50"></i>
                <p>Tu carrito está vacío.</p>
                <p class="text-sm mt-2 text-palo-rosa cursor-pointer hover:underline" (click)="close.emit()">Ir a comprar</p>
            </div>
            
            <div *ngFor="let item of cartService.cartItems()" class="group flex gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-pink-100 transition-all">
                <div class="w-20 h-24 rounded-lg overflow-hidden bg-gray-50 shrink-0 relative">
                    <img [src]="item.product.image" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="{{item.product.name}}">
                </div>
                <div class="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                        <h4 class="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{{item.product.name}}</h4>
                        <p class="text-xs text-gray-500 mt-1">Color: {{item.selectedColor}} • Talla: {{item.selectedSize}}</p>
                    </div>
                    <div class="flex items-center justify-between mt-2">
                        <span class="font-bold text-palo-rosa">S/. {{(item.product.price * item.quantity) | number:'1.2-2'}}</span>
                        <div class="flex items-center gap-3">
                             <div class="flex items-center gap-2 text-xs font-medium bg-gray-50 rounded-md px-2 py-1">
                                <span>x{{item.quantity}}</span>
                             </div>
                            <button (click)="cartService.removeFromCart(item)" class="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><i class="pi pi-trash text-sm"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="border-t border-gray-100 pt-6 mt-auto bg-white">
            <div class="flex justify-between items-baseline mb-2">
                <span class="text-sm font-medium text-gray-500">Subtotal</span>
                <span class="text-lg font-semibold text-gray-900">S/. {{cartService.total() | number:'1.2-2'}}</span>
            </div>
             <div class="flex justify-between items-baseline mb-6">
                <span class="text-lg font-bold text-gray-800">Total</span>
                <span class="text-2xl font-bold text-palo-rosa">S/. {{cartService.total() | number:'1.2-2'}}</span>
            </div>
            <button pButton label="Comprar por WhatsApp" icon="pi pi-whatsapp" class="w-full p-button-success !rounded-xl !py-3 !text-lg !font-bold shadow-lg shadow-green-100 hover:shadow-green-200 hover:-translate-y-0.5 transition-all" (click)="cartService.checkout()"></button>
             <p class="text-xs text-center text-gray-400 mt-3 font-light">Serás redirigido a WhatsApp para coordinar pago</p>
        </div>
    </div>
  `
})
export class CartSidebarComponent {
    cartService = inject(CartService);
    @Output() close = new EventEmitter<void>();
}
