import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '../../core/services/product.service';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { FormsModule } from '@angular/forms';
import { SliderModule } from 'primeng/slider';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
    selector: 'app-catalog',
    standalone: true,
    imports: [CommonModule, ProductCardComponent, FormsModule, SliderModule, CheckboxModule],
    template: `
    <div class="container mx-auto px-4 py-8">
        <div class="flex flex-col lg:flex-row gap-8">
            <!-- Sidebar Filters -->
            <aside class="w-full lg:w-72 shrink-0 space-y-6">
                
                <div class="bg-white rounded-2xl shadow-sm border border-pink-50 sticky top-24 overflow-hidden">
                    <!-- Header (Accordion Toggle) -->
                    <div class="flex justify-between items-center p-6 cursor-pointer lg:cursor-default" (click)="toggleFilters()">
                        <div class="flex items-center gap-2">
                            <h3 class="text-xl font-bold text-gray-800 font-serif">Filtros</h3>
                            <i class="pi lg:hidden text-palo-rosa" [class.pi-chevron-down]="!showFiltersMobile" [class.pi-chevron-up]="showFiltersMobile"></i>
                        </div>
                        <button *ngIf="hasActiveFilters()" (click)="$event.stopPropagation(); resetFilters()" class="text-xs text-palo-rosa font-bold hover:underline">LIMPIAR</button>
                    </div>
                    
                    <!-- Content (Collapsed on mobile, Visible on Desktop) -->
                    <div class="px-6 pb-6 lg:block" [class.hidden]="!showFiltersMobile">
                        <!-- Categories -->
                        <div class="mb-8">
                        <h4 class="font-bold mb-3 text-xs text-gray-400 uppercase tracking-widest">Categoría</h4>
                        <div class="space-y-3">
                            <div *ngFor="let cat of categories()" class="flex items-center group">
                                <p-checkbox [value]="cat" [(ngModel)]="selectedCategories" (onChange)="triggerUpdate()" [inputId]="cat" styleClass="scale-90"></p-checkbox>
                                <label [for]="cat" class="ml-3 text-sm text-gray-600 group-hover:text-palo-rosa cursor-pointer transition-colors">{{cat}}</label>
                            </div>
                        </div>
                    </div>

                    <!-- Price -->
                    <div class="mb-8">
                        <h4 class="font-bold mb-4 text-xs text-gray-400 uppercase tracking-widest">Precio</h4>
                        <p-slider [(ngModel)]="priceRange" [range]="true" [min]="0" [max]="300" (onChange)="triggerUpdate()" styleClass="w-full mb-4"></p-slider>
                        <div class="flex justify-between items-center">
                            <div class="bg-gray-50 rounded-lg px-3 py-1 border border-gray-100 text-sm text-gray-600 font-medium">S/. {{priceRange[0]}}</div>
                            <span class="text-gray-300">-</span>
                            <div class="bg-gray-50 rounded-lg px-3 py-1 border border-gray-100 text-sm text-gray-600 font-medium">S/. {{priceRange[1]}}</div>
                        </div>
                    </div>

                    <!-- Colors (Hidden by request) -->
                    <!-- <div class="mb-6">
                         <h4 class="font-semibold mb-3 text-xs text-gray-400 uppercase tracking-widest">Color</h4>
                         <div class="flex flex-wrap gap-3">
                            <div *ngFor="let color of allColors()" 
                                 (click)="toggleColor(color)"
                                 [class.ring-2]="selectedColors.includes(color)"
                                 [class.ring-palo-rosa]="selectedColors.includes(color)"
                                 [class.ring-offset-2]="selectedColors.includes(color)"
                                 class="w-8 h-8 rounded-full cursor-pointer border border-gray-200 shadow-sm hover:scale-110 transition-transform relative"
                                 [style.backgroundColor]="getColorHex(color)"
                                 title="{{color}}">
                                 <i *ngIf="selectedColors.includes(color)" class="pi pi-check absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px]" [class.text-white]="color !== 'Blanco'" [class.text-black]="color === 'Blanco'"></i>
                            </div>
                         </div>
                    </div> -->
                </div>
            </div>
            </aside>
            
            <!-- Grid -->
            <main class="flex-1 min-w-0">
                <!-- Hero Section -->
                <div class="mb-10 rounded-3xl bg-[#fdf2f4] overflow-hidden relative min-h-[200px] flex items-center px-8 sm:px-12 border border-pink-50 shadow-[0_0_20px_rgba(0,0,0,0.1)]">
                    <div class="relative z-10 max-w-lg py-8">
                        <span class="inline-block py-1 px-3 rounded-full bg-white text-palo-rosa text-xs font-bold tracking-wider mb-4 shadow-sm">NUEVA COLECCIÓN</span>
                        <h1 class="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 font-serif leading-tight">
                            Estilo que <span class="text-transparent bg-clip-text bg-gradient-to-r from-palo-rosa to-pink-400">Enamora</span>
                        </h1>
                        <p class="text-gray-600 text-lg">Encuentra tu look perfecto para cada ocasión.</p>
                    </div>
                    <!-- Decorative Elements -->
                    <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-pink-100/50 to-transparent hidden sm:block"></div>
                </div>

                <!-- Products Grid -->
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-lg font-bold text-gray-800">{{filteredProducts().length}} Productos encontrados</h2>
                    <!-- Sort dropdown could go here -->
                </div>

                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                     <app-product-card *ngFor="let product of filteredProducts()" [product]="product"></app-product-card>
                </div>
                
                <div *ngIf="filteredProducts().length === 0" class="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200 mt-4">
                    <i class="pi pi-filter-slash text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg font-medium">No se encontraron productos con estos filtros.</p>
                    <button class="mt-4 px-6 py-2 bg-white border border-gray-200 rounded-full text-palo-rosa font-bold shadow-sm hover:shadow hover:border-palo-rosa transition-all" (click)="resetFilters()">Limpiar Filtros</button>
                </div>
            </main>
        </div>
    </div>
  `
})
export class CatalogComponent {
    productService = inject(ProductService);
    products = signal<Product[]>([]);

