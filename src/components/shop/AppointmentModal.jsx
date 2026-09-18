import React, { useState } from 'react';
import { X, CheckCircle2, MessageCircle, CalendarClock, Package } from 'lucide-react';
import { createAppointment } from '../../lib/firestore-service';

const TIME_SLOTS = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
];

const SERVICES = ['Nutrición', 'Herbolario', 'Dietética', 'Otro'];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isWeekday(isoDate) {
  const day = new Date(`${isoDate}T00:00:00`).getDay();
  return day >= 1 && day <= 5; // lunes(1)..viernes(5)
}

export function AppointmentModal({ isOpen, onClose }) {
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [type, setType] = useState('asesoramiento');
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', date: '', time: '', service: SERVICES[0], orderId: '', notes: ''
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleClose = () => {
    onClose();
    setStep('form');
    setError(null);
    setFormData({ name: '', phone: '', email: '', date: '', time: '', service: SERVICES[0], orderId: '', notes: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isWeekday(formData.date)) {
      setError('Solo atendemos citas de lunes a viernes.');
      return;
    }

    setIsSubmitting(true);
    try {
      const appointmentId = await createAppointment({
        type,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || '',
        preferredDate: formData.date,
        preferredTime: formData.time,
        service: type === 'asesoramiento' ? formData.service : '',
        orderId: type === 'recogida_pedido' ? formData.orderId : '',
        notes: formData.notes || ''
      });
      setResult({ appointmentId, ...formData, type });
      setStep('success');
    } catch (err) {
      setError(err.message || 'No se pudo enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateWhatsAppUrl = () => {
    if (!result) return '';
    const phone = '34966355760';
    let text = `🌱 *SOLICITUD DE CITA — JARDÍN DE LA VIDA*\n`;
    text += `*Ref:* #${result.appointmentId}\n`;
    text += `*Tipo:* ${result.type === 'asesoramiento' ? 'Cita de asesoramiento' : 'Recogida de pedido'}\n`;
    text += `*Nombre:* ${result.name} (${result.phone})\n`;
    text += `*Fecha preferida:* ${result.date} a las ${result.time}\n`;
    if (result.type === 'asesoramiento') text += `*Motivo:* ${result.service}\n`;
    if (result.type === 'recogida_pedido' && result.orderId) text += `*Nº pedido:* ${result.orderId}\n`;
    if (result.notes) text += `*Notas:* ${result.notes}\n`;
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
              <h2>Pedir Cita</h2>
              <p>Reserva una cita de asesoramiento o una franja para recoger tu pedido. Atendemos de lunes a viernes, 11:00–15:00 y 17:00–21:00.</p>
            </header>

            <form onSubmit={handleSubmit} className="checkoutForm">
              <div className="formSection">
                <h3>1. Tipo de solicitud</h3>
                <div className="deliverySelector">
                  <label className={`radioCard ${type === 'asesoramiento' ? 'selected' : ''}`}>
                    <input type="radio" name="type" value="asesoramiento"
                      checked={type === 'asesoramiento'} onChange={() => setType('asesoramiento')} />
                    <div className="radioCardContent">
                      <CalendarClock size={20} />
                      <div>
                        <strong>Cita de asesoramiento</strong>
                        <span>Nutrición, herbolario o dietética en tienda</span>
                      </div>
                    </div>
                  </label>
                  <label className={`radioCard ${type === 'recogida_pedido' ? 'selected' : ''}`}>
                    <input type="radio" name="type" value="recogida_pedido"
                      checked={type === 'recogida_pedido'} onChange={() => setType('recogida_pedido')} />
                    <div className="radioCardContent">
                      <Package size={20} />
                      <div>
                        <strong>Recogida de pedido</strong>
                        <span>Reserva franja horaria para pasar a recoger</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="formSection">
                <h3>2. Datos de contacto</h3>
                <div className="formGrid">
                  <div className="formGroup">
                    <label htmlFor="ap-name">Nombre y Apellidos *</label>
                    <input id="ap-name" name="name" type="text" required
                      value={formData.name} onChange={handleChange} placeholder="Ej: María García" />
                  </div>
                  <div className="formGroup">
                    <label htmlFor="ap-phone">Teléfono / WhatsApp *</label>
                    <input id="ap-phone" name="phone" type="tel" required
                      value={formData.phone} onChange={handleChange} placeholder="Ej: 600 000 000" />
                  </div>
                </div>
                <div className="formGroup">
                  <label htmlFor="ap-email">Correo electrónico (opcional)</label>
                  <input id="ap-email" name="email" type="email"
                    value={formData.email} onChange={handleChange} placeholder="maria@ejemplo.com" />
                </div>
              </div>

              <div className="formSection">
                <h3>3. Fecha y hora preferida</h3>
                <div className="formGrid">
                  <div className="formGroup">
                    <label htmlFor="ap-date">Día (lunes a viernes) *</label>
                    <input id="ap-date" name="date" type="date" required
                      min={todayIsoDate()} value={formData.date} onChange={handleChange} />
                  </div>
                  <div className="formGroup">
                    <label htmlFor="ap-time">Hora *</label>
                    <select id="ap-time" name="time" required value={formData.time} onChange={handleChange}>
                      <option value="" disabled>Selecciona una hora</option>
                      {TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                    </select>
                  </div>
                </div>

                {type === 'asesoramiento' && (
                  <div className="formGroup">
                    <label htmlFor="ap-service">Motivo de la cita</label>
                    <select id="ap-service" name="service" value={formData.service} onChange={handleChange}>
                      {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                {type === 'recogida_pedido' && (
                  <div className="formGroup">
                    <label htmlFor="ap-orderId">Nº de pedido (opcional)</label>
                    <input id="ap-orderId" name="orderId" type="text"
                      value={formData.orderId} onChange={handleChange} placeholder="Ej: JV-4821" />
                  </div>
                )}
              </div>

              <div className="formGroup">
                <label htmlFor="ap-notes">Notas adicionales</label>
                <textarea id="ap-notes" name="notes" rows="2"
                  value={formData.notes} onChange={handleChange}
                  placeholder="Cualquier detalle que debamos saber..."></textarea>
              </div>

              {error && (
                <div className="formError" role="alert">{error}</div>
              )}

              <button type="submit" className="btn primary full btnSubmitOrder" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar solicitud de cita'}
              </button>
            </form>
          </div>
        ) : (
          <div className="orderSuccessContent">
            <div className="successHeader">
              <div className="successIcon">
                <CheckCircle2 size={48} />
              </div>
              <h2>¡Solicitud enviada!</h2>
              <p className="orderIdBadge">Referencia: <strong>#{result?.appointmentId}</strong></p>
              <p className="successMessage">
                Hemos recibido tu solicitud para el <strong>{result?.date}</strong> a las <strong>{result?.time}</strong>.
                Te confirmaremos la cita a la mayor brevedad.
              </p>
            </div>

            <div className="successActions">
              <a href={generateWhatsAppUrl()} target="_blank" rel="noopener noreferrer"
                className="btn primary full btnWhatsAppAction">
                <MessageCircle size={20} /> Confirmar también por WhatsApp
              </a>
              <button className="btn secondary full" onClick={handleClose}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
