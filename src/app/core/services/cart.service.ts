import { Injectable, signal, computed } from '@angular/core';
import { Product } from './product.service';
import { whatsappUrl } from '../config/contacto';

export interface CartItem {
    product: Product;
    quantity: number;
}

@Injectable({
    providedIn: 'root'
})
export class CartService {
    cartItems = signal<CartItem[]>([]);

    total = computed(() => this.cartItems().reduce((acc, item) => acc + (item.product.price * item.quantity), 0));
    count = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));

    addToCart(product: Product) {
        this.cartItems.update(items => {
            const existing = items.find(i => i.product.id === product.id);
            if (existing) {
                return items.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...items, { product, quantity: 1 }];
        });
    }

    removeFromCart(item: CartItem) {
        this.cartItems.update(items => items.filter(i => i !== item));
    }

    checkout() {
        const items = this.cartItems();
        if (items.length === 0) return;

        let message = `Hola, estoy interesado en comprar los siguientes productos en Nena's Store:\n`;
        items.forEach(item => {
            message += `- ${item.product.name} x${item.quantity} - S/. ${(item.product.price * item.quantity).toFixed(2)}\n`;
        });
        message += `\nTotal: S/. ${this.total().toFixed(2)}`;

        window.open(whatsappUrl(message), '_blank');
    }

    checkoutSingleItem(product: Product) {
        let message = `Hola, estoy interesado en comprar el siguiente producto en Nena's Store:\n`;
        message += `- ${product.name} - S/. ${product.price.toFixed(2)}`;

        window.open(whatsappUrl(message), '_blank');
    }
}
