import React, { useState } from 'react';
import { X, CheckCircle2, MessageCircle, Store, CreditCard, Smartphone, Banknote, ShieldCheck, ArrowLeft, PackageCheck } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export function CheckoutModal() {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartSubtotal,
    checkoutOrder,
    lastOrder
  } = useShop();

  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [shippingMethod, setShippingMethod] = useState('recogida');
  const [paymentMethod, setPaymentMethod] = useState('bizum');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Alicante',
    postalCode: '03012',
    notes: ''
  });

  const [orderResult, setOrderResult] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCheckoutOpen) return null;

  const freeShippingThreshold = 45.0;
  const shippingCost = shippingMethod === 'envio' ? (cartSubtotal >= freeShippingThreshold ? 0 : 4.90) : 0;
  const total = cartSubtotal + shippingCost;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || isSubmitting) return;

    setOrderError(null);
    setIsSubmitting(true);
    try {
      const result = await checkoutOrder({
        customer: formData,
        shippingMethod,
        paymentMethod,
        notes: formData.notes
      });

      if (result) {
        setOrderResult(result);
        setStep('success');
      }
    } catch (err) {
      setOrderError(err.message || 'No se pudo completar el pedido. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setStep('form');
    setOrderResult(null);
    setOrderError(null);
  };

  const generateWhatsAppUrl = (order) => {
    if (!order) return '';
    const phone = '34966355760';
    let text = `🌱 *NUEVO PEDIDO JARDÍN DE LA VIDA*\n`;
    text += `*Nº Pedido:* #${order.orderId}\n`;
    text += `*Cliente:* ${order.customer.name} (${order.customer.phone})\n`;
    text += `*Método:* ${order.shippingMethod === 'recogida' ? '🏪 Recogida en tienda (C/ Jaime Segarra 51)' : '🚚 Envío a domicilio'}\n`;
    text += `*Pago:* ${order.paymentMethod.toUpperCase()}\n\n`;
    text += `*Productos:*\n`;
    order.items.forEach(item => {
      text += `• ${item.quantity}x ${item.name} (${(item.price * item.quantity).toFixed(2)}€)\n`;
    });
    text += `\n*TOTAL:* ${order.total.toFixed(2)}€\n`;
    if (order.notes) {
      text += `*Notas:* ${order.notes}\n`;
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="modalOverlay" onClick={handleClose}>
      <div className="checkoutModal" onClick={(e) => e.stopPropagation()}>
        <button className="btnCloseModal" onClick={handleClose} aria-label="Cerrar ventana">
          <X size={20} />
        </button>

        {step === 'form' ? (
          <div className="checkoutContent">
            <header className="modalHeader">
              <h2>Finalizar Compra</h2>
              <p>Completa tus datos para preparar tu pedido y reservar el stock en tienda.</p>
            </header>

            <form onSubmit={handleSubmit} className="checkoutForm">
              <div className="formSection">
                <h3>1. Datos de Contacto</h3>
                <div className="formGrid">
                  <div className="formGroup">
                    <label htmlFor="name">Nombre y Apellidos *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="Ej: María García"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="formGroup">
                    <label htmlFor="phone">Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      placeholder="Ej: 600 000 000"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="formGroup">
                  <label htmlFor="email">Correo Electrónico (opcional)</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="maria@ejemplo.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="formSection">
                <h3>2. Modalidad de Entrega</h3>
                <div className="deliverySelector">
                  <label className={`radioCard ${shippingMethod === 'recogida' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="recogida"
                      checked={shippingMethod === 'recogida'}
                      onChange={() => setShippingMethod('recogida')}
                    />
                    <div className="radioCardContent">
                      <Store size={20} />
                      <div>
                        <strong>Recogida en tienda (Gratis)</strong>
                        <span>C/ Jaime Segarra 51, Alicante · Disponible en 2h</span>
                      </div>
                    </div>
                  </label>

                  <label className={`radioCard ${shippingMethod === 'envio' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="envio"
                      checked={shippingMethod === 'envio'}
                      onChange={() => setShippingMethod('envio')}
                    />
                    <div className="radioCardContent">
                      <div>
                        <strong>Envío a domicilio ({shippingCost === 0 ? 'Gratis' : `${shippingCost.toFixed(2)}€`})</strong>
                        <span>Entrega cuidada en Alicante y península</span>
                      </div>
                    </div>
                  </label>
                </div>

                {shippingMethod === 'envio' && (
                  <div className="addressFields">
                    <div className="formGroup">
                      <label htmlFor="address">Dirección completa *</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        required={shippingMethod === 'envio'}
                        placeholder="Calle, número, piso/puerta"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="formGrid">
                      <div className="formGroup">
                        <label htmlFor="city">Ciudad / Localidad *</label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          required={shippingMethod === 'envio'}
                          value={formData.city}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="formGroup">
                        <label htmlFor="postalCode">Código Postal *</label>
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          required={shippingMethod === 'envio'}
                          value={formData.postalCode}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="formSection">
                <h3>3. Forma de Pago</h3>
                <div className="paymentGrid">
                  <label className={`paymentOption ${paymentMethod === 'bizum' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bizum"
                      checked={paymentMethod === 'bizum'}
                      onChange={() => setPaymentMethod('bizum')}
                    />
                    <Smartphone size={18} />
                    <span>Bizum</span>
                  </label>

                  <label className={`paymentOption ${paymentMethod === 'tarjeta' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="tarjeta"
                      checked={paymentMethod === 'tarjeta'}
                      onChange={() => setPaymentMethod('tarjeta')}
                    />
                    <CreditCard size={18} />
                    <span>Tarjeta (Simulado)</span>
                  </label>

                  <label className={`paymentOption ${paymentMethod === 'tienda' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="tienda"
                      checked={paymentMethod === 'tienda'}
                      onChange={() => setPaymentMethod('tienda')}
                    />
                    <Banknote size={18} />
                    <span>En tienda física</span>
                  </label>
                </div>
              </div>

              <div className="formGroup">
                <label htmlFor="notes">Observaciones o notas para el herbolario</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="2"
                  placeholder="Instrucciones de entrega, dudas sobre posología..."
                  value={formData.notes}
                  onChange={handleChange}
                ></textarea>
              </div>

              {/* Resumen Final en Checkout */}
              <div className="orderReviewBox">
                <div className="reviewRow">
                  <span>Artículos ({cart.length})</span>
                  <span>{cartSubtotal.toFixed(2)}€</span>
                </div>
                <div className="reviewRow">
                  <span>Entrega</span>
                  <span>{shippingCost === 0 ? 'Gratis' : `${shippingCost.toFixed(2)}€`}</span>
                </div>
                <div className="reviewRow total">
                  <strong>Total a pagar</strong>
                  <strong>{total.toFixed(2)}€</strong>
                </div>
              </div>

              {orderError && (
                <div className="formError" role="alert">
                  {orderError}
                </div>
              )}

              <button type="submit" className="btn primary full btnSubmitOrder" disabled={isSubmitting}>
                {isSubmitting ? 'Confirmando pedido...' : `Confirmar y Reservar Pedido (${total.toFixed(2)}€)`}
              </button>
            </form>
          </div>
        ) : (
          /* PANTALLA DE ÉXITO Y TICKET */
          <div className="orderSuccessContent">
            <div className="successHeader">
              <div className="successIcon">
                <CheckCircle2 size={48} />
              </div>
              <h2>¡Pedido Confirmado con Éxito!</h2>
              <p className="orderIdBadge">Identificador: <strong>#{orderResult?.orderId}</strong></p>
              <p className="successMessage">
                El stock de la tienda física se ha <strong>actualizado y reservado en tiempo real</strong>.
              </p>
            </div>

            <div className="orderTicket">
              <div className="ticketSection">
                <h4>Detalle del pedido</h4>
                <div className="ticketItems">
                  {orderResult?.items.map(item => (
                    <div key={item.id} className="ticketItem">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{(item.price * item.quantity).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ticketDetails">
                <div className="ticketRow">
                  <span>Fecha:</span>
                  <span>{orderResult?.date}</span>
                </div>
                <div className="ticketRow">
                  <span>Entrega:</span>
                  <span>{orderResult?.shippingMethod === 'recogida' ? 'Recogida en C/ Jaime Segarra 51 (Alicante)' : `Envío a domicilio (${orderResult?.customer.address}, ${orderResult?.customer.city})`}</span>
                </div>
                <div className="ticketRow">
                  <span>Forma de Pago:</span>
                  <span className="paymentBadge">{orderResult?.paymentMethod.toUpperCase()}</span>
                </div>
                <div className="ticketRow total">
                  <strong>Total:</strong>
                  <strong>{orderResult?.total.toFixed(2)}€</strong>
                </div>
              </div>
            </div>

            <div className="successActions">
              <a
                href={generateWhatsAppUrl(orderResult)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn primary full btnWhatsAppAction"
              >
                <MessageCircle size={20} /> Enviar copia del pedido por WhatsApp
              </a>

              <button
                className="btn secondary full"
                onClick={handleClose}
              >
                Volver a la tienda
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
