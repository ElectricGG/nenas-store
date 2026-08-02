import { Product } from '../services/product.service';

/**
 * Búsqueda de productos compartida por el catálogo público y el panel de admin.
 * Se busca en nombre y descripción; los aciertos en el nombre pesan más.
 */

// Marcas diacríticas que NFD separa de su letra base (U+0300 a U+036F).
// Se construye con fromCharCode para no dejar caracteres invisibles en el código.
const DIACRITICOS = new RegExp(
    `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036F)}]`,
    'g'
);

/** Minúsculas y sin tildes, para que "munequera" encuentre "Muñequeras". */
export function normalizeText(text: string | null | undefined): string {
    return (text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(DIACRITICOS, '')
        .trim();
}

/** Divide lo escrito en palabras ya normalizadas. */
export function searchTerms(query: string | null | undefined): string[] {
    return normalizeText(query).split(/\s+/).filter(Boolean);
}

/** Cada palabra buscada debe aparecer en el código, el nombre o la descripción. */
function matches(product: Product, terms: string[]): boolean {
    const haystack = `#${product.codigo} ${normalizeText(product.name)} ${normalizeText(product.description)}`;
    return terms.every(term => haystack.includes(term));
}

function score(product: Product, terms: string[], query: string): number {
    // El código exacto manda sobre todo lo demás: así se nombran los productos
    // en el live ("este es el 34") y quien lo escribe espera caer justo ahí.
    const codigo = String(product.codigo);
    if (query === codigo || query === `#${codigo}`) return 1000;

    const name = normalizeText(product.name);
    const description = normalizeText(product.description);

    let total = 0;
    if (name.startsWith(query)) total += 100;
    else if (name.includes(query)) total += 50;

    for (const term of terms) {
        if (name.includes(term)) total += 10;
        else if (description.includes(term)) total += 1;
    }

    return total;
}

/**
 * Filtra por la consulta y ordena por relevancia.
 * Sin consulta devuelve la lista intacta, conservando su orden original.
 * El índice original desempata, así que se respeta el orden por más reciente.
 */
export function searchProducts(products: Product[], query: string | null | undefined): Product[] {
    const normalized = normalizeText(query);
    const terms = searchTerms(query);
    if (terms.length === 0) return products;

    return products
        .filter(product => matches(product, terms))
        .map((product, index) => ({ product, index, score: score(product, terms, normalized) }))
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map(entry => entry.product);
}
