/**
 * Helpers para métricas de stock comprometido, filtros y urgencia de pedidos.
 */

export function calculateCommittedStock(orders = []) {
  const committedMap = {};

  orders.forEach((order) => {
    // Solo pedidos pendientes de preparación comprometen stock físico
    if (order.status !== 'pendiente_preparacion') return;

    (order.items || []).forEach((item) => {
      const prodId = item.productId || item.id;
      if (!prodId) return;

      if (!committedMap[prodId]) {
        committedMap[prodId] = {
          committedQty: 0,
          orders: []
        };
      }

      committedMap[prodId].committedQty += item.quantity || 1;
      committedMap[prodId].orders.push({
        orderId: order.orderId || order.id,
        quantity: item.quantity || 1,
        customerName: order.customer?.name || 'Cliente web',
        shippingMethod: order.shippingMethod || order.deliveryMethod || 'recogida',
        date: order.date || order.createdAt
      });
    });
  });

  return committedMap;
}

export function getOrderUrgency(order) {
  if (!order) return { level: 'normal', label: 'Normal', timeAgo: '', isPickup: false };

  const isPickup =
    order.shippingMethod === 'recogida' ||
    order.deliveryMethod === 'recogida_tienda' ||
    order.deliveryMethod === 'recogida';

  // Si ya está completado o cancelado, urgencia normal
  if (order.status === 'completado' || order.status === 'cancelado') {
    return { level: 'resolved', label: 'Completado', timeAgo: '', isPickup };
  }

  // Parsear fecha
  let createdAtMs = null;
  if (order.createdAt?.toMillis) {
    createdAtMs = order.createdAt.toMillis();
  } else if (order.createdAt) {
    createdAtMs = new Date(order.createdAt).getTime();
  } else if (order.date) {
    const parsed = Date.parse(order.date);
    if (!Number.isNaN(parsed)) createdAtMs = parsed;
  }

  const now = Date.now();
  const diffMinutes = createdAtMs ? Math.floor((now - createdAtMs) / (1000 * 60)) : 0;

  let timeAgo = '';
  if (diffMinutes < 1) timeAgo = 'Ahora mismo';
  else if (diffMinutes < 60) timeAgo = `Hace ${diffMinutes} min`;
  else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    timeAgo = `Hace ${hours} h`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    timeAgo = `Hace ${days} d`;
  }

  // Criterios de urgencia:
  // - Recogida en tienda pendiente > 45 min -> Crítico (el cliente puede llegar en cualquier momento)
  // - Recogida en tienda pendiente <= 45 min -> Alta
  // - Envío a domicilio pendiente > 12h -> Alta
  // - Resto -> Normal
  if (isPickup) {
    if (diffMinutes >= 45) {
      return {
        level: 'critical',
        label: '¡Urgente! Recogida en tienda',
        badgeColor: 'urgencyCritical',
        timeAgo,
        isPickup: true
      };
    }
    return {
      level: 'high',
      label: 'Recogida en tienda (2h)',
      badgeColor: 'urgencyHigh',
      timeAgo,
      isPickup: true
    };
  }

  if (diffMinutes >= 720) {
    return {
      level: 'high',
      label: 'Envío pendiente (>12h)',
      badgeColor: 'urgencyHigh',
      timeAgo,
      isPickup: false
    };
  }

  return {
    level: 'normal',
    label: 'Envío a domicilio',
    badgeColor: 'urgencyNormal',
    timeAgo,
    isPickup: false
  };
}

export function filterAndSortProducts(products = [], options = {}) {
  const {
    searchQuery = '',
    stockFilter = 'all',
    categoryFilter = 'all',
    sortOption = 'stock_asc',
    committedMap = {}
  } = options;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = products.filter((product) => {
    const minAlert = product.minStockAlert ?? 3;
    const committed = committedMap[product.id]?.committedQty || 0;
    const available = Math.max(0, (product.stock || 0) - committed);

    // Filtro por Estado de Stock
    if (stockFilter === 'out_of_stock' && product.stock > 0) return false;
    if (stockFilter === 'low_stock' && (product.stock === 0 || product.stock > minAlert)) return false;
    if (stockFilter === 'healthy' && product.stock <= minAlert) return false;
    if (stockFilter === 'committed' && committed <= 0) return false;

    // Filtro por Categoría
    if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;

    // Buscador
    if (normalizedQuery) {
      const name = (product.name || '').toLowerCase();
      const barcode = (product.barcode || '').toLowerCase();
      const format = (product.format || '').toLowerCase();
      const origin = (product.origin || '').toLowerCase();
      const category = (product.category || '').toLowerCase();

      const matches =
        name.includes(normalizedQuery) ||
        barcode.includes(normalizedQuery) ||
        format.includes(normalizedQuery) ||
        origin.includes(normalizedQuery) ||
        category.includes(normalizedQuery);

      if (!matches) return false;
    }

    return true;
  });

  // Ordenación
  filtered.sort((a, b) => {
    const stockA = a.stock ?? 0;
    const stockB = b.stock ?? 0;
    const priceA = a.price ?? 0;
    const priceB = b.price ?? 0;
    const nameA = (a.name || '').localeCompare(b.name || '', 'es');
    const catA = (a.category || '').localeCompare(b.category || '', 'es');

    switch (sortOption) {
      case 'stock_asc':
        return stockA - stockB;
      case 'stock_desc':
        return stockB - stockA;
      case 'name_asc':
        return nameA;
      case 'name_desc':
        return -nameA;
      case 'price_asc':
        return priceA - priceB;
      case 'price_desc':
        return priceB - priceA;
      case 'category_asc':
        return catA || nameA;
      default:
        return stockA - stockB;
    }
  });

  return filtered;
}
