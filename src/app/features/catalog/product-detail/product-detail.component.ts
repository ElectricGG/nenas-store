import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService, Product } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { CartAnimationService } from '../../../core/services/cart-animation.service';
import { ProductCardComponent } from '../components/product-card/product-card.component';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { WhatsappFormatPipe } from '../../../shared/pipes/whatsapp-format.pipe';

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, DialogModule, ProductCardComponent, WhatsappFormatPipe],
    template: `
    <div class="container mx-auto px-4 py-8">

        <!-- Back link + compartir -->
        <div class="flex items-center justify-between gap-4 mb-6">
            <a routerLink="/" class="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-palo-rosa transition-colors group">
                <i class="pi pi-arrow-left text-xs group-hover:-translate-x-1 transition-transform"></i>
                Volver al catálogo
            </a>

            <button *ngIf="product()" (click)="compartir()"
                    class="inline-flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-palo-rosa hover:text-palo-rosa shadow-sm transition-all shrink-0"
                    [class.!border-green-200]="copiado"
                    [class.!text-green-600]="copiado">
                <i class="pi text-xs" [class.pi-share-alt]="!copiado" [class.pi-check]="copiado"></i>
                {{ copiado ? 'Link copiado' : 'Compartir' }}
            </button>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="flex flex-col items-center justify-center py-32">
            <i class="pi pi-spin pi-spinner text-4xl text-palo-rosa mb-4"></i>
            <p class="text-gray-400">Cargando producto...</p>
        </div>

        <!-- Not found -->
        <div *ngIf="!loading() && !product()" class="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <i class="pi pi-search-minus text-4xl text-gray-300 mb-4"></i>
            <p class="text-gray-500 text-lg font-medium">No encontramos este producto.</p>
            <a routerLink="/" class="mt-4 px-6 py-2 bg-white border border-gray-200 rounded-full text-palo-rosa font-bold shadow-sm hover:shadow hover:border-palo-rosa transition-all">Ver el catálogo</a>
        </div>

        <ng-container *ngIf="!loading() && product() as p">
            <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-8 lg:gap-10">

                <!-- Gallery -->
                <div class="space-y-3 w-full max-w-[340px] mx-auto lg:mx-0">
                    <div class="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 border border-pink-50 shadow-sm cursor-zoom-in group/image"
                         (click)="showPreview()"
                         (touchstart)="onCarouselTouchStart($event)"
                         (touchend)="onCarouselTouchEnd($event)">
                        <img #detailImage [src]="currentImage" class="w-full h-full object-cover" alt="{{p.name}}">

                        <ng-container *ngIf="p.images && p.images.length > 1">
                            <button (click)="prevImage($event)" class="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full w-9 h-9 flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover/image:opacity-100 transition-all duration-300 shadow-sm z-10 hover:scale-110">
                                <i class="pi pi-chevron-left text-sm font-bold"></i>
                            </button>
                            <button (click)="nextImage($event)" class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full w-9 h-9 flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover/image:opacity-100 transition-all duration-300 shadow-sm z-10 hover:scale-110">
                                <i class="pi pi-chevron-right text-sm font-bold"></i>
                            </button>
                        </ng-container>

                        <div *ngIf="!hasStock" class="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px] z-20 pointer-events-none">
                            <span class="bg-gray-800 text-white text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">Sin Stock</span>
                        </div>
                    </div>

                    <!-- Thumbnails -->
                    <div *ngIf="p.images && p.images.length > 1" class="flex gap-2 flex-wrap">
                        <button *ngFor="let img of p.images; let i = index"
                                (click)="currentImageIndex = i"
                                class="w-16 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0"
                                [class.border-palo-rosa]="i === currentImageIndex"
                                [class.border-transparent]="i !== currentImageIndex"
                                [class.opacity-60]="i !== currentImageIndex">
                            <img [src]="img" class="w-full h-full object-cover" alt="{{p.name}} {{i + 1}}">
                        </button>
                    </div>
                </div>

                <!-- Info -->
                <div class="flex flex-col">
                    <span class="inline-block self-start py-1 px-3 rounded-full bg-[#fdf2f4] text-palo-rosa text-xs font-bold tracking-wider mb-3">{{p.category | uppercase}}</span>

                    <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 font-serif leading-tight">{{p.name}}</h1>

                    <p class="text-2xl font-bold text-palo-rosa mb-5">S/. {{p.price | number:'1.2-2'}}</p>

                    <div class="mb-6">
                        <h2 class="font-bold mb-2 text-xs text-gray-400 uppercase tracking-widest">Descripción</h2>
                        <p *ngIf="p.description; else sinDescripcion"
                           class="text-gray-600 leading-relaxed whitespace-pre-line"
                           [innerHTML]="p.description | whatsappFormat"></p>
                        <ng-template #sinDescripcion>
                            <p class="text-gray-400 leading-relaxed">Sin descripción disponible.</p>
                        </ng-template>
                    </div>

                    <div class="flex items-center gap-2 mb-6 text-sm font-medium" [class.text-green-600]="hasStock" [class.text-gray-400]="!hasStock">
                        <i class="pi" [class.pi-check-circle]="hasStock" [class.pi-times-circle]="!hasStock"></i>
                        <span>{{hasStock ? 'Disponible' : 'Agotado'}}</span>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 mt-auto">
                        <!-- Accion principal: sumar al carrito -->
                        <button pButton
                            [disabled]="!hasStock"
                            class="flex-1 !bg-palo-rosa !border-palo-rosa hover:!bg-pink-600 !rounded-xl !font-bold !shadow-md hover:!shadow-lg !shadow-pink-100 transition-all !py-3 disabled:opacity-50 disabled:bg-gray-400 disabled:border-gray-400 disabled:shadow-none"
                            (click)="addToCart()">
                            <i class="pi mr-2" [class.pi-shopping-cart]="!isAdding" [class.pi-check]="isAdding"></i>
                            {{ hasStock ? (isAdding ? 'Agregado al carrito' : 'Agregar al carrito') : 'Agotado' }}
                        </button>

                        <!-- Secundaria: comprar solo este producto -->
                        <button pButton
                            label="Comprar solo este"
                            icon="pi pi-whatsapp"
                            [disabled]="!hasStock"
                            class="!bg-white !text-green-600 !border-gray-200 hover:!bg-green-50 hover:!border-green-200 !rounded-xl !font-bold !shadow-sm transition-all !py-3 sm:!w-56 disabled:opacity-50 disabled:cursor-not-allowed"
                            (click)="buyNow()"></button>
                    </div>

                    <p *ngIf="hasStock" class="text-xs text-gray-400 mt-3">
                        Puedes juntar varios productos en el carrito y pedirlos todos en un solo mensaje.
                    </p>
                </div>
            </div>

            <!-- Related -->
            <div *ngIf="related().length > 0" class="mt-12">
                <div class="flex justify-between items-center gap-4 mb-6">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 font-serif leading-tight">También te puede gustar</h2>

                    <div class="flex items-center gap-2 shrink-0">
                        <button (click)="scrollRelated(-1)" [disabled]="!canScrollPrev"
                            aria-label="Anterior"
                            class="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-700 flex items-center justify-center shadow-sm transition-all hover:border-palo-rosa hover:text-palo-rosa disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-700">
                            <i class="pi pi-chevron-left text-xs font-bold"></i>
                        </button>
                        <button (click)="scrollRelated(1)" [disabled]="!canScrollNext"
                            aria-label="Siguiente"
                            class="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-700 flex items-center justify-center shadow-sm transition-all hover:border-palo-rosa hover:text-palo-rosa disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-700">
                            <i class="pi pi-chevron-right text-xs font-bold"></i>
                        </button>
                    </div>
                </div>

                <div #relatedTrack (scroll)="onRelatedScroll()"
                     class="related-track flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2">
                    <div *ngFor="let r of related()" class="snap-start shrink-0 w-[42%] sm:w-[31%] md:w-[23%] lg:w-[19%]">
                        <app-product-card [product]="r"></app-product-card>
                    </div>
                </div>
            </div>
        </ng-container>
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
                 alt="{{product()?.name}}">

            <ng-container *ngIf="product()?.images && product()!.images.length > 1">
                <button (click)="prevImage($event)" class="absolute left-1 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center transition-all shadow-lg hover:scale-110 focus:outline-none z-50">
                    <i class="pi pi-chevron-left text-base font-bold"></i>
                </button>
                <button (click)="nextImage($event)" class="absolute right-1 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center transition-all shadow-lg hover:scale-110 focus:outline-none z-50">
                    <i class="pi pi-chevron-right text-base font-bold"></i>
                </button>
            </ng-container>
        </div>
    </p-dialog>
  `,
    styles: [`
    /* Native horizontal scroll on touch, without the scrollbar showing */
    .related-track {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .related-track::-webkit-scrollbar {
      display: none;
    }
  `]
})
export class ProductDetailComponent {
    private route = inject(ActivatedRoute);
    private productService = inject(ProductService);
    cartService = inject(CartService);
    cartAnimationService = inject(CartAnimationService);
    analyticsService = inject(AnalyticsService);

