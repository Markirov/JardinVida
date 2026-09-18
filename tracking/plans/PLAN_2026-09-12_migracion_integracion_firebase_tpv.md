# Plan Arquitectónico: Migración Integral del Sistema de Inventario y TPV a Firebase Cloud

> **Fecha:** 2026-09-12  
> **Autor:** Lead Developer / Software Architect (Antigravity)  
> **Proyecto:** El Jardín de la Vida — Dietética, Nutrición y Herbolario (Alicante)  
> **Estado:** Aprobado / En fase de especificación  

---

## Resumen Ejecutivo

El sistema actual de la tienda física opera sobre **Abarrotes Punto de Venta** alojado en un ordenador portátil que se apaga diariamente al cierre del local (~20:00h). Esta arquitectura presenta una limitación crítica: **la tienda online queda desconectada durante 12 horas al día**, impidiendo la venta desatendida y generando riesgo de inconsistencias de stock.

Este plan detalla la migración hacia una **arquitectura 100% Cloud sobre Google Firebase (Firestore + Hosting + Auth)**, convirtiendo la nube en la **Fuente Única de Verdad** activa 24/7/365, con un nuevo **Módulo TPV Web (Punto de Venta)** integrado directamente en la plataforma web para la operativa física de la tienda.

---

## 1. Arquitectura y Calidad del Código

`
                               ┌─────────────────────────────────────────┐
                               │       🔥 FIREBASE CLOUD (24/7)          │
                               │  - Firestore: BD Central de Stock       │
                               │  - Firebase Auth: Acceso Admin/Cajero   │
                               │  - Hosting: CDN Global SPA              │
                               └────────────────────┬────────────────────┘
                                                    │
                      ┌─────────────────────────────┴─────────────────────────────┐
                      │                                                           │
                      ▼                                                           ▼
       🛒 TIENDA ONLINE (PÚBLICA)                                  🖥️ MÓDULO TPV CAJA (PRIVADO)
       - Catálogo reactivo                                         - Modo rápido de mostrador
       - Carrito con límites por stock                             - Soporte lector código barras USB
       - Checkout con WhatsApp / Recogida                          - Arqueo de caja y cobro mixto
       - Consulta stock en tiempo real                             - Actualización inmediata en nube
`

### 1.1. Esquemas de Datos Canónicos (Firestore)

#### Colección products (/products/{productId})
`	ypescript
interface ProductDocument {
  id: string;                    // Slug o identificador único (ej: 'jv-propolis-puro')
  barcode?: string;              // Código de barras EAN-13 para lector TPV (ej: '8437012345678')
  name: string;                  // Nombre comercial
  category: string;              // 'Herbolario', 'Suplementación', 'Infusiones', etc.
  description: string;           // Descripción para la web
  format: string;                // Gotero 50ml, 60 cápsulas, 100g granel...
  origin: string;                // Procedencia (ej: 'Alicante / Huerta tradicional')
  price: number;                 // Precio PVP con IVA (ej: 14.50)
  costPrice?: number;            // Precio de coste para márgenes de tienda
  vatRate: number;               // Tipo de IVA (4, 10 o 21%)
  stock: number;                 // Existencias físicas disponibles
  minStockAlert: number;         // Umbral para aviso de reposición (ej: 3)
  imageUrl: string;              // URL de imagen optimizada
  badge?: string;                // 'Cosecha local', 'Defensas', etc.
  isActive: boolean;             // Visibilidad en catálogo web
  updatedAt: string;             // Timestamp ISO
}
`

#### Colección orders (/orders/{orderId})
`	ypescript
interface OrderDocument {
  orderId: string;               // Identificador amigable (ej: 'JV-8421')
  source: 'web_online' | 'tienda_tpv'; // Canal de venta
  date: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    vatRate: number;
  }>;
  customer?: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  deliveryMethod: 'recogida_tienda' | 'envio_domicilio' | 'venta_directa_caja';
  paymentMethod: 'bizum' | 'tarjeta' | 'efectivo' | 'tienda';
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'completado' | 'pendiente_preparacion' | 'cancelado';
  notes?: string;
}
`

