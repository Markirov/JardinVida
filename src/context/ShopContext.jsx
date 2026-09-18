import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_PRODUCTS } from '../data/products';
import { isFirebaseActive } from '../lib/firebase';
import { subscribeToProducts, placeOrderTransaction } from '../lib/firestore-service';

const ShopContext = createContext(null);

const STORAGE_KEYS = {
  PRODUCTS: 'jardin_vida_products_stock_v1',
  CART: 'jardin_vida_cart_v1',
  ORDERS: 'jardin_vida_orders_v1'
};

export function ShopProvider({ children }) {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  // Fase 2.1 — con Firebase configurado, el catálogo pasa a ser fuente única de verdad
  // vía listener en vivo; sin credenciales, se mantiene la simulación local (modo demo).
  useEffect(() => {
    if (!isFirebaseActive) return;
    const unsubscribe = subscribeToProducts(
      (liveProducts) => setProducts(liveProducts),
      (err) => console.error('Error escuchando stock en tiempo real desde Firestore:', err)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Error guardando productos en localStorage:', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.error('Error guardando carrito en localStorage:', e);
    }
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    const liveProduct = products.find(p => p.id === product.id);
    if (!liveProduct || liveProduct.stock <= 0) return false;

    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      const currentQtyInCart = existing ? existing.quantity : 0;
      const allowedQtyToAdd = Math.min(quantity, liveProduct.stock - currentQtyInCart);

      if (allowedQtyToAdd <= 0) return prevCart;

      if (existing) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + allowedQtyToAdd }
            : item
        );
      } else {
        return [...prevCart, { ...liveProduct, quantity: allowedQtyToAdd }];
      }
    });

    return true;
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const liveProduct = products.find(p => p.id === productId);
    if (!liveProduct) return;

    const clampedQty = Math.min(newQuantity, liveProduct.stock);

    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity: clampedQty } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const resetStock = () => {
    setProducts(INITIAL_PRODUCTS);
    setCart([]);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CART);
  };

  // Fase 2.2/2.3 — con Firebase activo, el pedido y el descuento de stock se ejecutan en una
  // transacción atómica en Firestore (evita condiciones de carrera con el TPV físico).
  // Sin credenciales configuradas, cae al modo demo local (localStorage) tal cual antes.
  const checkoutOrder = async ({ customer, shippingMethod, paymentMethod, notes }) => {
    if (cart.length === 0) return null;

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = shippingMethod === 'envio' ? 4.90 : 0;
    const total = subtotal + shippingCost;

    if (isFirebaseActive) {
      const orderData = await placeOrderTransaction({
        cart, customer, shippingMethod, paymentMethod, notes, shippingCost, subtotal, total
      });
      setLastOrder(orderData);
      clearCart();
      return orderData;
    }

    // Reducir stock real en la tienda simulada
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const cartItem = cart.find(item => item.id === prod.id);
        if (cartItem) {
          const newStock = Math.max(0, prod.stock - cartItem.quantity);
          return { ...prod, stock: newStock };
        }
        return prod;
      });
    });

    const orderId = 'JV-' + Math.floor(1000 + Math.random() * 9000);

    const orderData = {
      orderId,
      date: new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }),
      items: [...cart],
      customer,
      shippingMethod,
      shippingCost,
      subtotal,
      total,
      paymentMethod,
      notes
    };

    setLastOrder(orderData);
    clearCart();

    try {
      const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
      history.unshift(orderData);
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(history));
    } catch (e) {
      console.error('Error guardando histórico de pedidos:', e);
    }

    return orderData;
  };

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <ShopContext.Provider
      value={{
        products,
        cart,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        lastOrder,
        setLastOrder,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        resetStock,
        checkoutOrder,
        totalCartItems,
        cartSubtotal
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop debe ser usado dentro de un ShopProvider');
  }
  return context;
}
