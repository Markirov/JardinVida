import React, { useState, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Flower2,
  HeartPulse,
  Leaf,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Salad,
  ShoppingBag,
  Sprout,
  X,
  Store
} from 'lucide-react';
import './styles.css';
import { ShopProvider, useShop } from './context/ShopContext';
import { ProductCatalog } from './components/shop/ProductCatalog';
import { CartDrawer } from './components/shop/CartDrawer';
import { CheckoutModal } from './components/shop/CheckoutModal';
import { AppointmentModal } from './components/shop/AppointmentModal';

// Módulo TPV (Fase 3) y Panel de Administración (Fase 4): carga bajo demanda.
const PosApp = lazy(() => import('./components/pos/PosApp'));
const AdminApp = lazy(() => import('./components/admin/AdminApp'));

const services = [
  {
    icon: Salad,
    title: 'Nutrición que baja a tierra',
    text: 'Planes claros, medibles y adaptados a tu rutina real. Sin dogmas. Sin ruido. Con seguimiento cercano.',
  },
  {
    icon: Leaf,
    title: 'Herbolario vivo',
    text: 'Infusiones, complementos y productos naturales seleccionados con criterio, trazabilidad y uso responsable.',
  },
  {
    icon: HeartPulse,
    title: 'Digestivo y energía diaria',
    text: 'Acompañamiento para ordenar hábitos, entender señales del cuerpo y construir bienestar desde lo cotidiano.',
  },
  {
    icon: ShoppingBag,
    title: 'Despensa consciente',
    text: 'Dietética, alimentos funcionales y pequeñas decisiones que convierten la compra en una forma de cuidado.',
  },
];

const rituals = [
  'Escuchamos tu momento, no solo tus síntomas.',
  'Trazamos un mapa sencillo de hábitos, horarios y objetivos.',
  'Elegimos acciones pequeñas, repetibles y sostenibles.',
  'Ajustamos contigo hasta que el plan eche raíces.',
];

const gallery = [
  {
    src: 'https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?auto=format&fit=crop&w=900&q=80',
    alt: 'Hojas verdes con luz natural',
    label: 'Materia viva',
  },
  {
    src: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80',
    alt: 'Ingredientes frescos sobre una mesa',
    label: 'Nutrición real',
  },
  {
    src: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=900&q=80',
    alt: 'Verduras organicas recien cosechadas',
    label: 'Despensa natural',
  },
];