    @ViewChild('detailImage') detailImage!: ElementRef;
    @ViewChild('relatedTrack') relatedTrack?: ElementRef<HTMLDivElement>;

    product = signal<Product | null>(null);
    related = signal<Product[]>([]);
    loading = signal(true);

    canScrollPrev = false;
    canScrollNext = false;

    isAdding = false;
    copiado = false;
    displayPreview = false;
    isZoomed = false;
    zoomOrigin = '50% 50%';
    currentImageIndex = 0;

    constructor() {
        // paramMap emits again when navigating between related products (the component is reused)
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) this.load(id);
        });
    }

    private load(id: string) {
        this.loading.set(true);
        this.product.set(null);
        this.related.set([]);
        this.currentImageIndex = 0;
        this.displayPreview = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        this.productService.getProductDetail(id).subscribe({
            next: (p) => {
                this.product.set(p);
                this.loading.set(false);
                if (p) this.loadRelated(p);
            },
            error: () => {
                this.product.set(null);
                this.loading.set(false);
            }
        });
    }

    private loadRelated(current: Product) {
        this.productService.getProducts().subscribe({
            next: (all) => {
                // The whole category, minus this product. The list already comes
                // ordered by created_at desc, so the newest show up first.
                this.related.set(
                    all.filter(p => p.id !== current.id && p.category === current.category)
                );
                // Let the track render before measuring it for the arrows
                setTimeout(() => this.onRelatedScroll(), 0);
            },
            error: () => this.related.set([])
        });
    }

    scrollRelated(direction: -1 | 1) {
        const track = this.relatedTrack?.nativeElement;
        if (!track) return;

        // Roughly one screenful at a time, whatever the breakpoint
        track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: 'smooth' });
    }

    onRelatedScroll() {
        const track = this.relatedTrack?.nativeElement;
        if (!track) {
            this.canScrollPrev = false;
            this.canScrollNext = false;
            return;
        }

        const tolerance = 8; // sub-pixel scroll positions never land exactly on the edge
        this.canScrollPrev = track.scrollLeft > tolerance;
        this.canScrollNext = track.scrollLeft + track.clientWidth < track.scrollWidth - tolerance;
    }

    get currentImage(): string {
        const p = this.product();
        if (!p) return '';
        if (p.images && p.images.length > 0) {
            return p.images[this.currentImageIndex];
        }
        return p.image;
    }

    get hasStock(): boolean {
        const p = this.product();
        if (!p) return false;
        if (!p.product_variants || p.product_variants.length === 0) return true;
        return p.product_variants.some(v => v.stock > 0);
    }

    addToCart() {
        const p = this.product();
        if (!p || !this.hasStock) return;

        if (this.detailImage) {
            this.cartAnimationService.animateFlyToCart(this.detailImage.nativeElement, p.image);
        }

        this.cartService.addToCart(p);

        this.isAdding = true;
        setTimeout(() => {
            this.isAdding = false;
        }, 1500);
    }

    buyNow() {
        const p = this.product();
        if (!p || !this.hasStock) return;

        this.analyticsService.logPurchaseClick(p);
        this.cartService.checkoutSingleItem(p);
    }

    // En celular abre el menu nativo (WhatsApp, Instagram...); en escritorio copia el link
    async compartir() {
        const p = this.product();
        if (!p) return;

        const url = window.location.href;
        const texto = `${p.name} — S/. ${p.price.toFixed(2)} en Nena's Store`;

        try {
            if (navigator.share) {
                await navigator.share({ title: p.name, text: texto, url });
                return;
            }

            await navigator.clipboard.writeText(url);
            this.copiado = true;
            setTimeout(() => this.copiado = false, 2000);
        } catch {
            // Cancelar el dialogo de compartir no es un error
        }
    }

    showPreview() {
        if (this.suppressPreview) return;
        this.displayPreview = true;
        this.isZoomed = false;
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
        const p = this.product();
        if (p?.images && p.images.length > 0) {
            this.currentImageIndex = (this.currentImageIndex + 1) % p.images.length;
            this.isZoomed = false;
        }
    }

    prevImage(event?: Event) {
        if (event) event.stopPropagation();
        const p = this.product();
        if (p?.images && p.images.length > 0) {
            this.currentImageIndex = (this.currentImageIndex - 1 + p.images.length) % p.images.length;
            this.isZoomed = false;
        }
    }

    // Swipe support for the gallery
    private touchStartX = 0;
    private touchEndX = 0;
    private suppressPreview = false;

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

        if (this.touchEndX < this.touchStartX - swipeThreshold) this.nextImage();
        if (this.touchEndX > this.touchStartX + swipeThreshold) this.prevImage();

        // A swipe also fires a click right after touchend; don't open the preview then
        if (swiped) {
            this.suppressPreview = true;
            setTimeout(() => this.suppressPreview = false, 400);
        }
    }
}
