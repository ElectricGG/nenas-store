import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private router = inject(Router);
    private supabase = inject(SupabaseService).client;

    // User state
    isAuthenticated = signal<boolean>(!!localStorage.getItem('sb-access-token'));

    constructor() {
        // Recover session if exists
        this.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                this.isAuthenticated.set(true);
            }
        });

        // Listen to auth changes
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                this.isAuthenticated.set(true);
                localStorage.setItem('sb-access-token', session.access_token);
            } else {
                this.isAuthenticated.set(false);
                localStorage.removeItem('sb-access-token');
            }
        });
    }

    async login(email: string, password: string): Promise<boolean> {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Login error:', error.message);
            return false;
        }

        this.router.navigate(['/admin']);
        return true;
    }

    async logout() {
        await this.supabase.auth.signOut();
        this.isAuthenticated.set(false);
        this.router.navigate(['/login']);
    }
}
