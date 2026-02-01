import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Category } from '../../../core/services/product.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ToastModule,
        InputTextModule,
        TextareaModule,
        InputNumberModule,
        SelectModule,
        ButtonModule,
        TableModule
    ],
    providers: [MessageService],
    template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <p-toast></p-toast>
      
      <div class="flex items-center gap-4">
        <button pButton icon="pi pi-arrow-left" (click)="goBack()" class="p-button-text p-button-rounded text-gray-600"></button>
        <h1 class="text-3xl font-bold text-gray-800">{{ isEditMode ? 'Editar Producto' : 'Nuevo Producto' }}</h1>
      </div>

      <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="space-y-8">
        
        <!-- Basic Info Card -->
        <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 class="text-xl font-bold text-palo-rosa font-serif border-b pb-2">Información Básica</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Name -->
            <div class="space-y-2">
              <label class="font-medium text-gray-700">Nombre del Producto</label>
              <input pInputText formControlName="name" class="w-full" placeholder="Ej. Vestido Floral" />
            </div>

            <!-- Category -->
            <div class="space-y-2">
              <label class="font-medium text-gray-700">Categoría</label>
              <p-select [options]="categories" formControlName="category_id" optionLabel="name" optionValue="id" placeholder="Seleccione una categoría" styleClass="w-full" class="w-full"></p-select>
            </div>

            <!-- Price -->
            <div class="space-y-2">
              <label class="font-medium text-gray-700">Precio Base (S/.)</label>
              <p-inputNumber formControlName="price" mode="currency" currency="PEN" locale="es-PE" styleClass="w-full" class="w-full"></p-inputNumber>
            </div>

            <!-- Image Upload -->
             <div class="space-y-2">
              <label class="font-medium text-gray-700">Imagen Principal</label>
              <input type="file" (change)="onFileSelected($event)" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-palo-rosa hover:file:bg-pink-100"/>
              
              <!-- Preview -->
              <div *ngIf="imagePreview" class="mt-4">
                  <img [src]="imagePreview" class="h-32 w-32 object-cover rounded-lg border border-gray-200 shadow-sm" />
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-2">
            <label class="font-medium text-gray-700">Descripción</label>
            <textarea pInputTextarea formControlName="description" rows="4" class="w-full" placeholder="Detalles del producto..."></textarea>
          </div>
        </div>

        <!-- Variants Card -->
        <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div class="flex justify-between items-center border-b pb-2">
             <h2 class="text-xl font-bold text-palo-rosa font-serif">Variantes (Tallas y Colores)</h2>
             <button type="button" pButton icon="pi pi-plus" label="Agregar Variante" (click)="addVariant()" class="p-button-outlined p-button-sm !text-palo-rosa !border-palo-rosa"></button>
          </div>

          <div formArrayName="variants" class="space-y-4">
             <div *ngFor="let variant of variants.controls; let i = index" [formGroupName]="i" class="flex flex-col md:flex-row gap-4 items-stretch md:items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
                
                <div class="flex-1 space-y-1 w-full">
                   <label class="text-xs font-bold text-gray-500">Talla</label>
                   <input pInputText formControlName="size" placeholder="S, M, 32..." class="w-full p-inputtext-sm" />
                </div>

                <div class="flex-1 space-y-1 w-full">
                   <label class="text-xs font-bold text-gray-500">Color</label>
                   <input pInputText formControlName="color" placeholder="Rojo, Azul..." class="w-full p-inputtext-sm" />
                </div>

                <div class="flex-1 space-y-1 w-full">
                   <label class="text-xs font-bold text-gray-500">Stock</label>
                   <input type="number" pInputText formControlName="stock" min="0" placeholder="0" class="w-full p-inputtext-sm" />
                </div>

                <div class="w-full md:w-auto flex justify-end">
                    <button type="button" pButton icon="pi pi-trash" (click)="removeVariant(i)" class="p-button-text p-button-danger p-button-rounded"></button>
                </div>
             </div>
          </div>
          
          <div *ngIf="variants.length === 0" class="text-center py-8 text-gray-400">
             <i class="pi pi-box text-3xl mb-2"></i>
             <p>Agrega al menos una variante para este producto.</p>
          </div>
        </div>

        <div class="flex justify-end gap-4 pt-4">
           <button type="button" pButton label="Cancelar" (click)="goBack()" class="p-button-text text-gray-600"></button>
           <button type="submit" pButton [label]="isEditMode ? 'Actualizar Producto' : 'Crear Producto'" [loading]="loading" class="!bg-palo-rosa !border-palo-rosa !font-bold hover:!bg-pink-600 px-8 py-3 rounded-xl"></button>
        </div>

      </form>
    </div>
  `
})
export class ProductFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private productService = inject(ProductService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private messageService = inject(MessageService);

    productForm!: FormGroup;
    categories: Category[] = [];
    loading = false;
    isEditMode = false;
    productId: string | null = null;

    selectedFile: File | null = null;
    imagePreview: string | null = null;

    ngOnInit() {
        this.initForm();
        this.loadCategories();

        this.route.paramMap.subscribe(params => {
            this.productId = params.get('id');
            if (this.productId) {
                this.isEditMode = true;
                this.loadProductData(this.productId);
            }
        });
    }

    initForm() {
        this.productForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            price: [0, [Validators.required, Validators.min(0)]],
            category_id: [null, Validators.required],
            variants: this.fb.array([])
        });

        // Add one empty variant by default if creating
        if (!this.isEditMode) {
            this.addVariant();
        }
    }

    get variants() {
        return this.productForm.get('variants') as FormArray;
    }

    addVariant() {
        const variantGroup = this.fb.group({
            size: ['', Validators.required],
            color: ['', Validators.required],
            stock: [0, [Validators.required, Validators.min(0)]]
        });
        this.variants.push(variantGroup);
    }

    removeVariant(index: number) {
        this.variants.removeAt(index);
    }

    loadCategories() {
        this.productService.getCategories().subscribe(cats => this.categories = cats);
    }

    loadProductData(id: string) {
        this.loading = true;
        this.productService.getProductById(id).subscribe({
            next: (data) => {
                this.productForm.patchValue({
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    category_id: data.category_id
                });

                this.imagePreview = data.image_url;

                // Clear default variants
                this.variants.clear();

                // Add existing variants
                if (data.product_variants) {
                    data.product_variants.forEach((v: any) => {
                        this.variants.push(this.fb.group({
                            size: [v.size, Validators.required],
                            color: [v.color, Validators.required],
                            stock: [v.stock, [Validators.required, Validators.min(0)]]
                        }));
                    });
                }

                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el producto' });
                this.loading = false;
            }
        });
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;

            // Preview
            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    async onSubmit() {
        if (this.productForm.invalid) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario inválido', detail: 'Por favor complete todos los campos requeridos.' });
            return;
        }

        if (!this.selectedFile && !this.isEditMode) {
            this.messageService.add({ severity: 'warn', summary: 'Imagen requerida', detail: 'Debe subir una imagen para el producto.' });
            return;
        }

        this.loading = true;
        const formValue = this.productForm.value;

        // Extract Product Data
        const productData = {
            name: formValue.name,
            description: formValue.description,
            price: formValue.price,
            category_id: formValue.category_id,
            image_url: this.imagePreview || '' // Will be overwritten if file selected
        };

        // Extract Variants
        const variantsData = formValue.variants;

        try {
            if (this.isEditMode && this.productId) {
                await this.productService.updateProduct(this.productId, productData, variantsData, this.selectedFile || undefined);
                this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Producto actualizado correctamente' });
            } else {
                await this.productService.createProduct(productData, variantsData, this.selectedFile!);
                this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Producto creado correctamente' });
            }

            setTimeout(() => this.goBack(), 1000);

        } catch (error: any) {
            console.error(error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar.' });
        } finally {
            this.loading = false;
        }
    }

    goBack() {
        this.router.navigate(['/admin/products']);
    }
}
