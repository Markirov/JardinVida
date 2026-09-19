import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sprout, LogOut, Package, ClipboardList, Download, Upload, Plus, Save, Bell,
  CheckCircle2, XCircle, CalendarClock, ArrowLeft, RefreshCw, Pencil, ChevronLeft,
  ChevronRight, Info, AlertTriangle, AlertCircle, ShoppingBag
} from 'lucide-react';
import { logoutAdmin } from '../../lib/auth-service';
import {
  subscribeToProducts, subscribeToOrders, updateOrderStatus,
  createProduct, updateProductFields, adjustProductStock,
  subscribeToAppointments, updateAppointmentStatus, importProductsBatch
} from '../../lib/firestore-service';
import { parseAbarrotesCsv } from '../../lib/abarrotes-csv';
import { resolveProductImage, resolveProductImagesBatch, getPlaceholderForCategory } from '../../lib/product-image';
import { calculateCommittedStock, filterAndSortProducts } from '../../lib/stock-metrics';
import { InventoryKpiSummary } from './stock/InventoryKpiSummary';
import { CatalogFiltersBar } from './stock/CatalogFiltersBar';
import { OrderUrgencyBadge } from './orders/OrderUrgencyBadge';

const TABS = [
  { id: 'catalogo', label: 'Catálogo', icon: Package },
  { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { id: 'reservas', label: 'Reservas', icon: CalendarClock },
  { id: 'exportar', label: 'Exportar', icon: Download }
];

const EMPTY_PRODUCT = {
  name: '', category: '', price: '', stock: '', barcode: '',
  format: '', origin: '', description: '', vatRate: '21', minStockAlert: '3', imageUrl: ''
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
    // Audio no disponible (p.ej. autoplay bloqueado)
  }
}