    // Filters State
    selectedCategories: string[] = [];
    priceRange: number[] = [0, 300];
    selectedColors: string[] = [];

    showFiltersMobile = false;

    // Computed helpers for available options
    categories = computed(() => [...new Set(this.products().map(p => p.category))]);
    allColors = computed(() => [...new Set(this.products().flatMap(p => p.colors))]);

    // Main filtered products signal
    filteredProducts = computed(() => {
        this.filtersTrigger(); // dependency
        return this.products().filter(p => {
            const matchCat = this.selectedCategories.length === 0 || this.selectedCategories.includes(p.category);
            const matchPrice = p.price >= this.priceRange[0] && p.price <= this.priceRange[1];
            const matchColor = this.selectedColors.length === 0 || p.colors.some(c => this.selectedColors.includes(c));
            return matchCat && matchPrice && matchColor;
        });
    });

    // Signal to trigger re-computation when mutable props change
    filtersTrigger = signal(0);

    constructor() {
        this.productService.getProducts().subscribe(p => this.products.set(p));
    }

    triggerUpdate() {
        this.filtersTrigger.set(Date.now());
    }

    toggleColor(color: string) {
        if (this.selectedColors.includes(color)) {
            this.selectedColors = this.selectedColors.filter(c => c !== color);
        } else {
            this.selectedColors.push(color);
        }
        this.triggerUpdate();
    }

    resetFilters() {
        this.selectedCategories = [];
        this.priceRange = [0, 300];
        this.selectedColors = [];
        this.triggerUpdate();
    }

    toggleFilters() {
        this.showFiltersMobile = !this.showFiltersMobile;
    }

    hasActiveFilters() {
        return this.selectedCategories.length > 0 || this.priceRange[0] > 0 || this.priceRange[1] < 300 || this.selectedColors.length > 0;
    }

    getColorHex(colorName: string): string {
        const map: Record<string, string> = {
            'Rosa': '#FFB7C5',
            'Palo Rosa': '#D48995',
            'Blanco': '#FFFFFF',
            'Azul': '#3B82F6',
            'Negro': '#1F2937',
            'Beige': '#F5F5DC',
            'Rojo': '#EF4444',
            'Verde': '#10B981',
            'Gris': '#9CA3AF'
        };
        return map[colorName] || '#CCCCCC';
    }
}
