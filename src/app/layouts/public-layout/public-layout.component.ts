import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ScrollTopModule } from 'primeng/scrolltop';

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
export class PublicLayoutComponent { }
