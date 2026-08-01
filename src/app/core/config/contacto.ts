/**
 * Único lugar donde vive el número de WhatsApp de la tienda.
 * Si cambia, se cambia acá y no hay que buscarlo por el código.
 */
export const WHATSAPP_NUMERO = '51923422425';

export function whatsappUrl(mensaje: string): string {
    return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}
