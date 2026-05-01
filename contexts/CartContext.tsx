'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface CartItem {
  id: string;
  cartItemId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'cartItemId'> & { quantity?: number }) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);

  // Clear cart on logout
  useEffect(() => {
    if (!user) setItems([]);
  }, [user]);

  const addItem = (item: Omit<CartItem, 'quantity' | 'cartItemId'> & { quantity?: number }) => {
    const qtyToAdd = item.quantity || 1;
    const cartItemId = item.size ? `${item.id}-${item.size}` : item.id;
    setItems(prev => {
      const existing = prev.find(i => i.cartItemId === cartItemId);
      if (existing) return prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + qtyToAdd } : i);
      return [...prev, { id: item.id, name: item.name, price: item.price, image: item.image, size: item.size, cartItemId, quantity: qtyToAdd }];
    });
    setCartOpen(true);
  };

  const removeItem = (cartItemId: string) => setItems(prev => prev.filter(i => i.cartItemId !== cartItemId));
  const updateQuantity = (cartItemId: string, qty: number) => {
    if (qty <= 0) { removeItem(cartItemId); return; }
    setItems(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: qty } : i));
  };
  const clearCart = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      items, addItem, removeItem, updateQuantity, clearCart, total, count,
      isCartOpen, setCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
