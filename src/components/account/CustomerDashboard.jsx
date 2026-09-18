import React, { useEffect, useState } from 'react';
import { Sprout, LogOut, Package, CalendarClock, UserCircle, Save } from 'lucide-react';
import { logoutAdmin } from '../../lib/auth-service';
import {
  subscribeToMyOrders, subscribeToMyAppointments,
  getCustomerProfile, saveCustomerProfile
} from '../../lib/firestore-service';

const TABS = [
  { id: 'pedidos', label: 'Mis pedidos', icon: Package },
  { id: 'reservas', label: 'Mis citas', icon: CalendarClock },
  { id: 'datos', label: 'Mis datos', icon: UserCircle }
];

const STATUS_LABELS = {
  pendiente_preparacion: 'En preparación',
  completado: 'Completado',
  cancelado: 'Cancelado',
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  rechazada: 'Rechazada'
};

export function CustomerDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('pedidos');
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState({ name: '', phone: '', email: user.email });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    const unsubOrders = subscribeToMyOrders(user.uid, setOrders, () => {});
    const unsubAppointments = subscribeToMyAppointments(user.uid, setAppointments, () => {});
    getCustomerProfile(user.uid).then((data) => {
      if (data) setProfile({ name: data.name || '', phone: data.phone || '', email: data.email || user.email });
    });
    return () => { unsubOrders(); unsubAppointments(); };
  }, [user.uid]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaved(false);
    try {
      await saveCustomerProfile(user.uid, profile);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="posScreen">
      <header className="posHeader">
        <div className="posLoginBrand">
          <Sprout size={24} />
          <span>Mi cuenta</span>
        </div>
        <div className="posHeaderRight">
          <span className="posUserBadge">{user.email}</span>
          <button className="btn secondary" onClick={logoutAdmin} aria-label="Cerrar sesión">
            <LogOut size={18} /> Salir
          </button>
        </div>
      </header>

      <nav className="adminTabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`adminTabBtn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </nav>

      <main className="adminMain">
        {activeTab === 'pedidos' && (
          <section>
            <h2>Mis pedidos ({orders.length})</h2>
            {orders.length === 0 ? (
              <p className="accountEmptyState">Aún no tienes pedidos.</p>
            ) : (
              <div className="accountCardList">
                {orders.map((o) => (
                  <div key={o.id} className="accountCard">
                    <div className="accountCardHeader">
                      <strong>#{o.orderId}</strong>
                      <span className={`orderStatusBadge status-${o.status}`}>
                        {STATUS_LABELS[o.status] || o.status}
                      </span>
                    </div>
                    <p>{new Date(o.date).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    <p>{o.items?.length || 0} artículo(s) · {o.total?.toFixed(2)}€</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'reservas' && (
          <section>
            <h2>Mis citas ({appointments.length})</h2>
            {appointments.length === 0 ? (
              <p className="accountEmptyState">Aún no tienes citas solicitadas.</p>
            ) : (
              <div className="accountCardList">
                {appointments.map((a) => (
                  <div key={a.id} className="accountCard">
                    <div className="accountCardHeader">
                      <strong>#{a.appointmentId}</strong>
                      <span className={`orderStatusBadge status-${a.status}`}>
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </div>
                    <p>{a.type === 'asesoramiento' ? 'Cita de asesoramiento' : 'Recogida de pedido'}</p>
                    <p>{a.preferredDate} a las {a.preferredTime}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'datos' && (
          <section>
            <h2>Mis datos</h2>
            <form className="accountProfileForm" onSubmit={handleSaveProfile}>
              <div className="formGroup">
                <label htmlFor="profile-name">Nombre y apellidos</label>
                <input
                  id="profile-name" type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Ej: María García"
                />
              </div>
              <div className="formGroup">
                <label htmlFor="profile-phone">Teléfono</label>
                <input
                  id="profile-phone" type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="Ej: 600 000 000"
                />
              </div>
              <div className="formGroup">
                <label htmlFor="profile-email">Email de contacto</label>
                <input
                  id="profile-email" type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="tú@ejemplo.com"
                />
              </div>
              <button type="submit" className="btn primary" disabled={isSavingProfile}>
                <Save size={16} /> {isSavingProfile ? 'Guardando...' : profileSaved ? 'Guardado ✓' : 'Guardar datos'}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
