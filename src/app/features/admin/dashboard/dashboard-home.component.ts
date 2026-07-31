import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { AnalyticsService, DashboardStats, TopViewedProduct } from '../../../core/services/analytics.service';

@Component({
    selector: 'app-dashboard-home',
    standalone: true,
    imports: [CommonModule, CardModule, RouterModule],
    template: `
    <div class="space-y-6">
        <div class="flex items-center justify-between gap-4">
            <h1 class="text-3xl font-bold text-gray-800">Dashboard</h1>
            <span *ngIf="loading()" class="text-sm text-gray-400 flex items-center gap-2">
                <i class="pi pi-spin pi-spinner"></i> Cargando...
            </span>
        </div>

        <div *ngIf="error()" class="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm">
            No se pudieron cargar las estadísticas. {{ error() }}
        </div>

        <!-- Hoy -->
        <div>
            <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Hoy</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center shrink-0">
                        <i class="pi pi-users text-xl"></i>
                    </div>
                    <div class="min-w-0">
                        <h3 class="text-gray-500 text-sm font-medium">Personas</h3>
                        <p class="text-2xl font-bold text-gray-800">{{ stats()?.visitors_today ?? '—' }}</p>
                        <p class="text-xs text-gray-400 mt-1">Visitantes únicos</p>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shrink-0">
                        <i class="pi pi-eye text-xl"></i>
                    </div>
                    <div class="min-w-0">
                        <h3 class="text-gray-500 text-sm font-medium">Vistas</h3>
                        <p class="text-2xl font-bold text-gray-800">{{ stats()?.views_today ?? '—' }}</p>
                        <p class="text-xs text-gray-400 mt-1">Páginas abiertas</p>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center shrink-0">
                        <i class="pi pi-cursor text-xl"></i>
                    </div>
                    <div class="min-w-0">
                        <h3 class="text-gray-500 text-sm font-medium">Clicks en compras</h3>
                        <p class="text-2xl font-bold text-gray-800">{{ stats()?.clicks_today ?? '—' }}</p>
                        <p class="text-xs text-gray-400 mt-1">Fueron a WhatsApp</p>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="w-12 h-12 bg-pink-50 text-palo-rosa rounded-full flex items-center justify-center shrink-0">
                        <i class="pi pi-shopping-bag text-xl"></i>
                    </div>
                    <div class="min-w-0">
                        <h3 class="text-gray-500 text-sm font-medium">Productos activos</h3>
                        <p class="text-2xl font-bold text-gray-800">{{ stats()?.total_products ?? '—' }}</p>
                        <a routerLink="/admin/products" class="text-xs text-palo-rosa font-bold hover:underline mt-1 inline-block">Administrar</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Historico -->
        <div>
            <div class="flex items-baseline gap-2 mb-3 flex-wrap">
                <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest">Histórico</h2>
                <span *ngIf="desde()" class="text-xs text-gray-300">desde el {{ desde() }}</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 class="text-gray-500 text-sm font-medium">Personas</h3>
                    <p class="text-2xl font-bold text-gray-800">{{ stats()?.visitors_total ?? '—' }}</p>
                </div>

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 class="text-gray-500 text-sm font-medium">Vistas</h3>
                    <p class="text-2xl font-bold text-gray-800">{{ stats()?.views_total ?? '—' }}</p>
                    <p class="text-xs text-gray-400 mt-1">{{ vistasPorPersona() }} por persona</p>
                </div>

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 class="text-gray-500 text-sm font-medium">Clicks en compras</h3>
                    <p class="text-2xl font-bold text-gray-800">{{ stats()?.clicks_total ?? '—' }}</p>
                </div>

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-palo-rosa/20 ring-1 ring-palo-rosa/10">
                    <h3 class="text-gray-500 text-sm font-medium">Conversión</h3>
                    <p class="text-2xl font-bold text-palo-rosa">{{ conversion() }}</p>
                    <p class="text-xs text-gray-400 mt-1">Personas que dieron click en comprar</p>
                </div>
            </div>
        </div>

        <!-- Productos mas vistos -->
        <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 class="text-lg font-bold text-gray-800 mb-1">Productos más vistos</h2>
            <p class="text-xs text-gray-400 mb-6">Histórico completo</p>

            <div *ngIf="topProducts().length > 0; else sinVistas" class="space-y-3">
                <div *ngFor="let p of topProducts(); let i = index" class="flex items-center gap-4">
                    <span class="w-6 h-6 rounded-full bg-gray-50 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0">{{ i + 1 }}</span>
                    <span class="flex-1 min-w-0 truncate text-sm font-medium text-gray-700">{{ p.name }}</span>
                    <div class="w-32 sm:w-48 bg-gray-100 rounded-full h-2 overflow-hidden shrink-0">
                        <div class="bg-palo-rosa h-full rounded-full transition-all" [style.width.%]="barWidth(p.views)"></div>
                    </div>
                    <span class="text-sm font-bold text-gray-800 w-10 text-right shrink-0">{{ p.views }}</span>
                </div>
            </div>

            <ng-template #sinVistas>
                <div class="text-center py-10">
                    <i class="pi pi-chart-line text-4xl text-gray-200 mb-3"></i>
                    <p class="text-gray-400 text-sm">Todavía no hay visitas registradas.</p>
                    <p class="text-gray-300 text-xs mt-1">Los datos empiezan a acumularse desde ahora.</p>
                </div>
            </ng-template>
        </div>
    </div>
  `
})
export class DashboardHomeComponent implements OnInit {
    private analyticsService = inject(AnalyticsService);

    stats = signal<DashboardStats | null>(null);
    topProducts = signal<TopViewedProduct[]>([]);
    loading = signal(true);
    error = signal<string | null>(null);

    conversion = computed(() => {
        const s = this.stats();
        if (!s || !s.visitors_total) return '—';
        return ((s.clicks_total / s.visitors_total) * 100).toFixed(1) + '%';
    });

    vistasPorPersona = computed(() => {
        const s = this.stats();
        if (!s || !s.visitors_total) return '—';
        return (s.views_total / s.visitors_total).toFixed(1);
    });

    desde = computed(() => {
        const fecha = this.stats()?.first_view_at;
        if (!fecha) return null;
        return new Date(fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
    });

    ngOnInit() {
        this.analyticsService.getDashboardStats().subscribe({
            next: (s) => {
                this.stats.set(s);
                this.loading.set(false);
            },
            error: (e) => {
                this.error.set(e?.message || '');
                this.loading.set(false);
            }
        });

        this.analyticsService.getTopViewedProducts().subscribe({
            next: (p) => this.topProducts.set(p),
            error: () => this.topProducts.set([])
        });
    }

    barWidth(views: number): number {
        const max = Math.max(...this.topProducts().map(p => p.views), 1);
        return (views / max) * 100;
    }
}
