import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Store, Truck, AlertTriangle } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    totalCartItems,
    products
  } = useShop();

  const [shippingMethod, setShippingMethod] = useState('recogida');

  if (!isCartOpen) return null;

  const freeShippingThreshold = 45.0;
  const shippingCost = shippingMethod === 'envio' ? (cartSubtotal >= freeShippingThreshold ? 0 : 4.90) : 0;
  const total = cartSubtotal + shippingCost;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="cartOverlay" onClick={() => setIsCartOpen(false)}>
      <aside className="cartDrawer" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera Carrito */}
        <header className="cartHeader">
          <div className="cartHeaderTitle">
            <ShoppingBag size={22} />
            <h2>Cesta de la compra</h2>
            <span className="cartBadgeCount">{totalCartItems}</span>
          </div>
          <button
            className="btnCloseDrawer"
            onClick={() => setIsCartOpen(false)}
            aria-label="Cerrar cesta"
          >
            <X size={20} />
          </button>
        </header>

        {/* Lista de Productos en el Carrito */}
        {cart.length > 0 ? (
          <>
            <div className="cartItemsList">
              {cart.map(item => {
                const liveProd = products.find(p => p.id === item.id);
                const maxStock = liveProd ? liveProd.stock : item.quantity;
                const isMaxedOut = item.quantity >= maxStock;

                return (
                  <div key={item.id} className="cartItemRow">
                    <img src={item.image} alt={item.name} className="cartItemThumb" />
                    
                    <div className="cartItemDetails">
                      <div className="cartItemTop">
                        <h4>{item.name}</h4>
                        <button
                          className="btnRemoveItem"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Eliminar ${item.name}`}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <span className="cartItemFormat">{item.format}</span>

                      <div className="cartItemBottom">
                        <div className="qtyControls">
                          <button
                            className="btnQty"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Reducir cantidad"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="qtyValue">{item.quantity}</span>
                          <button
                            className={`btnQty ${isMaxedOut ? 'disabled' : ''}`}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isMaxedOut}
                            aria-label="Aumentar cantidad"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="cartItemPrice">
                          {(item.price * item.quantity).toFixed(2)}€
                        </div>
                      </div>

                      {isMaxedOut && (
                        <div className="stockLimitNotice">
                          <AlertTriangle size={12} />
                          <span>Máximo stock disponible en tienda alcanzado ({maxStock} uds)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Opciones de Envío / Recogida */}
            <div className="cartShippingOptions">
              <label className="shippingOptionLabel">Método de entrega:</label>
              <div className="shippingGrid">
                <button
                  type="button"
                  className={`shippingBtn ${shippingMethod === 'recogida' ? 'active' : ''}`}
                  onClick={() => setShippingMethod('recogida')}
                >
                  <Store size={18} />
                  <div>
                    <strong>Recogida en tienda</strong>
                    <small>C/ Jaime Segarra, 51 · Gratis</small>
                  </div>
                </button>

                <button
                  type="button"
                  className={`shippingBtn ${shippingMethod === 'envio' ? 'active' : ''}`}
                  onClick={() => setShippingMethod('envio')}
                >
                  <Truck size={18} />
                  <div>
                    <strong>Envío a domicilio</strong>
                    <small>{cartSubtotal >= freeShippingThreshold ? 'Gratis (>45€)' : '4.90€'}</small>
                  </div>
                </button>
              </div>
            </div>

            {/* Resumen de Totales y Checkout */}
            <footer className="cartFooter">
              <div className="summaryRows">
                <div className="summaryRow">
                  <span>Subtotal</span>
                  <span>{cartSubtotal.toFixed(2)}€</span>
                </div>
                <div className="summaryRow">
                  <span>Entrega ({shippingMethod === 'recogida' ? 'Tienda Alicante' : 'Domicilio'})</span>
                  <span>{shippingCost === 0 ? 'Gratis' : `${shippingCost.toFixed(2)}€`}</span>
                </div>
                <div className="summaryRow totalRow">
                  <strong>Total (IVA incl.)</strong>
                  <strong className="totalAmount">{total.toFixed(2)}€</strong>
                </div>
              </div>

              <button
                className="btnCheckout"
                onClick={handleProceedToCheckout}
              >
                <span>Tramitar pedido</span>
                <ArrowRight size={18} />
              </button>

              <p className="secureNotice">
                🔒 Compra segura con confirmación directa en tienda y WhatsApp.
              </p>
            </footer>
          </>
        ) : (
          <div className="cartEmptyState">
            <ShoppingBag size={48} className="emptyIcon" />
            <h3>Tu cesta está vacía</h3>
            <p>Descubre nuestros productos naturales, extractos y mezclas para cuidar tu salud.</p>
            <button
              className="btn primary"
              onClick={() => setIsCartOpen(false)}
            >
              Explorar el herbolario
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
