# AUDITORÍA TÉCNICA Y DE SEGURIDAD (AUDIT)

*Registro vivo de auditorías independientes realizadas por el rol de QA & Security Reviewer.*

---

## 📅 Última Auditoría Integral: 2026-09-12 (QA & Security Reviewer)

### 1. 🏗️ Arquitectura y Calidad del Código
- **Modularidad:** Estructura limpia y desacoplada en `src/components/shop/`, `src/context/ShopContext.jsx` y `src/lib/firebase.js`.
- **Hallazgo:** `src/main.jsx` aglutina bootstrapping de React con secciones estáticas (Servicios, Método, Galería, Contacto).
  - *Mitigación recomendada:* Modularizar secciones en `src/components/sections/` para mejorar mantenibilidad futura.
- **Tipado & Contratos:** No hay PropTypes o TypeScript.
  - *Mitigación recomendada:* Documentar o validar contratos de datos en pedidos y productos.

### 2. 🎨 UI, UX y Accesibilidad (Frontend)
- **Experiencia de Usuario (UX):** Flujo de compra claro con cálculo dinámico de costes (recogida gratis vs envío), límites de stock en tiempo real y checkout directo con derivación a WhatsApp.
- **Accesibilidad (a11y):**
  - Implementados `aria-label`, `role="tab"` y botones accesibles en controles de carrito y catálogo.
  - *Mitigación recomendada:* Implementar trampa de foco (focus trap) y cierre con tecla `Escape` en `CartDrawer` y `CheckoutModal`.
  - *Mitigación recomendada:* Verificar ratio de contraste WCAG AA en combinaciones con color secundario (`--sun` / `#f2b94b`).

### 3. ⚡ Rendimiento y Optimización
- **Bundling (Vite):** Bundle de producción optimizado: CSS 23.21 kB (5.33 kB gzip), JS 229.90 kB (72.52 kB gzip).
- **Imágenes:** Uso de `loading="lazy"` en catálogo y URLs con transformaciones automáticas de calidad.
- *Mitigación recomendada:* Carga dinámica (code splitting / `React.lazy`) para la capa de Firebase cuando se active la persistencia en la nube para reducir el JS inicial.

### 4. 🔒 Seguridad y Resiliencia
- **Reglas de Firestore (`firestore.rules`):** Correctamente aisladas (escritura de catálogo y lectura de pedidos restringidas a `request.auth != null`).
  - *Mitigación recomendada:* Añadir validación de campos obligatorios en `allow create` para `/orders` y `/appointments` (validar tipos y longitud de datos).
- **Gestión de Credenciales:** Variables de entorno modularizadas en `src/lib/firebase.js` con fallback seguro a modo demo local sin credenciales expuestas en git.
- **Dependencias (NPM Audit):** 2 vulnerabilidades detectadas en subdependencias de build (`nanoid`, `postcss`).
  - *Mitigación recomendada:* El Lead Developer debe ejecutar `npm audit fix`.
- **Resiliencia:** Degradación elegante (Graceful Degradation) con `localStorage` y checkout por WhatsApp funcional en caso de desconexión o ausencia de Firebase.

---

## 🟢 Registro Histórico
- **2026-09-11:** Auditoría Inicial de Despliegue (Agentic Harness, Firebase setup, Shop System).

