import React, { createContext, useContext, useState, useEffect } from 'react';

const CustomerAuthContext = createContext();

const API = '/api/customers';

export function CustomerAuthProvider({ shopId, children }) {
  const STORAGE_KEY = `customer_token_${shopId}`;

  const [customer, setCustomer] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [cart, setCart] = useState(customer?.cart || []);
  const [cartOpen, setCartOpen] = useState(false);

  const authHeader = customer
    ? { Authorization: `Bearer ${customer.customerId}` }
    : {};

  const register = async ({ fullName, email, password }) => {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, shopId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  };

  const login = async ({ email, password }) => {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, shopId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    
    // If a staff member (Shop Admin) logs into the customer portal
    if (data.token && data.role !== 'customer') {
      localStorage.setItem('nexflow_token', data.token);
      window.location.replace('/');
      return data;
    }

    const customerData = {
      customerId: data.customerId,
      fullName: data.fullName,
      email: data.email
    };
    setCustomer(customerData);
    setCart(data.cart || []);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(customerData));
    return data;
  };

  const logout = () => {
    setCustomer(null);
    setCart([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const addToCart = async (item, quantity = 1) => {
    if (!customer) return false;
    const res = await fetch(`${API}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ itemId: item._id, quantity })
    });
    const data = await res.json();
    if (res.ok) { setCart(data.cart); return true; }
    throw new Error(data.message);
  };

  const updateCartItem = async (itemId, quantity) => {
    const res = await fetch(`${API}/cart/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ quantity })
    });
    const data = await res.json();
    if (res.ok) setCart(data.cart);
  };

  const removeFromCart = async (itemId) => {
    const res = await fetch(`${API}/cart/${itemId}`, {
      method: 'DELETE',
      headers: authHeader
    });
    const data = await res.json();
    if (res.ok) setCart(data.cart);
  };

  const clearCart = async () => {
    const res = await fetch(`${API}/cart`, { method: 'DELETE', headers: authHeader });
    if (res.ok) setCart([]);
  };

  const getMyOrders = async () => {
    const res = await fetch('/api/checkout/my-orders', { headers: authHeader });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load orders');
    return data.orders || [];
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CustomerAuthContext.Provider value={{
      customer, cart, cartOpen, setCartOpen,
      cartTotal, cartCount, authHeader,
      register, login, logout,
      addToCart, updateCartItem, removeFromCart, clearCart,getMyOrders
    }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export const useCustomerAuth = () => useContext(CustomerAuthContext);
