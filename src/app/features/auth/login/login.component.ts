import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../core/services/auth.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, PasswordModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white px-4">
      <p-toast></p-toast>
      <div class="bg-white p-8 rounded-2xl shadow-xl border border-pink-100 w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-palo-rosa font-serif mb-2">Nena's Store</h1>
          <p class="text-gray-500">Panel de Administración</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <input pInputText id="email" type="text" [(ngModel)]="email" name="email" class="w-full !rounded-xl" placeholder="admin@nenas.store" />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <p-password id="password" [(ngModel)]="password" name="password" [feedback]="false" styleClass="w-full" inputStyleClass="w-full !rounded-xl" placeholder="••••••••"></p-password>
          </div>

          <button pButton label="Ingresar" type="submit" [loading]="loading" class="w-full !bg-palo-rosa !border-palo-rosa hover:!bg-pink-600 !rounded-xl !font-bold !py-3"></button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  authService = inject(AuthService);
  messageService = inject(MessageService);

  email = '';
  password = '';

  loading = false;

  async onSubmit() {
    if (!this.email || !this.password) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Por favor ingrese usuario y contraseña' });
      return;
    }

    this.loading = true;
    const success = await this.authService.login(this.email, this.password);
    this.loading = false;

    if (!success) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Credenciales inválidas' });
    }
  }
}
