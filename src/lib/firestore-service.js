import {
  collection, doc, getDoc, onSnapshot, runTransaction, query, where, orderBy, limit,
  updateDoc, setDoc, deleteDoc, writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './auth-service';

// Capa de abstracción sobre el SDK de Firestore (Fase 2.1/2.2/2.3 del plan de migración).

export function subscribeToProducts(onChange, onError) {
  return onSnapshot(
    collection(db, 'products'),
    (snapshot) => onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

function generateFriendlyOrderId() {
  return 'JV-' + Math.floor(1000 + Math.random() * 9000);
}

// Descuenta stock de cart en una transacción y registra el stock_movement correspondiente.
// Compartido por el checkout web (Fase 2) y la venta de mostrador TPV (Fase 3).
function applyStockDecrement(transaction, cart, productRefs, movementType) {
  const productSnaps = productRefs.map((ref) => transaction.get(ref));
  return Promise.all(productSnaps).then((snaps) => {
    snaps.forEach((snap, idx) => {
      const cartItem = cart[idx];
      if (!snap.exists()) {
        throw new Error(`El producto "${cartItem.name}" ya no está disponible.`);
      }
      const currentStock = snap.data().stock ?? 0;
      if (currentStock < cartItem.quantity) {
        throw new Error(`Stock insuficiente de "${cartItem.name}" (quedan ${currentStock}).`);
      }
    });

    snaps.forEach((snap, idx) => {
      const cartItem = cart[idx];
      const previousStock = snap.data().stock ?? 0;
      const newStock = previousStock - cartItem.quantity;

      transaction.update(productRefs[idx], { stock: newStock, updatedAt: new Date().toISOString() });

      const movementRef = doc(collection(db, 'stock_movements'));
      transaction.set(movementRef, {
        id: movementRef.id,
        productId: cartItem.id,
        type: movementType,
        quantityDelta: -cartItem.quantity,
        previousStock,
        newStock,
        timestamp: new Date().toISOString()
      });
    });
  });
}

// Transacción atómica: verifica stock, lo descuenta, registra el movimiento y crea el pedido
// en una sola operación indivisible (evita vender el mismo último artículo dos veces en simultáneo).
export async function placeOrderTransaction({ cart, customer, shippingMethod, paymentMethod, notes, shippingCost, subtotal, total }) {
  if (cart.length === 0) throw new Error('El carrito está vacío.');

  const orderRef = doc(collection(db, 'orders'));
  const orderId = generateFriendlyOrderId();
  const productRefs = cart.map((item) => doc(db, 'products', item.id));
  const userId = auth.currentUser?.uid;

  await runTransaction(db, async (transaction) => {
    await applyStockDecrement(transaction, cart, productRefs, 'sale_online');

    transaction.set(orderRef, {
      orderId,
      source: 'web_online',
      date: new Date().toISOString(),
      items: cart.map(({ id, name, quantity, price, vatRate }) => ({
        productId: id, name, quantity, price, vatRate: vatRate ?? null
      })),
      customer,
      deliveryMethod: shippingMethod === 'envio' ? 'envio_domicilio' : 'recogida_tienda',
      paymentMethod,
      subtotal,
      shippingCost,
      total,
      status: 'pendiente_preparacion',
      notes: notes || '',
      ...(userId ? { userId } : {})
    });
  });

  return {
    orderId,
    date: new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }),
    items: cart,
    customer,
    shippingMethod,
    shippingCost,
    subtotal,
    total,
    paymentMethod,
    notes
  };
}

// Venta de mostrador (TPV): misma garantía atómica que el checkout web, pero sin cliente/envío,
// pagada y completada al instante (source 'tienda_tpv', movimiento 'sale_pos'). Requiere sesión
// de cajero/admin (las reglas permiten esto vía isAdmin()).
export async function placePosSaleTransaction({ cart, paymentMethod, cashReceived }) {
  if (cart.length === 0) throw new Error('El ticket está vacío.');

  const orderRef = doc(collection(db, 'orders'));
  const orderId = generateFriendlyOrderId();
  const productRefs = cart.map((item) => doc(db, 'products', item.id));
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;

  await runTransaction(db, async (transaction) => {
    await applyStockDecrement(transaction, cart, productRefs, 'sale_pos');

    transaction.set(orderRef, {
      orderId,
      source: 'tienda_tpv',
      date: new Date().toISOString(),
      items: cart.map(({ id, name, quantity, price, vatRate }) => ({
        productId: id, name, quantity, price, vatRate: vatRate ?? null
      })),
      deliveryMethod: 'venta_directa_caja',
      paymentMethod,
      subtotal,
      shippingCost: 0,
      total,
      status: 'completado',
      notes: ''
    });
  });

  return {
    orderId,
    date: new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }),
    items: cart,
    paymentMethod,
    subtotal,
    total,
    cashReceived: paymentMethod === 'efectivo' ? cashReceived : undefined,
    change: paymentMethod === 'efectivo' ? Math.max(0, (cashReceived ?? 0) - total) : undefined
  };
}

