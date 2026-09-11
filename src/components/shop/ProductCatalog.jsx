import React, { useState, useMemo } from 'react';
import { Search, RotateCcw, SlidersHorizontal, Info, ShieldCheck, Truck, Store } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { CATEGORIES } from '../../data/products';
import { ProductCard } from './ProductCard';

export function ProductCatalog() {
  const { products, resetStock } = useShop();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <section id="tienda" className="shopSection">
      {/* Banner de Sincronización de Stock en Tienda */}
      <div className="stockSyncBanner">
        <div className="stockSyncInfo">
          <Store className="syncIcon" size={20} />
          <div>
            <strong>Stock en directo de tienda física (Alicante)</strong>
            <p>Las unidades se descuentan en tiempo real al tramitar tu pedido para recogida o envío.</p>
          </div>
        </div>
        <button
          className="btnResetDemo"
          onClick={resetStock}
          title="Restaura el stock inicial de la demostración"
        >
          <RotateCcw size={14} /> Restablecer stock demo
        </button>
      </div>

      <div className="sectionHeader shopHeader">
        <p className="eyebrow">Despensa y Herbolario Online</p>
        <h2>Productos seleccionados para tu bienestar cotidiano.</h2>
        <p className="shopSubtitle">
          Pide online y recoge en nuestra tienda física de <strong>C/ Jaime Segarra 51 (Alicante)</strong> o solicita entrega a domicilio.
        </p>
      </div>

      {/* Ventajas destacadas de la tienda */}
      <div className="shopPerks">
        <div className="perkItem">
          <Store size={18} />
          <span>Recogida gratuita en tienda en 2 horas</span>
        </div>
        <div className="perkItem">
          <Truck size={18} />
          <span>Envíos locales y nacionales cuidados</span>
        </div>
        <div className="perkItem">
          <ShieldCheck size={18} />
          <span>Asesoramiento herbolario profesional</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="catalogControls">
        <div className="searchBox">
          <Search size={18} className="searchIcon" />
          <input
            type="text"
            placeholder="Buscar por planta, síntoma o producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Buscar productos"
          />
          {searchQuery && (
            <button
              className="btnClearSearch"
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>

        <div className="categoryTabs" role="tablist">
          {CATEGORIES.map(category => (
            <button
              key={category}
              className={`tabBtn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
              role="tab"
              aria-selected={selectedCategory === category}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Productos */}
      {filteredProducts.length > 0 ? (
        <div className="productsGrid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="emptyCatalog">
          <Info size={32} />
          <h3>No se encontraron productos</h3>
          <p>Prueba con otros términos de búsqueda o selecciona otra categoría.</p>
          <button
            className="btn secondary"
            onClick={() => { setSelectedCategory('Todos'); setSearchQuery(''); }}
          >
            Ver todos los productos
          </button>
        </div>
      )}
    </section>
  );
}
