import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Product } from './product.service';
import { from, Observable, map } from 'rxjs';

export interface DashboardStats {
    visitors_today: number;
    views_today: number;
    clicks_today: number;
    visitors_total: number;
    views_total: number;
    clicks_total: number;
    total_products: number;
    first_view_at: string | null;
}

export interface TopViewedProduct {
    product_id: string;
    name: string;
    views: number;
}

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    private supabase = inject(SupabaseService).client;

    private readonly VISITOR_KEY = 'ns_visitor_id';
    private readonly SESSION_KEY = 'ns_session_id';

    // Fire and forget - void return
    async logPurchaseClick(product: Product): Promise<void> {
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
                    selected_size: null,
                    selected_color: null,
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

    // --- VISITAS ---

    async logPageView(path: string, productId: string | null = null): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('page_views')
                .insert({
                    path,
                    product_id: productId,
                    visitor_id: this.getVisitorId(),
                    session_id: this.getSessionId(),
                    referrer: document.referrer || null,
                    user_agent: navigator.userAgent
                });

            if (error) {
                console.error('Page view error:', error);
            }
        } catch (err) {
            console.error('Page view crash:', err);
        }
    }

    // Persiste entre visitas: sirve para contar personas, no solo vistas
    private getVisitorId(): string {
        return this.readOrCreate(localStorage, this.VISITOR_KEY);
    }

    // Se renueva al cerrar la pestaña
    private getSessionId(): string {
        return this.readOrCreate(sessionStorage, this.SESSION_KEY);
    }

    private readOrCreate(store: Storage, key: string): string {
        // El modo incognito o el bloqueo de storage no deben tumbar la web
        try {
            const existing = store.getItem(key);
            if (existing) return existing;

            const fresh = this.newId();
            store.setItem(key, fresh);
            return fresh;
        } catch {
            return 'anon-sin-storage';
        }
    }

    private newId(): string {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    // --- LECTURA (solo admin autenticado, ver politicas RLS) ---

    getDashboardStats(): Observable<DashboardStats> {
        return from(this.supabase.rpc('dashboard_stats')).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data as DashboardStats;
            })
        );
    }

    getTopViewedProducts(tope = 5): Observable<TopViewedProduct[]> {
        return from(this.supabase.rpc('top_viewed_products', { tope })).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data || []) as TopViewedProduct[];
            })
        );
    }
}
