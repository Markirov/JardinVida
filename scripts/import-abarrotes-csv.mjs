#!/usr/bin/env node
// Fase 1.1/1.2 — Parser de export CSV de Abarrotes PDV -> ProductDocument (Firestore).
// Uso:
//   node scripts/import-abarrotes-csv.mjs <ruta.csv>              (dry-run, imprime + guarda preview JSON)
//   node scripts/import-abarrotes-csv.mjs <ruta.csv> --commit     (sube a Firestore, requiere credenciales VITE_FIREBASE_*)
//
// Formato esperado (export real de Abarrotes PDV, delimitador ; o , autodetectado):
//   Codigo;Descripcion;Categoria;PrecioCoste;PrecioVenta;IVA;Existencia;StockMinimo

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf-8').split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match || line.trim().startsWith('#')) continue;
    const [, key, rawValue] = match;
    if (process.env[key] === undefined) {
      process.env[key] = rawValue.replace(/^["']|["']$/g, '');
    }
  }
}
loadEnvFile(resolve('.env'));

const REQUIRED_HEADERS = ['Codigo', 'Descripcion', 'PrecioVenta', 'Existencia'];

function detectDelimiter(headerLine) {
  return headerLine.split(';').length > headerLine.split(',').length ? ';' : ',';
}

function parseCsv(raw) {
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

function toNumber(value, fallback = 0) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function slugify(text) {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function mapToProduct(row) {
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

async function commitToFirestore(products) {
  const requiredEnv = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID'];
  const missingEnv = requiredEnv.filter((k) => !process.env[k]);
  if (missingEnv.length > 0) {
    console.error(`\n✗ No se puede subir a Firestore: faltan variables de entorno (${missingEnv.join(', ')}).`);
    console.error('  Configura .env con las credenciales del proyecto Firebase real antes de usar --commit.\n');
    process.exitCode = 1;
    return;
  }

  const { initializeApp } = await import('firebase/app');
  const { getFirestore, writeBatch, doc } = await import('firebase/firestore');
  const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');

  const app = initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
  });

  // Las reglas exigen request.auth != null para escribir en products; el script se
  // autentica como admin antes de subir el catálogo (ADMIN_EMAIL / ADMIN_PASSWORD en .env).
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const auth = getAuth(app);
    await signInWithEmailAndPassword(auth, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
  } else {
    console.error('\n✗ Faltan ADMIN_EMAIL / ADMIN_PASSWORD en .env (las reglas de Firestore exigen usuario autenticado para escribir productos).\n');
    process.exitCode = 1;
    return;
  }

  const db = getFirestore(app);
  const batch = writeBatch(db);
  products.forEach((p) => batch.set(doc(db, 'products', p.id), p));
  await batch.commit();
  console.log(`\n✓ ${products.length} productos subidos a la colección "products" de Firestore.\n`);
}

async function main() {
  const csvPath = process.argv[2];
  const commit = process.argv.includes('--commit');

  if (!csvPath) {
    console.error('Uso: node scripts/import-abarrotes-csv.mjs <ruta.csv> [--commit]');
    process.exitCode = 1;
    return;
  }

  const raw = readFileSync(resolve(csvPath), 'latin1');
  const rows = parseCsv(raw);
  const results = rows.map(mapToProduct);

  const valid = results.filter((r) => r.ok).map((r) => r.product);
  const invalid = results.filter((r) => !r.ok);

  console.log(`\nFilas leídas: ${rows.length}`);
  console.log(`Válidas: ${valid.length}  |  Con errores: ${invalid.length}\n`);

  if (invalid.length > 0) {
    console.log('Errores encontrados:');
    invalid.forEach((r) => console.log(`  Fila ${r.row}: ${r.errors.join('; ')}`));
    console.log('');
  }

  console.table(valid.map((p) => ({
    id: p.id, barcode: p.barcode, name: p.name, category: p.category,
    price: p.price, stock: p.stock, minStockAlert: p.minStockAlert
  })));

  const previewPath = resolve('scripts/fixtures/abarrotes-import-preview.json');
  writeFileSync(previewPath, JSON.stringify(valid, null, 2), 'utf-8');
  console.log(`Preview guardado en ${previewPath}`);

  if (commit) {
    await commitToFirestore(valid);
  } else {
    console.log('\n(dry-run — usa --commit para subir a Firestore con credenciales reales)\n');
  }
}

main()
  .catch((err) => {
    console.error(`\n✗ ${err.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode ?? 0));
