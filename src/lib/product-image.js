// Resolución automática de imagen de producto: primero intenta Open Food Facts por
// código de barras (base de datos pública, gratis, sin API key); si no hay resultado,
// cae a una imagen genérica por categoría para que el producto nunca quede en blanco.
// El resultado siempre es editable a mano después (es solo un valor de partida).

// Claves normalizadas (minúsculas, sin acentos) para no depender de que el nombre de
// categoría venga exactamente igual desde el CSV, el formulario admin o el filtro público
// — en la práctica llegan con y sin acentos según el origen de los datos.
const CATEGORY_PLACEHOLDERS = {
  'herbolario & fitoterapia': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
  'suplementacion & adaptogenos': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'infusiones & te': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
  'cosmetica natural': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
  'despensa consciente': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
  'dietetica & control de peso': 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=600&q=80'
};

const DEFAULT_PLACEHOLDER = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80';

function normalizeCategory(category) {
  return (category || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function getPlaceholderForCategory(category) {
  return CATEGORY_PLACEHOLDERS[normalizeCategory(category)] || DEFAULT_PLACEHOLDER;
}

// Consulta Open Food Facts por EAN/código de barras. Devuelve la URL de imagen si existe,
// o null si el producto no está en su base o falla la petición (nunca lanza).
export async function fetchImageByBarcode(barcode, { timeoutMs = 4000 } = {}) {
  if (!barcode) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=image_url,image_front_url`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1) return null;
    return data.product?.image_front_url || data.product?.image_url || null;
  } catch {
    return null; // sin conexión, timeout, CORS, etc. — se cae al placeholder por categoría.
  } finally {
    clearTimeout(timeout);
  }
}

// Resuelve la imagen de partida de un producto: Open Food Facts por código de barras,
// si no hay resultado, placeholder genérico por categoría.
export async function resolveProductImage({ barcode, category }) {
  const found = await fetchImageByBarcode(barcode);
  return found || getPlaceholderForCategory(category);
}

// Resuelve imágenes para varios productos a la vez, con un límite de peticiones en
// paralelo para no saturar la API externa en importaciones grandes (CSV de cientos de filas).
export async function resolveProductImagesBatch(products, { concurrency = 8, onProgress } = {}) {
  const results = new Array(products.length);
  let nextIndex = 0;
  let done = 0;

  async function worker() {
    while (nextIndex < products.length) {
      const i = nextIndex++;
      results[i] = await resolveProductImage(products[i]);
      done++;
      onProgress?.(done, products.length);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, products.length) }, worker);
  await Promise.all(workers);
  return results;
}