export function AdminDashboard({ userEmail }) {
  const [tab, setTab] = useState('catalogo');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [editedStock, setEditedStock] = useState({});
  const [editedPrice, setEditedPrice] = useState({});
  const [editedOldPrice, setEditedOldPrice] = useState({});
  const [editedImage, setEditedImage] = useState({});
  const [editingImageId, setEditingImageId] = useState(null);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [error, setError] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvError, setCsvError] = useState(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvImportResult, setCsvImportResult] = useState(null);
  const [csvImageProgress, setCsvImageProgress] = useState(null);
  const [isFetchingNewProductImage, setIsFetchingNewProductImage] = useState(false);

  // Estados para Filtros, Búsqueda, Ordenación y Paginación de Stock
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState('stock_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedCommittedProduct, setSelectedCommittedProduct] = useState(null);

  const initialOrdersLoadedRef = useRef(false);
  const prevOrdersCountRef = useRef(0);
  const csvInputRef = useRef(null);

  useEffect(() => {
    const unsubProducts = subscribeToProducts(setProducts, (err) => setError(err.message));
    const unsubOrders = subscribeToOrders((newOrders) => {
      if (initialOrdersLoadedRef.current && newOrders.length > prevOrdersCountRef.current) {
        const latest = newOrders[0];
        setNewOrderAlert(latest);
        playAlertBeep();
      }
      initialOrdersLoadedRef.current = true;
      prevOrdersCountRef.current = newOrders.length;
      setOrders(newOrders);
    }, (err) => setError(err.message));
    const unsubAppointments = subscribeToAppointments(setAppointments, (err) => setError(err.message));

    return () => {
      unsubProducts();
      unsubOrders();
      unsubAppointments();
    };
  }, []);

  // Calcular mapa de stock comprometido
  const committedMap = useMemo(() => calculateCommittedStock(orders), [orders]);

  // Filtrado y ordenación
  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(products, {
      searchQuery,
      stockFilter,
      categoryFilter,
      sortOption,
      committedMap
    });
  }, [products, searchQuery, stockFilter, categoryFilter, sortOption, committedMap]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Ajustar página si se sobrepasa
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleOrderStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveStock = async (productId) => {
    const value = Number(editedStock[productId]);
    if (!Number.isFinite(value) || value < 0) return;
    try {
      await updateProductFields(productId, { stock: value });
      setEditedStock((prev) => { const next = { ...prev }; delete next[productId]; return next; });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickStockAdjust = async (productId, delta) => {
    try {
      await adjustProductStock(productId, delta);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSavePrice = async (productId) => {
    const value = Number(editedPrice[productId]);
    if (!Number.isFinite(value) || value < 0) return;
    try {
      await updateProductFields(productId, { price: value });
      setEditedPrice((prev) => { const next = { ...prev }; delete next[productId]; return next; });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveOldPrice = async (productId) => {
    const raw = editedOldPrice[productId];
    const value = raw === '' ? null : Number(raw);
    if (raw !== '' && (!Number.isFinite(value) || value <= 0)) return;
    try {
      await updateProductFields(productId, { oldPrice: value ?? null });
      setEditedOldPrice((prev) => { const next = { ...prev }; delete next[productId]; return next; });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveImage = async (productId) => {
    const url = editedImage[productId];
    if (url === undefined) return;
    try {
      await updateProductFields(productId, { imageUrl: url });
      setEditedImage((prev) => { const next = { ...prev }; delete next[productId]; return next; });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRefetchImage = async (product) => {
    const url = await resolveProductImage({ barcode: product.barcode, category: product.category });
    await updateProductFields(product.id, { imageUrl: url });
  };

  const toggleActive = async (product) => {
    try {
      await updateProductFields(product.id, { isActive: !product.isActive });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCsvFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    setCsvImportResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const raw = new TextDecoder('iso-8859-1').decode(buffer);
      setCsvPreview(parseAbarrotesCsv(raw));
    } catch (err) {
      setCsvError(err.message);
      setCsvPreview(null);
    }
  };

  const handleConfirmCsvImport = async () => {
    if (!csvPreview || csvPreview.valid.length === 0) return;
    setIsImportingCsv(true);
    setCsvError(null);
    try {
      setCsvImageProgress({ done: 0, total: csvPreview.valid.length });
      const images = await resolveProductImagesBatch(csvPreview.valid, {
        onProgress: (done, total) => setCsvImageProgress({ done, total })
      });
      const withImages = csvPreview.valid.map((p, i) => ({ ...p, imageUrl: images[i] }));
      setCsvImageProgress(null);

      await importProductsBatch(withImages);
      setCsvImportResult({ count: withImages.length });
      setCsvPreview(null);
      if (csvInputRef.current) csvInputRef.current.value = '';
    } catch (err) {
      setCsvError(err.message);
    } finally {
      setIsImportingCsv(false);
      setCsvImageProgress(null);
    }
  };

  const handleCancelCsvImport = () => {
    setCsvPreview(null);
    setCsvError(null);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const handleAutoFetchNewProductImage = async () => {
    if (newProduct.imageUrl) return;
    setIsFetchingNewProductImage(true);
    try {
      const url = await resolveProductImage({ barcode: newProduct.barcode, category: newProduct.category });
      setNewProduct((prev) => (prev.imageUrl ? prev : { ...prev, imageUrl: url }));
    } finally {
      setIsFetchingNewProductImage(false);
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
        minStockAlert: Number(newProduct.minStockAlert || 3),
        vatRate: Number(newProduct.vatRate || 21),
        isActive: true
      });
      setNewProduct(EMPTY_PRODUCT);
      setShowNewProduct(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      products,
      orders,
      appointments
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jardin-vida-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="adminDashboard">
      <header className="adminHeader">
        <div className="adminHeaderLeft">
          <a href="/" className="adminBackLink" title="Volver a la tienda">
            <ArrowLeft size={18} />
          </a>
          <Sprout size={28} className="adminLogo" />
          <div>
            <h1>Panel de Control</h1>
            <p className="adminSubtitle">El Jardín de la Vida · {userEmail}</p>
          </div>
        </div>
        <button className="btn secondary" onClick={logoutAdmin}>
          <LogOut size={16} /> Cerrar sesión
        </button>
      </header>

      {newOrderAlert && (
        <aside className="adminNewOrderBanner" role="alert">
          <div className="adminNewOrderContent">
            <Bell size={20} className="adminBellPulse" />
            <div>
              <strong>¡Nuevo pedido recibido!</strong>
              <p>
                #{newOrderAlert.orderId} · {newOrderAlert.customer?.name || 'Cliente'} · {newOrderAlert.total?.toFixed(2)}€
              </p>
            </div>
          </div>
          <div className="adminNewOrderActions">
            <button className="btn primary small" onClick={() => { setTab('pedidos'); setNewOrderAlert(null); }}>
              Ver pedidos
            </button>
            <button className="adminBannerClose" onClick={() => setNewOrderAlert(null)} aria-label="Cerrar aviso">
              ×
            </button>
          </div>
        </aside>
      )}

      {error && (
        <div className="formError adminGlobalError" role="alert">
          {error}
          <button onClick={() => setError(null)} aria-label="Cerrar error">×</button>
        </div>
      )}

      <nav className="adminTabs" role="tablist">
        {TABS.map((t) => {
          const Icon = t.icon;
          const count = t.id === 'catalogo'
            ? products.length
            : t.id === 'pedidos'
              ? orders.length
              : t.id === 'reservas'
                ? appointments.length
                : null;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`adminTab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <Icon size={18} />
              <span>{t.label}</span>
              {count !== null && <span className="adminTabBadge">{count}</span>}
            </button>
          );
        })}
      </nav>

      <main className="adminContent">
        {tab === 'catalogo' && (
          <section>
            <div className="adminSectionHeader">
              <div>
                <h2>Control de Stock y Catálogo</h2>
                <p className="adminSectionDesc">
                  Gestiona existencias, precios, alertas y reposiciones en tiempo real.
                </p>
              </div>
              <div className="adminSectionActions">
                <button
                  className="btn secondary"
                  onClick={() => csvInputRef.current?.click()}
                  disabled={isImportingCsv}
                >
                  <Upload size={18} /> Importar CSV
                </button>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  className="visuallyHidden"
                  onChange={handleCsvFileSelected}
                />
                <button className="btn primary" onClick={() => setShowNewProduct((v) => !v)}>
                  <Plus size={18} /> Nuevo producto
                </button>
              </div>
            </div>

            {/* KPI Cards de Resumen de Stock */}
            <InventoryKpiSummary
              products={products}
              committedMap={committedMap}
              activeFilter={stockFilter}
              onSelectFilter={(f) => {
                setStockFilter(f);
                setCurrentPage(1);
              }}
            />

            {/* Barra de Filtros, Búsqueda y Ordenación */}
            <CatalogFiltersBar
              products={products}
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              stockFilter={stockFilter}
              onStockFilterChange={(f) => {
                setStockFilter(f);
                setCurrentPage(1);
              }}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={(c) => {
                setCategoryFilter(c);
                setCurrentPage(1);
              }}
              sortOption={sortOption}
              onSortOptionChange={setSortOption}
              totalFilteredCount={filteredProducts.length}
              totalProductsCount={products.length}
            />

            {csvImportResult && (
              <div className="adminLowStockNotice" role="status">
                <CheckCircle2 size={16} /> {csvImportResult.count} productos importados/actualizados desde el CSV.
              </div>
            )}

            {csvError && (
              <div className="formError adminInlineError" role="alert">{csvError}</div>
            )}

            {csvPreview && (
              <div className="csvImportPreview">
                <h3>Vista previa de la importación</h3>
                <p>
                  Filas leídas: {csvPreview.total} · Válidas: {csvPreview.valid.length} · Con errores: {csvPreview.invalid.length}
                </p>
                {csvPreview.invalid.length > 0 && (
                  <ul className="csvImportErrors">
                    {csvPreview.invalid.slice(0, 10).map((r) => (
                      <li key={r.row}>Fila {r.row}: {r.errors.join('; ')}</li>
                    ))}
                    {csvPreview.invalid.length > 10 && <li>…y {csvPreview.invalid.length - 10} más.</li>}
                  </ul>
                )}
                <p className="accountEmptyState">
                  Se crearán o actualizarán {csvPreview.valid.length} productos (mismo código de barras = mismo producto, se sobreescribe).
                </p>
                <div className="adminCsvActions">
                  <button
                    className="btn primary"
                    onClick={handleConfirmCsvImport}
                    disabled={isImportingCsv || csvPreview.valid.length === 0}
                  >
                    {isImportingCsv
                      ? (csvImageProgress
                        ? `Buscando imágenes... ${csvImageProgress.done}/${csvImageProgress.total}`
                        : 'Guardando...')
                      : `Confirmar importación (${csvPreview.valid.length})`}
                  </button>
                  <button className="btn secondary" onClick={handleCancelCsvImport} disabled={isImportingCsv}>
                    Cancelar
                  </button>
                </div>
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
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      onBlur={handleAutoFetchNewProductImage} />
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
                      onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                      onBlur={handleAutoFetchNewProductImage} />
                  </div>
                  <div className="formGroup">
                    <label>Stock Mínimo Alerta</label>
                    <input type="number" min="0" value={newProduct.minStockAlert}
                      onChange={(e) => setNewProduct({ ...newProduct, minStockAlert: e.target.value })} />
                  </div>
                </div>
                <div className="formGrid">
                  <div className="formGroup">
                    <label>Formato</label>
                    <input value={newProduct.format}
                      onChange={(e) => setNewProduct({ ...newProduct, format: e.target.value })} />
                  </div>
                  <div className="formGroup">
                    <label>Procedencia / Origen</label>
                    <input value={newProduct.origin}
                      onChange={(e) => setNewProduct({ ...newProduct, origin: e.target.value })} />
                  </div>
                </div>
                <div className="formGroup">
                  <label>Descripción</label>
                  <textarea rows="2" value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                </div>
                <div className="formGroup">
                  <label>Imagen</label>
                  <div className="adminImageFieldRow">
                    {newProduct.imageUrl && (
                      <img className="adminImagePreview" src={newProduct.imageUrl} alt="" />
                    )}
                    <input
                      value={newProduct.imageUrl}
                      placeholder={isFetchingNewProductImage ? 'Buscando imagen...' : 'https://... (se autocompleta al salir del código de barras)'}
                      onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    />
                  </div>
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
                    <th>Imagen</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Precio anterior</th>
                    <th>Stock (Físico / Disp.)</th>
                    <th>Ajuste Rápido</th>
                    <th>Visible</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p) => {
                    const minAlert = p.minStockAlert ?? 3;
                    const stock = p.stock ?? 0;
                    const committed = committedMap[p.id]?.committedQty || 0;
                    const available = Math.max(0, stock - committed);

                    let rowClass = '';
                    if (stock === 0) rowClass = 'adminRowOutOfStock';
                    else if (stock <= minAlert) rowClass = 'adminRowLowStock';

                    return (
                      <tr key={p.id} className={rowClass}>
                        <td>
                          <div className="adminImageCell">
                            <img
                              className="adminImageThumb"
                              src={p.imageUrl || getPlaceholderForCategory(p.category)}
                              alt=""
                            />
                            <div className="adminImageCellActions">
                              <button
                                className="adminImageCellBtn"
                                onClick={() => handleRefetchImage(p)}
                                aria-label="Volver a buscar imagen automáticamente"
                                title="Volver a buscar imagen automáticamente"
                              >
                                <RefreshCw size={12} />
                              </button>
                              <button
                                className="adminImageCellBtn"
                                onClick={() => setEditingImageId(editingImageId === p.id ? null : p.id)}
                                aria-label="Poner imagen manualmente"
                                title="Poner imagen manualmente"
                              >
                                <Pencil size={12} />
                              </button>
                            </div>
                            {editingImageId === p.id && (
                              <div className="adminImageUrlEdit">
                                <input
                                  type="text"
                                  placeholder="https://..."
                                  value={editedImage[p.id] ?? p.imageUrl ?? ''}
                                  onChange={(e) => setEditedImage({ ...editedImage, [p.id]: e.target.value })}
                                />
                                <button
                                  onClick={async () => { await handleSaveImage(p.id); setEditingImageId(null); }}
                                  aria-label="Guardar imagen"
                                >
                                  <Save size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="adminProductNameCell">
                            <strong>{p.name}</strong>
                            {p.barcode && <small className="adminProductBarcode">EAN: {p.barcode}</small>}
                            {p.format && <small className="adminProductFormat">{p.format}</small>}
                          </div>
                        </td>
                        <td>
                          <span className="adminCategoryBadge">{p.category || 'General'}</span>
                        </td>
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
                              type="number" step="0.01" min="0"
                              placeholder="—"
                              value={editedOldPrice[p.id] ?? p.oldPrice ?? ''}
                              onChange={(e) => setEditedOldPrice({ ...editedOldPrice, [p.id]: e.target.value })}
                            />
                            {editedOldPrice[p.id] !== undefined && editedOldPrice[p.id] !== (p.oldPrice ?? '') && (
                              <button onClick={() => handleSaveOldPrice(p.id)} aria-label="Guardar precio anterior">
                                <Save size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="adminStockCell">
                            <div className="adminInlineEdit">
                              <input
                                type="number" min="0"
                                value={editedStock[p.id] ?? p.stock}
                                onChange={(e) => setEditedStock({ ...editedStock, [p.id]: e.target.value })}
                                title="Editar stock físico total"
                              />
                              {editedStock[p.id] !== undefined && Number(editedStock[p.id]) !== p.stock && (
                                <button onClick={() => handleSaveStock(p.id)} aria-label="Guardar stock">
                                  <Save size={14} />
                                </button>
                              )}
                            </div>

                            {/* Indicador de stock comprometido / disponible */}
                            {committed > 0 ? (
                              <button
                                type="button"
                                className="adminCommittedBtn"
                                onClick={() => setSelectedCommittedProduct({ product: p, details: committedMap[p.id] })}
                                title="Ver pedidos que comprometen este stock"
                              >
                                <ShoppingBag size={12} />
                                <span><strong>{available}</strong> disp. ({committed} en pedidos)</span>
                              </button>
                            ) : (
                              <span className={`adminStockStatusBadge ${stock === 0 ? 'badgeOut' : stock <= minAlert ? 'badgeLow' : 'badgeOk'}`}>
                                {stock === 0 ? 'Agotado' : stock <= minAlert ? `Bajo (min ${minAlert})` : 'OK'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="quickAddGroup">
                            <button
                              type="button"
                              className="quickAddBtn"
                              onClick={() => handleQuickStockAdjust(p.id, 1)}
                              title="Añadir +1 ud"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              className="quickAddBtn"
                              onClick={() => handleQuickStockAdjust(p.id, 5)}
                              title="Añadir +5 uds"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              className="quickAddBtn"
                              onClick={() => handleQuickStockAdjust(p.id, 10)}
                              title="Añadir +10 uds"
                            >
                              +10
                            </button>
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
                    );
                  })}
                  {paginatedProducts.length === 0 && (
                    <tr>
                      <td colSpan="8" className="adminEmptyTable">
                        No se encontraron productos con los filtros y búsqueda actuales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {filteredProducts.length > 0 && (
              <div className="adminPaginationBar">
                <div className="adminPaginationInfo">
                  Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredProducts.length)} de {filteredProducts.length} productos
                </div>

                <div className="adminPaginationControls">
                  <div className="adminPageSizeSelector">
                    <label htmlFor="pageSizeSelect">Mostrar:</label>
                    <select
                      id="pageSizeSelect"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={25}>25 por pág.</option>
                      <option value={50}>50 por pág.</option>
                      <option value={100}>100 por pág.</option>
                      <option value={500}>500 por pág.</option>
                    </select>
                  </div>

                  <div className="adminPageNav">
                    <button
                      type="button"
                      className="adminPageBtn"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="adminPageCurrent">
                      Página <strong>{currentPage}</strong> de {totalPages}
                    </span>
                    <button
                      type="button"
                      className="adminPageBtn"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      aria-label="Página siguiente"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Detalle de Stock Comprometido */}
            {selectedCommittedProduct && (
              <div className="adminModalOverlay" onClick={() => setSelectedCommittedProduct(null)}>
                <div className="adminModalContent" onClick={(e) => e.stopPropagation()}>
                  <div className="adminModalHeader">
                    <div className="adminModalTitleGroup">
                      <ShoppingBag size={20} className="modalIcon" />
                      <div>
                        <h3>Pedidos con stock comprometido</h3>
                        <p>{selectedCommittedProduct.product.name} · Stock físico: {selectedCommittedProduct.product.stock} uds</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="adminModalClose"
                      onClick={() => setSelectedCommittedProduct(null)}
                      aria-label="Cerrar modal"
                    >
                      ×
                    </button>
                  </div>

                  <div className="adminModalBody">
                    <div className="committedSummaryBanner">
                      <div>
                        <span className="committedSummaryLabel">Total comprometido:</span>
                        <strong>{selectedCommittedProduct.details.committedQty} uds</strong>
                      </div>
                      <div>
                        <span className="committedSummaryLabel">Disponible real:</span>
                        <strong>{Math.max(0, (selectedCommittedProduct.product.stock || 0) - selectedCommittedProduct.details.committedQty)} uds</strong>
                      </div>
                    </div>

                    <table className="committedOrdersTable">
                      <thead>
                        <tr>
                          <th>Pedido</th>
                          <th>Cliente</th>
                          <th>Tipo entrega</th>
                          <th>Cantidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCommittedProduct.details.orders.map((o, idx) => (
                          <tr key={`${o.orderId}-${idx}`}>
                            <td><strong>#{o.orderId}</strong></td>
                            <td>{o.customerName}</td>
                            <td>
                              <span className={`adminSourceBadge ${o.shippingMethod === 'recogida' ? 'tienda_tpv' : ''}`}>
                                {o.shippingMethod === 'recogida' ? 'Recogida tienda' : 'Envío domicilio'}
                              </span>
                            </td>
                            <td><span className="badgeQuantity">{o.quantity} uds</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="adminModalFooter">
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => {
                        setSelectedCommittedProduct(null);
                        setTab('pedidos');
                      }}
                    >
                      Ir a gestionar pedidos
                    </button>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => setSelectedCommittedProduct(null)}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'pedidos' && (
          <section>
            <div className="adminSectionHeader">
              <div>
                <h2>Gestión de Pedidos ({orders.length})</h2>
                <p className="adminSectionDesc">
                  Priorización inteligente: pedidos de recogida inmediata y envíos urgentes destacados.
                </p>
              </div>
            </div>

            <div className="adminOrdersList">
              {orders.map((order) => {
                const isUrgent = order.shippingMethod === 'recogida' || order.deliveryMethod === 'recogida';
                return (
                  <article
                    key={order.id}
                    className={`adminOrderCard status-${order.status} ${order.status === 'pendiente_preparacion' && isUrgent ? 'cardUrgentHighlight' : ''}`}
                  >
                    <div className="adminOrderCardHeader">
                      <div className="adminOrderHeaderLeft">
                        <strong>#{order.orderId}</strong>
                        <span className={`adminSourceBadge ${order.source}`}>
                          {order.source === 'tienda_tpv' ? 'TPV mostrador' : 'Web online'}
                        </span>
                        <span className="adminOrderStatus">{order.status}</span>
                      </div>
                      <OrderUrgencyBadge order={order} />
                    </div>
                    <div className="adminOrderCardBody">
                      <span><strong>Cliente:</strong> {order.customer?.name || 'Venta de mostrador'}</span>
                      <span><strong>Artículos:</strong> {order.items?.length || 0} artículo{(order.items?.length || 0) > 1 ? 's' : ''}</span>
                      <span><strong>Total:</strong> {order.total?.toFixed(2)}€</span>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="adminOrderItemsBreakdown">
                        <small>
                          {order.items.map((it) => `${it.quantity || 1}x ${it.name}`).join(' · ')}
                        </small>
                      </div>
                    )}

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
                );
              })}
              {orders.length === 0 && <p className="posEmptyTicket">Todavía no hay pedidos.</p>}
            </div>
          </section>
        )}

        {tab === 'reservas' && (
          <section>
            <h2>Solicitudes de cita ({appointments.length})</h2>
            <div className="adminOrdersList">
              {appointments.map((ap) => (
                <article key={ap.id} className={`adminOrderCard status-${ap.status === 'pendiente' ? 'pendiente_preparacion' : ap.status}`}>
                  <div className="adminOrderCardHeader">
                    <strong>#{ap.appointmentId}</strong>
                    <span className={`adminSourceBadge ${ap.type === 'recogida_pedido' ? 'tienda_tpv' : ''}`}>
                      {ap.type === 'recogida_pedido' ? 'Recogida de pedido' : 'Asesoramiento'}
                    </span>
                    <span className="adminOrderStatus">{ap.status}</span>
                  </div>
                  <div className="adminOrderCardBody">
                    <span>{ap.name} ({ap.phone})</span>
                    <span>{ap.preferredDate} a las {ap.preferredTime}</span>
                    {ap.service && <span>{ap.service}</span>}
                    {ap.orderId && <span>Pedido {ap.orderId}</span>}
                  </div>
                  {ap.notes && <p className="adminAppointmentNotes">{ap.notes}</p>}
                  {ap.status === 'pendiente' && (
                    <div className="adminOrderActions">
                      <button className="btn primary" onClick={() => handleAppointmentStatus(ap.id, 'confirmada')}>
                        <CheckCircle2 size={16} /> Confirmar
                      </button>
                      <button className="btn secondary" onClick={() => handleAppointmentStatus(ap.id, 'cancelada')}>
                        <XCircle size={16} /> Rechazar
                      </button>
                    </div>
                  )}
                </article>
              ))}
              {appointments.length === 0 && <p className="posEmptyTicket">Todavía no hay solicitudes de cita.</p>}
            </div>
          </section>
        )}

        {tab === 'exportar' && (
          <section>
            <h2>Exportación de datos</h2>
            <p className="adminExportHint">
              Descarga una copia de seguridad del catálogo, pedidos y solicitudes de cita en formato JSON.
            </p>
            <button className="btn primary" onClick={exportData}>
              <Download size={18} /> Exportar productos + pedidos + reservas (JSON)
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
