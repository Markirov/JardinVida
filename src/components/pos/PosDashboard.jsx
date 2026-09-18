import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sprout, LogOut, ScanBarcode, Trash2, Plus, Minus,
  Banknote, CreditCard, Smartphone, Printer, CheckCircle2, Search
} from 'lucide-react';
import { logoutAdmin } from '../../lib/auth-service';
import { subscribeToProducts, placePosSaleTransaction } from '../../lib/firestore-service';

const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'bizum', label: 'Bizum', icon: Smartphone }
];

export function PosDashboard({ userEmail }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const scanInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (liveProducts) => setProducts(liveProducts),
      (err) => setError('No se pudo conectar con el stock en vivo: ' + err.message)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    scanInputRef.current?.focus();
  }, [receipt]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cashReceivedNumber = Number(cashReceived.replace(',', '.')) || 0;
  const change = Math.max(0, cashReceivedNumber - total);

  const addToCart = (product) => {
    if (!product || product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty >= product.stock) return prev;
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== productId) return item;
          const product = products.find((p) => p.id === productId);
          const maxStock = product ? product.stock : item.quantity;
          const newQty = Math.min(maxStock, item.quantity + delta);
          return { ...item, quantity: newQty };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // El lector de código de barras USB actúa como teclado y termina con Enter. No siempre
  // dispara el submit nativo del <form> (según foco/hardware), así que se captura también
  // por onKeyDown directamente en el input — ruta más fiable para un lector real.
  const tryAddByBarcode = () => {
    const code = searchTerm.trim();
    if (!code) return;
    const match = products.find((p) => p.barcode === code);
    if (match) {
      addToCart(match);
      setSearchTerm('');
    }
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    tryAddByBarcode();
  };

  const handleScanKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      tryAddByBarcode();
    }
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) => p.name?.toLowerCase().includes(term) || p.barcode?.includes(term)
    );
  }, [products, searchTerm]);

  const handleCharge = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'efectivo' && cashReceivedNumber < total) {
      setError('El efectivo recibido es menor que el total.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await placePosSaleTransaction({
        cart,
        paymentMethod,
        cashReceived: paymentMethod === 'efectivo' ? cashReceivedNumber : undefined
      });
      setReceipt(result);
      setCart([]);
      setCashReceived('');
    } catch (err) {
      setError(err.message || 'No se pudo cobrar la venta. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <div className="posScreen">
        <div className="posReceipt">
          <CheckCircle2 size={40} className="posReceiptIcon" />
          <h2>Venta cobrada</h2>
          <p className="orderIdBadge">Ticket #{receipt.orderId}</p>
          <div className="orderTicket">
            <div className="ticketSection">
              <div className="ticketItems">
                {receipt.items.map((item) => (
                  <div key={item.id} className="ticketItem">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{(item.price * item.quantity).toFixed(2)}€</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ticketDetails">
              <div className="ticketRow">
                <span>Pago:</span>
                <span className="paymentBadge">{receipt.paymentMethod.toUpperCase()}</span>
              </div>
              {receipt.paymentMethod === 'efectivo' && (
                <>
                  <div className="ticketRow">
                    <span>Recibido:</span>
                    <span>{receipt.cashReceived.toFixed(2)}€</span>
                  </div>
                  <div className="ticketRow">
                    <span>Cambio:</span>
                    <span>{receipt.change.toFixed(2)}€</span>
                  </div>
                </>
              )}
              <div className="ticketRow total">
                <strong>Total:</strong>
                <strong>{receipt.total.toFixed(2)}€</strong>
              </div>
            </div>
          </div>
          <div className="successActions">
            <button className="btn primary full" onClick={() => window.print()}>
              <Printer size={18} /> Imprimir ticket
            </button>
            <button className="btn secondary full" onClick={() => setReceipt(null)}>
              Nueva venta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="posScreen">
      <header className="posHeader">
        <div className="posLoginBrand">
          <Sprout size={24} />
          <span>TPV Mostrador</span>
        </div>
        <div className="posHeaderRight">
          <span className="posUserBadge">{userEmail}</span>
          <button className="btn secondary" onClick={logoutAdmin} aria-label="Cerrar sesión">
            <LogOut size={18} /> Salir
          </button>
        </div>
      </header>

      <div className="posLayout">
        <section className="posCatalogPane">
          <form className="posScanBar" onSubmit={handleScanSubmit}>
            <ScanBarcode size={22} aria-hidden="true" />
            <input
              ref={scanInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleScanKeyDown}
              placeholder="Escanea código de barras o busca por nombre..."
              aria-label="Escanear código de barras o buscar producto"
              autoFocus
            />
            <Search size={18} aria-hidden="true" />
          </form>

          <div className="posProductGrid">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                className="posProductBtn"
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
              >
                <strong>{product.name}</strong>
                <span>{product.price.toFixed(2)}€</span>
                <span className={product.stock <= 0 ? 'posStockBadge out' : 'posStockBadge'}>
                  {product.stock <= 0 ? 'Agotado' : `${product.stock} uds`}
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="posTicketPane" aria-live="polite">
          <h3>Ticket actual</h3>
          <div className="posTicketItems">
            {cart.length === 0 && <p className="posEmptyTicket">Escanea o toca un producto para empezar.</p>}
            {cart.map((item) => (
              <div key={item.id} className="posTicketRow">
                <div className="posTicketRowInfo">
                  <strong>{item.name}</strong>
                  <span>{item.price.toFixed(2)}€ / ud</span>
                </div>
                <div className="posTicketQty">
                  <button onClick={() => updateQty(item.id, -1)} aria-label="Reducir cantidad">
                    <Minus size={14} />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} aria-label="Aumentar cantidad">
                    <Plus size={14} />
                  </button>
                </div>
                <button className="posRemoveBtn" onClick={() => removeItem(item.id)} aria-label={`Quitar ${item.name}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="posPaymentSection">
            <div className="paymentGrid">
              {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                <label key={id} className={`paymentOption ${paymentMethod === id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="posPaymentMethod"
                    value={id}
                    checked={paymentMethod === id}
                    onChange={() => setPaymentMethod(id)}
                  />
                  <Icon size={18} />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            {paymentMethod === 'efectivo' && (
              <div className="formGroup">
                <label htmlFor="cash-received">Efectivo recibido</label>
                <input
                  id="cash-received"
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                />
                {cashReceivedNumber > 0 && (
                  <p className="posChangeHint">Cambio: <strong>{change.toFixed(2)}€</strong></p>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="formError" role="alert">
              {error}
            </div>
          )}

          <div className="orderReviewBox">
            <div className="reviewRow total">
              <strong>Total</strong>
              <strong>{total.toFixed(2)}€</strong>
            </div>
          </div>

          <button
            className="btn primary full btnSubmitOrder"
            onClick={handleCharge}
            disabled={cart.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Cobrando...' : `Cobrar (${total.toFixed(2)}€)`}
          </button>
        </aside>
      </div>
    </div>
  );
}
