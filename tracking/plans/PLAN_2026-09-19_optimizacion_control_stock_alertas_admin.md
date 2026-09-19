# Plan de Implementación: Optimización de Control de Stock, Filtros, Ordenación y Alertas de Entrega

Mejora integral del flujo de gestión de inventario y pedidos en el panel de administración (`/admin`), resolviendo la sobrecarga visual al trabajar con catálogos de alto volumen (300–500+ SKU) y aportando visibilidad en tiempo real sobre **stock comprometido** y **urgencia de entrega de pedidos**.

---

## 1. Diagnóstico del Estado Actual

1. **Gestión de Catálogo Monolítica:**
   - La tabla actual en `AdminDashboard.jsx` lista todos los productos en una única vista sin buscador, filtros ni paginación, dificultando localizar artículos o identificar rápidamente qué productos necesitan reposición urgente.
2. **Desconexión entre Pedidos Pendientes y Stock Físico:**
   - Si entran pedidos online para "Recogida en tienda", el dependiente no ve de un vistazo cuántas unidades del estante están ya comprometidas para clientes que vendrán hoy a recoger.
3. **Falta de Alertas Temporales de Entrega:**
   - Los pedidos pendientes se muestran como una lista plana sin priorización por antigüedad ni fecha/hora de recogida prometida (2h para recogida local en tienda física).

---

## 2. Propuesta de Arquitectura y Componentes

```
src/
├── components/
│   └── admin/
│       ├── AdminDashboard.jsx             # Vista orquestadora (Header, pestañas, KPI bar)
│       ├── stock/
│       │   ├── InventoryKpiSummary.jsx    # Tarjetas KPI (Agotados, Stock Bajo, Comprometidos)
│       │   ├── CatalogFiltersBar.jsx      # Buscador, píldoras de stock, selector categoría y orden
│       │   ├── StockTableRow.jsx          # Fila con desglose (Físico | Comprometido | Disponible) y acciones rápidas (+1, +5, +10)
│       │   └── StockHistoryModal.jsx      # Modal de auditoría/movimientos de un producto
│       └── orders/
│           ├── OrderUrgencyBadge.jsx      # Badge de urgencia (Crítico > 1h, Recogida Hoy, Normal)
│           └── OrdersList.jsx             # Vista de pedidos con filtrado por urgencia y canal
```

---

## 3. Especificación Detallada de Funcionalidades

### 3.1. Barra de Control y Filtros Inteligentes en Catálogo
- **Buscador en Tiempo Real:** Filtra instantáneamente por:
  - Nombre del producto
  - Código de barras EAN-13 (con soporte para escaneo directo con lector en el input)
  - Formato / Presentación (ej: "Gotero 50ml")
- **Píldoras Rápidas de Estado de Stock con Contadores Vivos:**
  - `Todos (N)`
  - 🔴 `Agotados (X)` (`stock === 0`)
  - 🟠 `Stock Crítico / Bajo (Y)` (`stock > 0 && stock <= minStockAlert`)
  - 🟢 `Stock Saludable (Z)` (`stock > minStockAlert`)
  - 📦 `Comprometidos en Pedidos (W)` (artículos reservados en pedidos pendientes de preparación)
- **Filtro de Categorías:** Menú desplegable dinámico generado a partir de las categorías reales presentes en Firestore.
- **Selector de Ordenación Multicriterio:**
  - ⬇️ **Stock: Menor a Mayor** (Prioridad absoluta para reposición y compras a proveedores)
  - ⬆️ **Stock: Mayor a Menor**
  - 🔤 **Nombre (A-Z / Z-A)**
  - 💶 **Precio (Menor / Mayor)**
  - 🏷️ **Categoría**

### 3.2. Desglose de Stock Físico vs. Comprometido vs. Disponible Real
- En cada fila del catálogo se mostrará un desglose claro:
  - **Stock en Estantería (Físico):** Total de existencias en tienda.
  - **Comprometido:** Unidades retenidas en pedidos con estado `pendiente_preparacion`.
  - **Disponible para Venta:** `Stock Físico - Unidades Comprometidas`.
- **Botones de Reposición Rápida:**
  - Botones de un clic (`+1`, `+5`, `+10`) o campo inline editable con guardado automático para agilizar la entrada de mercancía.

### 3.3. Sistema de Alertas y Urgencia de Entrega de Pedidos
- **Cálculo de Urgencia en Pedidos (`OrderUrgencyBadge`):**
  - 🚨 **Urgente / Crítico (> 1h o Recogida en < 2h):** Pedidos de recogida en C/ Jaime Segarra 51 que requieren preparación inmediata antes de la llegada del cliente.
  - ⏰ **Pendiente Hoy:** Pedidos recibidos en el día para preparar en el turno actual.
  - 🚚 **Envío a Domicilio:** Pedidos para empaquetar y entregar a mensajería.
- **Banner de Alerta en Header:**
  - Contador destacado con aviso visual si hay pedidos de recogida local pendientes de apartar.

### 3.4. Paginación y Rendimiento (Virtualización/Paginación de Tabla)
- Paginación local de 20 / 50 / 100 filas por página para mantener fluidez a 60 FPS incluso con 500–1.000 productos.

---

## 4. Tareas (Checklist de Implementación)

### Fase 1 — Modelado de Métricas y Helpers de Stock
- [x] 1.1 Crear helper `src/lib/stock-metrics.js` para calcular stock comprometido cruzando `products` y `orders`.
- [x] 1.2 Crear helper de urgencia temporal para pedidos (`getOrderUrgency(order)`).

### Fase 2 — Componentes de Filtrado y Control en Catálogo
- [x] 2.1 Crear `InventoryKpiSummary.jsx` con métricas globales (Agotados, Stock Bajo, Comprometidos).
- [x] 2.2 Crear `CatalogFiltersBar.jsx` con buscador, píldoras de estado, filtro de categoría y menú de ordenación.
- [x] 2.3 Refactorizar la tabla de catálogo en `AdminDashboard.jsx` incorporando paginación (25/50/100) y desglose de stock disponible vs comprometido.
- [x] 2.4 Añadir botones de reposición rápida (+1, +5, +10) en la columna de stock.

### Fase 3 — Sistema de Alertas de Urgencia en Pedidos
- [x] 3.1 Integrar `OrderUrgencyBadge.jsx` en la pestaña de Pedidos y en el aviso global del header.
- [x] 3.2 Añadir filtro por urgencia y tipo de entrega (Recogida tienda vs Envío) en la vista de Pedidos.

### Fase 4 — Verificación y Despliegue
- [x] 4.1 Probar ordenaciones por stock ascendente con el dataset de 300 productos.
- [x] 4.2 Probar simulación de pedido online y verificar que el stock comprometido se refleja inmediatamente en la fila del producto en el catálogo admin.
- [x] 4.3 Ejecutar `npm run build` y `bash verify.sh`.
