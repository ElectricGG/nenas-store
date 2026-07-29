import { Injectable, inject } from '@angular/core';
import { Observable, from, map, of, switchMap, shareReplay, catchError, throwError } from 'rxjs';
import { SupabaseService } from './supabase.service';

// Read Models (UI)
export interface Product {
    id: string; // Changed to string for UUID
    name: string;
    price: number;
    image: string; // Primary image (backwards compatibility)
    images: string[]; // All images
    category: string;
    sizes: string[];
    colors: string[];
    material: string;
    description: string;
    product_variants?: any[];
}

// Write Models (DB)
export interface ProductInput {
    name: string;
    description: string;
    price: number;
    category_id: number;
    image_url: string;
    images?: string[];
}

export interface ProductVariantInput {
    size?: string | null;
    color?: string | null;
    stock: number;
    additional_price?: number;
}

export interface Category {
    id: number;
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private supabase = inject(SupabaseService).client;

    // --- CACHE ---
    // Only the admin writes products, so the active list is kept in memory and
    // shared by the catalog, the detail page and the related row. Any write
    // invalidates it; the TTL is the safety net for other people's browsers.
    private readonly CACHE_TTL_MS = 5 * 60 * 1000;
    private productsCache$: Observable<Product[]> | null = null;
    private cachedAt = 0;

    invalidateProductsCache() {
        this.productsCache$ = null;
        this.cachedAt = 0;
    }

    private get cacheExpired(): boolean {
        return Date.now() - this.cachedAt > this.CACHE_TTL_MS;
    }

    // --- READ ---

    getProducts(forceRefresh = false): Observable<Product[]> {
        if (forceRefresh || !this.productsCache$ || this.cacheExpired) {
            const query = this.supabase
                .from('products')
                .select(`
                    id,
                    name,
                    description,
                    price,
                    image_url,
                    images,
                    category:categories(name),
                    product_variants(size, color, stock)
                `)
                .eq('active', true)
                .order('created_at', { ascending: false });

            this.cachedAt = Date.now();
            this.productsCache$ = from(query).pipe(
                map(({ data, error }) => {
                    if (error) throw error;
                    return (data || []).map((row: any) => this.mapRowToProduct(row));
                }),
                // A failed request must not stay cached, or it would replay the error
                catchError(err => {
                    this.invalidateProductsCache();
                    return throwError(() => err);
                }),
                shareReplay({ bufferSize: 1, refCount: false })
            );
        }

        return this.productsCache$;
    }

    // Storefront detail page: same shape as getProducts(), for a single product.
    // getProductById() below stays untouched because the admin form depends on its raw shape.
    // Served from the cached list when possible, so opening a product costs no request.
    getProductDetail(id: string): Observable<Product | null> {
        return this.getProducts().pipe(
            catchError(() => of([] as Product[])),
            switchMap(products => {
                const cached = products.find(p => p.id === id);
                // Not in the cached list: it may have been created after we cached
                return cached ? of(cached) : this.fetchProductDetail(id);
            })
        );
    }

