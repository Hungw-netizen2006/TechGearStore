import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  totalQuantity: number;
  totalAmount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('techgear_local_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Lưu giỏ hàng cục bộ nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('techgear_local_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  // Đồng bộ giỏ hàng từ server khi đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      api.getCart()
        .then((serverCart) => {
          const items: CartItem[] = serverCart.items.map((i) => ({
            product: i.product,
            quantity: i.quantity,
          }));
          setCartItems(items);
        })
        .catch(() => {
          // ignore error if server offline
        });
    }
  }, [isAuthenticated]);

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (isAuthenticated) {
      try {
        const res = await api.addToCart(product.id, quantity);
        setCartItems(res.items.map((i) => ({ product: i.product, quantity: i.quantity })));
      } catch (err: any) {
        alert(err.message || 'Không thể thêm sản phẩm');
        return;
      }
    } else {
      setCartItems((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { product, quantity }];
      });
    }
    setIsCartOpen(true);
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (isAuthenticated) {
      try {
        const res = await api.updateCartItem(productId, quantity);
        setCartItems(res.items.map((i) => ({ product: i.product, quantity: i.quantity })));
      } catch (err: any) {
        alert(err.message || 'Không thể cập nhật số lượng');
      }
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = async (productId: number) => {
    if (isAuthenticated) {
      try {
        const res = await api.removeCartItem(productId);
        setCartItems(res.items.map((i) => ({ product: i.product, quantity: i.quantity })));
      } catch {
        setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
      }
    } else {
      setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await api.clearCart();
      } catch {
        // ignore
      }
    }
    setCartItems([]);
    localStorage.removeItem('techgear_local_cart');
  };

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalQuantity,
        totalAmount,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

