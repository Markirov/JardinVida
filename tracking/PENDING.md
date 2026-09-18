# BACKLOG DE TAREAS (PENDING)

*Este backlog organiza las tareas pendientes del proyecto por nivel de prioridad. Al completar una tarea, trasládala íntegramente a la sección "✅ Completado" al final del archivo.*

## 🔴 Alta Prioridad

- [ ] **Fase 1.3: Subida masiva real a Firestore (seed)** [Sin asignar]
  - Requiere credenciales reales `VITE_FIREBASE_*` en `.env` y export CSV real de Abarrotes PDV. Script listo: `node scripts/import-abarrotes-csv.mjs <csv> --commit`.
- [ ] **Configuración de reservas y formulario interactivo** [Sin asignar]
  - Conectar formulario de contacto/reservas con Firestore (`appointments`) o WhatsApp.

## 🟡 Media Prioridad

- [ ] **Fase 3: Módulo de Punto de Venta (TPV) para Tienda Física en mostrador** [Sin asignar]
  - Interfaz de caja rápida con soporte para lector de código de barras USB y cobros.
- [ ] **Fase 4: Panel de Administración y Alertas de Stock** [Sin asignar]
  - Gestión de catálogo, aviso de pedidos entrantes y control de mínimos de stock.
- [ ] **Integración de galería y fotografía real del local** [Sin asignar]
  - Sustituir imágenes provisionales por assets fotográficos optimizados de la tienda y herbolario.

## 🟢 Baja Prioridad

- [ ] **Estructura de Blog / Artículos para SEO local** [Sin asignar]
  - Crear sección dinámica o estática para artículos de nutrición, dietética y posicionamiento en Alicante.


---

## ✅ Completado

- [x] **Fase 2: Conexión en tiempo real de catálogo y checkout a Firestore** (2026-09-18, Lead Developer (Claude Code)): `firestore-service.js` (listener de stock + transacción atómica de pedido), `ShopContext.jsx` con fallback a modo demo local si no hay credenciales, `CheckoutModal.jsx` async con manejo de errores. Probado end-to-end en navegador.
- [x] **Fase 1.1/1.2: Importador CSV de Abarrotes PDV + CSV demo ficticio** (2026-09-18, Lead Developer (Claude Code)): `scripts/import-abarrotes-csv.mjs` con validación, mapeo a `ProductDocument` y modo dry-run; CSV demo de 10 productos para pruebas sin acceso al export real.
- [x] **Configuración y Migración de Arquitectura a Firebase** (2026-09-11, Lead Developer (Antigravity)): SDK, Hosting, Firestore Rules, cliente modular y scripts de despliegue.
- [x] **Sistema de compra online y catálogo con simulación de stock de tienda** (2026-09-11, Lead Developer (Antigravity)): Catálogo por categorías, carrito reactivo con límites por stock disponible, checkout y mensaje WhatsApp.
- [x] **Despliegue e integración del Agentic Harness Universal** (2026-09-11, Lead Developer / Architect (Antigravity)): Estructura base (.agents, tracking, scripts, git hooks).



