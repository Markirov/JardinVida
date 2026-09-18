import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sprout, LogOut, Package, ClipboardList, Download, Plus, Save, Bell, CheckCircle2, XCircle
} from 'lucide-react';
import { logoutAdmin } from '../../lib/auth-service';
import {
  subscribeToProducts, subscribeToOrders, updateOrderStatus,
  createProduct, updateProductFields, adjustProductStock
} from '../../lib/firestore-service';

const TABS = [
  { id: 'catalogo', label: 'Catálogo', icon: Package },
  { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { id: 'exportar', label: 'Exportar', icon: Download }
];

const EMPTY_PRODUCT = {
  name: '', category: '', price: '', stock: '', barcode: '',
  format: '', origin: '', description: '', vatRate: '21', minStockAlert: '3'
};

function playAlertBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Audio no disponible (p.ej. autoplay bloqueado) — la alerta visual sigue funcionando.
  }
}

export function AdminDashboard({ userEmail }) {
  const [tab, setTab] = useState('catalogo');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editedStock, setEditedStock] = useState({});
  const [editedPrice, setEditedPrice] = useState({});
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [error, setError] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const knownOrderIds = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToProducts(setProducts, (err) => setError(err.message));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (liveOrders) => {
        if (knownOrderIds.current) {
          const newPending = liveOrders.find(
            (o) => !knownOrderIds.current.has(o.id) && o.status === 'pendiente_preparacion'
          );
          if (newPending) {
            playAlertBeep();
            setNewOrderAlert(`Nuevo pedido #${newPending.orderId} recibido`);
          }
        }
        knownOrderIds.current = new Set(liveOrders.map((o) => o.id));
        setOrders(liveOrders);
      },
      (err) => setError(err.message)
    );
    return () => unsubscribe();
  }, []);

  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === 'pendiente_preparacion').length,
    [orders]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.isActive && p.stock <= (p.minStockAlert ?? 0)),
    [products]
  );

  const handleSaveStock = async (productId) => {
    const value = Number(editedStock[productId]);
    if (!Number.isFinite(value) || value < 0) return;
    try {
      await adjustProductStock(productId, value, 'Ajuste manual — Panel Admin');
      setEditedStock((prev) => { const next = { ...prev }; delete next[productId]; return next; });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSavePrice = async (productId) => {
    const value = Number(editedPrice[productId]);
    if (!Number.isFinite(value) || value <= 0) return;
    try {
      await updateProductFields(productId, { price: value });
      setEditedPrice((prev) => { const next = { ...prev }; delete next[productId]; return next; });
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (product) => {
    try {
      await updateProductFields(product.id, { isActive: !product.isActive });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await createProduct({
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        vatRate: Number(newProduct.vatRate),
        minStockAlert: Number(newProduct.minStockAlert)
      });
      setNewProduct(EMPTY_PRODUCT);
      setShowNewProduct(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOrderStatus = async (orderDocId, status) => {
    try {
      await updateOrderStatus(orderDocId, status);
    } catch (err) {
      setError(err.message);
    }
  };

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      products,
      orders
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jardin-vida-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="posScreen">
      <header className="posHeader">
        <div className="posLoginBrand">
          <Sprout size={24} />
          <span>Panel de Administración</span>
        </div>
        <div className="posHeaderRight">
          {pendingCount > 0 && (
            <span className="adminPendingBadge">
              <Bell size={14} /> {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="posUserBadge">{userEmail}</span>
          <button className="btn secondary" onClick={logoutAdmin} aria-label="Cerrar sesión">
            <LogOut size={18} /> Salir
          </button>
        </div>
      </header>

      {newOrderAlert && (
        <div className="adminOrderAlert" role="alert" aria-live="assertive">
          <Bell size={18} /> {newOrderAlert}
          <button onClick={() => setNewOrderAlert(null)} aria-label="Descartar aviso">×</button>
        </div>
      )}

      <nav className="adminTabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`adminTabBtn ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="formError adminInlineError" role="alert">
          {error}
        </div>
      )}

      <main className="adminMain">
        {tab === 'catalogo' && (
          <section>
            <div className="adminSectionHeader">
              <h2>Catálogo ({products.length})</h2>
              <button className="btn primary" onClick={() => setShowNewProduct((v) => !v)}>
                <Plus size={18} /> Nuevo producto
              </button>
            </div>

            {lowStockProducts.length > 0 && (
              <div className="adminLowStockNotice" role="status">
                <Bell size={16} /> {lowStockProducts.length} producto{lowStockProducts.length > 1 ? 's' : ''} bajo mínimo:{' '}
                {lowStockProducts.map((p) => p.name).join(', ')}
              </div>
            )}

            {showNewProduct && (
              <form className="adminNewProductForm" onSubmit={handleCreateProduct}>
                <div className="formGrid">
                  <div className="formGroup">
                    <label>Nombre *</label>
                    <input required value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                  </div>
                  <div className="formGroup">
                    <label>Categoría</label>
                    <input value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
                  </div>
                </div>
                <div className="formGrid">
                  <div className="formGroup">
                    <label>Precio (€) *</label>
                    <input required type="number" step="0.01" min="0" value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
                  </div>
                  <div className="formGroup">
                    <label>Stock inicial *</label>
                    <input required type="number" min="0" value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} />
                  </div>
                </div>
                <div className="formGrid">
                  <div className="formGroup">
                    <label>Código de barras</label>
                    <input value={newProduct.barcode}
                      onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })} />
                  </div>
                  <div className="formGroup">
                    <label>Formato</label>
                    <input value={newProduct.format}
                      onChange={(e) => setNewProduct({ ...newProduct, format: e.target.value })} />
                  </div>
                </div>
                <div className="formGroup">
                  <label>Descripción</label>
                  <textarea rows="2" value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                </div>
                <button type="submit" className="btn primary full">
                  <Save size={18} /> Guardar producto
                </button>
              </form>
            )}

            <div className="adminTableWrap">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Visible</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className={p.stock <= (p.minStockAlert ?? 0) ? 'adminLowStockRow' : ''}>
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td>
                        <div className="adminInlineEdit">
                          <input
                            type="number" step="0.01" min="0"
                            value={editedPrice[p.id] ?? p.price}
                            onChange={(e) => setEditedPrice({ ...editedPrice, [p.id]: e.target.value })}
                          />
                          {editedPrice[p.id] !== undefined && Number(editedPrice[p.id]) !== p.price && (
                            <button onClick={() => handleSavePrice(p.id)} aria-label="Guardar precio">
                              <Save size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="adminInlineEdit">
                          <input
                            type="number" min="0"
                            value={editedStock[p.id] ?? p.stock}
                            onChange={(e) => setEditedStock({ ...editedStock, [p.id]: e.target.value })}
                          />
                          {editedStock[p.id] !== undefined && Number(editedStock[p.id]) !== p.stock && (
                            <button onClick={() => handleSaveStock(p.id)} aria-label="Guardar stock">
                              <Save size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          className={`adminToggle ${p.isActive ? 'on' : 'off'}`}
                          onClick={() => toggleActive(p)}
                        >
                          {p.isActive ? 'Visible' : 'Oculto'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'pedidos' && (
          <section>
            <h2>Pedidos recientes ({orders.length})</h2>
            <div className="adminOrdersList">
              {orders.map((order) => (
                <article key={order.id} className={`adminOrderCard status-${order.status}`}>
                  <div className="adminOrderCardHeader">
                    <strong>#{order.orderId}</strong>
                    <span className={`adminSourceBadge ${order.source}`}>
                      {order.source === 'tienda_tpv' ? 'TPV mostrador' : 'Web online'}
                    </span>
                    <span className="adminOrderStatus">{order.status}</span>
                  </div>
                  <div className="adminOrderCardBody">
                    <span>{order.customer?.name || 'Venta de mostrador'}</span>
                    <span>{order.items.length} artículo{order.items.length > 1 ? 's' : ''}</span>
                    <span>{order.total.toFixed(2)}€</span>
                  </div>
                  {order.status === 'pendiente_preparacion' && (
                    <div className="adminOrderActions">
                      <button className="btn primary" onClick={() => handleOrderStatus(order.id, 'completado')}>
                        <CheckCircle2 size={16} /> Marcar completado
                      </button>
                      <button className="btn secondary" onClick={() => handleOrderStatus(order.id, 'cancelado')}>
                        <XCircle size={16} /> Cancelar
                      </button>
                    </div>
                  )}
                </article>
              ))}
              {orders.length === 0 && <p className="posEmptyTicket">Todavía no hay pedidos.</p>}
            </div>
          </section>
        )}

        {tab === 'exportar' && (
          <section>
            <h2>Exportación de datos</h2>
            <p className="adminExportHint">
              Descarga una copia de seguridad del catálogo y del histórico de pedidos en formato JSON.
            </p>
            <button className="btn primary" onClick={exportData}>
              <Download size={18} /> Exportar productos + pedidos (JSON)
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
