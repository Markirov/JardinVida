# TAREAS COMPLETADAS (DONE)

- [x] **Spec de rediseño: paleta verde salvia + ocre, navegación por categorías, aviso de confianza y decisión Firebase vs PrestaShop** (2026-09-19, Domain & Product Owner (Claude Code)):
  1. Informe previo de competencia (6 herbolarios online españoles, 2 en Alicante) usado como base: https://claude.ai/artifact/BPhP8kUwuPeYgUyJihGsiK
  2. Spec de diseño entregada al usuario: https://claude.ai/artifact/7deiu1nG3K386FqurmC55p — paleta (6 tokens de `styles.css` con nuevo valor hex, mismos nombres), navegación por categorías (icono lucide-react por categoría + desplegable en header, reutilizando el filtro por pestañas ya existente en `ProductCatalog.jsx`), badge "+35 años cuidando tu salud" (hero + footer), y comparativa razonada Firebase (actual) vs PrestaShop con recomendación de **seguir con Firebase** (catálogo pequeño, TPV+stock ya sincronizado a medida, migrar tiraría ese trabajo).
  3. No se tocó código (rol Domain & Product Owner, sabor lean) — tarea registrada en `tracking/PENDING.md` con lock en los 4 archivos afectados, a la espera de aprobación del usuario y ejecución por Lead Developer (gate §1.2, AGENTS.md).

- [x] **Sistema de reservas / cita previa (formulario público + gestión en panel admin)** (2026-09-19, Lead Developer / Architect (Claude Code)):
  1. Requisitos acordados explícitamente con el usuario antes de codificar: tipo de solicitud dual (asesoramiento / recogida de pedido) con selector, guardado en Firestore + confirmación opcional por WhatsApp, campos fecha/hora preferida + motivo + email + notas, en modal. Horario de atención confirmado por el usuario: **L-V de 11:00 a 15:00 y de 17:00 a 21:00**.
  2. `firestore-service.js` ampliado: `createAppointment` (id legible `CITA-XXXX`, `status: 'pendiente'`), `subscribeToAppointments` (listener en vivo ordenado por `createdAt`), `updateAppointmentStatus`. Colección `appointments` ya contemplada en `firestore.rules` desde el diseño original (`create: true` público, `read/update/delete: isAdmin()`) — sin cambios de reglas necesarios.
  3. Nuevo `src/components/shop/AppointmentModal.jsx`: selector de tipo, datos de contacto, fecha (validación L-V vía `isWeekday`, rechaza fin de semana con mensaje de error) y hora (franjas de 30 min dentro del horario de tienda), campo condicional (motivo o nº de pedido), pantalla de éxito con referencia y enlace WhatsApp prellenado (no se abre automáticamente).
  4. `main.jsx`: los 3 CTA "Pedir Cita" (nav, hero, contacto) pasan de `<a href="wa.me/...">` a `<button onClick={...}>` que abren el modal; `AppointmentModal` montado junto a `CartDrawer`/`CheckoutModal`.
  5. `AdminDashboard.jsx`: nueva pestaña **Reservas** (listado en vivo, mismo patrón de aviso sonoro/visual que Pedidos al llegar una solicitud `pendiente`, botones Confirmar/Rechazar). Export JSON ampliado para incluir `appointments`.
  6. `styles.css`: selector `.nav button.navCta` (el CTA de nav dejó de ser `<a>`), estilo `.adminAppointmentNotes`.
  7. Verificado end-to-end en local contra Firestore real de producción (`jardinvida-eb973`): modal se abre desde CTA, fecha en fin de semana (sábado 2026-09-19) rechazada con el mensaje correcto, solicitud entre semana (lunes 2026-09-21) creada con éxito (`#CITA-7287`), pantalla de éxito y enlace WhatsApp generados, pestaña Reservas del admin muestra la solicitud en vivo, botón Confirmar actualiza el estado a "Confirmada" en tiempo real.
  8. `npm run build` y `bash verify.sh` verdes.