#### Colección stock_movements (/stock_movements/{movementId})
`	ypescript
interface StockMovementDocument {
  id: string;
  productId: string;
  type: 'sale_online' | 'sale_pos' | 'restock' | 'adjustment';
  quantityDelta: number;         // -1, +10, etc.
  previousStock: number;
  newStock: number;
  reason?: string;
  timestamp: string;
}
`

### 1.2. Desacoplamiento y Servicios
- **Capa de Abstracción (src/lib/firestore-service.js):** Encapsula todas las llamadas SDK (getDocs, onSnapshot, unTransaction).
- **Transacciones Atómicas (unTransaction):** Para evitar condiciones de carrera si se vende el último artículo en el TPV físico exactamente en el mismo segundo en que entra una compra online.

---

## 2. UI, UX y Accesibilidad (Frontend)

### 2.1. Experiencia de Usuario (UX) en la Tienda Pública
- **Feedback Inmediato de Stock:** Indicadores semánticos mediante insignias con contraste reforzado:
  - 🟢 *En stock (X uds disponibles)*
  - 🟠 *¡Últimas X unidades en tienda!* (animación suave no intrusiva)
  - 🔴 *Agotado temporalmente* (botón deshabilitado con sugerencia de aviso)
- **Carrito Slide-Over:** Permite seleccionar recogida gratuita en C/ Jaime Segarra 51 o envío a domicilio sin abandonar la vista del catálogo.
- **Canal Directo de WhatsApp:** Integración con un solo clic con mensaje preformateado conteniendo el desglose del pedido y datos de contacto.

### 2.2. Interfaz del Módulo TPV (Modo Mostrador / Caja)
- **Modo Pantalla Completa y Teclado Rápido:**
  - Lector de código de barras USB/Bluetooth actúa de forma transparente (captura de evento KeyDown global para escanear artículos en menos de 100ms).
  - Selector táctil de productos frecuentes con botones de alto contraste.
  - Calculadora de cambio para cobros en efectivo.
- **Accesibilidad (WCAG 2.1 AA):**
  - Contraste superior a 4.5:1 en todos los textos y badges sobre fondo claro y oscuro.
  - Navegación completa por tabulación (Tab, Shift+Tab, Enter, Escape para cerrar drawers/modales).
  - Atributos ria-label, ria-live="polite" para lectores de pantalla en actualizaciones dinámicas del carrito.

---

## 3. Rendimiento y Optimización

### 3.1. Estrategia de Caché y Persistencia Offline
- **Firestore Offline Persistence (nableIndexedDbPersistence):**
  - Si la conexión de fibra de la tienda sufre una micro-interrupción de 5 minutos, el TPV físico continúa cobrando y registrando ventas en IndexedDB.
  - En cuanto la red se restablece, los movimientos se sincronizan automáticamente con Firebase.
- **Minimización de Lecturas (Plan Spark Gratuito):**
  - El plan gratuito de Firebase permite **50.000 lecturas diarias** y **20.000 escrituras diarias**.
  - Con un catálogo de ~300 productos cacheados en memoria/IndexedDB mediante listeners onSnapshot por delta de cambios, el consumo diario estimado es inferior al 5% de la cuota gratuita (**0 €/mes garantizado**).

### 3.2. Optimización de Carga Web (Frontend Vite)
- **Code Splitting & Lazy Loading:**
  - La tienda pública carga únicamente el bundle esencial (~70 KB gzip).
  - El módulo administrativo/TPV se carga bajo demanda (React.lazy(() => import('./components/pos/PosDashboard'))).
- **Assets Gráficos:**
  - Imágenes servidas en formato WebP con dimensiones responsive (srcset) y loading="lazy".

---

## 4. Seguridad y Resiliencia

