// Parser puro (sin dependencias de Node) del export CSV de Abarrotes PDV -> ProductDocument.
// Compartido por el script de línea de comandos (scripts/import-abarrotes-csv.mjs) y el
// importador desde el panel de administración (src/components/admin/AdminDashboard.jsx).
//
// Formato esperado (delimitador ; o , autodetectado):
//   Codigo;Descripcion;Categoria;PrecioCoste;PrecioVenta;IVA;Existencia;StockMinimo;PrecioOferta

export const REQUIRED_HEADERS = ['Codigo', 'Descripcion', 'PrecioVenta', 'Existencia'];

export function detectDelimiter(headerLine) {
  return headerLine.split(';').length > headerLine.split(',').length ? ';' : ',';
}

export function parseCsv(raw) {
  const text = raw.replace(/^﻿/, '').trim();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error('CSV vacío o sin filas de datos.');

  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter).map((h) => h.trim());

  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw new Error(`Faltan columnas obligatorias en el CSV: ${missing.join(', ')}`);
  }

  return lines.slice(1).map((line, idx) => {
    const cells = line.split(delimiter).map((c) => c.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ''; });
    row.__rowNumber = idx + 2;
    return row;
  });
}

export function toNumber(value, fallback = 0) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function slugify(text) {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function mapToProduct(row) {
  const errors = [];
  if (!row.Codigo) errors.push('Codigo vacío');
  if (!row.Descripcion) errors.push('Descripcion vacía');

  const price = toNumber(row.PrecioVenta, NaN);
  if (!Number.isFinite(price) || price <= 0) errors.push(`PrecioVenta inválido ("${row.PrecioVenta}")`);

  const stock = toNumber(row.Existencia, NaN);
  if (!Number.isFinite(stock) || stock < 0) errors.push(`Existencia inválida ("${row.Existencia}")`);

  if (errors.length > 0) return { ok: false, row: row.__rowNumber, errors };

  const oldPrice = toNumber(row.PrecioOferta, undefined);

  const product = {
    id: `jv-${slugify(row.Codigo)}`,
    barcode: row.Codigo,
    name: row.Descripcion,
    category: row.Categoria || 'Sin categorizar',
    description: row.Descripcion,
    format: '',
    origin: '',
    price,
    ...(Number.isFinite(oldPrice) && oldPrice > price ? { oldPrice } : {}),
    costPrice: toNumber(row.PrecioCoste, undefined),
    vatRate: toNumber(row.IVA, 21),
    stock: Math.round(stock),
    minStockAlert: Math.round(toNumber(row.StockMinimo, 3)),
    imageUrl: '',
    isActive: true,
    updatedAt: new Date().toISOString()
  };

  return { ok: true, product };
}

// Parsea el CSV completo y separa filas válidas de filas con error.
export function parseAbarrotesCsv(raw) {
  const rows = parseCsv(raw);
  const results = rows.map(mapToProduct);
  return {
    total: rows.length,
    valid: results.filter((r) => r.ok).map((r) => r.product),
    invalid: results.filter((r) => !r.ok)
  };
}
