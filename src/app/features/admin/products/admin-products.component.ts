import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Product, ProductService } from '../../../core/services/product.service';
import { searchProducts } from '../../../core/utils/product-search';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-admin-products',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        TableModule,
        ButtonModule,
        InputTextModule,
        TagModule,
        ConfirmDialogModule,
        ToastModule
    ],
    providers: [ConfirmationService, MessageService],
    template: `
    <div class="space-y-6">
        <p-toast></p-toast>
        <p-confirmDialog header="Confirmación" icon="pi pi-exclamation-triangle"></p-confirmDialog>

        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 class="text-2xl md:text-3xl font-bold text-gray-800">Productos</h1>
            <button pButton label="Nuevo Producto" icon="pi pi-plus" routerLink="new" class="w-full sm:w-auto !bg-palo-rosa !border-palo-rosa !rounded-xl"></button>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <div class="relative flex-1">
                <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"></i>
                <input type="text"
                       [ngModel]="searchTerm()"
                       (ngModelChange)="searchTerm.set($event)"
                       placeholder="Buscar por número, nombre o descripción..."
                       class="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 bg-white shadow-sm text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-palo-rosa transition-colors">
                <button *ngIf="searchTerm()" (click)="searchTerm.set('')" aria-label="Limpiar búsqueda"
                        class="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <i class="pi pi-times text-[10px]"></i>
                </button>
            </div>
            <span class="text-sm font-medium text-gray-500 shrink-0">
                {{ filteredProducts().length }}<span *ngIf="searchTerm()"> de {{ products().length }}</span> productos
            </span>
        </div>

        <div class="card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <p-table [value]="filteredProducts()" [tableStyle]="{ 'min-width': '60rem' }" styleClass="p-datatable-sm p-datatable-striped">
                    <ng-template pTemplate="header">
                        <tr>
                            <th class="w-16">Imagen</th>
                            <th class="w-20">Código</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Variantes</th>
                            <th class="text-center">Acciones</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-product>
                        <tr>
                            <td>
                                <img [src]="product.image" [alt]="product.name" class="w-12 h-12 rounded-lg object-cover shadow-sm bg-gray-50" />
                            </td>
                            <td>
                                <span class="inline-block px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-sm font-bold">#{{ product.codigo }}</span>
                            </td>
                            <td class="font-medium text-gray-800">{{ product.name }}</td>
                            <td>
                                <span class="px-2 py-1 bg-gray-50 text-gray-600 rounded-lg text-sm">{{ product.category }}</span>
                            </td>
                            <td class="font-bold text-palo-rosa whitespace-nowrap">S/. {{ product.price | number:'1.2-2' }}</td>
                            <td>
                                <div class="flex flex-wrap gap-1">
                                    <span *ngFor="let size of product.sizes" class="bg-pink-50 text-pink-600 px-2 py-1 rounded-md text-xs font-semibold">{{ size }}</span>
                                    <span *ngFor="let color of product.colors" class="bg-gray-50 text-gray-600 px-2 py-1 rounded-md text-xs font-semibold">{{ color }}</span>
                                    <span *ngIf="product.sizes.length === 0 && product.colors.length === 0" class="text-gray-400 text-xs italic">Sin talla ni color</span>
                                </div>
                            </td>
                            <td class="text-center">
                                <div class="flex justify-center gap-2">
                                    <button pButton icon="pi pi-pencil" [routerLink]="['edit', product.id]" class="p-button-rounded p-button-text p-button-secondary"></button>
                                    <button pButton icon="pi pi-trash" (click)="confirmDelete(product)" class="p-button-rounded p-button-text p-button-danger"></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="7" class="text-center py-8 text-gray-400">
                                <ng-container *ngIf="searchTerm(); else sinProductos">
                                    Ningún producto coincide con "{{ searchTerm() }}".
                                    <button (click)="searchTerm.set('')" class="text-palo-rosa font-bold hover:underline ml-1">Limpiar</button>
                                </ng-container>
                                <ng-template #sinProductos>No hay productos registrados.</ng-template>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>
    </div>
  `
})
export class AdminProductsComponent {
    productService = inject(ProductService);
    confirmationService = inject(ConfirmationService);
    messageService = inject(MessageService);

    products = signal<Product[]>([]);
    searchTerm = signal('');

    // Misma búsqueda que el catálogo público: nombre + descripción, sin tildes
    filteredProducts = computed(() => searchProducts(this.products(), this.searchTerm()));

    constructor() {
        this.loadProducts();
    }

    loadProducts() {
        // The admin must always see the truth, so this one skips the cache
        this.productService.getProducts(true).subscribe(p => this.products.set(p));
    }

    confirmDelete(product: Product) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar "${product.name}"?`,
            accept: () => {
                this.deleteProduct(product.id as string);
            }
        });
    }

    deleteProduct(id: string) {
        this.productService.deleteProduct(id).then(() => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Producto eliminado' });
            this.loadProducts();
        }).catch(() => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el producto' });
        });
    }
}
