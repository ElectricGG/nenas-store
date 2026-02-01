import { Component, Input, inject, OnInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { CartAnimationService } from '../../../../core/services/cart-animation.service';

@Component({
    selector: 'app-product-card',
    standalone: true,
    imports: [CommonModule, ButtonModule, FormsModule],
    template: `
    <div class="bg-white rounded-xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 group border border-transparent hover:border-pink-100 flex flex-col h-full relative overflow-hidden">
      <!-- Image -->
      <div class="relative aspect-[3/4] rounded-lg overflow-hidden mb-3 bg-gray-50">
        <img #productImage [src]="product.image" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="{{product.name}}" loading="lazy">
        <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <!-- Out of Stock Badge -->
        <div *ngIf="!hasStock" class="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
            <span class="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Sin Stock</span>
        </div>
      </div>
      
      <!-- Content -->
      <div class="flex-1 flex flex-col">
        <div class="flex justify-between items-start mb-1">
            <h3 class="text-sm font-bold text-gray-800 leading-tight line-clamp-1" title="{{product.name}}">{{product.name}}</h3>
        </div>
        <p class="text-lg font-bold text-palo-rosa mb-2">S/. {{product.price | number:'1.2-2'}}</p>
        
        <div class="mt-auto space-y-3">
             <!-- Selections -->
             <div class="grid grid-cols-2 gap-2" *ngIf="product.sizes.length > 0">
                 <div>
                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-0.5 tracking-wider">Talla</label>
                    <div class="relative">
                        <select [(ngModel)]="selectedSize" (ngModelChange)="onSizeChange()" class="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1 px-2 pr-6 rounded-md leading-tight focus:outline-none focus:bg-white focus:border-palo-rosa text-[11px] transition-colors cursor-pointer h-7">
                            <option *ngFor="let s of product.sizes" [value]="s">{{s}}</option>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-500">
                            <i class="pi pi-chevron-down text-[8px]"></i>
                        </div>
                    </div>
                 </div>
                 <div>
                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-0.5 tracking-wider">Color</label>
                    <div class="relative">
                        <select [(ngModel)]="selectedColor" [disabled]="availableColors.length === 0" class="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1 px-2 pr-6 rounded-md leading-tight focus:outline-none focus:bg-white focus:border-palo-rosa text-[11px] transition-colors cursor-pointer h-7 disabled:opacity-50 disabled:cursor-not-allowed">
                             <option *ngFor="let c of availableColors" [value]="c">{{c}}</option>
                             <option *ngIf="availableColors.length === 0" value="">N/A</option>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-500">
                            <i class="pi pi-chevron-down text-[8px]"></i>
                        </div>
                    </div>
                 </div>
             </div>
      
             <div class="flex gap-2">
                <button pButton 
                    [disabled]="!hasStock"
                    [class.!bg-green-50]="isAdding"
                    [class.!border-green-200]="isAdding"
                    [class.!text-green-600]="isAdding"
                    class="!bg-white !text-gray-700 !border-gray-200 hover:!bg-gray-50 hover:!border-gray-300 !rounded-lg !w-9 !h-9 !shrink-0 !shadow-sm transition-all duration-300 transform !p-0 disabled:opacity-50 disabled:cursor-not-allowed" 
                    [class.scale-110]="isAdding"
                    (click)="addToCart()">
                    <i *ngIf="!isAdding" class="pi pi-shopping-cart text-sm"></i>
                    <i *ngIf="isAdding" class="pi pi-check text-sm font-bold"></i>
                </button>
                <button pButton [label]="hasStock ? 'Comprar' : 'Agotado'" [disabled]="!hasStock" class="flex-1 !bg-palo-rosa !border-palo-rosa hover:!bg-pink-600 !rounded-lg !text-xs !font-bold !shadow-md hover:!shadow-lg !shadow-pink-100 transition-all h-9 disabled:opacity-50 disabled:bg-gray-400 disabled:border-gray-400 disabled:shadow-none" (click)="buyNow()"></button>
             </div>
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent implements OnInit {
    @Input({ required: true }) product!: Product;
    @ViewChild('productImage') productImage!: ElementRef;

    cartService = inject(CartService);
    cartAnimationService = inject(CartAnimationService);

    selectedSize: string = '';
    selectedColor: string = '';

    availableColors: string[] = [];
    isAdding = false;

    get hasStock(): boolean {
        // If product has no variants (e.g. unique item?), assume in stock or check global stock prop if added later
        if (!this.product.product_variants || this.product.product_variants.length === 0) return true;

        const variant = this.product.product_variants.find(v =>
            v.size === this.selectedSize && v.color === this.selectedColor
        );
        return variant ? variant.stock > 0 : false;
    }

    ngOnInit() {
        if (this.product.sizes.length > 0) {
            this.selectedSize = this.product.sizes[0];
            this.updateAvailableColors();
        }
    }

    onSizeChange() {
        this.updateAvailableColors();
    }

    updateAvailableColors() {
        if (!this.product.product_variants) {
            this.availableColors = [];
            return;
        }

        // Get unique colors for the selected size
        const variantsForSize = this.product.product_variants.filter(v => v.size === this.selectedSize);
        this.availableColors = [...new Set(variantsForSize.map(v => v.color))];

        // Auto-select first color, or clear if none
        if (this.availableColors.length > 0) {
            // Try to keep selected color if valid, otherwise pick first
            if (!this.availableColors.includes(this.selectedColor)) {
                this.selectedColor = this.availableColors[0];
            }
        } else {
            this.selectedColor = '';
        }
    }

    addToCart() {
        if (!this.hasStock) return;

        if (this.productImage) {
            this.cartAnimationService.animateFlyToCart(this.productImage.nativeElement, this.product.image);
        }

        this.cartService.addToCart(this.product, this.selectedSize, this.selectedColor);

        this.isAdding = true;
        setTimeout(() => {
            this.isAdding = false;
        }, 1500);
    }

    buyNow() {
        if (!this.hasStock) return;
        this.cartService.checkoutSingleItem(this.product, this.selectedSize, this.selectedColor);
    }
}
