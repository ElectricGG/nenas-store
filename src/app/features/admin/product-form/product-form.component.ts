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
              <label class="font-medium text-gray-700">Imágenes del Producto</label>
              <input type="file" (change)="onFileSelected($event)" accept="image/*" multiple class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-palo-rosa hover:file:bg-pink-100"/>
              
              <!-- Previews -->
              <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <!-- Existing Images -->
                  <div *ngFor="let img of existingImages; let i = index" class="relative group">
                      <img [src]="img" class="h-32 w-full object-cover rounded-lg border border-gray-200 shadow-sm" />
                      <button type="button" (click)="removeExistingImage(i)" class="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md text-red-500 hover:text-red-700 cursor-pointer">
                        <i class="pi pi-times text-xs"></i>
                      </button>
                  </div>

                  <!-- New Image Previews -->
                  <div *ngFor="let preview of imagePreviews; let i = index" class="relative group">
                      <img [src]="preview" class="h-32 w-full object-cover rounded-lg border border-gray-200 shadow-sm opacity-90" />
                      <div class="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          <span class="bg-white text-xs px-2 py-1 rounded-full shadow font-bold text-gray-600">Nuevo</span>
                      </div>
                      <button type="button" (click)="removeNewImage(i)" class="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md text-red-500 hover:text-red-700 cursor-pointer">
                        <i class="pi pi-times text-xs"></i>
                      </button>
                  </div>
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

    selectedFiles: File[] = [];
    imagePreviews: string[] = [];
    existingImages: string[] = [];

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

                // Load existing images (prioritize array)
                if (data.images && data.images.length > 0) {
                    this.existingImages = data.images;
                } else if (data.image_url) {
                    this.existingImages = [data.image_url];
                } else {
                    this.existingImages = [];
                }

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
        const files: FileList = event.target.files;
        if (files && files.length > 0) {
            // Convert FileList to Array and Append
            const newFiles = Array.from(files);
            this.selectedFiles = [...this.selectedFiles, ...newFiles];

            // Generate Previews for new files
            newFiles.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.imagePreviews.push(e.target.result);
                };
                reader.readAsDataURL(file);
            });
        }
    }

    removeNewImage(index: number) {
        this.selectedFiles.splice(index, 1);
        this.imagePreviews.splice(index, 1);
    }

    removeExistingImage(index: number) {
        this.existingImages.splice(index, 1);
    }

    async onSubmit() {
        if (this.productForm.invalid) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario inválido', detail: 'Por favor complete todos los campos requeridos.' });
            return;
        }

        if (this.selectedFiles.length === 0 && this.existingImages.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Imagen requerida', detail: 'Debe subir al menos una imagen para el producto.' });
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
            image_url: '' // Will be handled by service
        };

        // Extract Variants
        const variantsData = formValue.variants;

        try {
            if (this.isEditMode && this.productId) {
                await this.productService.updateProduct(this.productId, productData, variantsData, this.selectedFiles, this.existingImages);
                this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Producto actualizado correctamente' });
            } else {
                await this.productService.createProduct(productData, variantsData, this.selectedFiles);
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