- [x] **Fase 5: Despliegue a producción y prueba de concurrencia — Plan de migración Firebase completo** (2026-09-19, Lead Developer / Architect (Claude Code)):
  1. `npm run deploy` (build + `firebase deploy`): Hosting, reglas Firestore y config de Auth publicados en `jardinvida-eb973`. **URL pública: https://jardinvida-eb973.web.app**
  2. Verificado en producción real (no local): home pública, `/tpv` y `/admin` cargan correctamente vía el rewrite SPA de `firebase.json`.
  3. **Prueba de concurrencia (5.3):** script ad-hoc con dos sesiones Firebase independientes (una anónima simulando el carrito web, otra autenticada simulando el TPV) compitiendo en paralelo real (`Promise.allSettled`, sin esperar la una a la otra) por el último artículo de un producto forzado a `stock: 1`. Resultado: exactamente 1 de las 2 ventas tuvo éxito, la otra fue rechazada con "Stock insuficiente", stock final 0 — confirma que `runTransaction` evita la sobreventa tal como diseñado en Fase 2. Producto restaurado a su stock original tras la prueba.
  4. **5.1 sin test suite/emulador formal** — verificado manualmente contra producción real en su lugar (justificación y deuda técnica anotada en el propio plan y en PENDING.md).
  5. Con esto quedan completadas las 5 fases de `tracking/plans/PLAN_2026-09-12_migracion_integracion_firebase_tpv.md`.

- [x] **Fase 4: Panel de Administración (catálogo, pedidos, exportación)** (2026-09-19, Lead Developer / Architect (Claude Code)):
  1. Ruta `/admin` (lazy, protegida con el mismo login admin de Firebase Auth — extraído a componente compartido `src/components/shared/AdminLoginScreen.jsx`, reutilizado también por `/tpv`).
  2. `AdminDashboard.jsx` con 3 pestañas: **Catálogo** (edición inline de precio/stock con guardado explícito, alta/ocultar visibilidad, alta de producto nuevo), **Pedidos** (listado en vivo `onSnapshot` ordenado por fecha, aviso sonoro + banner visual al llegar un pedido nuevo en `pendiente_preparacion`, botones para marcar `completado`/`cancelado`), **Exportar** (descarga JSON de catálogo + pedidos).
  3. `firestore-service.js` ampliado: `subscribeToOrders`, `updateOrderStatus`, `createProduct`, `updateProductFields`, `deleteProduct`, `adjustProductStock` (esta última transaccional, deja rastro en `stock_movements` con `type: 'adjustment'` — mismo patrón que las ventas). Sin cambios en `firestore.rules`: `isAdmin()` ya cubre todo lo necesario.
  4. **Nota de fidelidad al plan:** el checklist original (Fase 4.2) mencionaba estados "Preparado/Entregado", pero el esquema canónico `OrderDocument` (sección 1.1 del plan) solo declara `'completado' | 'pendiente_preparacion' | 'cancelado'` — se implementó contra el esquema, no contra la prosa suelta del checklist.
  5. Verificado end-to-end en producción real: edición de stock (7→20 uds confirmado en Firestore), cambio de estado de pedido en vivo, alta de producto nuevo (creado y luego borrado tras la prueba), export JSON sin errores. `npm run build` y `bash verify.sh` verdes.

