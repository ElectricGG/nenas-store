
import { Component, Input, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { ButtonModule } from 'primeng/button';
import { CartAnimationService } from '../../../../core/services/cart-animation.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-product-card',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
    <div class="bg-white rounded-xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 group border border-transparent hover:border-pink-100 flex flex-col h-full relative overflow-hidden">
      <!-- Image -->
      <div class="relative aspect-[3/4] rounded-lg overflow-hidden mb-3 bg-gray-50 cursor-pointer group/image" (click)="goToDetail()" (touchstart)="onCarouselTouchStart($event)" (touchend)="onCarouselTouchEnd($event)">
        <img #productImage [src]="currentImage" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="{{product.name}}" loading="lazy">
        <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <!-- Navigation Arrows (always visible on mobile, hover on desktop) -->
        <ng-container *ngIf="product.images && product.images.length > 1">
            <button (click)="prevImage($event)" class="absolute left-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full w-6 h-6 flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover/image:opacity-100 transition-all duration-300 shadow-sm z-10 hover:scale-110">
                <i class="pi pi-chevron-left text-[10px] font-bold"></i>
            </button>
            <button (click)="nextImage($event)" class="absolute right-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full w-6 h-6 flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover/image:opacity-100 transition-all duration-300 shadow-sm z-10 hover:scale-110">
                <i class="pi pi-chevron-right text-[10px] font-bold"></i>
            </button>
            <!-- Dots Indicator -->
             <div class="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none">
                <div *ngFor="let img of product.images; let i = index" class="w-1 h-1 rounded-full transition-colors duration-300 shadow-sm" [class.bg-white]="i === currentImageIndex" [class.bg-white/50]="i !== currentImageIndex"></div>
            </div>
        </ng-container>

        <!-- Out of Stock Badge -->
        <div *ngIf="!hasStock" class="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px] z-20 pointer-events-none">
            <span class="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Sin Stock</span>
        </div>
      </div>
      
      <!-- Content -->
      <div class="flex-1 flex flex-col">
        <div class="flex justify-between items-start mb-1">
            <h3 class="text-sm font-bold text-gray-800 leading-tight line-clamp-1 cursor-pointer hover:text-palo-rosa transition-colors" title="{{product.name}}" (click)="goToDetail()">{{product.name}}</h3>
        </div>
        <p class="text-lg font-bold text-palo-rosa mb-2">S/. {{product.price | number:'1.2-2'}}</p>
        
        <div class="mt-auto space-y-3">
             <div class="flex gap-2">
                <!-- Accion principal: sumar al carrito, para que el pedido junte varios productos -->
                <button pButton
                    [label]="hasStock ? (isAdding ? 'Agregado' : 'Agregar') : 'Agotado'"
                    [icon]="isAdding ? 'pi pi-check' : 'pi pi-shopping-cart'"
                    [disabled]="!hasStock"
                    class="flex-1 !bg-palo-rosa !border-palo-rosa hover:!bg-pink-600 !rounded-lg !text-xs !font-bold !shadow-md hover:!shadow-lg !shadow-pink-100 transition-all h-9 disabled:opacity-50 disabled:bg-gray-400 disabled:border-gray-400 disabled:shadow-none"
                    (click)="addToCart()"></button>

                <!-- Secundaria: comprar solo este producto por WhatsApp -->
                <button pButton
                    [disabled]="!hasStock"
                    title="Comprar solo este por WhatsApp"
                    aria-label="Comprar solo este por WhatsApp"
                    class="!bg-white !text-green-600 !border-gray-200 hover:!bg-green-50 hover:!border-green-200 !rounded-lg !w-9 !h-9 !shrink-0 !shadow-sm transition-all !p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    (click)="buyNow()">
                    <i class="pi pi-whatsapp text-sm"></i>
                </button>
             </div>
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent {
    @Input({ required: true }) product!: Product;
    @ViewChild('productImage') productImage!: ElementRef;

    cartService = inject(CartService);
    cartAnimationService = inject(CartAnimationService);
    analyticsService = inject(AnalyticsService);
    private router = inject(Router);

    isAdding = false;
    currentImageIndex = 0;

    get currentImage(): string {
        if (this.product.images && this.product.images.length > 0) {
            return this.product.images[this.currentImageIndex];
        }
        return this.product.image;
    }

    get hasStock(): boolean {
        // If product has no variants (e.g. unique item?), assume in stock or check global stock prop if added later
        if (!this.product.product_variants || this.product.product_variants.length === 0) return true;

        // Variants are stock-only from the storefront: available if any of them has stock
        return this.product.product_variants.some(v => v.stock > 0);
    }

    addToCart() {
        if (!this.hasStock) return;

        if (this.productImage) {
            this.cartAnimationService.animateFlyToCart(this.productImage.nativeElement, this.product.image);
        }

        this.cartService.addToCart(this.product);

        this.isAdding = true;
        setTimeout(() => {
            this.isAdding = false;
        }, 1500);
    }

    buyNow() {
        if (!this.hasStock) return;

        this.analyticsService.logPurchaseClick(this.product);

        this.cartService.checkoutSingleItem(this.product);
    }

    goToDetail() {
        if (this.suppressNavigation) return;
        this.router.navigate(['/producto', this.product.id]);
    }

    nextImage(event?: Event) {
        if (event) event.stopPropagation();
        if (this.product.images && this.product.images.length > 0) {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.product.images.length;
        }
    }

    prevImage(event?: Event) {
        if (event) event.stopPropagation();
        if (this.product.images && this.product.images.length > 0) {
            this.currentImageIndex = (this.currentImageIndex - 1 + this.product.images.length) % this.product.images.length;
        }
    }

    // Swipe support for Carousel
    private touchStartX = 0;
    private touchEndX = 0;
    private suppressNavigation = false;

    onCarouselTouchStart(event: TouchEvent) {
        this.touchStartX = event.changedTouches[0].screenX;
    }

    onCarouselTouchEnd(event: TouchEvent) {
        this.touchEndX = event.changedTouches[0].screenX;
        this.handleCarouselSwipe();
    }

    private handleCarouselSwipe() {
        const swipeThreshold = 50;
        const swiped = Math.abs(this.touchEndX - this.touchStartX) > swipeThreshold;

        if (this.touchEndX < this.touchStartX - swipeThreshold) {
            this.nextImage();
        }
        if (this.touchEndX > this.touchStartX + swipeThreshold) {
            this.prevImage();
        }

        // A swipe also fires a click right after touchend; don't navigate then
        if (swiped) {
            this.suppressNavigation = true;
            setTimeout(() => this.suppressNavigation = false, 400);
        }
    }
}
