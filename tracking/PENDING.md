# BACKLOG DE TAREAS (PENDING)

*Este backlog organiza las tareas pendientes del proyecto por nivel de prioridad. Al completar una tarea, trasládala íntegramente a la sección "✅ Completado" al final del archivo.*

## 🔴 Alta Prioridad

- [ ] **Implementar rediseño de paleta, navegación por categorías y aviso de confianza** [Para Lead Developer — spec lista, pendiente de aprobación del usuario]
  - Spec completa (tokens de color, mapeo de iconos por categoría, copy y ubicación del aviso "+35 años", comparativa Firebase vs PrestaShop): https://claude.ai/artifact/7deiu1nG3K386FqurmC55p
  - (Locks: `src/styles.css`, `src/main.jsx`, `src/data/products.js`, `src/components/shop/ProductCatalog.jsx`)
  - 1) Cambiar 6 valores hex en `src/styles.css:1-13` (`--moss`, `--leaf`, `--mint`, `--sun`, `--clay`, `--petal`) — mismos nombres de token, solo valor.
  - 2) Añadir icono por categoría en `CATEGORIES` (`src/data/products.js`) y render en `.tabBtn` (`ProductCatalog.jsx`); importar `Coffee` de `lucide-react` en `main.jsx` (Leaf/Sprout/Flower2/Salad ya están importados).
  - 3) Header: convertir enlace "Tienda & Stock" en desplegable con las 5 categorías, cada una aplica `selectedCategory` directamente.
  - 4) Añadir badge "+35 años cuidando tu salud" junto al `.eyebrow` del hero (`main.jsx:148`) y en el `<footer>` — confirmar cifra exacta de años con el usuario antes de publicar.
  - 5) Referencia visual "estilo Casa Pià" (usuario la eligió como favorita del análisis de competencia): https://claude.ai/artifact/5Fik53J5RWGqZF1Nfnex7h — ascender `--clay` (terracota) a color de acción principal, añadir campo `oldPrice` opcional en `products.js` + render tachado en `ProductCard.jsx`. Cambios de titulares serif (`DM Serif Display`) y hero en placa crema quedan a la espera de que el usuario confirme si quiere ir tan lejos (cambia el tono de marca, no es solo ajuste de color).

## 🟡 Media Prioridad

- [ ] **Integración de galería y fotografía real del local** [Sin asignar]
  - Sustituir imágenes provisionales por assets fotográficos optimizados de la tienda y herbolario.

## 🟢 Baja Prioridad

- [ ] **Estructura de Blog / Artículos para SEO local** [Sin asignar]
  - Crear sección dinámica o estática para artículos de nutrición, dietética y posicionamiento en Alicante.
- [ ] **Re-sembrar catálogo real de Abarrotes PDV** [Sin asignar]
  - Firestore tiene el catálogo demo ficticio (10 productos). Ejecutar `node scripts/import-abarrotes-csv.mjs <export_real.csv> --commit` con el export real cuando esté disponible.
- [ ] **Rotar contraseña del usuario admin de Firebase Auth** [Sin asignar]
  - `marcosfenollar@gmail.com` se creó con contraseña débil en texto plano en `.env` local para firmar el seed. Cambiarla desde la consola Firebase antes de dar acceso real al TPV/panel (Fase 3/4).
- [ ] **Test suite / Firebase Emulator para firestore.rules** [Sin asignar]
  - Fase 5.1 del plan se verificó manualmente contra producción real, no con un test suite automatizado. Añadir `@firebase/rules-unit-testing` cuando el proyecto lo justifique.


---

## ✅ Completado

- [x] **Sistema de reservas / cita previa (formulario público + gestión en panel admin)** (2026-09-19, Lead Developer (Claude Code)): modal público con selector asesoramiento/recogida de pedido, validación L-V 11:00-15:00 y 17:00-21:00, guardado en Firestore (`appointments`) + confirmación opcional por WhatsApp; pestaña "Reservas" en `/admin` con aviso sonoro/visual y confirmar/rechazar. Verificado end-to-end en producción real.
- [x] **Fase 5: Despliegue a producción y prueba de concurrencia** (2026-09-19, Lead Developer (Claude Code)): `npm run deploy` publicado en https://jardinvida-eb973.web.app; `/`, `/tpv` y `/admin` verificados en real; prueba de concurrencia (venta simultánea web+TPV del último artículo) confirmó que la transacción atómica evita sobreventa. **Plan de migración Firebase completo (Fases 1-5).**
- [x] **Fase 4: Panel de Administración (catálogo, pedidos, exportación)** (2026-09-19, Lead Developer (Claude Code)): ruta `/admin`, edición inline de precio/stock con auditoría, alta de productos, histórico de pedidos con aviso sonoro/visual y cambio de estado, aviso de stock mínimo, exportación JSON. Verificado end-to-end en producción real.
- [x] **Fase 3: Módulo TPV de mostrador para tienda física** (2026-09-19, Lead Developer (Claude Code)): ruta `/tpv` con login Firebase Auth, escaneo de código de barras, cobro Efectivo/Tarjeta/Bizum con calculadora de cambio, ticket imprimible, transacción atómica compartida con el checkout web. Verificado end-to-end en producción real.
- [x] **Puesta en producción real: Firestore, Auth, reglas y seed contra `jardinvida-eb973`** (2026-09-18, Lead Developer (Claude Code)): base Firestore creada, reglas corregidas (checkout público puede bajar stock sin auth) y desplegadas, Auth email/password activo, admin creado, catálogo demo sembrado y verificado en producción real desde el navegador.
- [x] **Fase 2: Conexión en tiempo real de catálogo y checkout a Firestore** (2026-09-18, Lead Developer (Claude Code)): `firestore-service.js` (listener de stock + transacción atómica de pedido), `ShopContext.jsx` con fallback a modo demo local si no hay credenciales, `CheckoutModal.jsx` async con manejo de errores. Probado end-to-end en navegador.
- [x] **Fase 1.1/1.2: Importador CSV de Abarrotes PDV + CSV demo ficticio** (2026-09-18, Lead Developer (Claude Code)): `scripts/import-abarrotes-csv.mjs` con validación, mapeo a `ProductDocument` y modo dry-run; CSV demo de 10 productos para pruebas sin acceso al export real.
- [x] **Configuración y Migración de Arquitectura a Firebase** (2026-09-11, Lead Developer (Antigravity)): SDK, Hosting, Firestore Rules, cliente modular y scripts de despliegue.
- [x] **Sistema de compra online y catálogo con simulación de stock de tienda** (2026-09-11, Lead Developer (Antigravity)): Catálogo por categorías, carrito reactivo con límites por stock disponible, checkout y mensaje WhatsApp.
- [x] **Despliegue e integración del Agentic Harness Universal** (2026-09-11, Lead Developer / Architect (Antigravity)): Estructura base (.agents, tracking, scripts, git hooks).



