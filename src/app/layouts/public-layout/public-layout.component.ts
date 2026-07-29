import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ScrollTopModule } from 'primeng/scrolltop';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-public-layout',
    standalone: true,
    imports: [RouterOutlet, HeaderComponent, ScrollTopModule],
    template: `
    <app-header></app-header>
    <router-outlet></router-outlet>
    <p-scrollTop
        styleClass="!bg-palo-rosa !rounded-full !w-12 !h-12 !shadow-lg hover:!bg-pink-600 transition-colors"
        icon="pi pi-arrow-up text-white font-bold"
        [threshold]="200"
        behavior="smooth">
    </p-scrollTop>
  `
})
export class PublicLayoutComponent {
    private router = inject(Router);
    private analytics = inject(AnalyticsService);
    private auth = inject(AuthService);

    constructor() {
        // Una vista por navegacion. Solo en el layout publico, para no medir el admin.
        this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe(event => {
                // Tus propias visitas como admin no cuentan
                if (this.auth.isAuthenticated()) return;

                const url = event.urlAfterRedirects;
                this.analytics.logPageView(url, this.extractProductId(url));
            });
    }

    private extractProductId(url: string): string | null {
        const match = url.match(/^\/producto\/([0-9a-f-]{36})/i);
        return match ? match[1] : null;
    }
}
