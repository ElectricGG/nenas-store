
import { Component, Input, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CartAnimationService } from '../../../../core/services/cart-animation.service';

@Component({
    selector: 'app-product-card',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule],
    template: `
    <div class="bg-white rounded-xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 group border border-transparent hover:border-pink-100 flex flex-col h-full relative overflow-hidden">
      <!-- Image -->
      <div class="relative aspect-[3/4] rounded-lg overflow-hidden mb-3 bg-gray-50 cursor-pointer group/image" (click)="showPreview()" (touchstart)="onCarouselTouchStart($event)" (touchend)="onCarouselTouchEnd($event)">
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
            <h3 class="text-sm font-bold text-gray-800 leading-tight line-clamp-1" title="{{product.name}}">{{product.name}}</h3>
        </div>
        <p class="text-lg font-bold text-palo-rosa mb-2">S/. {{product.price | number:'1.2-2'}}</p>
        
        <div class="mt-auto space-y-3">
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

    <!-- Image Preview Modal -->
    <p-dialog [(visible)]="displayPreview" [modal]="true" [dismissableMask]="true" [showHeader]="false" styleClass="!bg-transparent !shadow-none" [style]="{width: 'auto', maxWidth: '95vw', maxHeight: '95vh'}" [contentStyle]="{'padding': '0', 'background': 'transparent', 'overflow': 'visible'}" (onHide)="displayPreview = false">
        <div class="relative group flex items-center justify-center overflow-hidden rounded-lg shadow-2xl bg-white" (mousemove)="onMouseMove($event)" (touchmove)="onTouchMove($event)" (click)="toggleZoom($event)">
            <button (click)="$event.stopPropagation(); displayPreview = false" class="absolute top-4 right-4 z-50 bg-white/90 text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-white transition-colors cursor-pointer focus:outline-none backdrop-blur-sm">
                <i class="pi pi-times text-lg"></i>
            </button>
            <img [src]="currentImage" 
                 class="max-w-[90vw] max-h-[85vh] object-contain transition-transform duration-200 ease-out will-change-transform" 
                 [class.cursor-zoom-in]="!isZoomed"
                 [class.cursor-zoom-out]="isZoomed"
                 [style.transform]="isZoomed ? 'scale(2.5)' : 'scale(1)'"
                 [style.transform-origin]="zoomOrigin"
                 alt="{{product.name}}">
            
            <!-- Modal Navigation -->
            <ng-container *ngIf="product.images && product.images.length > 1">
                <button (click)="prevImage($event)" class="absolute left-1 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center transition-all shadow-lg hover:scale-110 focus:outline-none z-50">
                    <i class="pi pi-chevron-left text-base font-bold"></i>
                </button>
                <button (click)="nextImage($event)" class="absolute right-1 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center transition-all shadow-lg hover:scale-110 focus:outline-none z-50">
                    <i class="pi pi-chevron-right text-base font-bold"></i>
                </button>
            </ng-container>
        </div>
    </p-dialog>
  `
})
export class ProductCardComponent {
    @Input({ required: true }) product!: Product;
    @ViewChild('productImage') productImage!: ElementRef;

    cartService = inject(CartService);
    cartAnimationService = inject(CartAnimationService);
    analyticsService = inject(AnalyticsService);

    isAdding = false;
    displayPreview = false;
    isZoomed = false;
    zoomOrigin = '50% 50%';
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

    showPreview() {
        this.displayPreview = true;
        this.isZoomed = false; // Reset zoom on open
    }

    toggleZoom(event: MouseEvent) {
        event.stopPropagation();
        this.isZoomed = !this.isZoomed;
        if (this.isZoomed) {
            this.updateZoomOrigin(event);
        }
    }

    onMouseMove(event: MouseEvent) {
        if (this.isZoomed) {
            this.updateZoomOrigin(event);
        }
    }

    onTouchMove(event: TouchEvent) {
        if (this.isZoomed) {
            // Prevent scrolling on mobile while zooming
            // Note: Simplistic prevention. 
            this.updateZoomOrigin(event);
        }
    }

    private updateZoomOrigin(event: MouseEvent | TouchEvent) {
        const element = event.currentTarget as HTMLElement;
        const rect = element.getBoundingClientRect();

        let clientX, clientY;

        if (window.TouchEvent && event instanceof TouchEvent) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            const mouseEvent = event as MouseEvent;
            clientX = mouseEvent.clientX;
            clientY = mouseEvent.clientY;
        }

        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        this.zoomOrigin = `${x}% ${y}%`;
    }

    nextImage(event?: Event) {
        if (event) event.stopPropagation();
        if (this.product.images && this.product.images.length > 0) {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.product.images.length;
            this.isZoomed = false; // Reset zoom on change
        }
    }

    prevImage(event?: Event) {
        if (event) event.stopPropagation();
        if (this.product.images && this.product.images.length > 0) {
            this.currentImageIndex = (this.currentImageIndex - 1 + this.product.images.length) % this.product.images.length;
            this.isZoomed = false;
        }
    }

    // Swipe support for Carousel
    private touchStartX = 0;
    private touchEndX = 0;

    onCarouselTouchStart(event: TouchEvent) {
        this.touchStartX = event.changedTouches[0].screenX;
    }

    onCarouselTouchEnd(event: TouchEvent) {
        this.touchEndX = event.changedTouches[0].screenX;
        this.handleCarouselSwipe();
    }

    private handleCarouselSwipe() {
        const swipeThreshold = 50;
        if (this.touchEndX < this.touchStartX - swipeThreshold) {
            this.nextImage();
        }
        if (this.touchEndX > this.touchStartX + swipeThreshold) {
            this.prevImage();
        }
    }
}