function MainContent() {
  const [open, setOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const { totalCartItems, setIsCartOpen } = useShop();

  return (
    <main>
      {/* Header con acceso directo a la cesta y navegación */}
      <header className="header">
        <a className="brand" href="#inicio" aria-label="Jardín de la Vida">
          <Sprout />
          <span>Jardín de la Vida</span>
        </a>

        <div className="headerActions">
          <button
            className="btnHeaderCart"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Ver cesta con ${totalCartItems} productos`}
          >
            <ShoppingBag size={20} />
            <span className="cartLabelText">Cesta</span>
            {totalCartItems > 0 && (
              <span className="cartCounterBadge">{totalCartItems}</span>
            )}
          </button>

          <button className="menu" onClick={() => setOpen(!open)} aria-label="Abrir menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>

        <nav className={open ? 'nav open' : 'nav'} onClick={() => setOpen(false)}>
          <a href="#inicio">Inicio</a>
          <a href="#tienda" className="navLinkHighlight">
            🌱 Tienda & Stock
          </a>
          <a href="#servicios">Servicios</a>
          <a href="#metodo">Método</a>
          <a href="#mundo">Mundo orgánico</a>
          <a href="#contacto">Contacto</a>
          <button className="navCta" onClick={() => { setIsAppointmentOpen(true); setOpen(false); }}>
            Pedir Cita
          </button>
        </nav>
      </header>

      {/* Botón flotante de carrito para móvil */}
      {totalCartItems > 0 && (
        <button
          className="floatingCartBtn"
          onClick={() => setIsCartOpen(true)}
          aria-label="Abrir cesta flotante"
        >
          <ShoppingBag size={24} />
          <span className="floatingCartCount">{totalCartItems}</span>
          <span className="floatingCartLabel">Ver cesta</span>
        </button>
      )}

      {/* Hero Section */}
      <section id="inicio" className="hero">
        <div className="heroMedia" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1400&q=85"
            alt=""
          />
        </div>
        <div className="heroText">
          <p className="eyebrow">Dietética, nutrición y herbolario en Alicante</p>
          <h1>Jardín de la Vida, donde el bienestar vuelve a crecer.</h1>
          <p className="lead">
            Un lugar para personas que quieren comer mejor, entender su cuerpo y elegir productos naturales
            con una guía honesta, cercana y nada aburrida.
          </p>
          <div className="actions">
            <a className="btn primary" href="#tienda">
              <ShoppingBag size={20} /> Ver Tienda & Stock
            </a>
            <button className="btn secondary" onClick={() => setIsAppointmentOpen(true)}>
              <MessageCircle size={19} /> Pedir cita previa
            </button>
          </div>
        </div>
        <aside className="heroBadge">
          <Flower2 />
          <strong>Jardín de la Vida</strong>
          <span>raíz, pulso y alimento natural</span>
        </aside>
      </section>

      {/* Manifiesto */}
      <section className="manifesto">
        <p>
          Cultivamos decisiones pequeñas, productos bien elegidos y planes que se pueden
          vivir. Jardín de la Vida es naturaleza con criterio.
        </p>
      </section>

      {/* SECCIÓN NUEVA: CATÁLOGO Y TIENDA ONLINE CON STOCK */}
      <ProductCatalog />

      {/* Servicios */}
      <section id="servicios" className="section">
        <div className="sectionHeader">
          <p className="eyebrow">Lo que hacemos</p>
          <h2>Una forma más orgánica de cuidarte.</h2>
        </div>
        <div className="grid">
          {services.map(({ icon: Icon, title, text }) => (
            <article className="service" key={title}>
              <Icon />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Método */}
      <section id="metodo" className="method">
        <div className="methodText">
          <p className="eyebrow">Método Jardín de la Vida</p>
          <h2>Primero sembramos claridad. Después crecen los hábitos.</h2>
          <p>
            Trabajamos desde la educación alimentaria, la escucha y la constancia. Cada recomendación tiene que encajar
            con tu vida, tu cocina y tu energía disponible.
          </p>
        </div>
        <div className="steps">
          {rituals.map((step, index) => (
            <div className="step" key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mundo Orgánico */}
      <section id="mundo" className="world">
        <div className="worldIntro">
          <p className="eyebrow">Mundo orgánico</p>
          <h2>Texturas, aromas y decisiones que saben a tierra.</h2>
        </div>
        <div className="gallery">
          {gallery.map((image) => (
            <figure key={image.label}>
              <img src={image.src} alt={image.alt} />
              <figcaption>{image.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Visita / Cita Previa */}
      <section className="visit" id="contacto">
        <div>
          <p className="eyebrow">Cita previa y Tienda Física</p>
          <h2>Ven a Jardín de la Vida y sal con un plan que puedas sostener.</h2>
          <p>
            Estamos en C/ Jaime Segarra, 51, Alicante. Puedes llamarnos, visitarnos para recoger tus pedidos online o escribirnos por WhatsApp.
          </p>
        </div>
        <div className="contactBox">
          <p>
            <MapPin /> C/ Jaime Segarra, 51 · Alicante · 03012
          </p>
          <p>
            <Phone /> 966 355 760
          </p>
          <button className="btn primary full" onClick={() => setIsAppointmentOpen(true)}>
            <Calendar size={20} /> Reservar Cita en Jardín de la Vida
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <strong>Jardín de la Vida</strong>
        <p>Dietética, nutrición, herbolario y compra online · C/ Jaime Segarra 51, Alicante</p>
      </footer>

      {/* Overlays / Modales */}
      <CartDrawer />
      <CheckoutModal />
      <AppointmentModal isOpen={isAppointmentOpen} onClose={() => setIsAppointmentOpen(false)} />
    </main>
  );
}

function App() {
  if (window.location.pathname.startsWith('/tpv')) {
    return (
      <Suspense fallback={<div className="posScreen posLoadingScreen">Cargando TPV...</div>}>
        <PosApp />
      </Suspense>
    );
  }

  if (window.location.pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<div className="posScreen posLoadingScreen">Cargando panel...</div>}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <ShopProvider>
      <MainContent />
    </ShopProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
