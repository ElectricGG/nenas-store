import { Injectable, Renderer2, RendererFactory2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class CartAnimationService {
    private renderer: Renderer2;

    constructor(rendererFactory: RendererFactory2, @Inject(DOCUMENT) private document: Document) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    animateFlyToCart(sourceElement: HTMLElement, imageSrc: string) {
        const targetElement = this.document.getElementById('cart-icon-target');
        if (!targetElement || !sourceElement) return;

        const startRect = sourceElement.getBoundingClientRect();
        const endRect = targetElement.getBoundingClientRect();

        // Create the flying image
        const flyingImage = this.renderer.createElement('img');
        this.renderer.setAttribute(flyingImage, 'src', imageSrc);

        // Initial Styles
        this.renderer.setStyle(flyingImage, 'position', 'fixed');
        this.renderer.setStyle(flyingImage, 'top', `${startRect.top}px`);
        this.renderer.setStyle(flyingImage, 'left', `${startRect.left}px`);
        this.renderer.setStyle(flyingImage, 'width', `${startRect.width}px`);
        this.renderer.setStyle(flyingImage, 'height', `${startRect.height}px`);
        this.renderer.setStyle(flyingImage, 'object-fit', 'cover');
        this.renderer.setStyle(flyingImage, 'border-radius', '0.75rem'); // matching rounded-xl
        this.renderer.setStyle(flyingImage, 'z-index', '9999');
        this.renderer.setStyle(flyingImage, 'pointer-events', 'none');
        this.renderer.setStyle(flyingImage, 'transition', 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)'); // Smooth bezier

        this.renderer.appendChild(this.document.body, flyingImage);

        // Trigger Animation (Force reflow)
        void flyingImage.offsetWidth;

        // Target Styles
        this.renderer.setStyle(flyingImage, 'top', `${endRect.top + endRect.height / 4}px`);
        this.renderer.setStyle(flyingImage, 'left', `${endRect.left + endRect.width / 4}px`);
        this.renderer.setStyle(flyingImage, 'width', '20px');
        this.renderer.setStyle(flyingImage, 'height', '20px');
        this.renderer.setStyle(flyingImage, 'opacity', '0.5');
        this.renderer.setStyle(flyingImage, 'border-radius', '50%');

        // Cleanup
        setTimeout(() => {
            this.renderer.removeChild(this.document.body, flyingImage);
        }, 800);
    }
}