    private fetchProductDetail(id: string): Observable<Product | null> {
        const query = this.supabase
            .from('products')
            .select(`
                id,
                name,
                description,
                price,
                image_url,
                images,
                category:categories(name),
                product_variants(size, color, stock)
            `)
            .eq('id', id)
            .eq('active', true)
            .limit(1);

        return from(query).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                const row = (data || [])[0];
                return row ? this.mapRowToProduct(row) : null;
            })
        );
    }

    getProductById(id: string): Observable<any> {
        // Fetch raw data including variants with stock
        const query = this.supabase
            .from('products')
            .select(`
                *,
                product_variants(*)
            `)
            .eq('id', id)
            .single();

        return from(query).pipe(map(({ data, error }) => {
            if (error) throw error;
            return data;
        }));
    }

    getCategories(): Observable<Category[]> {
        return from(this.supabase.from('categories').select('*')).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data as Category[];
            })
        );
    }

    // --- WRITE ---

    async createProduct(productData: ProductInput, variants: ProductVariantInput[], imageFiles: File[]): Promise<void> {
        // 1. Upload Images
        const imageUrls: string[] = [];
        if (imageFiles.length > 0) {
            for (const file of imageFiles) {
                const url = await this.uploadImage(file);
                imageUrls.push(url);
            }
        }

        productData.images = imageUrls;
        if (imageUrls.length > 0) {
            productData.image_url = imageUrls[0]; // Set primary image
        }

        // 2. Insert Product
        const { data: product, error: prodError } = await this.supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (prodError) throw prodError;

        // 3. Insert Variants
        const variantsWithProductId = variants.map(v => ({
            ...v,
            product_id: product.id,
            size: this.normalizeSize(v.size),
            color: this.normalizeColor(v.color)
        }));
        const { error: varError } = await this.supabase
            .from('product_variants')
            .insert(variantsWithProductId);

        if (varError) throw varError;

        this.invalidateProductsCache();
    }

    async updateProduct(id: string, productData: ProductInput, variants: ProductVariantInput[], newImageFiles: File[], existingImages: string[] = []): Promise<void> {
        // 1. Upload new images
        const newImageUrls: string[] = [];
        if (newImageFiles.length > 0) {
            for (const file of newImageFiles) {
                const url = await this.uploadImage(file);
                newImageUrls.push(url);
            }
        }

        // Combine existing and new images
        const allImages = [...existingImages, ...newImageUrls];
        productData.images = allImages;

        if (allImages.length > 0) {
            productData.image_url = allImages[0];
        }

        // 2. Update Product
        const { error: prodError } = await this.supabase
            .from('products')
            .update(productData)
            .eq('id', id);

        if (prodError) throw prodError;

        // 3. Sync Variants (Strategy: Delete All -> Insert New. Simple & Reliable for this scale)
        const { error: delError } = await this.supabase
            .from('product_variants')
            .delete()
            .eq('product_id', id);

        if (delError) throw delError;

        const variantsWithProductId = variants.map(v => ({
            ...v,
            product_id: id,
            size: this.normalizeSize(v.size),
            color: this.normalizeColor(v.color)
        }));
        const { error: varError } = await this.supabase
            .from('product_variants')
            .insert(variantsWithProductId);

        if (varError) throw varError;

        this.invalidateProductsCache();
    }

    async deleteProduct(id: string): Promise<void> {
        // Soft delete
        const { error } = await this.supabase
            .from('products')
            .update({ active: false })
            .eq('id', id);

        if (error) throw error;

        this.invalidateProductsCache();
    }

    // --- HELPERS ---

    // Talla y color son opcionales: si vienen vacíos se guardan como null, no como ''
    private normalizeSize(size?: string | null): string | null {
        const clean = (size || '').trim();
        return clean ? clean.toUpperCase() : null;
    }

    private normalizeColor(color?: string | null): string | null {
        const clean = (color || '').trim();
        return clean ? clean : null;
    }

    private async uploadImage(file: File): Promise<string> {
        // Phone photos come in at 1-3 MB and are shown at ~200-400px wide.
        // Shrinking them before upload is what actually makes the catalog load fast.
        const optimized = await this.compressImage(file);

        const fileExt = optimized.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'jpg');
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`; // More unique name
        const filePath = `${fileName}`;

        const { error: uploadError } = await this.supabase.storage
            .from('products')
            .upload(filePath, optimized, { contentType: optimized.type || file.type });

        if (uploadError) throw uploadError;

        const { data } = this.supabase.storage.from('products').getPublicUrl(filePath);
        return data.publicUrl;
    }

    // --- IMAGE COMPRESSION ---

    private readonly MAX_IMAGE_SIZE_PX = 1200;
    private readonly IMAGE_QUALITY = 0.8;

    // Resizes and re-encodes in the browser before uploading.
    // Anything that goes wrong falls back to the original file, so a save never
    // fails because of the compression.
    private compressImage(file: File): Promise<Blob> {
        return new Promise<Blob>((resolve) => {
            if (!file.type.startsWith('image/')) {
                resolve(file);
                return;
            }

            const objectUrl = URL.createObjectURL(file);
            const img = new Image();

            img.onload = () => {
                URL.revokeObjectURL(objectUrl);

                const { width, height } = this.fitWithin(img.width, img.height);
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }

                // JPEG has no transparency: paint white first so PNGs don't turn black
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => resolve(blob && blob.size < file.size ? blob : file),
                    'image/jpeg',
                    this.IMAGE_QUALITY
                );
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(file);
            };

            img.src = objectUrl;
        });
    }

    private fitWithin(width: number, height: number): { width: number; height: number } {
        const largest = Math.max(width, height);
        if (largest <= this.MAX_IMAGE_SIZE_PX) return { width, height };

        const ratio = this.MAX_IMAGE_SIZE_PX / largest;
        return {
            width: Math.round(width * ratio),
            height: Math.round(height * ratio)
        };
    }

    private mapRowToProduct(row: any): Product {
        // Ensure images array exists, fallback to single image_url if null
        const images = row.images && row.images.length > 0 ? row.images : (row.image_url ? [row.image_url] : []);

        return {
            id: row.id,
            name: row.name,
            price: row.price,
            image: row.image_url || (images.length > 0 ? images[0] : ''),
            images: images,
            category: row.category?.name || 'Uncategorized',
            // Talla y color son opcionales, así que descartamos los null/vacíos
            sizes: [...new Set(row.product_variants?.map((v: any) => v.size).filter(Boolean) || [])] as string[],
            colors: [...new Set(row.product_variants?.map((v: any) => v.color).filter(Boolean) || [])] as string[],
            material: 'Consultar',
            description: row.description,
            product_variants: row.product_variants || []
        };
    }
}