- [x] **Fase 3: Módulo TPV de mostrador para tienda física** (2026-09-19, Lead Developer / Architect (Claude Code)):
  1. Ruta `/tpv` (sin router — check simple de `location.pathname` en `main.jsx`) con `PosApp` cargado vía `React.lazy` (chunk separado, ~96KB, no afecta la web pública).
  2. `src/lib/auth-service.js`: wrapper de Firebase Auth (login/logout/estado). `PosLogin.jsx` protege el acceso — sin sesión no se ve el TPV.
  3. `PosDashboard.jsx`: barra de escaneo/búsqueda (código de barras o nombre), grid táctil de productos con stock en vivo, ticket con +/-/quitar, selector de pago (Efectivo/Tarjeta/Bizum) con calculadora de cambio, ticket final con `window.print()`.
  4. `firestore-service.js` ampliado con `placePosSaleTransaction` (comparte la lógica atómica de descuento de stock con el checkout web vía helper `applyStockDecrement`, pero con `source: 'tienda_tpv'`, `status: 'completado'`, movimiento `sale_pos`).
  5. **Bug de robustez encontrado y corregido:** el envío del formulario de escaneo dependía del submit nativo del `<form>`, que no siempre dispara con lectores/entornos reales — se añadió captura directa `onKeyDown` (Enter) en el input como ruta principal, más fiable para hardware USB real.
  6. **Bug de seguridad encontrado y corregido:** las reglas de `stock_movements` solo permitían `type == 'sale_online'` (checkout web), bloqueando también al admin autenticado del TPV (`sale_pos`) con `permission-denied`. Corregido: `isAdmin()` autoriza cualquier tipo de movimiento; el visitante público anónimo sigue limitado a `sale_online` con delta negativo. Redesplegado.
  7. Verificado end-to-end en producción real (`jardinvida-eb973`): login admin, escaneo de 2 códigos de barras distintos, cobro en efectivo con cambio correcto (60€ − 52,60€ = 7,40€), ticket generado, stock descontado en Firestore real (12→10 uds) confirmado por consulta directa a la API.
  8. `npm run build` y `bash verify.sh` verdes.

