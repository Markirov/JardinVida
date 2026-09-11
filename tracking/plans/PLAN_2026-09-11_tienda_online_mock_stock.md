# Plan de Implementación: Tienda Online & Simulación de Stock en Tiempo Real

Integración de un catálogo de productos de herbolario y dietética para **El Jardín de la Vida**, con carrito de compra reactivo, control de stock dinámico en tienda y pasarela de tramitación de pedidos con soporte para recogida local en Alicante y confirmación por WhatsApp.

---

## 1. Diagnóstico y Arquitectura

El cliente aún no ha definido el ERP/software TPV de la tienda física (Holded, Factusol, WooCommerce, Shopify, o base de datos propia en Firebase/Firestore). Por ello, implementaremos una **Capa de Abstracción de Inventario (`StockService` / `ShopContext`)** que:
1. Simula el inventario físico de la tienda en tiempo real con persistencia en `localStorage`.
2. Permite probar compras, comprobar cómo disminuye el stock al realizar pedidos y cómo la interfaz avisa de *"¡Últimas X unidades en tienda!"* o bloquea compras si un producto se agota.
3. Provee un punto de anclaje desacoplado listo para conectar la API/Base de datos real en el futuro sin reescribir la interfaz de usuario.

---

## 2. Propuesta de Componentes y Datos

```
src/
├── data/
│   └── products.js              # Catálogo inicial con precios, categorías, descripciones y stock inicial
├── context/
│   └── ShopContext.jsx          # Estado global: inventario dinámico, carrito, validación de stock y checkout
├── components/
│   └── shop/
│       ├── ProductCard.jsx      # Tarjeta individual con insignias de stock y selector de cantidad
│       ├── ProductCatalog.jsx   # Grid de productos con filtrado por categorías y buscador
│       ├── CartDrawer.jsx       # Panel lateral (slide-over) de carrito de compra
│       └── CheckoutModal.jsx    # Modal de finalización de pedido con desglose, métodos de pago y WhatsApp
└── main.jsx                     # Integración en la navegación y secciones de la web
```

---

## 3. Catálogo y Categorías de Ejemplo

Se incluirán productos representativos de la tienda en Alicante:
- **Herbolario y Fitoterapia:** Extracto de Própolis Puro, Tintura de Valeriana y Pasiflora.
- **Suplementación y Adaptógenos:** Ashwagandha KSM-66 Orgánica, Magnesio Bisglicinato.
- **Nutrición & Despensa Viva:** Miel Cruda de Azahar de la Vega Baja, Proteína Vegana de Guisante.
- **Infusiones & Mezclas:** Infusión Digestiva "Brisa de la Huerta", Té Matcha Ceremonial.
- **Cosmética Natural:** Aceite de Rosa Mosqueta Silvestre, Crema Facial de Caléndula.

---

## 4. Tareas (Checklist de Implementación)

### Fase 1 — Modelado de Datos y Estado Global
- [ ] 1.1 Crear `src/data/products.js` con catálogo enriquecido y métricas de stock.
- [ ] 1.2 Crear `src/context/ShopContext.jsx` para gestión de carrito, persistencia local y reducción de stock en checkout.

### Fase 2 — Componentes de UI de la Tienda
- [ ] 2.1 Crear `ProductCard.jsx` con indicadores visuales de disponibilidad (`En stock`, `Últimas unidades`, `Agotado`).
- [ ] 2.2 Crear `ProductCatalog.jsx` con filtros por categoría (Herbolario, Nutrición, Infusiones, Cosmética) y buscador.
- [ ] 2.3 Crear `CartDrawer.jsx` con cálculo de totales, selector de tipo de entrega (Recogida gratis en tienda Alicante / Envío) y gestión de cantidades.
- [ ] 2.4 Crear `CheckoutModal.jsx` con confirmación de pedido, generación de identificador único `#JV-XXXX` y enlace directo a WhatsApp.

### Fase 3 — Integración y Estilos
- [ ] 3.1 Integrar el botón flotante/navbar del carrito con contador reactivo en `src/main.jsx`.
- [ ] 3.2 Añadir la sección de **Tienda Online** en la navegación y estructura de la landing page.
- [ ] 3.3 Añadir estilos fluidos y coherentes con la estética orgánica en `src/styles.css`.

### Fase 4 — Verificación
- [ ] 4.1 Ejecutar `npm run build` para garantizar compilación y tipos limpios.
- [ ] 4.2 Probar flujo completo: Añadir al carrito -> Validar límites de stock -> Tramitar pedido simulado -> Comprobar descuento de stock -> Validar mensaje de WhatsApp.
