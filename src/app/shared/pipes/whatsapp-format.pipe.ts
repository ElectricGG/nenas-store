import { Pipe, PipeTransform } from '@angular/core';

/**
 * Convierte el formato de WhatsApp a HTML para mostrar descripciones.
 * Por ahora solo negritas: *texto* pasa a <strong>texto</strong>.
 *
 * El texto original se escapa ANTES de agregar las etiquetas, así que nada
 * de lo que venga en la descripción puede inyectar HTML. Lo único que
 * sobrevive como etiqueta es lo que genera este pipe.
 */
@Pipe({
    name: 'whatsappFormat',
    standalone: true
})
export class WhatsappFormatPipe implements PipeTransform {

    // Un par de asteriscos en la misma línea, sin asteriscos adentro
    private readonly NEGRITA = /\*([^*\n]+)\*/g;

    transform(text: string | null | undefined): string {
        const escaped = this.escapeHtml(text || '');

        return escaped.replace(this.NEGRITA, (match, contenido: string) => {
            // "5 * 4 * 3" no debe volverse negrita: WhatsApp tampoco lo hace
            if (/^\s|\s$/.test(contenido)) return match;
            return `<strong>${contenido}</strong>`;
        });
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
