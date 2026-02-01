
import { Routes } from '@angular/router';
import { CatalogComponent } from './features/catalog/catalog.component';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { AdminLayoutComponent } from './features/admin/layout/admin-layout.component';
import { DashboardHomeComponent } from './features/admin/dashboard/dashboard-home.component';
import { AdminProductsComponent } from './features/admin/products/admin-products.component';
import { ProductFormComponent } from './features/admin/product-form/product-form.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    // Public Routes
    {
        path: '',
        component: PublicLayoutComponent,
        children: [
            { path: '', component: CatalogComponent }
        ]
    },

    // Auth Routes
    { path: 'login', component: LoginComponent },

    // Admin Routes
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardHomeComponent },
            { path: 'products', component: AdminProductsComponent },
            { path: 'products/new', component: ProductFormComponent },
            { path: 'products/edit/:id', component: ProductFormComponent }
        ]
    },

    // Catch all
    { path: '**', redirectTo: '' }
];
