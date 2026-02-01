import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product, ProductService } from '../../../core/services/product.service';
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

        <div class="card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <p-table [value]="products()" [tableStyle]="{ 'min-width': '60rem' }" styleClass="p-datatable-sm p-datatable-striped">
                    <ng-template pTemplate="header">
                        <tr>
                            <th class="w-16">Imagen</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Tallas</th>
                            <th class="text-center">Acciones</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-product>
                        <tr>
                            <td>
                                <img [src]="product.image" [alt]="product.name" class="w-12 h-12 rounded-lg object-cover shadow-sm bg-gray-50" />
                            </td>
                            <td class="font-medium text-gray-800">{{ product.name }}</td>
                            <td>
                                <span class="px-2 py-1 bg-gray-50 text-gray-600 rounded-lg text-sm">{{ product.category }}</span>
                            </td>
                            <td class="font-bold text-palo-rosa whitespace-nowrap">S/. {{ product.price | number:'1.2-2' }}</td>
                            <td>
                                <div class="flex flex-wrap gap-1">
                                    <span *ngFor="let size of product.sizes" class="bg-pink-50 text-pink-600 px-2 py-1 rounded-md text-xs font-semibold">{{ size }}</span>
                                    <span *ngIf="product.sizes.length === 0" class="text-gray-400 text-xs italic">Sin variantes</span>
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
                            <td colspan="6" class="text-center py-8 text-gray-400">
                                No hay productos registrados.
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

    constructor() {
        this.loadProducts();
    }

    loadProducts() {
        this.productService.getProducts().subscribe(p => this.products.set(p));
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
