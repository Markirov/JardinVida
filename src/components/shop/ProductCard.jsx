import React, { useState } from 'react';
import { ShoppingBag, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export function ProductCard({ product }) {
  const { addToCart, cart } = useShop();
  const [added, setAdded] = useState(false);

  const cartItem = cart.find(item => item.id === product.id);
  const qtyInCart = cartItem ? cartItem.quantity : 0;
  const availableToAdd = product.stock - qtyInCart;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;

  const handleAdd = () => {
    if (availableToAdd <= 0) return;
    const success = addToCart(product, 1);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  return (
    <article className={`productCard ${isOutOfStock ? 'outOfStock' : ''}`}>
      <div className="productImageWrapper">
        <img src={product.image} alt={product.name} loading="lazy" />
        
        {/* Badges de categoría o atributo */}
        <div className="productBadges">
          {product.badge && (
            <span className="badge attributeBadge">
              <Sparkles size={12} /> {product.badge}
            </span>
          )}
        </div>

        {/* Indicador de Stock en Tienda */}
        <div className="stockIndicator">
          {isOutOfStock ? (
            <span className="stockBadge out">
              <AlertCircle size={13} /> Agotado en tienda
            </span>
          ) : isLowStock ? (
            <span className="stockBadge low">
              ¡Quedan {product.stock} uds!
            </span>
          ) : (
            <span className="stockBadge in">
              En stock ({product.stock} uds)
            </span>
          )}
        </div>
      </div>

      <div className="productInfo">
        <div className="productMeta">
          <span className="productCategory">{product.category}</span>
          <span className="productFormat">{product.format}</span>
        </div>

        <h3 className="productTitle">{product.name}</h3>
        <p className="productDesc">{product.description}</p>
        
        <div className="productOrigin">
          <small>📍 {product.origin}</small>
        </div>

        <div className="productFooter">
          <div className="priceBox">
            <span className="price">{product.price.toFixed(2)}€</span>
            <small className="vat">IVA incl.</small>
          </div>

          <button
            className={`btnAddToCart ${added ? 'btnAdded' : ''} ${isOutOfStock || availableToAdd <= 0 ? 'btnDisabled' : ''}`}
            onClick={handleAdd}
            disabled={isOutOfStock || availableToAdd <= 0}
            aria-label={`Añadir ${product.name} al carrito`}
          >
            {added ? (
              <>
                <Check size={16} /> Añadido
              </>
            ) : isOutOfStock ? (
              'Agotado'
            ) : availableToAdd <= 0 ? (
              'Límite en cesta'
            ) : (
              <>
                <ShoppingBag size={16} /> Añadir
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
