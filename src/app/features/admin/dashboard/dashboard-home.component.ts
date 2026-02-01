import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-dashboard-home',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
    <div class="space-y-6">
        <h1 class="text-3xl font-bold text-gray-800">Dashboard</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div class="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                    <i class="pi pi-shopping-bag text-xl"></i>
                </div>
                <div>
                    <h3 class="text-gray-500 text-sm font-medium">Total Productos</h3>
                    <p class="text-2xl font-bold text-gray-800">12</p>
                </div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div class="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                    <i class="pi pi-dollar text-xl"></i>
                </div>
                <div>
                    <h3 class="text-gray-500 text-sm font-medium">Ventas Hoy</h3>
                    <p class="text-2xl font-bold text-gray-800">S/. 0.00</p>
                </div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div class="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center">
                    <i class="pi pi-users text-xl"></i>
                </div>
                <div>
                    <h3 class="text-gray-500 text-sm font-medium">Clientes Nuevos</h3>
                    <p class="text-2xl font-bold text-gray-800">0</p>
                </div>
            </div>
        </div>

        <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center py-20">
            <i class="pi pi-chart-line text-6xl text-gray-200 mb-4"></i>
            <h3 class="text-xl font-bold text-gray-400">Estadísticas próximamente</h3>
            <p class="text-gray-400">El panel de estadísticas estará disponible en la próxima versión.</p>
        </div>
    </div>
  `
})
export class DashboardHomeComponent { }
