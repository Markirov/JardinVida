import React, { useMemo } from 'react';
import { Search, X, ArrowDownUp, Filter, Tag, RotateCcw } from 'lucide-react';

export function CatalogFiltersBar({
  products = [],
  searchQuery,
  onSearchChange,
  stockFilter,
  onStockFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortOption,
  onSortOptionChange,
  totalFilteredCount,
  totalProductsCount
}) {
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [products]);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    stockFilter !== 'all' ||
    categoryFilter !== 'all' ||
    sortOption !== 'stock_asc';

  const handleResetFilters = () => {
    onSearchChange('');
    onStockFilterChange('all');
    onCategoryFilterChange('all');
    onSortOptionChange('stock_asc');
  };

  return (
    <div className="adminFiltersContainer">
      <div className="adminFiltersRow">
        {/* Buscador reactivo */}
        <div className="adminSearchBox">
          <Search size={18} className="adminSearchIcon" />
          <input
            type="text"
            placeholder="Buscar por nombre, código de barras EAN-13, formato o procedencia..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="adminSearchInput"
            aria-label="Buscar producto en el catálogo"
          />
          {searchQuery && (
            <button
              type="button"
              className="adminSearchClear"
              onClick={() => onSearchChange('')}
              aria-label="Borrar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Selector de Categoría */}
        <div className="adminSelectGroup">
          <label htmlFor="categoryFilterSelect" className="adminSelectLabel">
            <Tag size={15} /> Categoría:
          </label>
          <select
            id="categoryFilterSelect"
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="adminSelect"
          >
            <option value="all">Todas las categorías ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Ordenación */}
        <div className="adminSelectGroup">
          <label htmlFor="sortOptionSelect" className="adminSelectLabel">
            <ArrowDownUp size={15} /> Ordenar por:
          </label>
          <select
            id="sortOptionSelect"
            value={sortOption}
            onChange={(e) => onSortOptionChange(e.target.value)}
            className="adminSelect"
          >
            <option value="stock_asc">⬇️ Stock: Menor a Mayor (urgente reponer)</option>
            <option value="stock_desc">⬆️ Stock: Mayor a Menor</option>
            <option value="name_asc">🔤 Nombre: A → Z</option>
            <option value="name_desc">🔤 Nombre: Z → A</option>
            <option value="price_asc">💶 Precio: Menor a Mayor</option>
            <option value="price_desc">💶 Precio: Mayor a Menor</option>
            <option value="category_asc">🏷️ Categoría</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn secondary btnResetFilters"
            onClick={handleResetFilters}
            title="Restablecer todos los filtros"
          >
            <RotateCcw size={15} /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Píldoras de Estado de Stock */}
      <div className="adminPillsRow">
        <div className="adminPillsGroup" role="tablist">
          <button
            type="button"
            className={`adminPill ${stockFilter === 'all' ? 'pillActive' : ''}`}
            onClick={() => onStockFilterChange('all')}
          >
            Todos ({totalProductsCount})
          </button>
          <button
            type="button"
            className={`adminPill pillOut ${stockFilter === 'out_of_stock' ? 'pillActive' : ''}`}
            onClick={() => onStockFilterChange('out_of_stock')}
          >
            🔴 Agotados
          </button>
          <button
            type="button"
            className={`adminPill pillLow ${stockFilter === 'low_stock' ? 'pillActive' : ''}`}
            onClick={() => onStockFilterChange('low_stock')}
          >
            🟠 Stock Crítico / Bajo
          </button>
          <button
            type="button"
            className={`adminPill pillCommitted ${stockFilter === 'committed' ? 'pillActive' : ''}`}
            onClick={() => onStockFilterChange('committed')}
          >
            📦 Con Pedidos Pendientes
          </button>
          <button
            type="button"
            className={`adminPill pillHealthy ${stockFilter === 'healthy' ? 'pillActive' : ''}`}
            onClick={() => onStockFilterChange('healthy')}
          >
            🟢 Stock Saludable
          </button>
        </div>

        <div className="adminFilterResultsCount">
          Mostrando <strong>{totalFilteredCount}</strong> de {totalProductsCount} productos
        </div>
      </div>
    </div>
  );
}