// ============================
// Fase 4 — Panel de Administración
// ============================

function slugify(text) {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function subscribeToOrders(onChange, onError, { limitCount = 100 } = {}) {
  return onSnapshot(
    query(collection(db, 'orders'), orderBy('date', 'desc'), limit(limitCount)),
    (snapshot) => onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export async function updateOrderStatus(orderDocId, status) {
  await updateDoc(doc(db, 'orders', orderDocId), { status });
}

// Alta de producto nuevo (admin). Genera un id legible a partir del nombre si no se indica.
export async function createProduct(product) {
  const id = product.id?.trim() || `jv-${slugify(product.name)}`;
  await setDoc(doc(db, 'products', id), {
    ...product,
    id,
    isActive: product.isActive ?? true,
    updatedAt: new Date().toISOString()
  });
  return id;
}

// Edición de campos de un producto existente (precio, nombre, descripción, visibilidad...).
// Para cambios de stock usar adjustProductStock (deja rastro en stock_movements).
export async function updateProductFields(productId, fields) {
  await updateDoc(doc(db, 'products', productId), { ...fields, updatedAt: new Date().toISOString() });
}

export async function deleteProduct(productId) {
  await deleteDoc(doc(db, 'products', productId));
}

// Importación masiva desde CSV (panel admin): sube/actualiza productos en lotes de
// como máximo 400 escrituras (el límite de Firestore por batch es 500).
export async function importProductsBatch(products) {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((p) => batch.set(doc(db, 'products', p.id), p));
    await batch.commit();
  }
}

// Ajuste manual de stock (recuento, rotura, reposición fuera de un pedido) — transacción
// atómica que además deja rastro en stock_movements con type 'adjustment'.
export async function adjustProductStock(productId, newStock, reason) {
  const productRef = doc(db, 'products', productId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(productRef);
    if (!snap.exists()) throw new Error('El producto ya no existe.');
    const previousStock = snap.data().stock ?? 0;
    if (newStock === previousStock) return;

    transaction.update(productRef, { stock: newStock, updatedAt: new Date().toISOString() });

    const movementRef = doc(collection(db, 'stock_movements'));
    transaction.set(movementRef, {
      id: movementRef.id,
      productId,
      type: 'adjustment',
      quantityDelta: newStock - previousStock,
      previousStock,
      newStock,
      reason: reason || '',
      timestamp: new Date().toISOString()
    });
  });
}

// ============================
// Reservas / Citas (appointments)
// ============================

function generateFriendlyAppointmentId() {
  return 'CITA-' + Math.floor(1000 + Math.random() * 9000);
}

// Creación pública (cliente anónimo) de una solicitud de cita o recogida de pedido.
export async function createAppointment(data) {
  const appointmentId = generateFriendlyAppointmentId();
  const ref = doc(collection(db, 'appointments'));
  const userId = auth.currentUser?.uid;
  await setDoc(ref, {
    ...data,
    appointmentId,
    status: 'pendiente',
    createdAt: new Date().toISOString(),
    ...(userId ? { userId } : {})
  });
  return appointmentId;
}

export function subscribeToAppointments(onChange, onError, { limitCount = 100 } = {}) {
  return onSnapshot(
    query(collection(db, 'appointments'), orderBy('createdAt', 'desc'), limit(limitCount)),
    (snapshot) => onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export async function updateAppointmentStatus(appointmentDocId, status) {
  await updateDoc(doc(db, 'appointments', appointmentDocId), { status });
}

// ============================
// Acceso unificado (admin / ficha de cliente)
// ============================

export async function checkIsAdmin(uid) {
  const snap = await getDoc(doc(db, 'admins', uid));
  return snap.exists();
}

export function subscribeToMyOrders(uid, onChange, onError) {
  return onSnapshot(
    query(collection(db, 'orders'), where('userId', '==', uid)),
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      orders.sort((a, b) => (a.date < b.date ? 1 : -1));
      onChange(orders);
    },
    onError
  );
}

export function subscribeToMyAppointments(uid, onChange, onError) {
  return onSnapshot(
    query(collection(db, 'appointments'), where('userId', '==', uid)),
    (snapshot) => {
      const appointments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      appointments.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      onChange(appointments);
    },
    onError
  );
}

export async function getCustomerProfile(uid) {
  const snap = await getDoc(doc(db, 'customers', uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveCustomerProfile(uid, { name, phone, email }) {
  await setDoc(doc(db, 'customers', uid), {
    name: name || '',
    phone: phone || '',
    email: email || '',
    updatedAt: new Date().toISOString()
  });
}
