import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    template: `
    <div class="flex h-screen bg-gray-50 overflow-hidden">
      
      <!-- Mobile Top Bar -->
      <div class="md:hidden fixed w-full bg-white z-20 border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
          <div class="flex items-center gap-2">
            <img src="assets/logo.jpeg" alt="Logo" class="h-8 w-8 rounded-full object-cover">
            <span class="font-bold text-palo-rosa text-lg font-serif">Nena's Admin</span>
          </div>
          <button (click)="toggleSidebar()" class="text-gray-600 focus:outline-none">
              <i class="pi pi-bars text-2xl"></i>
          </button>
      </div>

      <!-- Sidebar Backdrop (Mobile) -->
      <div *ngIf="isSidebarOpen()" (click)="closeSidebar()" class="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity"></div>

      <!-- Sidebar -->
      <aside [class.translate-x-0]="isSidebarOpen()" [class.-translate-x-full]="!isSidebarOpen()" class="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-300 transform md:translate-x-0 md:static md:inset-auto">
        <div class="p-6 border-b border-gray-100 flex items-center justify-center h-16 md:h-20 gap-3">
            <img src="assets/logo.jpeg" alt="Logo" class="h-10 w-10 rounded-full object-cover shadow-sm">
            <h2 class="text-xl font-bold text-palo-rosa font-serif">Nena's Admin</h2>
        </div>

        <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
            <a routerLink="/admin/dashboard" routerLinkActive="bg-pink-50 text-palo-rosa" (click)="closeSidebar()" class="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors group">
                <i class="pi pi-home text-lg"></i>
                <span class="font-medium">Dashboard</span>
            </a>
            <a routerLink="/admin/products" routerLinkActive="bg-pink-50 text-palo-rosa" (click)="closeSidebar()" class="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors group">
                <i class="pi pi-shopping-bag text-lg"></i>
                <span class="font-medium">Productos</span>
            </a>
        </nav>

        <div class="p-4 border-t border-gray-100">
            <button (click)="logout()" class="w-full flex items-center gap-3 px-4 py-3 text-red-500 rounded-xl hover:bg-red-50 transition-colors">
                <i class="pi pi-sign-out text-lg"></i>
                <span class="font-medium">Cerrar Sesión</span>
            </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-4 md:p-8 mt-14 md:mt-0 relative w-full">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AdminLayoutComponent {
    authService = inject(AuthService);
    isSidebarOpen = signal(false);

    toggleSidebar() {
        this.isSidebarOpen.update(v => !v);
    }

    closeSidebar() {
        this.isSidebarOpen.set(false);
    }

    logout() {
        this.authService.logout();
    }
}
