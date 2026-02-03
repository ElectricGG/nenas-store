import { Injectable, inject } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { SupabaseService } from './supabase.service';

// Read Models (UI)
export interface Product {
    id: string; // Changed to string for UUID
    name: string;
    price: number;
    image: string;
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
}

export interface ProductVariantInput {
    size: string;
    color: string;
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

    // --- READ ---

    getProducts(): Observable<Product[]> {
        const query = this.supabase
            .from('products')
            .select(`
                id,
                name,
                description,
                price,
                image_url,
                category:categories(name),
                product_variants(size, color, stock)
            `)
            .eq('active', true);

        return from(query).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data || []).map((row: any) => this.mapRowToProduct(row));
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

    async createProduct(productData: ProductInput, variants: ProductVariantInput[], imageFile: File): Promise<void> {
        // 1. Upload Image
        const imageUrl = await this.uploadImage(imageFile);
        productData.image_url = imageUrl;

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
            size: v.size.toUpperCase()
        }));
        const { error: varError } = await this.supabase
            .from('product_variants')
            .insert(variantsWithProductId);

        if (varError) throw varError;
    }

    async updateProduct(id: string, productData: ProductInput, variants: ProductVariantInput[], imageFile?: File): Promise<void> {
        // 1. Upload new image if exists
        if (imageFile) {
            const imageUrl = await this.uploadImage(imageFile);
            productData.image_url = imageUrl;
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
            size: v.size.toUpperCase()
        }));
        const { error: varError } = await this.supabase
            .from('product_variants')
            .insert(variantsWithProductId);

        if (varError) throw varError;
    }

    async deleteProduct(id: string): Promise<void> {
        // Soft delete
        const { error } = await this.supabase
            .from('products')
            .update({ active: false })
            .eq('id', id);

        if (error) throw error;
    }

    // --- HELPERS ---

    private async uploadImage(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await this.supabase.storage
            .from('products')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = this.supabase.storage.from('products').getPublicUrl(filePath);
        return data.publicUrl;
    }

    private mapRowToProduct(row: any): Product {
        return {
            id: row.id,
            name: row.name,
            price: row.price,
            image: row.image_url,
            category: row.category?.name || 'Uncategorized',
            sizes: [...new Set(row.product_variants?.map((v: any) => v.size) || [])] as string[],
            colors: [...new Set(row.product_variants?.map((v: any) => v.color) || [])] as string[],
            material: 'Consultar',
            description: row.description,
            product_variants: row.product_variants || []
        };
    }
}
