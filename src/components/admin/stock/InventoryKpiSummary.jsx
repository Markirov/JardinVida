import React from 'react';
import { AlertCircle, AlertTriangle, PackageCheck, Package, ShoppingBag } from 'lucide-react';

export function InventoryKpiSummary({
  products = [],
  committedMap = {},
  activeFilter = 'all',
  onSelectFilter
}) {
  const stats = React.useMemo(() => {
    let outOfStock = 0;
    let lowStock = 0;
    let healthy = 0;
    let totalCommittedUnits = 0;
    let productsWithCommitted = 0;

    products.forEach((p) => {
      const minAlert = p.minStockAlert ?? 3;
      const stock = p.stock ?? 0;
      const committed = committedMap[p.id]?.committedQty || 0;

      if (stock === 0) outOfStock++;
      else if (stock <= minAlert) lowStock++;
      else healthy++;

      if (committed > 0) {
        productsWithCommitted++;
        totalCommittedUnits += committed;
      }
    });

    return {
      total: products.length,
      outOfStock,
      lowStock,
      healthy,
      productsWithCommitted,
      totalCommittedUnits
    };
  }, [products, committedMap]);

  return (
    <div className="inventoryKpiGrid">
      <button
        type="button"
        className={`kpiCard ${activeFilter === 'all' ? 'kpiActive' : ''}`}
        onClick={() => onSelectFilter('all')}
      >
        <div className="kpiIcon kpiTotal">
          <Package size={20} />
        </div>
        <div className="kpiData">
          <span className="kpiLabel">Total Referencias</span>
          <span className="kpiValue">{stats.total}</span>
        </div>
      </button>

      <button
        type="button"
        className={`kpiCard ${activeFilter === 'out_of_stock' ? 'kpiActive' : ''}`}
        onClick={() => onSelectFilter('out_of_stock')}
      >
        <div className="kpiIcon kpiOut">
          <AlertCircle size={20} />
        </div>
        <div className="kpiData">
          <span className="kpiLabel">Agotados</span>
          <span className="kpiValue kpiTextOut">{stats.outOfStock}</span>
        </div>
      </button>

      <button
        type="button"
        className={`kpiCard ${activeFilter === 'low_stock' ? 'kpiActive' : ''}`}
        onClick={() => onSelectFilter('low_stock')}
      >
        <div className="kpiIcon kpiLow">
          <AlertTriangle size={20} />
        </div>
        <div className="kpiData">
          <span className="kpiLabel">Stock Crítico / Bajo</span>
          <span className="kpiValue kpiTextLow">{stats.lowStock}</span>
        </div>
      </button>

      <button
        type="button"
        className={`kpiCard ${activeFilter === 'committed' ? 'kpiActive' : ''}`}
        onClick={() => onSelectFilter('committed')}
      >
        <div className="kpiIcon kpiCommitted">
          <ShoppingBag size={20} />
        </div>
        <div className="kpiData">
          <span className="kpiLabel">Comprometidos en Pedidos</span>
          <span className="kpiValue kpiTextCommitted">
            {stats.productsWithCommitted} <small>({stats.totalCommittedUnits} uds)</small>
          </span>
        </div>
      </button>

      <button
        type="button"
        className={`kpiCard ${activeFilter === 'healthy' ? 'kpiActive' : ''}`}
        onClick={() => onSelectFilter('healthy')}
      >
        <div className="kpiIcon kpiHealthy">
          <PackageCheck size={20} />
        </div>
        <div className="kpiData">
          <span className="kpiLabel">Stock Saludable</span>
          <span className="kpiValue kpiTextHealthy">{stats.healthy}</span>
        </div>
      </button>
    </div>
  );
}
