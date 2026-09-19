# BACKLOG DE TAREAS (PENDING)

*Este backlog organiza las tareas pendientes del proyecto por nivel de prioridad. Al completar una tarea, trasládala íntegramente a la sección "✅ Completado" al final del archivo.*

## 🔴 Alta Prioridad

- [ ] **Rediseño Jardín de la Vida — resto del paquete a escala real, pendiente de aprobación aparte** [Sin asignar]
  - Specs de referencia: https://claude.ai/artifact/7deiu1nG3K386FqurmC55p · https://claude.ai/artifact/5Fik53J5RWGqZF1Nfnex7h
  - No incluido en el envío ya aprobado (paleta, precio tachado y paginación — ver Completado): categorías dinámicas, ordenar por precio/nombre, titulares serif, hero en placa crema, buscador con autocompletado, ficha de producto en detalle, fix del listener sin límite en `firestore-service.js:9`, admin sin paginar en `AdminDashboard.jsx:325`.

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

- [x] **CSV demo a 300 productos + imagen automática de producto (Open Food Facts + placeholder por categoría)** (2026-09-19, Lead Developer (Claude Code)): nuevo `scripts/fixtures/abarrotes-export-demo-300.csv` (300 filas, 6 categorías, IVA/ofertas variados) para probar el catálogo a volumen real. `src/lib/product-image.js`: busca imagen por código de barras en Open Food Facts (gratis, sin key) y si no hay resultado cae a una imagen genérica por categoría — nunca queda en blanco, siempre editable a mano después. Se aplica al importar CSV (con vista previa de progreso), al crear/editar un producto en el admin (autocompleta al salir del código de barras o la categoría, nunca sobreescribe una imagen puesta a mano) y en la tabla de catálogo (miniatura + botón de re-buscar + edición manual de URL por fila). De paso corregido un bug real: la tienda pública leía `product.image` pero los productos de Firestore usan `imageUrl` — todos los productos sin foto propia se veían en blanco; ahora cae al placeholder por categoría. **Al escanear en el TPV no aplica todavía** — el TPV no tiene flujo de alta de producto para códigos desconocidos (solo añade productos que ya existen), así que ahí no hay nada que autocompletar hasta que se construya ese flujo (backlog aparte si se quiere).

- [x] **Botón "Volver a la web" en el panel admin + importador de CSV desde el propio panel** (2026-09-19, Lead Developer (Claude Code)): botón en el header del admin que lleva a `/`. Pestaña Catálogo con botón "Importar CSV" (formato Abarrotes PDV, mismo parser que `scripts/import-abarrotes-csv.mjs`, ahora extraído a `src/lib/abarrotes-csv.js` y compartido por ambos) con vista previa (filas válidas/con error) antes de confirmar la subida a Firestore en lotes. De paso, corregido un bug real de contraste: el botón `.btn.secondary` estaba pensado solo para el hero oscuro (texto casi blanco sobre fondo casi transparente) pero se usaba en todas partes sobre fondos claros (admin, TPV, checkout, ficha de cliente) — prácticamente invisible. Ahora `.secondary` es legible por defecto sobre fondo claro y el único uso sobre fondo oscuro (hero) lleva la clase añadida `.heroSecondary`.

- [x] **Acceso unificado ("Mi cuenta"): login/signup de cliente + ficha de cliente + endurecimiento de isAdmin()** (2026-09-19, Lead Developer (Claude Code)): botón único "Acceder" en la nav que lleva a `/cuenta`; ahí el mismo login (email+contraseña, Firebase Auth) sirve para admin y cliente — tras autenticar, se comprueba `admins/{uid}` en Firestore y se redirige al panel `/admin` si es admin, o se muestra la ficha de cliente (pedidos, citas, datos editables) si no lo es. **Corregido junto a esto un fallo de seguridad crítico:** `isAdmin()` en `firestore.rules` equivalía a "cualquier usuario autenticado" — al permitir alta pública de cuentas de cliente, cualquiera que se registrara habría heredado acceso total de admin (catálogo, pedidos, TPV). Ahora depende de la existencia de `admins/{uid}`; también se añadió el mismo guard de admin a `/admin` y `/tpv` (antes solo exigían sesión, no rol). Verificado en real: cuenta de prueba creada y confirmado que queda en la ficha de cliente (no en el panel), y que un intento REST autenticado de esa cuenta contra `products` devuelve 403; checkout/citas anónimas siguen funcionando sin cambios. Ver `tracking/DONE.md` para el detalle técnico completo.

- [x] **Rediseño Jardín de la Vida — paquete aprobado (paleta, precio tachado, paginación)** (2026-09-19, Lead Developer (Claude Code)): 6 tokens de color en `styles.css` actualizados a la paleta inspirada en Casa Pià; campo `oldPrice` opcional en `products.js`, `import-abarrotes-csv.mjs` (columna `PrecioOferta`, solo si es mayor que el precio actual) y en el admin (`AdminDashboard.jsx`, columna "Precio anterior" editable), con render condicional en `ProductCard.jsx` (precio tachado al lado); `ProductCatalog.jsx` pagina con `.slice(0, visibleCount)` + botón "Cargar más" de 12 en 12, listo para el catálogo real de ~500 SKU. Verificado end-to-end en local contra Firestore real: paleta visible, precio tachado probado en vivo (9.50€ / 11.90€ tachado) y revertido tras la prueba. Especificado y aprobado por el usuario vía Domain & Product Owner (otra sesión) — resto del paquete (categorías dinámicas, buscador, ficha de producto, etc.) queda pendiente de aprobación aparte.
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



