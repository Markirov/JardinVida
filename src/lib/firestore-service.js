import { collection, doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

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

// Transacción atómica: verifica stock, lo descuenta, registra el movimiento y crea el pedido
// en una sola operación indivisible (evita vender el mismo último artículo dos veces en simultáneo).
export async function placeOrderTransaction({ cart, customer, shippingMethod, paymentMethod, notes, shippingCost, subtotal, total }) {
  if (cart.length === 0) throw new Error('El carrito está vacío.');

  const orderRef = doc(collection(db, 'orders'));
  const orderId = generateFriendlyOrderId();
  const productRefs = cart.map((item) => doc(db, 'products', item.id));

  await runTransaction(db, async (transaction) => {
    const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));

    productSnaps.forEach((snap, idx) => {
      const cartItem = cart[idx];
      if (!snap.exists()) {
        throw new Error(`El producto "${cartItem.name}" ya no está disponible.`);
      }
      const currentStock = snap.data().stock ?? 0;
      if (currentStock < cartItem.quantity) {
        throw new Error(`Stock insuficiente de "${cartItem.name}" (quedan ${currentStock}).`);
      }
    });

    productSnaps.forEach((snap, idx) => {
      const cartItem = cart[idx];
      const previousStock = snap.data().stock ?? 0;
      const newStock = previousStock - cartItem.quantity;

      transaction.update(productRefs[idx], { stock: newStock, updatedAt: new Date().toISOString() });

      const movementRef = doc(collection(db, 'stock_movements'));
      transaction.set(movementRef, {
        id: movementRef.id,
        productId: cartItem.id,
        type: 'sale_online',
        quantityDelta: -cartItem.quantity,
        previousStock,
        newStock,
        timestamp: new Date().toISOString()
      });
    });

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
      notes: notes || ''
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