- [x] **Puesta en producción real: Firestore, Auth, reglas y seed contra `jardinvida-eb973`** (2026-09-18, Lead Developer / Architect (Claude Code)):
  1. Usuario proporcionó credenciales web reales de Firebase (`jardinvida-eb973`). Creado `.env` local (gitignorado) con `VITE_FIREBASE_*`.
  2. Base de datos Firestore no existía en el proyecto — creada (`(default)`, modo nativo, región `eur3`). `firestore.rules` tenía BOM que rompía la compilación — corregido.
  3. Reglas desplegadas a producción. Firebase Auth (Email/Password) inicializado vía `firebase_init` y desplegado. Usuario admin creado (`marcosfenollar@gmail.com`) vía REST Identity Toolkit para firmar el seed y futuros logins de TPV/panel (Fase 3/4).
  4. **Bug encontrado y corregido:** las reglas originales del plan solo permitían escribir `products`/`stock_movements` a usuarios autenticados, pero el checkout público (visitante anónimo) también escribe ahí al descontar stock — el checkout real fallaba con `permission-denied`. Corregido: un visitante público solo puede `update` un producto si el único cambio es **bajar** `stock` (nunca subirlo ni tocar otro campo), y solo puede `create` en `stock_movements` con `type: 'sale_online'` y `quantityDelta <= 0`. Resto de operaciones sigue exigiendo `isAdmin()`. Redesplegado y verificado.
  5. `scripts/import-abarrotes-csv.mjs` ampliado: `--commit` ahora se autentica como admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD` en `.env`) antes de escribir, ya que las reglas exigen sesión para altas/bajas completas de catálogo. También se corrigió que el proceso quedaba colgado tras terminar (falta de `process.exit`).
  6. Seed del catálogo demo (10 productos) ejecutado con éxito contra Firestore real (Fase 1.3 completada).
  7. Verificado end-to-end en navegador contra producción real: catálogo cargado desde Firestore, checkout como visitante anónimo, transacción atómica de stock (8→7 uds) confirmada en la base real, sin errores de consola tras el fix de reglas.
  8. **Pendiente de seguridad menor:** la contraseña del usuario admin es débil y quedó en texto plano en `.env` local (gitignorado, nunca comiteado) — recomendable cambiarla desde la consola Firebase cuando se monte el login real de Fase 3/4.

- [x] **Fase 2: Conexión en tiempo real de catálogo y checkout a Firestore** (2026-09-18, Lead Developer / Architect (Claude Code)):
  1. Capa `src/lib/firestore-service.js`: `subscribeToProducts` (listener `onSnapshot` sobre `products`) y `placeOrderTransaction` (transacción atómica `runTransaction`: verifica stock, lo descuenta, registra `stock_movements` y crea el pedido en `orders`, todo indivisible).
  2. `ShopContext.jsx`: si `isFirebaseActive`, el catálogo se sirve en vivo desde Firestore y `checkoutOrder` usa la transacción atómica; si no hay credenciales configuradas (caso actual), cae automáticamente al modo demo local (localStorage) sin cambios de comportamiento.
  3. `CheckoutModal.jsx`: `handleSubmit` async con estado de envío y manejo de error (p. ej. condición de carrera de stock insuficiente en la transacción) mostrado como banner en el formulario.
  4. Probado en navegador end-to-end en modo demo (Firebase no configurado): añadir al carrito, tramitar pedido, descuento de stock 8→7 uds, cesta vaciada, sin errores de consola. `npm run build` y `bash verify.sh` verdes.
  5. Se añadió `.claude/launch.json` para levantar `npm run dev` desde el Browser pane en próximas sesiones.

- [x] **Fase 1.1/1.2: Importador CSV de Abarrotes PDV + CSV demo ficticio** (2026-09-18, Lead Developer / Architect (Claude Code)):
  1. Script `scripts/import-abarrotes-csv.mjs`: parsea export CSV de Abarrotes PDV (delimitador `;`/`,` autodetectado, decimales con coma, encoding latin1), valida filas y mapea a `ProductDocument` (Firestore).
  2. CSV ficticio de prueba `scripts/fixtures/abarrotes-export-demo.csv` (10 productos, coherentes con catálogo existente en `src/data/products.js`) para demo sin acceso al export real.
  3. Modo dry-run por defecto (tabla en consola + preview JSON en `scripts/fixtures/abarrotes-import-preview.json`); flag `--commit` sube a Firestore vía SDK cliente si hay credenciales `VITE_FIREBASE_*` en `.env` (pendiente de credenciales reales — Fase 1.3 queda abierta hasta entonces).
  4. Probado end-to-end contra el CSV demo: 10/10 filas válidas. `bash verify.sh` verde.

- [x] **Diseño y especificación del Plan de Migración de Inventario y TPV a Firebase Cloud** (2026-09-12, Lead Developer / Architect (Antigravity)):
  1. Análisis exhaustivo de los 4 ejes: Arquitectura y Calidad de Código, UI/UX/Accesibilidad, Rendimiento/Optimización y Seguridad/Resiliencia.
  2. Diseño de contratos y esquemas para Firestore (`products`, `orders`, `stock_movements`).
  3. Solución al cuello de botella de Abarrotes PDV (apagado nocturno del portátil) mediante TPV Web 24/7 en la nube con soporte para lector de código de barras.
  4. Plan versionado y documentado en `tracking/plans/PLAN_2026-09-12_migracion_integracion_firebase_tpv.md`.

- [x] **Sync a Harness v2.5.0 + conversión a sabor `lean` (3 roles)** (2026-09-12, Framework Maintainer (Claude Code), prueba pedida por el usuario: "haz una prueba restringida a Jardin y Detodo... pásalos a lean"): (1) `harness.sh sync-all` (nuevo en el framework) aplicado de v2.3.0 a v2.5.0 — `.agents/AGENTS.md` reemplazado por el núcleo actual, skill `cognitive-orchestration` sincronizada; el resto (punteros raíz, reglas de rol, skill propia) quedó protegido y sin tocar (comportamiento esperado). (2) Conversión a `lean`: **Domain & Data Specialist** + **Product & UX Designer** fusionados en `.agents/rules/domain_owner.md` (copia de `recipes/lean/domain_owner.md` — el usuario autorizó perder el contenido específico de los dos roles originales, sin uso real todavía); `domain_specialist.md`/`product_designer.md` eliminados. Tabla de roles en `.agents/PROJECT.md` actualizada a 3 roles. Registrado con `harness.sh adopt "E:/Drive/jardin-vida-web" lean tracking` — manifest: 3 sincronizados (`AGENTS.md`, `domain_owner.md`, skill), 8 propios protegidos. `bash verify.sh` verde.


- [x] **Migración a Harness v2.3.0 (split núcleo/proyecto + retro-adopción)** (2026-09-12, Framework Maintainer (Claude Code)):
  1. `.agents/AGENTS.md` reemplazado por copia exacta del núcleo v2.3.0 (verificado byte a byte).
  2. Contenido propio (tabla de roles 4-rol: Lead Developer/Architect, Domain & Data Specialist, Product & UX Designer, QA & Security Reviewer; sección Seguridad de Git) movido a `.agents/PROJECT.md` nuevo, no sincronizable.
  3. `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` (raíz) actualizados para apuntar a ambos archivos.
  4. Registrado con `harness.sh adopt` — manifest con 2 archivos sincronizados (`.agents/AGENTS.md`, skill `cognitive-orchestration`), 10 propios protegidos (`.agents/PROJECT.md`, las 4 reglas de rol reales, skill `session-onboarding`, HARNESS_* previos si existían).
  5. `.agents/rules/*.md` de este proyecto usan nombres de rol propios (`domain_specialist.md`, `product_designer.md`, `qa_reviewer.md`) distintos de los genéricos del núcleo — quedan fuera del manifest por diseño, nunca se sobrescriben.

- [x] **Configuración y Migración de Arquitectura a Firebase** (2026-09-11, Lead Developer / Architect (Antigravity)):
  1. Instalación del SDK oficial de Firebase (`firebase`).
  2. Creación de configuración de Hosting (`firebase.json`) y reglas de seguridad para Firestore (`firestore.rules`).
  3. Inicialización del cliente modular en `src/lib/firebase.js` con soporte para variables de entorno (`.env.example`).
  4. Scripts añadidos a `package.json` (`npm run deploy`, `npm run deploy:hosting`).
  5. Build verificado y superado con éxito.

- [x] **Integración de Tienda Online y Simulación de Stock en Tiempo Real** (2026-09-11, Lead Developer / Architect (Antigravity)):

  1. Catálogo interactivo de productos de herbolario y dietética (`src/data/products.js`) con stock inicial, categorías y filtros.
  2. Capa de estado global `ShopContext.jsx` con persistencia en `localStorage`, validación de disponibilidad y descuento automático de stock al tramitar pedido.
  3. Carrito de compra reactivo (Slide-Over Drawer `CartDrawer.jsx`) con cálculo dinámico de totales, límites por stock disponible y selector de entrega (Recogida gratis en tienda física C/ Jaime Segarra 51 Alicante vs Envío).
  4. Pasarela de Checkout (`CheckoutModal.jsx`) con generación de ticket de pedido `#JV-XXXX` y enlace directo a WhatsApp con el desglose del pedido.
  5. Banner de sincronización de stock con botón para restablecer valores de demostración.
  6. Verificación de build (`vite build`) superada con éxito sin errores.

- [x] **Despliegue e integración del Agentic Harness Universal** (2026-09-11, Lead Developer / Architect (Antigravity)):
  1. Estructura base de gobernanza (.agents, rules, skills, tracking, scripts) desplegada desde el framework universal del Fabricador General.
  2. Git hooks de verificación (`scripts/git-hooks/pre-commit`) y scripts de arranque (`init.sh`, `verify.sh`) configurados.
  3. Punteros universales de protocolo (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`) vinculados.


