# TAREAS COMPLETADAS (DONE)

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