### 4.1. Reglas de Seguridad Granulares (irestore.rules)
`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función auxiliar para administradores autenticados
    function isAdmin() {
      return request.auth != null;
    }

    // Catálogo de Productos
    match /products/{productId} {
      // Lectura pública para cualquier visitante de la web
      allow read: if true;
      // Solo el personal logueado en caja/admin puede crear o editar productos
      allow write: if isAdmin();
    }

    // Pedidos
    match /orders/{orderId} {
      // Clientes web pueden crear pedidos con validación de campos
      allow create: if request.resource.data.total > 0 &&
                       request.resource.data.items.size() > 0;
      // Lectura y modificación exclusiva para administración
      allow read, update, delete: if isAdmin();
    }

    // Histórico de Movimientos de Stock
    match /stock_movements/{movementId} {
      allow read, write: if isAdmin();
    }
  }
}
`

### 4.2. Plan de Resiliencia ante Desastres
- **Copias de Seguridad Automatizadas:** Exportación periódica programada de la base de datos Firestore a Google Cloud Storage o volcado JSON local.
- **Independencia de Hardware:** Al migrar de un archivo local de Abarrotes en Windows a la nube, si el ordenador portátil de la tienda sufre una avería, el personal puede abrir un iPad, teléfono móvil u otro PC y continuar la venta de inmediato sin pérdida de histórico.

---

## 5. Tareas (Checklist de Implementación)

### Fase 1 — Importador y Migración de Datos de Abarrotes PDV
- [x] 1.1 Diseñar script parser de CSV/Excel exportado de Abarrotes PDV (scripts/import-abarrotes-csv.mjs).
- [x] 1.2 Mapear campos de Abarrotes (Código, Descripción, Precio, Existencia) al esquema ProductDocument.
- [x] 1.3 Subida masiva inicial (seed) a la colección products de Firestore. *(hecho con CSV demo — pendiente re-ejecutar con export real de Abarrotes cuando esté disponible)*

### Fase 2 — Conexión en Tiempo Real de la Tienda Web
- [x] 2.1 Conectar ShopContext.jsx a listeners en vivo onSnapshot de Firestore.
- [x] 2.2 Reemplazar la simulación local de stock por transacciones atómicas en Firestore al tramitar pedido.
- [x] 2.3 Registro del pedido en la colección orders de Firestore. *(con fallback automático a modo demo local si no hay credenciales `VITE_FIREBASE_*`; verificado en producción real contra el proyecto `jardinvida-eb973`)*

### Fase 3 — Módulo de Punto de Venta (TPV) para Tienda Física
- [x] 3.1 Crear vista de mostrador src/components/pos/PosDashboard.jsx. *(ruta `/tpv`, carga lazy, protegida con login Firebase Auth)*
- [x] 3.2 Implementar listener de código de barras USB para escaneo rápido. *(input dedicado + onKeyDown Enter, no depende del submit nativo del form)*
- [x] 3.3 Pantalla de cobro rápido (Efectivo / Tarjeta / Bizum) con emisión de ticket digital/impresión. *(calculadora de cambio en efectivo, `window.print()`)*
- [x] 3.4 Descuento de existencias físico sincronizado en tiempo real con la web. *(misma transacción atómica que Fase 2, verificado en Firestore real)*

### Fase 4 — Panel de Administración & Gestión de Inventario
- [x] 4.1 Pantalla para editar precios, añadir productos nuevos y ajustar stock manualmente. *(ruta `/admin`, edición inline con auditoría en `stock_movements` tipo `adjustment`)*
- [x] 4.2 Histórico de pedidos online recibidos con aviso sonoro/visual y cambio de estado. *(beep + banner en nuevo pedido `pendiente_preparacion`; estados `completado`/`cancelado` según el esquema canónico de `OrderDocument`, no los literales "Preparado/Entregado" de este bullet — ver nota)*
- [x] 4.3 Botón de exportación de seguridad de datos a Excel/JSON. *(JSON — productos + pedidos)*

### Fase 5 — Despliegue y Verificación
- [ ] 5.1 Verificación de reglas de seguridad con Firebase Emulator / Test suite.
- [ ] 5.2 Despliegue en producción con 
pm run deploy (Hosting + Firestore Rules).
- [ ] 5.3 Prueba de concurrencia: Venta simultánea en mostrador físico y carrito web.
