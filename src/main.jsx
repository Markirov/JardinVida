import React from 'react';
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
} from 'lucide-react';
import './styles.css';

const whatsapp =
  'https://wa.me/34966355760?text=Hola%2C%20quiero%20pedir%20cita%20en%20Jard%C3%ADn%20de%20la%20Vida';

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

function App() {
  const [open, setOpen] = React.useState(false);

  return (
    <main>
      <header className="header">
        <a className="brand" href="#inicio" aria-label="Jardín de la Vida">
          <Sprout />
          <span>Jardín de la Vida</span>
        </a>
        <button className="menu" onClick={() => setOpen(!open)} aria-label="Abrir menu">
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? 'nav open' : 'nav'} onClick={() => setOpen(false)}>
          <a href="#servicios">Servicios</a>
          <a href="#metodo">Método</a>
          <a href="#mundo">Mundo orgánico</a>
          <a href="#contacto">Contacto</a>
          <a className="navCta" href={whatsapp}>
            Reservar
          </a>
        </nav>
      </header>

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
            <a className="btn primary" href={whatsapp}>
              <MessageCircle size={20} /> Pedir cita
            </a>
            <a className="btn secondary" href="#mundo">
              Explorar el jardín <ArrowUpRight size={19} />
            </a>
          </div>
        </div>
        <aside className="heroBadge">
          <Flower2 />
          <strong>Jardín de la Vida</strong>
          <span>raíz, pulso y alimento natural</span>
        </aside>
      </section>

      <section className="manifesto">
        <p>
          Cultivamos decisiones pequeñas, productos bien elegidos y planes que se pueden
          vivir. Jardín de la Vida es naturaleza con criterio.
        </p>
      </section>

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

      <section className="visit">
        <div>
          <p className="eyebrow">Cita previa</p>
        <h2>Ven a Jardín de la Vida y sal con un plan que puedas sostener.</h2>
          <p>
            Estamos en C/ Jaime Segarra, 51, Alicante. Puedes llamarnos o escribirnos por WhatsApp para reservar tu cita.
          </p>
        </div>
        <div className="contactBox" id="contacto">
          <p>
            <MapPin /> C/ Jaime Segarra, 51 · Alicante · 03012
          </p>
          <p>
            <Phone /> 966 355 760
          </p>
          <a className="btn primary full" href={whatsapp}>
            <Calendar size={20} /> Reservar en Jardín de la Vida
          </a>
        </div>
      </section>

      <footer>
        <strong>Jardín de la Vida</strong>
        <p>Dietética, nutrición y herbolario · Alicante</p>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
