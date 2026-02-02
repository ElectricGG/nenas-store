import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Product } from './product.service';
import { from, Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    private supabase = inject(SupabaseService).client;

    // Fire and forget - void return
    async logPurchaseClick(product: Product, size: string, color: string): Promise<void> {
        try {
            // No await here to ensure UI is not blocked? 
            // Actually, async function without await on call site is fine.
            // But we should catch errors to avoid unhandled rejections if we don't await.

            const { error } = await this.supabase
                .from('purchase_clicks')
                .insert({
                    product_id: product.id,
                    product_name: product.name,
                    price: product.price,
                    selected_size: size,
                    selected_color: color,
                    metadata: {
                        category: product.category,
                        full_product: product
                    }
                });

            if (error) {
                console.error('Analytics error:', error);
            }
        } catch (err) {
            console.error('Analytics crash:', err);
        }
    }

    getTodayClicksCount(): Observable<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of day

        const query = this.supabase
            .from('purchase_clicks')
            .select('*', { count: 'exact', head: true }) // head: true returns count only, no data
            .gte('created_at', today.toISOString());

        return from(query).pipe(
            map(({ count, error }) => {
                if (error) {
                    console.error('Error fetching analytics:', error);
                    return 0;
                }
                return count || 0;
            })
        );
    }
}
