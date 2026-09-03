import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingBag, MapPin, Phone, Package,
  ChevronDown, X, ArrowLeft, ShoppingCart,
  Plus, Minus, Trash2, User, Lock, Mail, LogOut, Eye, EyeOff,
  CheckCircle, AlertCircle, Sparkles, UserCircle2, Store,
  Layers, ShoppingBasket, Shirt, Home, Watch, Smartphone, Footprints,
  Menu, Filter, HelpCircle, LayoutDashboard,
  Truck, Edit2, Edit, Receipt, Printer, DollarSign, FileText, Send, TrendingUp, TrendingDown, PackageX, AlertTriangle, FileSpreadsheet, Users, RefreshCw, Building2, Calendar, CreditCard, Banknote, ShieldCheck, Box, MoreVertical
} from 'lucide-react';
import { CustomerAuthProvider, useCustomerAuth } from '../contexts/CustomerAuthContext.jsx';
import { useUser } from '../contexts/UserContext.jsx';
import companyLogo from '../image/logo.png';
import { CheckoutModal } from '../components/CheckoutModal.jsx';
import UserOrderModal from '../components/UserOrderModal.jsx';
import { ProductModal } from '../components/ProductModal.jsx';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal.jsx';
import WalkInBillModal from '../components/WalkInBillModal.jsx';
import { OrdersManagement } from '../components/OrdersManagement.jsx';
import { PurchasesManagement } from '../components/PurchasesManagement.jsx';
import { SupplierPurchaseSummaryCard } from '../components/SupplierPurchaseSummaryCard.jsx';
import { CountUpNumber } from '../components/CountUpNumber.jsx';
import { updateItem, deleteItem as apiDeleteItem, createItem, createSale, getSales, getShopOrders, deleteSale } from '../services/api.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_CATALOG = '/api/catalog';

// Helper to get category-specific icon
const getCategoryIcon = (category) => {
  const cat = category.toLowerCase();
  if (cat.includes('grocery')) return ShoppingBasket;
  if (cat.includes('apparel') || cat.includes('cloth')) return Shirt;
  if (cat.includes('home') || cat.includes('decor')) return Home;
  if (cat.includes('accessories')) return Watch;
  if (cat.includes('electronic') || cat.includes('tech')) return Smartphone;
  if (cat.includes('footwear') || cat.includes('shoe')) return Footprints;
  if (cat.includes('package') || cat.includes('acc')) return Package;
  return Layers;
};

// ─── Customer Register / Login Full Page Component ───────────────────────────
function CustomerAuthView({ shopInfo }) {
  const navigate = useNavigate();
  const { register, login } = useCustomerAuth();
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [success, setSuccess] = useState('');

  const handle = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'register') {
        await register(form);
        await login({ email: form.email, password: form.password });
      } else {
        await login({ email: form.email, password: form.password });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-emerald-500/30">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#2D5A27]/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-in zoom-in-95 duration-500">
        <button
          onClick={() => navigate('/shop')}
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest bg-emerald-950/60 px-4 py-2 rounded-full border border-emerald-800/40 backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store Selector
        </button>

        <div className="bg-[#1E293B] border border-slate-700/60 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2D5A27] via-emerald-500 to-[#1B3817]" />

          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="p-4 bg-white rounded-2xl shadow-inner">
                {shopInfo?.logoUrl ? (
                  <img src={shopInfo.logoUrl} alt={shopInfo.name} className="w-12 h-12 rounded-xl object-contain" />
                ) : (
                  <img src={companyLogo} alt="Yousafzai Agri Foods" className="w-12 h-12 object-contain rounded-xl" />
                )}
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">{shopInfo?.name || 'Customer Portal'}</h1>
            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">
              Customer Store Login / Register
            </p>
          </div>

          <div className="flex bg-slate-900/80 rounded-2xl p-1.5 mb-6 border border-slate-700/50">
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${mode === 'register' ? 'bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
            >
              1. Register
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
            >
              2. Sign In
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 p-3.5 mb-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              {success}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={form.fullName}
                    onChange={handle('fullName')}
                    required
                    className="w-full bg-slate-900/60 border border-slate-700/60 focus:border-emerald-500 rounded-2xl py-3.5 pl-11 pr-4 text-white text-xs font-bold placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={form.email}
                  onChange={handle('email')}
                  required
                  className="w-full bg-slate-900/60 border border-slate-700/60 focus:border-emerald-500 rounded-2xl py-3.5 pl-11 pr-4 text-white text-xs font-bold placeholder:text-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handle('password')}
                  required
                  className="w-full bg-slate-900/60 border border-slate-700/60 focus:border-emerald-500 rounded-2xl py-3.5 pl-11 pr-12 text-white text-xs font-bold placeholder:text-slate-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#1B3817] hover:bg-[#12290D] border-t border-t-white/20 border-b-4 border-b-[#12290D] disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg active:translate-y-[2px] mt-4"
            >
              {loading ? (
                mode === 'register' ? 'Registering...' : 'Signing In...'
              ) : (
                mode === 'register' ? 'Register Account & Continue' : 'Sign In to Store'
              )}
            </button>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-slate-700/50">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {mode === 'register' ? 'Already registered?' : "Need an account?"}
              <button
                type="button"
                onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}
                className="text-emerald-400 hover:text-emerald-300 underline font-black ml-1.5"
              >
                {mode === 'register' ? 'Sign In Here' : 'Create Account Here'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Drawer Component ───────────────────────────────────────────────────
function CartDrawer({ currency }) {
  const safeCurrency = (!currency || currency === '$') ? 'Rs.' : currency;
  const { cart, cartOpen, setCartOpen, cartTotal, updateCartItem, removeFromCart, clearCart } = useCustomerAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end" onClick={() => setCartOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" />
      <div
        className="relative w-full max-w-md bg-[#1E293B] border-l border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 text-white"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700/60 bg-[#15202B]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1B3817] rounded-xl border border-white/10">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Your Cart</h2>
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => setCartOpen(false)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
          {cart.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="p-5 bg-slate-900 rounded-full border border-slate-700 mb-3">
                <ShoppingCart className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Your cart is currently empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.itemId} className="flex items-center gap-4 bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 shadow-sm">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Egg className="w-6 h-6 text-slate-600" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-xs truncate uppercase tracking-tight">{item.name}</p>
                <p className="text-emerald-400 font-black text-sm mt-0.5">{safeCurrency} {item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button onClick={() => updateCartItem(item.itemId, item.quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                  <Minus className="w-3 h-3 text-white" />
                </button>
                <span className="text-white font-black text-xs w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateCartItem(item.itemId, item.quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center bg-[#1B3817] text-white rounded-lg transition-all">
                  <Plus className="w-3 h-3 text-white" />
                </button>
                <button onClick={() => removeFromCart(item.itemId)}
                  className="w-7 h-7 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-all ml-1">
                  <Trash2 className="w-3 h-3 text-rose-400" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-700/60 bg-[#15202B] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">Total Amount</span>
              <span className="text-2xl font-black text-emerald-400">{safeCurrency} {cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCheckoutOpen(true)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md"
              >
                Proceed to Checkout
              </button>
            </div>
            <button onClick={clearCart}
              className="w-full py-3 bg-white/5 hover:bg-rose-500/10 border border-white/10 text-slate-400 hover:text-rose-400 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
              Empty Cart
            </button>
          </div>
        )}
      </div>

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        totalAmount={cartTotal}
        currency={safeCurrency}
      />
    </div>
  );
}

// ─── Main Storefront Content (Dashboard with Green Sidebar & Gray/Green Theme) ─────────
function StoreContent({ shopId }) {
  const navigate = useNavigate();
  const { customer, logout: customerLogout, cartCount, setCartOpen, addToCart } = useCustomerAuth();
  const { user, isShopAdmin, isSuperAdmin, logout: userLogout } = useUser();
  const savedUserStr = typeof window !== 'undefined' ? (localStorage.getItem('nexflow_user') || sessionStorage.getItem('nexflow_user')) : null;
  let savedRole = '';
  try {
    if (savedUserStr) {
      const parsed = JSON.parse(savedUserStr);
      savedRole = (parsed?.role || '').toLowerCase();
    }
  } catch (e) { }

  const custEmail = (customer?.email || '').toLowerCase();
  const custName = (customer?.fullName || '').toLowerCase();
  const isStaffAccount = custEmail.includes('admin') || custName.includes('admin');

  const userRole = (user?.role || savedRole || customer?.role || '').toLowerCase();
  const hasAdminToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('nexflow_token'));

  const isAdminUser =
    Boolean(isShopAdmin?.()) ||
    Boolean(isSuperAdmin?.()) ||
    ['shop_admin', 'super_admin', 'admin', 'owner', 'manager'].includes(userRole) ||
    hasAdminToken ||
    isStaffAccount;

  const canBuy = !isAdminUser;
  const [shop, setShop] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [editModalProduct, setEditModalProduct] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, item: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [addedMsg, setAddedMsg] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [activeView, setActiveView] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlView = urlParams.get('tab') || urlParams.get('view');
      if (urlView) return urlView;
      const saved = sessionStorage.getItem('yosafze_active_view') || localStorage.getItem('yosafze_active_view');
      if (saved) return saved;
    } catch (e) { }
    return 'dashboard';
  });

  useEffect(() => {
    try {
      if (activeView) {
        sessionStorage.setItem('yosafze_active_view', activeView);
        localStorage.setItem('yosafze_active_view', activeView);
      }
    } catch (e) { }
  }, [activeView]);

  useEffect(() => {
    fetchDamagedProducts();
    if (activeView === 'sales' || activeView === 'report-sales' || activeView === 'report-profit') {
      fetchShopSales();
    }
    if (activeView === 'registered-customers') {
      fetchRegisteredCustomers();
    }
    if (activeView === 'report-expenses' || activeView === 'damaged-products' || activeView === 'dashboard') {
      fetchExpenses();
      fetchDamagedProducts();
    }
  }, [activeView, shopId]);

  // ─── Walk-in Sales & Billing State for ShopAdmin ───
  const [walkInCart, setWalkInCart] = useState([]);
  const [walkInCustomerName, setWalkInCustomerName] = useState('');
  const [walkInCustomerPhone, setWalkInCustomerPhone] = useState('');
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState('CASH');
  const [walkInTransactionId, setWalkInTransactionId] = useState('');
  const [walkInPaymentProof, setWalkInPaymentProof] = useState('');
  const [viewingReceiptModal, setViewingReceiptModal] = useState(null);
  const [completedBill, setCompletedBill] = useState(null);
  const [isProcessingWalkIn, setIsProcessingWalkIn] = useState(false);
  const [shopSalesList, setShopSalesList] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [registeredCustomersList, setRegisteredCustomersList] = useState([]);
  const [activeCustMenuId, setActiveCustMenuId] = useState(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [allShopOrders, setAllShopOrders] = useState([]);

  const handleReceiptUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setWalkInPaymentProof(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleApproveSale = async (saleId) => {
    try {
      const token = localStorage.getItem('nexflow_token');
      const res = await fetch(`/api/sales/${saleId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ approvalStatus: 'APPROVED' })
      });
      if (res.ok) {
        setAddedMsg('Bank Transfer Payment Approved!');
        setTimeout(() => setAddedMsg(''), 3000);
        fetchShopSales();
        fetchDashboardStats();
      }
    } catch (err) {
      console.error("Approve sale error:", err);
    }
  };

  const fetchRegisteredCustomers = async () => {
    if (!shopId) return;
    setLoadingCustomers(true);
    try {
      const [custRes, salesData, ordersData] = await Promise.all([
        fetch(`/api/customers/all?shopId=${shopId}`).then(r => r.ok ? r.json() : { customers: [] }),
        getSales(shopId).catch(() => []),
        getShopOrders({ shopId }).catch(() => ({ orders: [] }))
      ]);

      const rawCust = custRes.customers || [];
      const shopFilteredCust = rawCust.filter(c => !c.shopId || String(c.shopId?._id || c.shopId) === String(shopId));
      setRegisteredCustomersList(shopFilteredCust);

      const salesArr = Array.isArray(salesData) ? salesData : (salesData?.sales || salesData?.data || []);
      const shopFilteredSales = salesArr.filter(s => !s.shopId || String(s.shopId?._id || s.shopId) === String(shopId));
      setShopSalesList(shopFilteredSales);

      const ordersArr = ordersData?.orders || ordersData?.data || (Array.isArray(ordersData) ? ordersData : []);
      const shopFilteredOrders = ordersArr.filter(o => !o.shopId || String(o.shopId?._id || o.shopId) === String(shopId));
      setAllShopOrders(shopFilteredOrders);
    } catch (err) {
      console.error("Fetch registered customers error:", err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const getCustomerStats = (cust) => {
    const custId = String(cust._id || '').toLowerCase();
    const name = (cust.fullName || cust.name || '').toLowerCase().trim();
    const email = (cust.email || '').toLowerCase().trim();
    const phone = (cust.phone || '').trim().replace(/\D/g, '');

    const matchingSales = shopSalesList.filter(s => {
      const sId = String(s.customerId || s.user || s.userId || '').toLowerCase();
      const cName = (s.customerName || s.name || s.fullName || '').toLowerCase().trim();
      const cEmail = (s.customerEmail || s.email || '').toLowerCase().trim();
      const cPhone = (s.customerPhone || s.phone || '').trim().replace(/\D/g, '');

      if (custId && sId && custId === sId) return true;
      if (email && cEmail && (email === cEmail || cEmail.includes(email) || email.includes(cEmail))) return true;
      if (name && cName && (cName === name || cName.includes(name) || name.includes(cName))) return true;
      if (phone && cPhone && phone.length >= 7 && cPhone.length >= 7 && (cPhone.includes(phone) || phone.includes(cPhone))) return true;
      return false;
    });

    const matchingOrders = allShopOrders.filter(o => {
      const oCustId = String(o.customerId || o.user || o.userId || '').toLowerCase();
      const shipName = (o.shippingDetails?.fullName || o.shippingDetails?.name || o.customerName || o.fullName || '').toLowerCase().trim();
      const shipEmail = (o.shippingDetails?.email || o.email || o.customerEmail || '').toLowerCase().trim();
      const shipPhone = (o.shippingDetails?.phone || o.phone || o.customerPhone || '').trim().replace(/\D/g, '');

      if (custId && oCustId && custId === oCustId) return true;
      if (email && shipEmail && (email === shipEmail || shipEmail.includes(email) || email.includes(shipEmail))) return true;
      if (name && shipName && (shipName === name || shipName.includes(name) || name.includes(shipName))) return true;
      if (phone && shipPhone && phone.length >= 7 && shipPhone.length >= 7 && (shipPhone.includes(phone) || phone.includes(shipPhone))) return true;
      return false;
    });

    const salesTotal = matchingSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const ordersTotal = matchingOrders.reduce((sum, o) => sum + (Number(o.totalAmount || o.grandTotal) || 0), 0);

    const totalSpent = salesTotal + ordersTotal;
    const ordersCount = matchingSales.length + matchingOrders.length;

    const combinedHistory = [
      ...matchingSales.map(s => ({
        date: s.saleDate || s.createdAt,
        items: (s.items || []).map(i => `${i.name} (${i.quantity})`).join(', '),
        amount: Number(s.totalAmount) || 0,
        type: 'POS Sale'
      })),
      ...matchingOrders.map(o => ({
        date: o.createdAt || o.orderDate,
        items: (o.items || []).map(i => `${i.name || i.title} (${i.quantity})`).join(', '),
        amount: Number(o.totalAmount || o.grandTotal) || 0,
        type: 'Online Order'
      }))
    ];

    return { totalSpent, ordersCount, matchingSales, matchingOrders, combinedHistory };
  };

  const handleWhatsAppCustomerShare = (cust, index = 0) => {
    const shopName = shop?.name || 'Yosafze Egg Traders';
    const name = cust.fullName || 'Registered Customer';
    const phone = cust.phone || '';
    const email = cust.email || 'N/A';
    const regDate = new Date(cust.createdAt || Date.now()).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    const serialNo = index + 1;
    const uniqueId = `CUST-${String(serialNo).padStart(4, '0')}`;
    const { totalSpent, ordersCount, combinedHistory } = getCustomerStats(cust);

    let text = `📄 *CUSTOMER ACCOUNT STATEMENT - ${shopName.toUpperCase()}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔢 *Serial No:* #${serialNo} (${uniqueId})\n`;
    text += `👤 *Customer Name:* ${name}\n`;
    if (phone) text += `📞 *Phone:* ${phone}\n`;
    text += `📧 *Email:* ${email}\n`;
    text += `📅 *Registration Date:* ${regDate}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📊 *Total Orders:* ${ordersCount} ${ordersCount === 1 ? 'Order' : 'Orders'}\n`;
    text += `💰 *Total Shopping Spent:* RS ${totalSpent.toLocaleString('en-PK')}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;

    if (combinedHistory.length > 0) {
      text += `📦 *TRANSACTION BREAKDOWN:*\n`;
      combinedHistory.forEach((item, idx) => {
        const dateStr = new Date(item.date).toLocaleDateString('en-PK');
        text += `${idx + 1}. [${dateStr}] ${item.items} = RS ${item.amount.toLocaleString('en-PK')} (${item.type})\n`;
      });
    } else {
      text += `_No purchase history recorded yet._\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🙏 *Thank you for shopping with ${shopName}!*`;

    const encodedText = encodeURIComponent(text);
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0092')) cleanPhone = '92' + cleanPhone.slice(4);
    else if (cleanPhone.startsWith('0')) cleanPhone = '92' + cleanPhone.slice(1);
    else if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) cleanPhone = '92' + cleanPhone;

    const whatsappUrl = cleanPhone
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://web.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };

  const handleExportCustomerExcel = (cust, index = 0) => {
    const shopName = shop?.name || 'Yosafze Egg Traders';
    const name = cust.fullName || 'Registered Customer';
    const email = cust.email || 'N/A';
    const phone = cust.phone || 'N/A';
    const regDate = new Date(cust.createdAt || Date.now()).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    const serialNo = index + 1;
    const uniqueId = `CUST-${String(serialNo).padStart(4, '0')}`;
    const { totalSpent, ordersCount, combinedHistory } = getCustomerStats(cust);

    const formattedRowsHtml = combinedHistory.length > 0 ? combinedHistory.map((item, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; padding: 7px 10px; vertical-align: middle;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 7px 10px; vertical-align: middle;">${new Date(item.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0284c7; padding: 7px 10px; vertical-align: middle;">${item.type}</td>
        <td style="border: 1px solid #cbd5e1; font-weight: bold; padding: 7px 12px; vertical-align: middle; text-transform: uppercase;">${item.items}</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; font-weight: 900; color: #047857; padding: 7px 12px; vertical-align: middle;">RS ${item.amount.toLocaleString()}</td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="5" style="text-align: center; padding: 18px; border: 1px solid #cbd5e1; color: #64748b; font-weight: bold; background-color: #f8fafc;">No transaction history recorded yet for this customer</td>
      </tr>
    `;

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Customer_${uniqueId}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; }
          .header-banner { background-color: #0f172a; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: center; height: 38px; border: 1px solid #0f172a; vertical-align: middle; }
          .sub-banner { background-color: #1e293b; color: #34d399; font-size: 9.5pt; text-align: center; font-weight: bold; height: 22px; border: 1px solid #1e293b; vertical-align: middle; }
          .info-label { font-weight: bold; color: #475569; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 7px 12px; }
          .info-val { font-weight: 600; color: #0f172a; background-color: #ffffff; border: 1px solid #cbd5e1; padding: 7px 12px; }
          .col-header { background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 9.5pt; border: 1px solid #0f172a; padding: 8px 6px; }
          .tot-lbl { background-color: #0f172a; color: #ffffff; font-weight: 900; font-size: 11pt; text-align: right; border: 1px solid #0f172a; padding: 10px 14px; }
          .tot-val { background-color: #ecfdf5; color: #047857; font-weight: 900; font-size: 13pt; text-align: right; border: 2px solid #059669; padding: 10px 14px; }
          .footer-note { color: #64748b; font-size: 9pt; font-style: italic; text-align: center; height: 26px; vertical-align: middle; border: none; }
        </style>
      </head>
      <body>
        <table>
          <colgroup>
            <col width="60" />
            <col width="190" />
            <col width="140" />
            <col width="300" />
            <col width="170" />
          </colgroup>
          <tr>
            <td colspan="5" class="header-banner">${shopName.toUpperCase()}</td>
          </tr>
          <tr>
            <td colspan="5" class="sub-banner">OFFICIAL REGISTERED CUSTOMER STATEMENT &amp; TRANSACTION RECORD</td>
          </tr>
          <tr style="height: 10px;"><td colspan="5" style="border:none;"></td></tr>
          <tr>
            <td colspan="2" class="info-label">Customer Serial &amp; ID:</td>
            <td colspan="3" class="info-val" style="color: #d97706; font-weight: 900;">SERIAL #${serialNo} &nbsp;(${uniqueId})</td>
          </tr>
          <tr>
            <td colspan="2" class="info-label">Customer Full Name:</td>
            <td colspan="3" class="info-val" style="font-weight: 900; text-transform: uppercase;">${name}</td>
          </tr>
          <tr>
            <td colspan="2" class="info-label">Contact Phone / WhatsApp:</td>
            <td colspan="3" class="info-val" style="mso-number-format:'\\@'; font-weight: bold; color: #047857;">${phone}</td>
          </tr>
          <tr>
            <td colspan="2" class="info-label">Email Address:</td>
            <td colspan="3" class="info-val" style="color: #334155; font-weight: 600;">${email}</td>
          </tr>
          <tr>
            <td colspan="2" class="info-label">Registration Date:</td>
            <td colspan="3" class="info-val">${regDate}</td>
          </tr>
          <tr>
            <td colspan="2" class="info-label">Total Orders Placed:</td>
            <td colspan="3" class="info-val" style="color: #0284c7; font-weight: bold;">${ordersCount} Orders</td>
          </tr>
          <tr>
            <td colspan="2" class="info-label">Store Branch:</td>
            <td colspan="3" class="info-val" style="font-weight: bold;">${shopName}</td>
          </tr>
          <tr style="height: 14px;"><td colspan="5" style="border:none;"></td></tr>
          <tr style="height: 32px;">
            <th class="col-header" style="text-align: center;">#</th>
            <th class="col-header">Transaction Date</th>
            <th class="col-header" style="text-align: center;">Order Type</th>
            <th class="col-header" style="text-align: left;">Items Purchased</th>
            <th class="col-header" style="text-align: right;">Paid Amount</th>
          </tr>
          ${formattedRowsHtml}
          <tr style="height: 10px;"><td colspan="5" style="border:none;"></td></tr>
          <tr>
            <td colspan="4" class="tot-lbl">TOTAL PURCHASES AMOUNT:</td>
            <td class="tot-val">RS ${totalSpent.toLocaleString()}</td>
          </tr>
          <tr style="height: 12px;"><td colspan="5" style="border:none;"></td></tr>
          <tr>
            <td colspan="5" class="footer-note">Official Customer Statement • Generated via Yosafze Egg Traders Financial System</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Customer_${uniqueId}_${name.replace(/\s+/g, '_')}_Statement.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintRegisteredCustomerRecord = (cust, index = 0) => {
    const shopName = shop?.name || 'Yosafze Egg Traders';
    const name = cust.fullName || 'Registered Customer';
    const email = cust.email || 'N/A';
    const phone = cust.phone || 'N/A';
    const regDate = new Date(cust.createdAt || Date.now()).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    const serialNo = index + 1;
    const uniqueId = `CUST-${String(serialNo).padStart(4, '0')}`;
    const { totalSpent, ordersCount, combinedHistory } = getCustomerStats(cust);

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to print customer statement');
      return;
    }

    let salesRows = combinedHistory.length > 0 ? combinedHistory.map((item, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding:10px; border:1px solid #cbd5e1; text-align:center; font-weight:bold; vertical-align:middle;">${idx + 1}</td>
        <td style="padding:10px; border:1px solid #cbd5e1; vertical-align:middle; font-weight:600; color:#334155;">${new Date(item.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        <td style="padding:10px; border:1px solid #cbd5e1; text-align:center; vertical-align:middle;">
          <span style="background:#e0f2fe; color:#0369a1; padding:3px 10px; border-radius:6px; font-weight:900; font-size:10.5px; text-transform:uppercase; border:1px solid #bae6fd;">${item.type}</span>
        </td>
        <td style="padding:10px; border:1px solid #cbd5e1; font-weight:bold; text-transform:uppercase; vertical-align:middle; color:#0f172a;">${item.items}</td>
        <td style="padding:10px; border:1px solid #cbd5e1; text-align:right; font-weight:900; color:#047857; vertical-align:middle;">RS ${item.amount.toLocaleString('en-PK')}</td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="5" style="padding:26px; text-align:center; color:#64748b; font-weight:bold; background:#f8fafc;">
          No transaction history recorded yet for this customer.
        </td>
      </tr>
    `;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customer Profile & Statement - ${uniqueId} - ${name}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm 15mm; }
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; background: #f8fafc; font-size: 12px; margin: 0; }
            .statement-wrapper { max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); overflow: hidden; border: 1.5px solid #cbd5e1; }
            .header-banner { background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #065f46 100%); color: #ffffff; padding: 22px 28px; display: flex; justify-content: space-between; align-items: center; }
            .header-title h1 { margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; color: #ffffff; }
            .header-title p { margin: 4px 0 0; font-size: 10px; font-weight: 800; color: #34d399; letter-spacing: 1.5px; text-transform: uppercase; }
            .serial-tag { background: #f59e0b; color: #0f172a; padding: 7px 16px; border-radius: 10px; font-weight: 900; font-size: 13px; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); text-align: center; }
            .serial-tag span { display: block; font-size: 8.5px; font-weight: 800; opacity: 0.85; text-transform: uppercase; }
            .body-content { padding: 26px 28px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 22px; }
            .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; }
            .info-card .label { font-size: 9.5px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
            .info-card .value { font-size: 13px; font-weight: 800; color: #0f172a; }
            .section-title { font-size: 11.5px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; margin: 22px 0 10px 0; display: flex; align-items: center; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; }
            th { background: #0f172a; color: #ffffff; text-transform: uppercase; font-weight: 900; font-size: 10px; letter-spacing: 0.5px; padding: 10px 12px; border: 1px solid #0f172a; text-align: left; }
            .amount-hero { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #10b981; border-radius: 16px; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; margin: 22px 0 26px 0; }
            .amount-hero .lbl { font-size: 12px; font-weight: 900; color: #065f46; text-transform: uppercase; letter-spacing: 1px; }
            .amount-hero .sub { font-size: 9.5px; font-weight: 700; color: #047857; margin-top: 2px; }
            .amount-hero .val { font-size: 24px; font-weight: 900; color: #047857; letter-spacing: -0.5px; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 36px; padding-top: 20px; border-top: 1px dashed #cbd5e1; text-align: center; }
            .sign-line { border-top: 1.5px solid #94a3b8; padding-top: 6px; font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
            .statement-footer { margin-top: 22px; text-align: center; font-size: 9.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
            @media print {
              body { background: #ffffff; padding: 0; }
              .statement-wrapper { box-shadow: none; border: 1.5px solid #94a3b8; }
            }
          </style>
        </head>
        <body>
          <div class="statement-wrapper">
            <div class="header-banner">
              <div class="header-title">
                <h1>${shopName.toUpperCase()}</h1>
                <p>OFFICIAL REGISTERED CUSTOMER STATEMENT &amp; TRANSACTION RECORD</p>
              </div>
              <div class="serial-tag">
                <span>CUSTOMER ID</span>
                SERIAL #${serialNo} (${uniqueId})
              </div>
            </div>

            <div class="body-content">
              <div class="info-grid">
                <div class="info-card">
                  <div class="label">Customer Full Name</div>
                  <div class="value" style="text-transform: uppercase;">${name}</div>
                </div>
                <div class="info-card">
                  <div class="label">Registration Date</div>
                  <div class="value">${regDate}</div>
                </div>
                <div class="info-card">
                  <div class="label">Contact Phone / WhatsApp</div>
                  <div class="value" style="color: #047857;">${phone}</div>
                </div>
                <div class="info-card">
                  <div class="label">Total Orders Placed</div>
                  <div class="value" style="color: #0284c7;">${ordersCount} ${ordersCount === 1 ? 'Order' : 'Orders'}</div>
                </div>
                <div class="info-card" style="grid-column: span 2;">
                  <div class="label">Email Address</div>
                  <div class="value" style="color: #334155;">${email}</div>
                </div>
              </div>

              <div class="section-title">
                <span>All Purchases &amp; Transaction History</span>
                <span style="font-size: 9.5px; color: #64748b;">${combinedHistory.length} Transactions</span>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style="text-align:center; width:45px;">#</th>
                    <th style="width:170px;">Transaction Date</th>
                    <th style="width:120px; text-align:center;">Order Type</th>
                    <th>Items Purchased</th>
                    <th style="text-align:right; width:150px;">Paid Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${salesRows}
                </tbody>
              </table>

              <div class="amount-hero">
                <div>
                  <div class="lbl">TOTAL PURCHASES AMOUNT:</div>
                  <div class="sub">Total Lifetime Cumulative Shopping</div>
                </div>
                <div class="val">RS ${totalSpent.toLocaleString('en-PK')}</div>
              </div>

              <div class="signatures">
                <div class="sign-line">Customer Signature</div>
                <div class="sign-line">${shopName} Authorized Stamp</div>
              </div>

              <div class="statement-footer">
                Yosafze Egg Traders • Official Customer Management &amp; Accounts Ledger
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 300);
  };

  const getProductUnitPrice = (product, unit = 'tray') => {
    if (!product) return 0;
    const basePrice = Number(product.price) || 0;
    const pEgg = Number(product.pricePerEgg) || 0;
    const pTray = Number(product.pricePerTray) || 0;
    const pPeti = Number(product.pricePerPeti) || 0;
    const uType = String(product.unitType || 'tray').toLowerCase();

    let eggRate = pEgg;
    if (!eggRate && pTray > 0) eggRate = pTray / 30;
    else if (!eggRate && pPeti > 0) eggRate = pPeti / 360;
    else if (!eggRate && basePrice > 0) {
      eggRate = uType === 'peti' ? basePrice / 360 : uType === 'tray' ? basePrice / 30 : basePrice;
    }
    if (!eggRate) eggRate = 30;

    if (unit === 'peti') {
      if (pPeti > 0) return pPeti;
      if (pTray > 0) return pTray * 12;
      return Math.round(eggRate * 360);
    }
    if (unit === 'tray') {
      if (pTray > 0) return pTray;
      if (pPeti > 0) return Math.round(pPeti / 12);
      return Math.round(eggRate * 30);
    }
    // 'egg'
    if (pEgg > 0) return pEgg;
    if (pTray > 0) return Math.round(pTray / 30);
    return Math.round(eggRate);
  };

  const addToWalkInCart = (product, unit = 'tray') => {
    if ((product.stock || 0) <= 0) {
      alert('Product is out of stock!');
      return;
    }
    const unitPrice = getProductUnitPrice(product, unit);
    setWalkInCart(prev => {
      const existing = prev.find(item => item.product._id === product._id && (item.selectedUnit || 'tray') === unit);
      if (existing) {
        return prev.map(item =>
          item.product._id === product._id && (item.selectedUnit || 'tray') === unit
            ? { ...item, quantity: item.quantity + 1, unitPrice }
            : item
        );
      }
      return [...prev, { product, quantity: 1, selectedUnit: unit, unitPrice }];
    });
    setAddedMsg(`Added ${product.name} (${unit.toUpperCase()}) to bill`);
    setTimeout(() => setAddedMsg(''), 2000);
  };

  const updateWalkInUnit = (productId, currentUnit, newUnit) => {
    setWalkInCart(prev =>
      prev.map(item => {
        if (item.product._id === productId && (item.selectedUnit || 'tray') === currentUnit) {
          const newUnitPrice = getProductUnitPrice(item.product, newUnit);
          return {
            ...item,
            selectedUnit: newUnit,
            unitPrice: newUnitPrice
          };
        }
        return item;
      })
    );
  };

  const updateWalkInQty = (productId, unit, delta) => {
    setWalkInCart(prev =>
      prev.map(item => {
        if (item.product._id === productId && (item.selectedUnit || 'tray') === unit) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeFromWalkInCart = (productId, unit) => {
    setWalkInCart(prev => prev.filter(item => !(item.product._id === productId && (item.selectedUnit || 'tray') === unit)));
  };

  const fetchShopSales = async () => {
    setLoadingSales(true);
    try {
      const sales = await getSales(shopId);
      setShopSalesList(sales || []);
    } catch (err) {
      console.error("Failed to load sales:", err);
    } finally {
      setLoadingSales(false);
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('Delete this sale record? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('nexflow_token');
      await fetch(`/api/sales/${saleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'x-user-role': user?.role || 'shop_admin' }
      });
      setShopSalesList(prev => prev.filter(s => s._id !== saleId));
      fetchDashboardStats();
    } catch (err) {
      alert('Failed to delete sale. Please try again.');
      console.error('Delete sale error:', err);
    }
  };

  const handleCompleteWalkInSale = async () => {
    if (walkInCart.length === 0) {
      alert('Walk-in cart is empty!');
      return;
    }
    setIsProcessingWalkIn(true);
    try {
      const saleItems = walkInCart.map(item => {
        const unit = item.selectedUnit || 'tray';
        const tPerPeti = item.product?.traysPerPeti || 12;
        const ePerTray = item.product?.eggsPerTray || 30;
        const ePerPeti = tPerPeti * ePerTray;
        const qty = Number(item.quantity) || 1;

        let breakdownStr = '';
        if (unit === 'peti') {
          const totalTrays = (qty * tPerPeti).toFixed(1).replace(/\.0$/, '');
          const totalEggs = Math.round(qty * ePerPeti);
          breakdownStr = `${qty} Peti • ${totalTrays} Trays • ${totalEggs.toLocaleString()} Eggs`;
        } else if (unit === 'tray') {
          const totalEggs = Math.round(qty * ePerTray);
          const totalPetis = (qty / tPerPeti).toFixed(2).replace(/\.00$/, '');
          breakdownStr = `${qty} Tray • ${totalEggs.toLocaleString()} Eggs • ${totalPetis} Peti`;
        } else {
          const totalTrays = (qty / ePerTray).toFixed(1).replace(/\.0$/, '');
          const totalPetis = (qty / ePerPeti).toFixed(2).replace(/\.00$/, '');
          breakdownStr = `${qty} Egg • ${totalTrays} Trays • ${totalPetis} Peti`;
        }

        const unitMultiplier = unit === 'peti' ? ePerPeti : unit === 'tray' ? ePerTray : 1;
        const totalEggs = qty * unitMultiplier;
        const unitPrice = item.unitPrice || getProductUnitPrice(item.product, unit);
        const subtotal = Math.round(unitPrice * qty);

        const unitCost = Number(item.product.costPrice) > 0 ? Number(item.product.costPrice) : (Number(item.product.price) || 0) * 0.8;
        const costPerEgg = item.product.unitType === 'peti' ? unitCost / ePerPeti : item.product.unitType === 'tray' ? unitCost / ePerTray : unitCost;
        const itemTotalCost = Math.round(costPerEgg * totalEggs);
        const profit = Math.max(0, subtotal - itemTotalCost);

        const unitLabel = unit === 'peti' ? 'Peti' : unit === 'tray' ? 'Tray' : 'Egg';

        return {
          productId: item.product._id,
          name: `${item.product.name} (${breakdownStr})`,
          rawProductName: item.product.name,
          quantity: qty,
          unit: unit,
          unitLabel: unitLabel,
          totalEggs: totalEggs,
          price: unitPrice,
          costPrice: unitCost,
          subtotal: subtotal,
          profit: profit
        };
      });

      const totalAmount = saleItems.reduce((sum, i) => sum + (Number(i.subtotal) || 0), 0);
      const totalProfit = saleItems.reduce((sum, i) => sum + (Number(i.profit) || 0), 0);

      const saleData = {
        shopId,
        items: saleItems,
        totalAmount,
        totalProfit,
        cashierName: user?.fullName || 'Shop Admin',
        customerName: walkInCustomerName.trim() || 'Walk-in Customer',
        customerPhone: walkInCustomerPhone.trim(),
        paymentMethod: walkInPaymentMethod,
        transactionId: walkInTransactionId.trim(),
        paymentProof: walkInPaymentProof,
        approvalStatus: walkInPaymentMethod === 'BANK_TRANSFER' ? 'PENDING_APPROVAL' : 'APPROVED'
      };

      const created = await createSale(saleData);

      const billData = {
        ...created,
        customerPhone: walkInCustomerPhone.trim()
      };

      setCompletedBill(billData);
      setWalkInCart([]);
      setWalkInCustomerName('');
      setWalkInCustomerPhone('');
      setWalkInPaymentMethod('CASH');
      setWalkInTransactionId('');
      setWalkInPaymentProof('');
      fetchCatalog();
      fetchDashboardStats();
      fetchShopSales();
    } catch (err) {
      alert(err.message || 'Failed to complete sale');
    } finally {
      setIsProcessingWalkIn(false);
    }
  };

  const handleEditProductSubmit = async (productData) => {
    try {
      const role = user?.role || 'shop_admin';
      await updateItem(editModalProduct._id, productData, '', role);
      setAddedMsg('✅ Product updated successfully!');
      setEditModalProduct(null);
      await fetchCatalog();
      await fetchDashboardStats();
      setTimeout(() => setAddedMsg(''), 2500);
    } catch (err) {
      console.error('[Update Product Error]', err);
      alert(err?.response?.data?.message || err.message || 'Failed to update product');
    }
  };

  const [addProductModal, setAddProductModal] = useState(false);

  const handleAddProductSubmit = async (productData) => {
    try {
      const finalImages = (productData.images && productData.images.length > 0)
        ? productData.images
        : ['/egg2.png'];
      await createItem({ ...productData, images: finalImages, shopId });
      setAddedMsg('✅ Product added successfully!');
      setAddProductModal(false);
      await fetchCatalog();
      await fetchDashboardStats();
      setTimeout(() => setAddedMsg(''), 2500);
    } catch (err) {
      console.error('[Add Product Error]', err);
      alert(err?.response?.data?.message || err.message || 'Failed to add product');
    }
  };

  const handleDirectDeleteProduct = async (item) => {
    if (!item) return;
    const targetId = typeof item === 'string' ? item : (item._id || item.id);
    const targetName = typeof item === 'string' ? 'this product' : `product "${item.name || 'Selected'}"`;
    if (!targetId || targetId === 'undefined') {
      alert('Product ID is missing');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${targetName}?`)) return;
    try {
      const role = user?.role || 'shop_admin';
      await apiDeleteItem(targetId, '', role);
      setItems(prev => prev.filter(p => String(p._id) !== String(targetId)));
      setAddedMsg('✅ Product deleted successfully!');
      fetchCatalog();
      fetchDashboardStats();
      setTimeout(() => setAddedMsg(''), 2500);
    } catch (err) {
      console.error('[Delete Product Error]', err);
      alert(err?.response?.data?.message || err.message || 'Failed to delete product');
    }
  };

  const confirmDeleteProduct = handleDirectDeleteProduct;

  const [dateFromFilter, setDateFromFilter] = useState('2026-08-01');
  const [dateToFilter, setDateToFilter] = useState(new Date().toISOString().split('T')[0]);
  const [reportTimeframe, setReportTimeframe] = useState('ALL'); // 'DAY', 'MONTH', 'YEAR', 'ALL'
  const [salesReportSearchTerm, setSalesReportSearchTerm] = useState('');
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [dashStats, setDashStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalOrders: 0,
    cartItemCount: 0,
    totalSpent: 0,
    totalCustomers: 0,
    outOfStock: 0,
    lowStock: 0,
    todaySales: 0,
    monthlySales: 0,
    yearlySales: 0,
    totalRevenue: 0,
    todayProfit: 0,
    monthlyProfit: 0,
    todayLoss: 0,
    monthlyLoss: 0,
    yearlyLoss: 0,
    totalProfit: 0,
    totalLoss: 0,
  });

  // ─── Filtered Sales for Sales Report View (Strict Timeframe + Search) ───
  const filteredSalesForReport = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return (shopSalesList || []).filter(s => {
      if (!s) return false;
      const sDate = new Date(s.saleDate || s.createdAt || s.date || 0);
      const sDateStr = sDate.toISOString().split('T')[0];

      let matchTime = true;
      if (reportTimeframe === 'DAY') {
        matchTime = sDateStr === todayStr;
      } else if (reportTimeframe === 'MONTH') {
        matchTime = sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
      } else if (reportTimeframe === 'YEAR') {
        matchTime = sDate.getFullYear() === currentYear;
      }

      if (!matchTime) return false;

      if (!salesReportSearchTerm.trim()) return true;
      const q = salesReportSearchTerm.toLowerCase();
      const inv = (s.invoiceNumber || s.serialNumber || '').toString().toLowerCase();
      const cust = (s.customerName || '').toLowerCase();
      const phone = (s.customerPhone || '').toLowerCase();
      const cashier = (s.cashierName || '').toLowerCase();
      const itemsStr = (s.items || []).map(i => i.name).join(' ').toLowerCase();

      return inv.includes(q) || cust.includes(q) || phone.includes(q) || cashier.includes(q) || itemsStr.includes(q);
    });
  }, [shopSalesList, reportTimeframe, salesReportSearchTerm]);

  const salesReportStats = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalEggs = 0;
    let cashSales = 0;
    let onlineSales = 0;

    filteredSalesForReport.forEach(s => {
      const amount = Number(s.totalAmount) || 0;
      const profit = Number(s.totalProfit) || 0;
      totalRevenue += amount;
      totalProfit += profit;

      const pMethod = (s.paymentMethod || 'CASH').toUpperCase();
      if (pMethod === 'CASH') {
        cashSales += amount;
      } else {
        onlineSales += amount;
      }

      (s.items || []).forEach(i => {
        totalEggs += Number(i.quantity) || 0;
      });
    });

    const totalPetis = (totalEggs / 360).toFixed(1);
    const totalTrays = Math.round(totalEggs / 30);
    const totalBills = filteredSalesForReport.length;
    const avgBill = totalBills > 0 ? Math.round(totalRevenue / totalBills) : 0;

    return {
      totalRevenue: totalRevenue || (reportTimeframe === 'DAY' ? dashStats.todaySales : reportTimeframe === 'MONTH' ? dashStats.monthlySales : reportTimeframe === 'YEAR' ? dashStats.yearlySales : dashStats.totalRevenue),
      totalProfit: totalProfit || (reportTimeframe === 'DAY' ? dashStats.todayProfit : reportTimeframe === 'MONTH' ? dashStats.monthlyProfit : reportTimeframe === 'YEAR' ? dashStats.yearlyProfit : dashStats.totalProfit),
      totalEggs,
      totalPetis,
      totalTrays,
      totalBills,
      avgBill,
      cashSales,
      onlineSales
    };
  }, [filteredSalesForReport, reportTimeframe, dashStats]);

  // Dynamic Manual Expenses Tracking State
  const [expensesList, setExpensesList] = useState([]);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [activeExpenseMenuId, setActiveExpenseMenuId] = useState(null);
  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    category: 'Utilities / Bills',
    amount: '',
    paymentMethod: 'Paid',
    expenseDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchExpenses = async () => {
    if (!shopId) return [];
    try {
      const res = await fetch(`/api/expenses/shop/${shopId}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.data || [];
        setExpensesList(list);
        localStorage.setItem(`nexflow_expenses_${shopId}`, JSON.stringify(list));
        return list;
      }
    } catch (e) {
      console.error('Fetch expenses error:', e);
    }
    const local = localStorage.getItem(`nexflow_expenses_${shopId}`);
    const parsed = local ? JSON.parse(local) : [];
    setExpensesList(parsed);
    return parsed;
  };

  const handleEditExpense = (exp) => {
    setEditingExpenseId(exp._id);
    setExpenseFormData({
      title: exp.title || '',
      category: exp.category || 'Utilities / Bills',
      amount: exp.amount || '',
      paymentMethod: exp.paymentMethod || 'Paid',
      expenseDate: exp.expenseDate ? new Date(exp.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: exp.notes || ''
    });
    setActiveExpenseMenuId(null);
    setShowAddExpenseModal(true);
  };

  const handleSaveExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseFormData.title || !expenseFormData.amount) {
      alert('Please enter expense title and amount');
      return;
    }

    if (editingExpenseId) {
      const updatedExpenseItem = {
        _id: editingExpenseId,
        shopId,
        title: expenseFormData.title,
        category: expenseFormData.category,
        amount: Number(expenseFormData.amount),
        paymentMethod: expenseFormData.paymentMethod || 'Paid',
        expenseDate: expenseFormData.expenseDate ? new Date(expenseFormData.expenseDate) : new Date(),
        notes: expenseFormData.notes || '',
        createdBy: user?.fullName || customer?.fullName || 'Shop Admin'
      };

      setExpensesList(prev => prev.map(item => String(item._id) === String(editingExpenseId) ? { ...item, ...updatedExpenseItem } : item));
      try {
        await fetch(`/api/expenses/${editingExpenseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedExpenseItem)
        });
      } catch (err) { }

      setShowAddExpenseModal(false);
      setEditingExpenseId(null);
      setExpenseFormData({
        title: '',
        category: 'Utilities / Bills',
        amount: '',
        paymentMethod: 'Paid',
        expenseDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setTimeout(fetchDashboardStats, 300);
      return;
    }

    const newExpenseItem = {
      _id: 'exp_' + Date.now(),
      shopId,
      title: expenseFormData.title,
      category: expenseFormData.category,
      amount: Number(expenseFormData.amount),
      paymentMethod: expenseFormData.paymentMethod || 'Paid',
      expenseDate: expenseFormData.expenseDate ? new Date(expenseFormData.expenseDate) : new Date(),
      notes: expenseFormData.notes || '',
      createdBy: user?.fullName || customer?.fullName || 'Shop Admin'
    };

    try {
      const res = await fetch(`/api/expenses/shop/${shopId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpenseItem)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setExpensesList(prev => [data.data, ...prev]);
        }
      } else {
        setExpensesList(prev => [newExpenseItem, ...prev]);
      }
    } catch (err) {
      setExpensesList(prev => [newExpenseItem, ...prev]);
    }

    setShowAddExpenseModal(false);
    setExpenseFormData({
      title: '',
      category: 'Utilities / Bills',
      amount: '',
      paymentMethod: 'Paid',
      expenseDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setTimeout(fetchDashboardStats, 300);
  };

  const handlePrintSingleExpense = (exp, idx = 0) => {
    setActiveExpenseMenuId(null);
    const shopName = shop?.name || 'Yosafze Egg Traders';
    const dateStr = new Date(exp.expenseDate || exp.createdAt || Date.now()).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const voucherNo = `#EXP-${String(idx + 1).padStart(4, '0')}`;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to print the expense voucher');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Expense Payment Voucher - ${voucherNo}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm 15mm; }
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; background: #f8fafc; font-size: 12px; margin: 0; }
            .voucher-wrapper { max-width: 660px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); overflow: hidden; border: 1.5px solid #cbd5e1; }
            .header-banner { background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #065f46 100%); color: #ffffff; padding: 22px 28px; display: flex; justify-content: space-between; align-items: center; }
            .header-title h1 { margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; color: #ffffff; }
            .header-title p { margin: 4px 0 0; font-size: 10px; font-weight: 800; color: #34d399; letter-spacing: 1.5px; text-transform: uppercase; }
            .voucher-tag { background: #f59e0b; color: #0f172a; padding: 7px 16px; border-radius: 10px; font-weight: 900; font-size: 13px; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); text-align: center; }
            .voucher-tag span { display: block; font-size: 8.5px; font-weight: 800; opacity: 0.85; text-transform: uppercase; }
            .body-content { padding: 26px 28px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
            .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; }
            .info-card.full-width { grid-column: span 2; }
            .info-card .label { font-size: 9.5px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
            .info-card .value { font-size: 13px; font-weight: 800; color: #0f172a; }
            .category-pill { display: inline-block; background: #fee2e2; color: #dc2626; padding: 3px 12px; border-radius: 6px; font-weight: 900; font-size: 11px; text-transform: uppercase; border: 1px solid #fecaca; }
            .status-pill { display: inline-block; background: #dcfce7; color: #15803d; padding: 3px 12px; border-radius: 6px; font-weight: 900; font-size: 11px; text-transform: uppercase; border: 1px solid #bbf7d0; }
            .amount-hero { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #10b981; border-radius: 16px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin: 22px 0 26px 0; }
            .amount-hero .lbl { font-size: 12px; font-weight: 900; color: #065f46; text-transform: uppercase; letter-spacing: 1px; }
            .amount-hero .sub { font-size: 9.5px; font-weight: 700; color: #047857; margin-top: 2px; }
            .amount-hero .val { font-size: 26px; font-weight: 900; color: #047857; letter-spacing: -0.5px; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 36px; padding-top: 20px; border-top: 1px dashed #cbd5e1; text-align: center; }
            .sign-line { border-top: 1.5px solid #94a3b8; padding-top: 6px; font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
            .voucher-footer { margin-top: 22px; text-align: center; font-size: 9.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
            @media print {
              body { background: #ffffff; padding: 0; }
              .voucher-wrapper { box-shadow: none; border: 1.5px solid #94a3b8; }
            }
          </style>
        </head>
        <body>
          <div class="voucher-wrapper">
            <div class="header-banner">
              <div class="header-title">
                <h1>${shopName.toUpperCase()}</h1>
                <p>OFFICIAL EXPENSE PAYMENT VOUCHER &amp; RECEIPT</p>
              </div>
              <div class="voucher-tag">
                <span>VOUCHER NO</span>
                ${voucherNo}
              </div>
            </div>

            <div class="body-content">
              <div class="info-grid">
                <div class="info-card">
                  <div class="label">Date &amp; Time</div>
                  <div class="value">${dateStr}</div>
                </div>
                <div class="info-card">
                  <div class="label">Expense Category</div>
                  <div class="value">
                    <span class="category-pill">${exp.category || 'General Expense'}</span>
                  </div>
                </div>
                <div class="info-card full-width">
                  <div class="label">Payment Status</div>
                  <div class="value">
                    <span class="status-pill">✓ PAID</span>
                  </div>
                </div>
                <div class="info-card full-width">
                  <div class="label">Expense Title / Description</div>
                  <div class="value" style="font-size: 14px; text-transform: uppercase; color: #0f172a;">${exp.title}</div>
                </div>
                <div class="info-card full-width">
                  <div class="label">Paid To / Logged By / Remarks</div>
                  <div class="value" style="color: #334155;">${exp.notes || exp.createdBy || 'Shop Admin'}</div>
                </div>
              </div>

              <div class="amount-hero">
                <div>
                  <div class="lbl">TOTAL AMOUNT (PAID):</div>
                  <div class="sub">Cash Settled &amp; Accounted in Store Financials</div>
                </div>
                <div class="val">Rs. ${(Number(exp.amount) || 0).toLocaleString('en-PK')}</div>
              </div>

              <div class="signatures">
                <div class="sign-line">Prepared By (Admin)</div>
                <div class="sign-line">Received By / Paid To</div>
                <div class="sign-line">Authorized Stamp</div>
              </div>

              <div class="voucher-footer">
                Yosafze Egg Traders • Financial Accounting &amp; Expense Management
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 300);
  };

  const handleWhatsAppSingleExpense = (exp, idx = 0) => {
    setActiveExpenseMenuId(null);
    const shopName = shop?.name || 'Yosafze Egg Traders';
    const dateStr = new Date(exp.expenseDate || exp.createdAt || Date.now()).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const voucherNo = `#EXP-${String(idx + 1).padStart(4, '0')}`;

    let msg = `🧾 *OFFICIAL EXPENSE RECEIPT - ${shopName.toUpperCase()}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🔢 *Voucher No:* ${voucherNo}\n`;
    msg += `📅 *Date:* ${dateStr}\n`;
    msg += `🏢 *Store Branch:* ${shopName}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📌 *Category:* ${exp.category || 'Expense'}\n`;
    msg += `💳 *Payment Method:* ${exp.paymentMethod || 'Paid'}\n`;
    msg += `📝 *Expense Title:* ${exp.title}\n`;
    msg += `👤 *Notes / Paid To:* ${exp.notes || exp.createdBy || 'Shop Admin'}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💵 *TOTAL AMOUNT: Rs. ${(Number(exp.amount) || 0).toLocaleString('en-PK')}* (${exp.paymentMethod || 'Paid'})\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🙏 *Official Expense Payment Voucher Recorded.*`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleExportSingleExpenseExcel = (exp, idx = 0) => {
    setActiveExpenseMenuId(null);
    const shopName = shop?.name || 'Yosafze Egg Traders';
    const dateStr = new Date(exp.expenseDate || exp.createdAt || Date.now()).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    const voucherNo = `#EXP-${String(idx + 1).padStart(4, '0')}`;

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Expense_${voucherNo.replace('#', '')}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; }
          .header-main { background-color: #0f172a; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: center; height: 38px; border: 1px solid #0f172a; vertical-align: middle; }
          .sub-title { background-color: #1e293b; color: #34d399; font-size: 9.5pt; text-align: center; font-weight: bold; height: 22px; border: 1px solid #1e293b; vertical-align: middle; }
          .lbl { background-color: #f1f5f9; color: #475569; font-weight: bold; font-size: 10pt; border: 1px solid #cbd5e1; padding: 7px 12px; }
          .val { background-color: #ffffff; color: #0f172a; font-weight: 600; font-size: 10pt; border: 1px solid #cbd5e1; padding: 7px 12px; }
          .val-bold { background-color: #f8fafc; color: #0f172a; font-weight: 900; font-size: 10.5pt; border: 1px solid #cbd5e1; padding: 7px 12px; }
          .tot-lbl { background-color: #f8fafc; color: #065f46; font-weight: 900; font-size: 11pt; text-align: right; border: 2px solid #059669; padding: 10px 14px; }
          .tot-val { background-color: #ecfdf5; color: #047857; font-weight: 900; font-size: 13pt; text-align: right; border: 2px solid #059669; padding: 10px 14px; }
          .footer-note { color: #64748b; font-size: 9pt; font-style: italic; text-align: center; height: 26px; vertical-align: middle; border: none; }
        </style>
      </head>
      <body>
        <table>
          <colgroup>
            <col width="160" />
            <col width="220" />
            <col width="160" />
            <col width="220" />
          </colgroup>
          <tr>
            <td colspan="4" class="header-main">${shopName.toUpperCase()}</td>
          </tr>
          <tr>
            <td colspan="4" class="sub-title">OFFICIAL EXPENSE PAYMENT VOUCHER</td>
          </tr>
          <tr style="height: 10px;"><td colspan="4" style="border:none;"></td></tr>
          <tr>
            <td class="lbl">Voucher No:</td>
            <td class="val" style="color:#0284c7; font-weight:900;">${voucherNo}</td>
            <td class="lbl">Expense Date:</td>
            <td class="val">${dateStr}</td>
          </tr>
          <tr>
            <td class="lbl">Expense Category:</td>
            <td class="val" style="color:#b91c1c; font-weight:bold; background-color:#fee2e2;">${exp.category || 'General'}</td>
            <td class="lbl">Payment Status:</td>
            <td class="val" style="font-weight:900; color:#15803d; background-color:#dcfce7;">✓ PAID</td>
          </tr>
          <tr>
            <td class="lbl">Expense Title:</td>
            <td colspan="3" class="val-bold" style="text-transform: uppercase;">${exp.title}</td>
          </tr>
          <tr>
            <td class="lbl">Notes / Paid To:</td>
            <td colspan="3" class="val">${exp.notes || exp.createdBy || 'Shop Admin'}</td>
          </tr>
          <tr style="height: 12px;"><td colspan="4" style="border:none;"></td></tr>
          <tr>
            <td colspan="3" class="tot-lbl">TOTAL AMOUNT (PAID):</td>
            <td class="tot-val">Rs. ${(Number(exp.amount) || 0).toLocaleString()}</td>
          </tr>
          <tr style="height: 12px;"><td colspan="4" style="border:none;"></td></tr>
          <tr>
            <td colspan="4" class="footer-note">Official Expense Voucher • Generated via Yosafze Egg Traders Financial System</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Expense_${voucherNo.replace('#', '')}_${shopName.replace(/\s+/g, '_')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteExpense = async (id) => {
    setActiveExpenseMenuId(null);
    if (!window.confirm('Are you sure you want to delete this expense entry?')) return;
    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    } catch (e) { }
    setExpensesList(prev => prev.filter(x => String(x._id) !== String(id)));
    setTimeout(fetchDashboardStats, 300);
  };

  // Damaged Products Loss Tracking State
  const [damagedProductsList, setDamagedProductsList] = useState([]);
  const [showAddDamagedModal, setShowAddDamagedModal] = useState(false);
  const [damagedFormData, setDamagedFormData] = useState({
    productName: '',
    productId: '',
    petiQuantity: '',
    trayQuantity: '',
    eggQuantity: '',
    unitType: 'egg',
    quantity: '',
    unitPrice: '',
    reason: 'Egg Breakage / Crack',
    damageDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchDamagedProducts = async () => {
    if (!shopId) return [];
    try {
      const res = await fetch(`/api/damaged-products/shop/${shopId}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.data || [];
        setDamagedProductsList(list);
        localStorage.setItem(`nexflow_damaged_${shopId}`, JSON.stringify(list));
        return list;
      }
    } catch (e) {
      console.error('Fetch damaged products error:', e);
    }
    const local = localStorage.getItem(`nexflow_damaged_${shopId}`);
    const parsed = local ? JSON.parse(local) : [];
    setDamagedProductsList(parsed);
    return parsed;
  };

  const handleAddDamagedSubmit = async (e) => {
    e.preventDefault();
    const pQty = Number(damagedFormData.petiQuantity || 0);
    const tQty = Number(damagedFormData.trayQuantity || 0);
    const eQty = Number(damagedFormData.eggQuantity || 0);
    const rawQty = Number(damagedFormData.quantity || 0);

    if (!damagedFormData.productName || (pQty <= 0 && tQty <= 0 && eQty <= 0 && rawQty <= 0)) {
      alert('Please enter product name and at least one damaged quantity (Petis, Trays, or Eggs)');
      return;
    }

    const selectedProduct = (items || []).find(i => 
      String(i._id) === String(damagedFormData.productId) || 
      (damagedFormData.productName && i.name?.toLowerCase().trim() === damagedFormData.productName.toLowerCase().trim())
    );

    const tPerP = Number(selectedProduct?.traysPerPeti) || 12;
    const ePerT = Number(selectedProduct?.eggsPerTray) || 30;
    const ePerP = tPerP * ePerT;

    const basePrice = Number(selectedProduct?.price || selectedProduct?.costPrice || selectedProduct?.salePrice || 0);
    const pUnit = selectedProduct?.unitType || 'peti';

    let eggRate = 0;
    if (selectedProduct && basePrice > 0) {
      if (pUnit === 'peti') eggRate = basePrice / ePerP;
      else if (pUnit === 'tray') eggRate = basePrice / ePerT;
      else eggRate = basePrice;
    } else if (Number(damagedFormData.unitPrice) > 0) {
      eggRate = Number(damagedFormData.unitPrice);
    }

    let totalEggsDmg = 0;
    if (pQty > 0 || tQty > 0 || eQty > 0) {
      totalEggsDmg = Math.round((pQty * ePerP) + (tQty * ePerT) + eQty);
    } else {
      totalEggsDmg = Math.round(rawQty);
    }

    const calculatedLoss = Math.round(totalEggsDmg * (eggRate || 0));

    const newDamagedItem = {
      _id: 'dmg_' + Date.now(),
      shopId,
      productName: damagedFormData.productName,
      productId: damagedFormData.productId || '',
      petiQuantity: pQty,
      trayQuantity: tQty,
      eggQuantity: eQty,
      quantity: totalEggsDmg,
      deductedEggs: totalEggsDmg,
      unitType: pQty > 0 && tQty === 0 && eQty === 0 ? 'peti' : (tQty > 0 && pQty === 0 && eQty === 0 ? 'tray' : 'egg'),
      unitPrice: Number(damagedFormData.unitPrice) || Math.round(eggRate * 10) / 10,
      totalLoss: calculatedLoss,
      reason: damagedFormData.reason,
      damageDate: damagedFormData.damageDate ? new Date(damagedFormData.damageDate) : new Date(),
      notes: damagedFormData.notes || '',
      reportedBy: user?.fullName || customer?.fullName || 'Shop Admin'
    };

    try {
      const res = await fetch(`/api/damaged-products/shop/${shopId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDamagedItem)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setDamagedProductsList(prev => [data.data, ...prev]);
        }
        if (data.updatedItem) {
          setItems(prev => prev.map(it => String(it._id) === String(data.updatedItem._id) ? data.updatedItem : it));
        }
      } else {
        setDamagedProductsList(prev => [newDamagedItem, ...prev]);
      }
    } catch (err) {
      setDamagedProductsList(prev => [newDamagedItem, ...prev]);
    }

    setShowAddDamagedModal(false);
    setDamagedFormData({
      productName: '',
      productId: '',
      petiQuantity: '',
      trayQuantity: '',
      eggQuantity: '',
      unitType: 'egg',
      quantity: '',
      unitPrice: '',
      reason: 'Egg Breakage / Crack',
      damageDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    await fetchCatalog();
    setTimeout(fetchDashboardStats, 300);
  };

  const handleDeleteDamaged = async (id) => {
    if (!window.confirm('Are you sure you want to delete this damaged product record and restore stock?')) return;
    try {
      await fetch(`/api/damaged-products/${id}`, { method: 'DELETE' });
    } catch (e) { }
    setDamagedProductsList(prev => prev.filter(x => String(x._id) !== String(id)));
    await fetchCatalog();
    setTimeout(fetchDashboardStats, 300);
  };

  // ─── Dynamic Live Expenses Calculations (Today, This Month, This Year, All-Time) ───
  const dynamicExpenseStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let todayExp = 0;
    let todayExpCount = 0;
    let monthExp = 0;
    let monthExpCount = 0;
    let yearExp = 0;
    let yearExpCount = 0;
    let totalExp = 0;
    let totalExpCount = (expensesList || []).length;

    (expensesList || []).forEach(e => {
      const amt = Number(e.amount) || 0;
      const d = new Date(e.expenseDate || e.createdAt || 0);
      const dStr = d.toISOString().split('T')[0];

      totalExp += amt;

      if (dStr === todayStr || d.toDateString() === now.toDateString()) {
        todayExp += amt;
        todayExpCount++;
      }
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        monthExp += amt;
        monthExpCount++;
      }
      if (d.getFullYear() === currentYear) {
        yearExp += amt;
        yearExpCount++;
      }
    });

    let todayDamaged = 0;
    let monthDamaged = 0;
    let yearDamaged = 0;
    let totalDamaged = 0;
    let totalDamagedEggs = 0;

    (damagedProductsList || []).forEach(d => {
      const loss = Number(d.totalLoss) || ((Number(d.quantity) || 0) * (Number(d.unitPrice) || 0));
      const date = new Date(d.damageDate || d.createdAt || 0);
      const dateStr = date.toISOString().split('T')[0];
      const eggs = Number(d.eggQuantity || d.quantity || 0) + (Number(d.petiQuantity || 0) * 360) + (Number(d.trayQuantity || 0) * 30);

      totalDamaged += loss;
      totalDamagedEggs += eggs;

      if (dateStr === todayStr || date.toDateString() === now.toDateString()) {
        todayDamaged += loss;
      }
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        monthDamaged += loss;
      }
      if (date.getFullYear() === currentYear) {
        yearDamaged += loss;
      }
    });

    return {
      todayExp,
      todayExpCount,
      monthExp,
      monthExpCount,
      yearExp,
      yearExpCount,
      totalExp,
      totalExpCount,
      todayDamaged,
      monthDamaged,
      yearDamaged,
      totalDamaged,
      totalDamagedEggs,
      todayTotalLoss: todayExp + todayDamaged,
      monthTotalLoss: monthExp + monthDamaged,
      yearTotalLoss: yearExp + yearDamaged,
      grandTotalLoss: totalExp + totalDamaged,
    };
  }, [expensesList, damagedProductsList]);

  // ─── Filtered Profit Analytics (Sales, Purchases with Peti/Tray/Egg, Expenses, Damaged Losses = Pure Net Profit) ───
  const profitReportStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. All-Time & Periodic Sales
    const todaySales = (shopSalesList || []).filter(s => new Date(s.saleDate || s.createdAt || s.date || 0).toISOString().split('T')[0] === todayStr);
    const todaySalesTotal = todaySales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const todayProfitTotal = todaySales.reduce((sum, s) => sum + (Number(s.totalProfit) || (Number(s.totalAmount) * 0.15)), 0);

    const monthSales = (shopSalesList || []).filter(s => {
      const d = new Date(s.saleDate || s.createdAt || s.date || 0);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthSalesTotal = monthSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const monthProfitTotal = monthSales.reduce((sum, s) => sum + (Number(s.totalProfit) || (Number(s.totalAmount) * 0.15)), 0);

    const yearSales = (shopSalesList || []).filter(s => new Date(s.saleDate || s.createdAt || s.date || 0).getFullYear() === currentYear);
    const yearSalesTotal = yearSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const yearProfitTotal = yearSales.reduce((sum, s) => sum + (Number(s.totalProfit) || (Number(s.totalAmount) * 0.15)), 0);

    const allSalesTotal = (shopSalesList || []).reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const allProfitTotal = (shopSalesList || []).reduce((sum, s) => sum + (Number(s.totalProfit) || (Number(s.totalAmount) * 0.15)), 0);

    // 2. Filter Sales for active timeframe
    const filteredSales = (shopSalesList || []).filter(s => {
      if (!s) return false;
      const sDate = new Date(s.saleDate || s.createdAt || s.date || 0);
      const sDateStr = sDate.toISOString().split('T')[0];

      if (reportTimeframe === 'DAY') return sDateStr === todayStr;
      if (reportTimeframe === 'MONTH') return sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
      if (reportTimeframe === 'YEAR') return sDate.getFullYear() === currentYear;
      return true;
    });

    let grossProfit = 0;
    let totalRevenue = 0;
    filteredSales.forEach(s => {
      grossProfit += Number(s.totalProfit) || 0;
      totalRevenue += Number(s.totalAmount) || 0;
    });

    if (grossProfit === 0 && totalRevenue > 0) {
      grossProfit = Math.round(totalRevenue * 0.15);
    }
    if (grossProfit === 0) {
      grossProfit = reportTimeframe === 'DAY' ? todayProfitTotal : reportTimeframe === 'MONTH' ? monthProfitTotal : reportTimeframe === 'YEAR' ? yearProfitTotal : allProfitTotal;
    }

    // 3. Filter Purchases / Restocks (items) for active timeframe
    const filteredPurchases = (items || []).filter(p => {
      if (!p) return false;
      const pDate = new Date(p.purchaseDate || p.createdAt || p.date || 0);
      const pDateStr = pDate.toISOString().split('T')[0];

      if (reportTimeframe === 'DAY') return pDateStr === todayStr;
      if (reportTimeframe === 'MONTH') return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
      if (reportTimeframe === 'YEAR') return pDate.getFullYear() === currentYear;
      return true;
    });

    let totalPurchasesCost = 0;
    let totalPurchasesEggs = 0;

    filteredPurchases.forEach(p => {
      const e = Number(p.eggQuantity || 0);
      const peti = Number(p.petiQuantity || 0);
      const tray = Number(p.trayQuantity || 0);
      const totalItemEggs = (peti * 360) + (tray * 30) + e;
      totalPurchasesEggs += totalItemEggs;

      const cost = Number(p.totalPurchaseCost || p.purchaseCost || p.totalCost) ||
        (Number(p.costPrice || 0) * (totalItemEggs / (p.unitType === 'peti' ? 360 : p.unitType === 'tray' ? 30 : 1)));
      totalPurchasesCost += Math.round(cost);
    });

    const totalPurchasesPetis = Number((totalPurchasesEggs / 360).toFixed(1));
    const totalPurchasesTrays = Math.round(totalPurchasesEggs / 30);

    // 4. Filter Expenses for active timeframe
    const filteredExpenses = (expensesList || []).filter(e => {
      if (!e) return false;
      const eDate = new Date(e.expenseDate || e.createdAt || 0);
      const eDateStr = eDate.toISOString().split('T')[0];

      if (reportTimeframe === 'DAY') return eDateStr === todayStr || eDate.toDateString() === now.toDateString();
      if (reportTimeframe === 'MONTH') return eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear;
      if (reportTimeframe === 'YEAR') return eDate.getFullYear() === currentYear;
      return true;
    });

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // 5. Filter Damaged Stock Logs for active timeframe
    const filteredDamaged = (damagedProductsList || []).filter(d => {
      if (!d) return false;
      const dDate = new Date(d.damageDate || d.createdAt || 0);
      const dDateStr = dDate.toISOString().split('T')[0];

      if (reportTimeframe === 'DAY') return dDateStr === todayStr || dDate.toDateString() === now.toDateString();
      if (reportTimeframe === 'MONTH') return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
      if (reportTimeframe === 'YEAR') return dDate.getFullYear() === currentYear;
      return true;
    });

    let totalDamagedLoss = 0;
    let totalDamagedEggs = 0;
    filteredDamaged.forEach(d => {
      totalDamagedLoss += Number(d.totalLoss) || ((Number(d.quantity) || 0) * (Number(d.unitPrice) || 0));
      totalDamagedEggs += Number(d.quantity) || 1;
    });

    // 6. Final Realized Net Profit (Revenue - Purchases - Expenses - Damaged Loss)
    const finalNetProfit = totalPurchasesCost > 0
      ? (totalRevenue - totalPurchasesCost - totalExpenses - totalDamagedLoss)
      : (grossProfit - totalExpenses - totalDamagedLoss);

    return {
      grossProfit,
      totalRevenue,
      totalPurchasesCost,
      totalPurchasesPetis,
      totalPurchasesTrays,
      totalPurchasesEggs,
      totalExpenses,
      totalDamagedLoss,
      totalDamagedEggs,
      finalNetProfit,
      todaySalesTotal,
      todayProfitTotal,
      monthSalesTotal,
      monthProfitTotal,
      yearSalesTotal,
      yearProfitTotal,
      allSalesTotal,
      allProfitTotal,
      filteredSalesCount: filteredSales.length,
      filteredPurchasesCount: filteredPurchases.length,
      filteredExpensesCount: filteredExpenses.length,
      filteredDamagedCount: filteredDamaged.length,
      filteredSales,
      filteredPurchases,
      filteredExpenses,
      filteredDamaged
    };
  }, [shopSalesList, items, expensesList, damagedProductsList, reportTimeframe, dashStats]);

  // ─── Executive Net Realized Profit/Loss Breakdown for Main Dashboard ───
  const netStats = useMemo(() => {
    const todayGrossProfit = dashStats.todayProfit || 0;
    const todayExp = dynamicExpenseStats.todayExp || 0;
    const todayDmg = dynamicExpenseStats.todayDamaged || 0;
    const todayNet = todayGrossProfit - todayExp - todayDmg;

    const monthlyGrossProfit = dashStats.monthlyProfit || 0;
    const monthlyExp = dynamicExpenseStats.monthExp || 0;
    const monthlyDmg = dynamicExpenseStats.monthDamaged || 0;
    const monthlyNet = monthlyGrossProfit - monthlyExp - monthlyDmg;

    const yearlyGrossProfit = dashStats.yearlyProfit || 0;
    const yearlyExp = dynamicExpenseStats.yearExp || 0;
    const yearlyDmg = dynamicExpenseStats.yearDamaged || 0;
    const yearlyNet = yearlyGrossProfit - yearlyExp - yearlyDmg;

    const totalGrossProfit = dashStats.totalProfit || 0;
    const totalExp = dynamicExpenseStats.totalExp || 0;
    const totalDmg = dynamicExpenseStats.totalDamaged || 0;
    const totalNet = totalGrossProfit - totalExp - totalDmg;

    return {
      todayGrossProfit,
      todayExp,
      todayDmg,
      todayNet,
      monthlyGrossProfit,
      monthlyExp,
      monthlyDmg,
      monthlyNet,
      yearlyGrossProfit,
      yearlyExp,
      yearlyDmg,
      yearlyNet,
      totalGrossProfit,
      totalExp,
      totalDmg,
      totalNet
    };
  }, [dashStats, expensesList, damagedProductsList]);

  // ─── Generate Official Profit PDF via jsPDF & autoTable ───
  const generateProfitReportPDF = (timeframe = reportTimeframe) => {
    const shopName = shop?.name || 'Yosafze Egg Traders';
    const timeTitle = timeframe === 'DAY' ? 'Today (Day)' : timeframe === 'MONTH' ? 'This Month' : timeframe === 'YEAR' ? 'This Year' : 'All-Time';
    const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const doc = new jsPDF('portrait', 'pt', 'a4');

    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 595, 60, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(shopName.toUpperCase(), 30, 26);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(52, 211, 153);
    doc.text(`Official Pure Realized Net Profit Statement • Filter: ${timeTitle}`, 30, 44);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated: ${dateStr}`, 430, 44);

    // Summary Metric Bar
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(30, 72, 535, 42, 6, 6, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL REVENUE', 40, 87);
    doc.text('PURCHASES COST', 150, 87);
    doc.text('SHOP EXPENSES', 270, 87);
    doc.text('DAMAGED LOSS', 380, 87);
    doc.text('PURE NET PROFIT', 475, 87);

    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${(profitReportStats.totalRevenue || 0).toLocaleString('en-PK')}`, 40, 104);
    doc.setTextColor(2, 132, 199);
    doc.text(`- Rs. ${(profitReportStats.totalPurchasesCost || 0).toLocaleString('en-PK')}`, 150, 104);
    doc.setTextColor(225, 29, 72);
    doc.text(`- Rs. ${(profitReportStats.totalExpenses || 0).toLocaleString('en-PK')}`, 270, 104);
    doc.setTextColor(217, 119, 6);
    doc.text(`- Rs. ${(profitReportStats.totalDamagedLoss || 0).toLocaleString('en-PK')}`, 380, 104);
    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${(profitReportStats.finalNetProfit || 0).toLocaleString('en-PK')}`, 475, 104);

    // Income Statement Breakdown Table
    const breakdownData = [
      ['1', '(+) Total Sales Revenue Earned', `${profitReportStats.filteredSalesCount} Sales Invoices`, `+ Rs. ${(profitReportStats.totalRevenue || 0).toLocaleString('en-PK')}`],
      ['2', '(-) Purchased Products / Restocks Cost', `${profitReportStats.totalPurchasesPetis} Petis • ${profitReportStats.totalPurchasesTrays} Trays • ${profitReportStats.totalPurchasesEggs.toLocaleString('en-PK')} Eggs`, `- Rs. ${(profitReportStats.totalPurchasesCost || 0).toLocaleString('en-PK')}`],
      ['3', '(-) Shop Operational Expenses (Bills, Rent, Misc)', `${profitReportStats.filteredExpensesCount} Expense Logs`, `- Rs. ${(profitReportStats.totalExpenses || 0).toLocaleString('en-PK')}`],
      ['4', '(-) Damaged / Broken Egg Inventory Loss', `${profitReportStats.filteredDamagedCount} Logs (${profitReportStats.totalDamagedEggs} Broken Eggs)`, `- Rs. ${(profitReportStats.totalDamagedLoss || 0).toLocaleString('en-PK')}`],
      ['5', '(=) FINAL PURE REALIZED NET PROFIT', 'Pure Realized Cash Balance', `Rs. ${(profitReportStats.finalNetProfit || 0).toLocaleString('en-PK')}`]
    ];

    autoTable(doc, {
      startY: 125,
      head: [['#', 'Financial Line Item & Description', 'Volume / Stock Details', 'Amount (RS)']],
      body: breakdownData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 5 },
      margin: { left: 30, right: 30 },
    });

    const fileName = `Net_Profit_Report_${timeTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    return fileName;
  };

  // ─── Generate Official Sales PDF via jsPDF & autoTable ───
  const generateSalesReportPDF = (timeframe = reportTimeframe) => {
    const shopName = shop?.name || 'Yosafze Egg Traders';
    const timeTitle = timeframe === 'DAY' ? 'Today (Day)' : timeframe === 'MONTH' ? 'This Month' : timeframe === 'YEAR' ? 'This Year' : 'All-Time';
    const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const doc = new jsPDF('portrait', 'pt', 'a4');

    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 595, 60, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(shopName.toUpperCase(), 30, 26);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Official Sales Revenue & Bills Report • Filter: ${timeTitle}`, 30, 44);
    doc.text(`Generated: ${dateStr}`, 430, 44);

    // Summary Metric Bar
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(30, 72, 535, 42, 6, 6, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL REVENUE', 45, 87);
    doc.text('ORDERS / BILLS', 180, 87);
    doc.text('EGGS SOLD (P/T)', 320, 87);
    doc.text('NET PROFIT', 455, 87);

    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${(salesReportStats.totalRevenue || 0).toLocaleString('en-PK')}`, 45, 104);
    doc.setTextColor(15, 23, 42);
    doc.text(`${salesReportStats.totalBills} Bills`, 180, 104);
    doc.setTextColor(217, 119, 6);
    doc.text(`${salesReportStats.totalPetis} P (${salesReportStats.totalTrays} T)`, 320, 104);
    doc.setTextColor(16, 185, 129);
    doc.text(`Rs. ${(salesReportStats.totalProfit || 0).toLocaleString('en-PK')}`, 455, 104);

    // Itemized Sales Table
    const tableData = (filteredSalesForReport.length > 0 ? filteredSalesForReport : shopSalesList).map((s, idx) => {
      const invNo = s.invoiceNumber || (s.serialNumber ? `#${s.serialNumber}` : `INV-${String(idx + 1).padStart(4, '0')}`);
      const sDate = new Date(s.saleDate || s.createdAt || Date.now()).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      const cust = `${s.customerName || 'Walk-in'}${s.customerPhone ? ` (${s.customerPhone})` : ''}`;
      const itemsList = (s.items || []).map(i => `${i.name} (x${i.quantity})`).join(', ') || 'Eggs';
      const method = s.paymentMethod || 'CASH';
      const total = Number(s.totalAmount) || 0;

      return [
        idx + 1,
        invNo,
        sDate,
        cust,
        itemsList,
        method,
        `Rs. ${total.toLocaleString('en-PK')}`
      ];
    });

    autoTable(doc, {
      startY: 125,
      head: [['#', 'Invoice #', 'Date & Time', 'Customer', 'Items Sold', 'Method', 'Total (Rs)']],
      body: tableData.length > 0 ? tableData : [['-', 'No Records', dateStr, 'N/A', 'No sales recorded', '-', 'Rs. 0']],
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 3.5, overflow: 'linebreak' },
      margin: { left: 30, right: 30 },
    });

    const fileName = `Sales_Report_${timeTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    return fileName;
  };

  const handleWhatsAppReportShare = (type = 'sales', timeframe = reportTimeframe) => {
    const shopName = shop?.name || 'Yosafze Egg Traders';
    const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const periodName = timeframe === 'DAY' ? 'Today (Day)' : timeframe === 'MONTH' ? 'This Month' : timeframe === 'YEAR' ? 'This Year' : 'All-Time';

    if (type === 'expenses') {
      const now = new Date();
      const filteredExp = expensesList.filter(exp => {
        const d = new Date(exp.expenseDate || exp.createdAt || Date.now());
        if (timeframe === 'DAY') return d.toDateString() === now.toDateString();
        if (timeframe === 'MONTH') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (timeframe === 'YEAR') return d.getFullYear() === now.getFullYear();
        return true;
      });

      const totalManualExp = filteredExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const damagedLossVal = timeframe === 'DAY' ? (dashStats.todayDamagedLoss || 0) :
        timeframe === 'MONTH' ? (dashStats.monthlyDamagedLoss || 0) :
          timeframe === 'YEAR' ? (dashStats.yearlyDamagedLoss || 0) :
            (dashStats.totalDamagedLoss || 0);
      const grandTotalExp = totalManualExp + damagedLossVal;

      let message = `📑 *EXPENSES & LOSS REPORT - ${shopName.toUpperCase()}*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `📅 *Period:* ${periodName} (${dateStr})\n`;
      message += `🏢 *Store Branch:* ${shopName}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `📊 *SUMMARY STATS:*\n`;
      message += `• Manual Expenses: Rs. ${totalManualExp.toLocaleString('en-PK')} (${filteredExp.length} Entries)\n`;
      message += `• Damaged Egg Losses: Rs. ${damagedLossVal.toLocaleString('en-PK')}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `💵 *TOTAL EXPENSES & LOSS: Rs. ${grandTotalExp.toLocaleString('en-PK')}*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;

      if (filteredExp.length > 0) {
        message += `📦 *ITEMIZED EXPENSES LIST:*\n`;
        filteredExp.forEach((e, idx) => {
          const eDate = new Date(e.expenseDate || e.createdAt).toLocaleDateString('en-PK');
          message += `${idx + 1}. [${e.category}] ${e.title} = Rs. ${(Number(e.amount) || 0).toLocaleString('en-PK')} (${e.paymentMethod || 'Paid'} • ${eDate})\n`;
        });
      } else {
        message += `_No manual expenses logged for this period._\n`;
      }

      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `🙏 *Thank you! Generated via Yosafze Egg Traders System*`;

      const encodedText = encodeURIComponent(message);
      window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
      return;
    }

    if (type === 'profit') {
      const pdfFileName = generateProfitReportPDF(timeframe);

      let message = `📄 *${shopName.toUpperCase()} - NET PROFIT STATEMENT*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `📅 *Period Filter:* ${periodName} (${dateStr})\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `📈 *1. SALES REVENUE SUMMARY:*\n`;
      message += `• Today's Sales: Rs. ${(profitReportStats.todaySalesTotal || 0).toLocaleString('en-PK')} (Profit: Rs. ${(profitReportStats.todayProfitTotal || 0).toLocaleString('en-PK')})\n`;
      message += `• This Month Sales: Rs. ${(profitReportStats.monthSalesTotal || 0).toLocaleString('en-PK')} (Profit: Rs. ${(profitReportStats.monthProfitTotal || 0).toLocaleString('en-PK')})\n`;
      message += `• This Year Sales: Rs. ${(profitReportStats.yearSalesTotal || 0).toLocaleString('en-PK')} (Profit: Rs. ${(profitReportStats.yearProfitTotal || 0).toLocaleString('en-PK')})\n`;
      message += `• All-Time Total Sales: Rs. ${(profitReportStats.allSalesTotal || 0).toLocaleString('en-PK')}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `📊 *2. NET PROFIT RECONCILIATION:*\n`;
      message += `(+) Total Sales: Rs. ${(profitReportStats.totalRevenue || 0).toLocaleString('en-PK')}\n`;
      message += `(-) Purchases Cost: Rs. ${(profitReportStats.totalPurchasesCost || 0).toLocaleString('en-PK')} (${profitReportStats.totalPurchasesPetis} Petis • ${profitReportStats.totalPurchasesTrays} Trays • ${profitReportStats.totalPurchasesEggs} Eggs)\n`;
      message += `(-) Shop Expenses: Rs. ${(profitReportStats.totalExpenses || 0).toLocaleString('en-PK')}\n`;
      message += `(-) Damaged Egg Loss: Rs. ${(profitReportStats.totalDamagedLoss || 0).toLocaleString('en-PK')} (${profitReportStats.totalDamagedEggs} Eggs)\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `💵 *(=) FINAL PURE REALIZED NET PROFIT: Rs. ${(profitReportStats.finalNetProfit || 0).toLocaleString('en-PK')}*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `📎 *Official PDF Statement (${pdfFileName}) downloaded to your device.*\n`;
      message += `_Yosafze Egg Traders Financial System_`;

      const encodedText = encodeURIComponent(message);
      window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
      return;
    }

    // Default Sales report WhatsApp
    const pdfFileName = generateSalesReportPDF(timeframe);
    let message = `📄 *${shopName.toUpperCase()} - SALES REVENUE REPORT*\n`;
    message += `📅 *Timeframe:* ${periodName} (${dateStr})\n`;
    message += `===============================\n`;
    message += `💰 *Total Sales Revenue:* Rs. ${(salesReportStats.totalRevenue || 0).toLocaleString('en-PK')}\n`;
    message += `🧾 *Total Invoices / Bills:* ${salesReportStats.totalBills} Bills\n`;
    message += `📦 *Stock Eggs Sold:* ${salesReportStats.totalPetis} Petis (${salesReportStats.totalTrays} Trays • ${(salesReportStats.totalEggs || 0).toLocaleString('en-PK')} Eggs)\n`;
    message += `📈 *Net Profit Earned:* Rs. ${(salesReportStats.totalProfit || 0).toLocaleString('en-PK')}\n`;
    message += `💵 *Cash Received:* Rs. ${(salesReportStats.cashSales || 0).toLocaleString('en-PK')}\n`;
    message += `💳 *Bank / Online Received:* Rs. ${(salesReportStats.onlineSales || 0).toLocaleString('en-PK')}\n`;
    message += `===============================\n`;
    message += `🛒 *RECENT SALES LIST:* (${filteredSalesForReport.length} sales)\n`;

    filteredSalesForReport.slice(0, 8).forEach((s, idx) => {
      const inv = s.invoiceNumber || `#${s.serialNumber || idx + 1}`;
      const cust = s.customerName || 'Walk-in Customer';
      message += `${idx + 1}. *${inv}* - ${cust} | Rs. ${(s.totalAmount || 0).toLocaleString('en-PK')} (${s.paymentMethod || 'CASH'})\n`;
    });

    if (filteredSalesForReport.length > 8) {
      message += `... and ${filteredSalesForReport.length - 8} more sales (see PDF).\n`;
    }

    message += `===============================\n`;
    message += `📎 *Official PDF Report (${pdfFileName}) downloaded to your device.*\n`;
    message += `_Yosafze Egg Traders Sales Management System_`;

    const encodedText = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  const handlePrintSingleReport = (type = 'sales', timeframe = reportTimeframe) => {
    const shopName = shop?.name || 'Yosafze Egg Traders';
    const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const timeTitle = timeframe === 'DAY' ? 'Today (Day)' : timeframe === 'MONTH' ? 'This Month' : timeframe === 'YEAR' ? 'This Year' : 'All-Time';

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to view and print the report');
      return;
    }

    if (type === 'expenses') {
      const now = new Date();
      const filteredExp = expensesList.filter(exp => {
        const d = new Date(exp.expenseDate || exp.createdAt || Date.now());
        if (timeframe === 'DAY') return d.toDateString() === now.toDateString();
        if (timeframe === 'MONTH') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (timeframe === 'YEAR') return d.getFullYear() === now.getFullYear();
        return true;
      });

      const totalManualExp = filteredExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const damagedLossVal = timeframe === 'DAY' ? (dashStats.todayDamagedLoss || 0) :
        timeframe === 'MONTH' ? (dashStats.monthlyDamagedLoss || 0) :
          timeframe === 'YEAR' ? (dashStats.yearlyDamagedLoss || 0) :
            (dashStats.totalDamagedLoss || 0);
      const grandTotalExp = totalManualExp + damagedLossVal;

      let expRows = filteredExp.length > 0 ? filteredExp.map((e, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="text-align:center; font-weight:bold; border:1px solid #cbd5e1; padding:8px;">${idx + 1}</td>
          <td style="border:1px solid #cbd5e1; padding:8px;">${new Date(e.expenseDate || e.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
          <td style="border:1px solid #cbd5e1; padding:8px; font-weight:bold; text-transform:uppercase;">${e.title}</td>
          <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;"><span style="background:#fee2e2; color:#b91c1c; padding:2px 8px; border-radius:4px; font-weight:bold; font-size:8.5pt;">${e.category}</span></td>
          <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;"><span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:4px; font-weight:bold; font-size:8.5pt;">${e.paymentMethod || 'Paid'}</span></td>
          <td style="border:1px solid #cbd5e1; padding:8px; color:#64748b;">${e.notes || e.createdBy || 'Shop Admin'}</td>
          <td style="border:1px solid #cbd5e1; padding:8px; text-align:right; font-weight:bold; color:#dc2626;">Rs. ${(Number(e.amount) || 0).toLocaleString('en-PK')}</td>
        </tr>
      `).join('') : `
        <tr>
          <td colspan="7" style="text-align:center; padding:20px; color:#64748b; font-weight:bold;">No expenses recorded for this period.</td>
        </tr>
      `;

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${timeTitle} Expenses &amp; Loss Report - ${shopName}</title>
            <style>
              @page { size: portrait; margin: 8mm 10mm; }
              body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #0f172a; background: #ffffff; font-size: 11px; margin: 0; }
              .header-banner { background: #dc2626; color: #ffffff; padding: 18px 24px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
              .header-banner h1 { margin: 0; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
              .header-banner p { margin: 4px 0 0; font-size: 10px; font-weight: 600; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
              .badge { background: #fee2e2; color: #991b1b; padding: 6px 14px; border-radius: 8px; font-weight: 900; font-size: 11px; }
              .stats-grid { display: flex; gap: 12px; margin-bottom: 20px; }
              .stat-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; text-align: center; }
              .stat-card label { font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px; }
              .stat-card .val { font-size: 15px; font-weight: 900; color: #dc2626; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background: #dc2626; color: #ffffff; font-weight: 900; text-transform: uppercase; font-size: 9pt; padding: 9px; border: 1px solid #dc2626; text-align: left; }
              .total-bar { margin-top: 20px; padding: 14px 20px; background: #fee2e2; border: 2px solid #ef4444; border-radius: 10px; display: flex; justify-content: space-between; font-weight: 900; font-size: 14px; color: #991b1b; }
              .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; color: #64748b; }
              .sign { border-top: 1.5px solid #cbd5e1; width: 180px; text-align: center; padding-top: 4px; }
            </style>
          </head>
          <body>
            <div class="header-banner">
              <div>
                <h1>${shopName.toUpperCase()}</h1>
                <p>OFFICIAL BUSINESS EXPENSES &amp; LOSS ANALYTICS STATEMENT</p>
              </div>
              <div class="badge">
                PERIOD: ${timeTitle.toUpperCase()}<br/>
                <span style="font-size:8px; opacity:0.8;">${dateStr}</span>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-card"><label>Operational Expenses</label><div class="val">Rs. ${totalManualExp.toLocaleString('en-PK')}</div></div>
              <div class="stat-card"><label>Damaged Egg Losses</label><div class="val" style="color:#d97706;">Rs. ${damagedLossVal.toLocaleString('en-PK')}</div></div>
              <div class="stat-card"><label>Grand Total Losses</label><div class="val" style="color:#991b1b;">Rs. ${grandTotalExp.toLocaleString('en-PK')}</div></div>
            </div>

            <h3 style="font-size:12px; text-transform:uppercase; font-weight:900; color:#334155; margin-bottom:6px;">Itemized Logged Expenses (${filteredExp.length} Entries)</h3>
            <table>
              <thead>
                <tr>
                  <th style="width:30px; text-align:center;">#</th>
                  <th style="width:100px;">Date</th>
                  <th>Expense Title / Reason</th>
                  <th style="width:120px; text-align:center;">Category</th>
                  <th style="width:110px; text-align:center;">Payment Status</th>
                  <th style="width:130px;">Notes / User</th>
                  <th style="width:110px; text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${expRows}
              </tbody>
            </table>

            <div class="total-bar">
              <span>TOTAL EXPENSES &amp; LOSSES:</span>
              <span>Rs. ${grandTotalExp.toLocaleString('en-PK')}</span>
            </div>

            <div class="footer">
              <div>Generated via Yosafze Egg Traders Admin System</div>
              <div class="sign">Authorized Signature &amp; Stamp</div>
            </div>
          </body>
        </html>
      `);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => printWin.print(), 300);
      return;
    }

    if (type === 'profit') {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${timeTitle} Pure Net Profit Statement - ${shopName}</title>
            <style>
              @page { size: portrait; margin: 8mm 10mm; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; background: #ffffff; font-size: 11px; margin: 0; }
              .header { background: linear-gradient(135deg, #0f172a 0%, #065f46 100%); color: #ffffff; padding: 18px 24px; border-radius: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
              .header h1 { margin: 0; font-size: 18px; letter-spacing: 0.5px; font-weight: 900; text-transform: uppercase; }
              .header p { margin: 2px 0 0; color: #34d399; font-weight: 800; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }
              .meta-badge { background: #f59e0b; color: #0f172a; padding: 6px 12px; border-radius: 8px; font-weight: 900; font-size: 10px; text-align: center; }
              .sales-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
              .sale-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 10px; border-radius: 8px; }
              .sale-card label { font-size: 8px; font-weight: 900; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px; }
              .sale-card .val { font-size: 12px; font-weight: 900; color: #059669; }
              .flow-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
              .flow-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 10px; border-radius: 8px; }
              .flow-card label { font-size: 8px; font-weight: 900; color: #64748b; text-transform: uppercase; display: block; }
              .flow-card .val { font-size: 12px; font-weight: 900; margin-top: 2px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 9.5px; text-align: left; }
              th { background: #0f172a; text-transform: uppercase; font-weight: 900; font-size: 8.5px; color: #ffffff; }
              .footer { margin-top: 35px; display: flex; justify-content: space-between; font-size: 8.5px; font-weight: 800; color: #64748b; }
              .sign { border-top: 1.5px solid #94a3b8; width: 160px; text-align: center; padding-top: 4px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1>${shopName.toUpperCase()}</h1>
                <p>Official Pure Realized Net Profit &amp; Loss Statement</p>
              </div>
              <div class="meta-badge">
                PERIOD: ${timeTitle.toUpperCase()}<br/>
                <span style="font-size:8px; opacity:0.85;">${dateStr}</span>
              </div>
            </div>

            <div style="font-size: 9.5px; font-weight: 900; color: #334155; text-transform: uppercase; margin-bottom: 6px;">1. Period Sales Overview (Day • Month • Year)</div>
            <div class="sales-grid">
              <div class="sale-card"><label>Today's Sales</label><div class="val">Rs. ${(profitReportStats.todaySalesTotal || 0).toLocaleString('en-PK')}</div></div>
              <div class="sale-card"><label>This Month Sales</label><div class="val">Rs. ${(profitReportStats.monthSalesTotal || 0).toLocaleString('en-PK')}</div></div>
              <div class="sale-card"><label>This Year Sales</label><div class="val">Rs. ${(profitReportStats.yearSalesTotal || 0).toLocaleString('en-PK')}</div></div>
              <div class="sale-card"><label>Lifetime Sales</label><div class="val">Rs. ${(profitReportStats.allSalesTotal || 0).toLocaleString('en-PK')}</div></div>
            </div>

            <div style="font-size: 9.5px; font-weight: 900; color: #334155; text-transform: uppercase; margin-bottom: 6px;">2. Statement Financial Deductions</div>
            <div class="flow-grid">
              <div class="flow-card"><label>(+) Total Sales</label><div class="val" style="color:#059669;">+ Rs. ${(profitReportStats.totalRevenue || 0).toLocaleString('en-PK')}</div></div>
              <div class="flow-card"><label>(-) Purchases Cost</label><div class="val" style="color:#0284c7;">- Rs. ${(profitReportStats.totalPurchasesCost || 0).toLocaleString('en-PK')}</div></div>
              <div class="flow-card"><label>(-) Shop Expenses</label><div class="val" style="color:#dc2626;">- Rs. ${(profitReportStats.totalExpenses || 0).toLocaleString('en-PK')}</div></div>
              <div class="flow-card"><label>(-) Damaged Loss</label><div class="val" style="color:#d97706;">- Rs. ${(profitReportStats.totalDamagedLoss || 0).toLocaleString('en-PK')}</div></div>
            </div>

            <table style="margin-top: 8px;">
              <thead>
                <tr>
                  <th style="width:25px; text-align:center;">#</th>
                  <th>Financial Line Item &amp; Description</th>
                  <th style="text-align:center;">Volume / Stock Details</th>
                  <th style="text-align:center;">Records</th>
                  <th style="text-align:right;">Amount (RS)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="text-align:center; font-weight:bold;">1</td>
                  <td><strong style="color:#047857;">(+) Total Sales Revenue Earned</strong></td>
                  <td style="text-align:center;">Sales Invoices</td>
                  <td style="text-align:center;">${profitReportStats.filteredSalesCount} Invoices</td>
                  <td style="text-align:right; font-weight:bold; color:#047857;">+ Rs. ${(profitReportStats.totalRevenue || 0).toLocaleString('en-PK')}</td>
                </tr>
                <tr>
                  <td style="text-align:center; font-weight:bold;">2</td>
                  <td><strong style="color:#0284c7;">(-) Purchased Products / Restocks Cost</strong></td>
                  <td style="text-align:center;">${profitReportStats.totalPurchasesPetis} Petis • ${profitReportStats.totalPurchasesTrays} Trays • ${profitReportStats.totalPurchasesEggs.toLocaleString('en-PK')} Eggs</td>
                  <td style="text-align:center;">${profitReportStats.filteredPurchasesCount} Restocks</td>
                  <td style="text-align:right; font-weight:bold; color:#0284c7;">- Rs. ${(profitReportStats.totalPurchasesCost || 0).toLocaleString('en-PK')}</td>
                </tr>
                <tr>
                  <td style="text-align:center; font-weight:bold;">3</td>
                  <td><strong style="color:#dc2626;">(-) Shop Operational Expenses (Bills, Rent, Misc)</strong></td>
                  <td style="text-align:center;">Overhead Cost</td>
                  <td style="text-align:center;">${profitReportStats.filteredExpensesCount} Logs</td>
                  <td style="text-align:right; font-weight:bold; color:#dc2626;">- Rs. ${(profitReportStats.totalExpenses || 0).toLocaleString('en-PK')}</td>
                </tr>
                <tr>
                  <td style="text-align:center; font-weight:bold;">4</td>
                  <td><strong style="color:#d97706;">(-) Damaged / Broken Egg Inventory Loss</strong></td>
                  <td style="text-align:center;">Waste &amp; Breakage</td>
                  <td style="text-align:center;">${profitReportStats.filteredDamagedCount} Logs (${profitReportStats.totalDamagedEggs} Eggs)</td>
                  <td style="text-align:right; font-weight:bold; color:#d97706;">- Rs. ${(profitReportStats.totalDamagedLoss || 0).toLocaleString('en-PK')}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style="background:#ecfdf5; font-weight:900; font-size:11px;">
                  <td colspan="4" style="text-align:right; color:#065f46; padding: 10px;">(=) FINAL PURE REALIZED NET PROFIT:</td>
                  <td style="text-align:right; color:#047857; padding: 10px; font-size: 13px;">Rs. ${(profitReportStats.finalNetProfit || 0).toLocaleString('en-PK')}</td>
                </tr>
              </tfoot>
            </table>

            <div class="footer">
              <div>Report Generated by Yosafze Egg Traders Admin System</div>
              <div class="sign">Authorized Signature &amp; Stamp</div>
            </div>
          </body>
        </html>
      `);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => printWin.print(), 300);
      return;
    }

    const salesList = filteredSalesForReport.length > 0 ? filteredSalesForReport : shopSalesList;

    const tableRows = salesList.map((s, idx) => {
      const inv = s.invoiceNumber || (s.serialNumber ? `#${s.serialNumber}` : `INV-${String(idx + 1).padStart(4, '0')}`);
      const sDate = new Date(s.saleDate || s.createdAt || Date.now()).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      const cust = s.customerName || 'Walk-in Customer';
      const phone = s.customerPhone ? `<br/><small style="color:#64748b;">${s.customerPhone}</small>` : '';
      const itemsList = (s.items || []).map(i => `${i.name} (x${i.quantity})`).join(', ') || 'Eggs';
      const method = s.paymentMethod || 'CASH';
      const total = Number(s.totalAmount) || 0;

      return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td><strong>${inv}</strong></td>
          <td>${sDate}</td>
          <td>${cust}${phone}</td>
          <td>${itemsList}</td>
          <td style="text-align:center;"><span class="badge ${method === 'CASH' ? 'badge-cash' : 'badge-bank'}">${method}</span></td>
          <td style="text-align:right; font-weight:bold; color:#047857;">Rs. ${total.toLocaleString('en-PK')}</td>
        </tr>
      `;
    }).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${timeTitle} Sales Revenue Report - ${shopName}</title>
          <style>
            @page { size: portrait; margin: 8mm 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 15px; color: #0f172a; background: #ffffff; font-size: 11px; margin: 0; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 12px; }
            .header h1 { margin: 0; color: #047857; text-transform: uppercase; font-size: 18px; letter-spacing: 1px; font-weight: 900; }
            .header p { margin: 2px 0 0; color: #64748b; font-weight: 800; font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; }
            .meta { display: flex; justify-content: space-between; font-size: 9.5px; font-weight: 800; margin-bottom: 10px; background: #f8fafc; padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
            .stats-grid { display: flex; flex-direction: row; gap: 8px; margin-bottom: 12px; }
            .stat-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 8px; border-radius: 8px; text-align: center; }
            .stat-card label { font-size: 8px; font-weight: 900; color: #64748b; text-transform: uppercase; display: block; }
            .stat-card .val { font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 1px; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th, td { border: 1px solid #cbd5e1; padding: 4.5px 6px; font-size: 9.5px; text-align: left; }
            th { background: #f1f5f9; text-transform: uppercase; font-weight: 900; font-size: 8px; color: #475569; }
            .badge { padding: 1.5px 5px; border-radius: 4px; font-size: 7.5px; font-weight: 900; text-transform: uppercase; }
            .badge-cash { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
            .badge-bank { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
            .total-row { background: #f8fafc; font-weight: 900; font-size: 10px; }
            .footer { margin-top: 25px; display: flex; justify-content: space-between; font-size: 8.5px; font-weight: 800; color: #64748b; }
            .sign { border-top: 1.5px solid #94a3b8; width: 140px; text-align: center; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${shopName.toUpperCase()}</h1>
            <p>Official Sales Revenue &amp; Bills Statement Report</p>
          </div>
          <div class="meta">
            <span>Generated: ${dateStr}</span>
            <span>Period Filter: ${timeTitle}</span>
            <span>Total Sales: ${salesList.length} Invoices</span>
          </div>
          <div class="stats-grid">
            <div class="stat-card"><label>Total Sales Revenue</label><div class="val" style="color:#059669;">Rs. ${(salesReportStats.totalRevenue || 0).toLocaleString('en-PK')}</div></div>
            <div class="stat-card"><label>Total Orders / Bills</label><div class="val">${salesReportStats.totalBills} Bills</div></div>
            <div class="stat-card"><label>Eggs Sold (Petis)</label><div class="val" style="color:#d97706;">${salesReportStats.totalPetis} Petis</div></div>
            <div class="stat-card"><label>Net Profit Earned</label><div class="val" style="color:#10b981;">Rs. ${(salesReportStats.totalProfit || 0).toLocaleString('en-PK')}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:20px; text-align:center;">#</th>
                <th>Invoice #</th>
                <th>Date &amp; Time</th>
                <th>Customer</th>
                <th>Items Purchased</th>
                <th style="text-align:center;">Method</th>
                <th style="text-align:right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="7" style="text-align:center; padding:15px;">No sales recorded for this period.</td></tr>'}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4" style="text-align:right;">TOTAL SALES REVENUE:</td>
                <td colspan="2" style="text-align:center;">${salesReportStats.totalBills} Bills (${salesReportStats.totalPetis} Petis)</td>
                <td style="text-align:right; color:#047857; font-size:11px;">Rs. ${(salesReportStats.totalRevenue || 0).toLocaleString('en-PK')}</td>
              </tr>
            </tfoot>
          </table>
          <div class="footer">
            <div>Report Generated by Yosafze Egg Traders Admin System</div>
            <div class="sign">Authorized Signature</div>
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 300);
  };

  const handleExportExcelReport = (type = 'sales', timeframe = reportTimeframe) => {
    const shopName = shop?.name || 'Yosafze Egg Traders';
    const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const timeLabel = timeframe === 'DAY' ? 'Daily (Today)' : timeframe === 'MONTH' ? 'Monthly (This Month)' : timeframe === 'YEAR' ? 'Yearly (This Year)' : 'All-Time Total';

    if (type === 'profit') {
      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Profit_${timeframe}</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; }
            .header-banner { background-color: #0f172a; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: center; height: 38px; border: 1px solid #0f172a; vertical-align: middle; }
            .sub-banner { background-color: #1e293b; color: #34d399; font-size: 9.5pt; text-align: center; font-weight: bold; height: 22px; border: 1px solid #1e293b; vertical-align: middle; }
            .info-label { font-weight: bold; color: #475569; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 7px 12px; }
            .info-val { font-weight: 600; color: #0f172a; background-color: #ffffff; border: 1px solid #cbd5e1; padding: 7px 12px; }
            .col-header { background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 9.5pt; border: 1px solid #0f172a; padding: 8px 6px; }
            .tot-lbl { background-color: #0f172a; color: #ffffff; font-weight: 900; font-size: 11pt; text-align: right; border: 1px solid #0f172a; padding: 10px 14px; }
            .tot-val { background-color: #ecfdf5; color: #047857; font-weight: 900; font-size: 13pt; text-align: right; border: 2px solid #059669; padding: 10px 14px; }
          </style>
        </head>
        <body>
          <table>
            <colgroup>
              <col width="60" />
              <col width="260" />
              <col width="160" />
              <col width="220" />
              <col width="160" />
            </colgroup>
            <tr>
              <td colspan="5" class="header-banner">${shopName.toUpperCase()}</td>
            </tr>
            <tr>
              <td colspan="5" class="sub-banner">OFFICIAL PURE REALIZED NET PROFIT STATEMENT (${timeLabel.toUpperCase()})</td>
            </tr>
            <tr style="height: 10px;"><td colspan="5" style="border:none;"></td></tr>
            <tr>
              <td colspan="2" class="info-label">Period Filter:</td>
              <td class="info-val" style="color: #0284c7; font-weight: bold;">${timeLabel}</td>
              <td class="info-label">Generated Date:</td>
              <td class="info-val">${dateStr}</td>
            </tr>
            <tr>
              <td colspan="2" class="info-label">Today's Sales Revenue:</td>
              <td class="info-val" style="color: #047857; font-weight: bold;">RS ${(profitReportStats.todaySalesTotal || 0).toLocaleString()}</td>
              <td class="info-label">This Month Sales:</td>
              <td class="info-val" style="color: #047857; font-weight: bold;">RS ${(profitReportStats.monthSalesTotal || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="2" class="info-label">This Year Sales:</td>
              <td class="info-val" style="color: #047857; font-weight: bold;">RS ${(profitReportStats.yearSalesTotal || 0).toLocaleString()}</td>
              <td class="info-label">Lifetime Total Sales:</td>
              <td class="info-val" style="color: #047857; font-weight: 900;">RS ${(profitReportStats.allSalesTotal || 0).toLocaleString()}</td>
            </tr>
            <tr style="height: 14px;"><td colspan="5" style="border:none;"></td></tr>
            <tr style="height: 32px;">
              <th class="col-header" style="text-align: center;">#</th>
              <th class="col-header" style="text-align: left;">Financial Line Item</th>
              <th class="col-header" style="text-align: center;">Category</th>
              <th class="col-header" style="text-align: center;">Volume / Stock Details</th>
              <th class="col-header" style="text-align: right;">Amount (RS)</th>
            </tr>
            <tr>
              <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; padding: 7px;">1</td>
              <td style="border: 1px solid #cbd5e1; font-weight: bold; color: #047857; padding: 7px;">(+) Total Sales Revenue Earned</td>
              <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #047857; padding: 7px;">Sales Revenue</td>
              <td style="border: 1px solid #cbd5e1; text-align: center; padding: 7px;">${profitReportStats.filteredSalesCount} Sales Invoices</td>
              <td style="text-align: right; border: 1px solid #cbd5e1; font-weight: 900; color: #047857; padding: 7px;">+ RS ${Number(profitReportStats.totalRevenue || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; padding: 7px;">2</td>
              <td style="border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7; padding: 7px;">(-) Purchased Products Cost</td>
              <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0284c7; padding: 7px;">Restocks</td>
              <td style="border: 1px solid #cbd5e1; text-align: center; padding: 7px;">${profitReportStats.totalPurchasesPetis} Petis • ${profitReportStats.totalPurchasesTrays} Trays • ${profitReportStats.totalPurchasesEggs} Eggs</td>
              <td style="text-align: right; border: 1px solid #cbd5e1; font-weight: 900; color: #0284c7; padding: 7px;">- RS ${Number(profitReportStats.totalPurchasesCost || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; padding: 7px;">3</td>
              <td style="border: 1px solid #cbd5e1; font-weight: bold; color: #dc2626; padding: 7px;">(-) Shop Operating Expenses</td>
              <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #dc2626; padding: 7px;">Overhead Cost</td>
              <td style="border: 1px solid #cbd5e1; text-align: center; padding: 7px;">${profitReportStats.filteredExpensesCount} Expense Logs</td>
              <td style="text-align: right; border: 1px solid #cbd5e1; font-weight: 900; color: #dc2626; padding: 7px;">- RS ${Number(profitReportStats.totalExpenses || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; padding: 7px;">4</td>
              <td style="border: 1px solid #cbd5e1; font-weight: bold; color: #d97706; padding: 7px;">(-) Damaged Egg Losses</td>
              <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #d97706; padding: 7px;">Stock Breakage</td>
              <td style="border: 1px solid #cbd5e1; text-align: center; padding: 7px;">${profitReportStats.filteredDamagedCount} Logs (${profitReportStats.totalDamagedEggs} Eggs)</td>
              <td style="text-align: right; border: 1px solid #cbd5e1; font-weight: 900; color: #d97706; padding: 7px;">- RS ${Number(profitReportStats.totalDamagedLoss || 0).toLocaleString()}</td>
            </tr>
            <tr style="height: 10px;"><td colspan="5" style="border:none;"></td></tr>
            <tr>
              <td colspan="4" class="tot-lbl">FINAL PURE REALIZED NET PROFIT:</td>
              <td class="tot-val">RS ${Number(profitReportStats.finalNetProfit || 0).toLocaleString()}</td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Net_Profit_Statement_${timeframe}_${shopName.replace(/\s+/g, '_')}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (type === 'expenses') {
      const now = new Date();
      const filteredExp = expensesList.filter(exp => {
        const d = new Date(exp.expenseDate || exp.createdAt || Date.now());
        if (timeframe === 'DAY') return d.toDateString() === now.toDateString();
        if (timeframe === 'MONTH') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (timeframe === 'YEAR') return d.getFullYear() === now.getFullYear();
        return true;
      });

      const totalManualExp = filteredExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const damagedLossVal = timeframe === 'DAY' ? (dashStats.todayDamagedLoss || 0) :
        timeframe === 'MONTH' ? (dashStats.monthlyDamagedLoss || 0) :
          timeframe === 'YEAR' ? (dashStats.yearlyDamagedLoss || 0) :
            (dashStats.totalDamagedLoss || 0);

      const formattedRowsHtml = filteredExp.map((e, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="text-align:center; border:1px solid #cbd5e1; font-weight:bold; padding:6px;">${idx + 1}</td>
          <td style="border:1px solid #cbd5e1; padding:6px;">${new Date(e.expenseDate || e.createdAt).toLocaleDateString('en-PK')}</td>
          <td style="border:1px solid #cbd5e1; font-weight:bold; padding:6px;">${e.title}</td>
          <td style="border:1px solid #cbd5e1; text-align:center; font-weight:bold; color:#e11d48; padding:6px;">${e.category}</td>
          <td style="border:1px solid #cbd5e1; text-align:center; font-weight:bold; color:#16a34a; padding:6px;">${e.paymentMethod || 'Paid'}</td>
          <td style="border:1px solid #cbd5e1; padding:6px;">${e.notes || e.createdBy || 'Shop Admin'}</td>
          <td style="text-align:right; border:1px solid #cbd5e1; font-weight:bold; color:#e11d48; padding:6px;">Rs. ${(Number(e.amount) || 0).toLocaleString()}</td>
        </tr>
      `).join('');

      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Expenses_${timeframe}</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10.5pt; }
            .header-banner { background-color: #0f172a; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: center; height: 38px; border: 1px solid #0f172a; vertical-align: middle; }
            .sub-banner { background-color: #1e293b; color: #38bdf8; font-size: 9.5pt; text-align: center; font-weight: bold; height: 22px; border: 1px solid #1e293b; vertical-align: middle; }
            .info-label { font-weight: bold; color: #475569; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 10px; }
            .info-val { font-weight: bold; color: #0f172a; border: 1px solid #cbd5e1; padding: 6px 10px; }
            .col-header { background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 9.5pt; border: 1px solid #0f172a; padding: 8px 6px; }
            .total-lbl-cell { background-color: #f8fafc; font-weight: 900; font-size: 11pt; color: #0f172a; border: 2px solid #0f172a; padding: 10px 14px; text-align: right; }
            .total-val-cell { background-color: #fef2f2; font-weight: 900; font-size: 12pt; color: #dc2626; border: 2px solid #0f172a; padding: 10px 14px; text-align: right; }
          </style>
        </head>
        <body>
          <table>
            <colgroup>
              <col width="50" />
              <col width="120" />
              <col width="260" />
              <col width="140" />
              <col width="130" />
              <col width="160" />
              <col width="140" />
            </colgroup>
            <tr>
              <td colspan="7" class="header-banner">${shopName.toUpperCase()}</td>
            </tr>
            <tr>
              <td colspan="7" class="sub-banner">OFFICIAL BUSINESS EXPENSES &amp; LOSS REPORT (${timeLabel.toUpperCase()})</td>
            </tr>
            <tr style="height: 10px;"><td colspan="7" style="border:none;"></td></tr>
            <tr>
              <td class="info-label">Report Period:</td>
              <td class="info-val" style="color: #0284c7; font-weight: 900;">${timeLabel}</td>
              <td style="border:none;"></td>
              <td class="info-label">Generated Date:</td>
              <td colspan="3" class="info-val">${dateStr}</td>
            </tr>
            <tr>
              <td class="info-label">Total Entries:</td>
              <td class="info-val">${filteredExp.length} Entries</td>
              <td style="border:none;"></td>
              <td class="info-label">Damaged Egg Loss:</td>
              <td colspan="3" class="info-val" style="color: #d97706; font-weight: bold;">Rs. ${damagedLossVal.toLocaleString()}</td>
            </tr>
            <tr style="height: 14px;"><td colspan="7" style="border:none;"></td></tr>
            <tr style="height: 30px;">
              <th class="col-header" style="text-align: center;">#</th>
              <th class="col-header">Expense Date</th>
              <th class="col-header" style="text-align: left;">Expense Title / Description</th>
              <th class="col-header" style="text-align: center;">Category</th>
              <th class="col-header" style="text-align: center;">Payment Method</th>
              <th class="col-header">Logged By / Notes</th>
              <th class="col-header" style="text-align: right;">Amount (RS)</th>
            </tr>
            ${formattedRowsHtml || '<tr><td colspan="7" style="text-align:center; padding:15px;">No expenses logged for this period</td></tr>'}
            <tr style="height: 10px;"><td colspan="7" style="border:none;"></td></tr>
            <tr>
              <td colspan="6" class="total-lbl-cell">COMBINED TOTAL EXPENSES &amp; LOSSES:</td>
              <td class="total-val-cell">Rs. ${(totalManualExp + damagedLossVal).toLocaleString()}</td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Expenses_${timeframe}_${shopName.replace(/\s+/g, '_')}_Report.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    let salesVal = (dashStats.totalRevenue || 0);
    let grossProfitVal = (dashStats.totalProfit || 0);
    let expensesVal = (dashStats.totalLoss || 0);
    let damagedVal = (dashStats.totalDamagedLoss || 0);
    let finalNetProfitVal = (grossProfitVal - expensesVal);

    if (timeframe === 'DAY') {
      salesVal = dashStats.todaySales || 0;
      grossProfitVal = dashStats.todayProfit || 0;
      expensesVal = dashStats.todayLoss || 0;
    } else if (timeframe === 'MONTH') {
      salesVal = dashStats.monthlySales || 0;
      grossProfitVal = dashStats.monthlyProfit || 0;
      expensesVal = dashStats.monthlyLoss || 0;
    } else if (timeframe === 'YEAR') {
      salesVal = dashStats.yearlySales || 0;
      grossProfitVal = dashStats.yearlyProfit || 0;
      expensesVal = dashStats.yearlyLoss || 0;
    }

    let csvRows = [];
    csvRows.push([`"YOSAFZE EGG TRADERS - OFFICIAL NET PROFIT & FINANCIAL REPORT"`]);
    csvRows.push([`"Store Branch"`, `"${shopName}"`]);
    csvRows.push([`"Report Period Filter"`, `"${timeLabel}"`]);
    csvRows.push([`"Generated Date"`, `"${dateStr}"`]);
    csvRows.push([]);

    csvRows.push([`"1. NET PROFIT RECONCILIATION STATEMENT"`, `"AMOUNT (RS)"`, `"CURRENCY"`, `"PERIOD"`]);
    csvRows.push([`"Gross Sales Revenue"`, salesVal, `"PKR"`, timeLabel]);
    csvRows.push([`"(+) Gross Sales Profit"`, grossProfitVal, `"PKR"`, timeLabel]);
    csvRows.push([`"(-) Shop Operational Expenses"`, expensesVal, `"PKR"`, timeLabel]);
    csvRows.push([`"(-) Damaged / Broken Egg Losses"`, damagedVal, `"PKR"`, timeLabel]);
    csvRows.push([`"(=) FINAL REALIZED NET PROFIT"`, finalNetProfitVal, `"PKR"`, timeLabel]);
    csvRows.push([]);

    csvRows.push([`"2. SUPPLIER PURCHASES & RESTOCKS"`, `"QUANTITY / VALUE"`, `"UNIT"`, `"NOTES"`]);
    csvRows.push([`"Restocks Entries Count"`, dashStats.totalPurchasesCount || 0, `"Entries"`, `"Supplier Bills"`]);
    csvRows.push([`"Total Petis Purchased"`, dashStats.totalPetisPurchased || 0, `"Petis"`, `"1 Peti = 12 Trays = 360 Eggs"`]);
    csvRows.push([`"Total Trays Purchased"`, dashStats.totalTraysPurchased || 0, `"Trays"`, `"1 Tray = 30 Eggs"`]);
    csvRows.push([`"Total Eggs Purchased"`, dashStats.totalEggsPurchased || 0, `"Eggs"`, `"Single Eggs"`]);
    csvRows.push([`"Total Purchase Cost Investment"`, dashStats.totalPurchaseCost || 0, `"PKR"`, `"Total Purchase Investment"`]);
    csvRows.push([`"Cash Paid to Supplier"`, dashStats.cashPaidToSupplier || 0, `"PKR"`, `"Cash Paid"`]);
    csvRows.push([`"Remaining Supplier Debt (Due)"`, dashStats.dueToSupplier || 0, `"PKR"`, `"Unpaid Debt"`]);
    csvRows.push([]);

    csvRows.push([`"3. CATALOG PRODUCTS & INVENTORY STOCK"`, `"QUANTITY"`, `"UNIT"`, `"NOTES"`]);
    csvRows.push([`"Total Catalog Products"`, dashStats.totalProducts || 0, `"Items"`, `"Active Catalog"`]);
    csvRows.push([`"Available Eggs Stock"`, dashStats.totalStockEggs || 0, `"Eggs"`, `"Eggs in Store"`]);
    csvRows.push([`"Available Petis Stock"`, dashStats.totalStockPetis || 0, `"Petis"`, `"Petis in Store"`]);
    csvRows.push([`"Sold Petis Stock"`, dashStats.soldPetis || 0, `"Petis"`, `"Petis Sold"`]);
    csvRows.push([`"Sold Trays Stock"`, dashStats.soldTrays || 0, `"Trays"`, `"Trays Sold"`]);
    csvRows.push([`"Sold Eggs Stock"`, dashStats.soldEggs || 0, `"Eggs"`, `"Eggs Sold"`]);
    csvRows.push([`"Total Damaged Loss"`, dashStats.totalDamagedLoss || 0, `"PKR"`, `"Egg Breakage Loss"`]);
    csvRows.push([]);
    csvRows.push([`"Generated via Yosafze Egg Traders Management System"`]);

    const csvString = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${shopName.replace(/\s+/g, '_')}_Excel_Report_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAllSalesExcel = () => {
    const shopName = shop?.name || 'Yosafze Egg Traders';
    let csvRows = [];
    csvRows.push([`"YOSAFZE EGG TRADERS - ALL SALES & CUSTOMER BILLS REPORT"`]);
    csvRows.push([`"Store / Branch"`, `"${shopName}"`]);
    csvRows.push([`"Export Date"`, `"${new Date().toLocaleString()}"`]);
    csvRows.push([`"Total Sales Count"`, shopSalesList.length]);
    csvRows.push([`"Total Revenue"`, `RS ${shopSalesList.reduce((sum, s) => sum + (s.totalAmount || 0), 0)}`]);
    csvRows.push([]);
    csvRows.push([`"#"`, `"Serial No"`, `"Invoice ID"`, `"Date & Time"`, `"Customer Name"`, `"Phone"`, `"Payment Method"`, `"Items Breakdown"`, `"Total Paid (RS)"`]);

    shopSalesList.forEach((s, idx) => {
      const serialNo = s.serialNumber || (s.invoiceNumber ? s.invoiceNumber.replace(/\D/g, '') : '') || String(s._id || '').slice(-6);
      const invoiceDisplay = s.invoiceNumber || `INV-${String(serialNo).padStart(5, '0')}`;
      const dateStr = new Date(s.saleDate || s.createdAt).toLocaleString();
      const itemsStr = (s.items || []).map(i => `${i.name} (${i.quantity})`).join('; ');
      csvRows.push([
        idx + 1,
        `"#${serialNo}"`,
        `"${invoiceDisplay}"`,
        `"${dateStr}"`,
        `"${s.customerName || 'Walk-in Customer'}"`,
        `="${s.customerPhone || 'N/A'}"`,
        `"${s.paymentMethod || 'CASH'}"`,
        `"${itemsStr}"`,
        s.totalAmount || 0
      ]);
    });

    csvRows.push([]);
    csvRows.push([`"Generated via Yosafze Egg Traders Management System"`]);

    const csvString = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${shopName.replace(/\s+/g, '_')}_All_Sales_Bills_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintCustomerSingleRecord = (sale) => {
    const shopName = shop?.name || 'Yosafze Egg Traders';
    const customerName = sale.customerName || 'Walk-in Customer';
    const customerPhone = sale.customerPhone || '';
    const saleDate = new Date(sale.saleDate || sale.createdAt).toLocaleString();
    const totalAmount = sale.totalAmount || 0;
    const items = sale.items || [];

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to print the customer record');
      return;
    }

    let itemsHtml = items.map((item, idx) => `
      <tr>
        <td style="padding:10px; border:1px solid #cbd5e1; text-align:center;">${idx + 1}</td>
        <td style="padding:10px; border:1px solid #cbd5e1; font-weight:bold;">${item.name}</td>
        <td style="padding:10px; border:1px solid #cbd5e1; text-align:center; font-weight:bold; color:#059669;">${item.quantity}</td>
        <td style="padding:10px; border:1px solid #cbd5e1; text-align:right;">RS ${(item.price || 0).toLocaleString()}</td>
        <td style="padding:10px; border:1px solid #cbd5e1; text-align:right; font-weight:bold;">RS ${((item.quantity || 1) * (item.price || 0)).toLocaleString()}</td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customer Bill Statement - ${customerName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #0f172a; background: #ffffff; }
            .header { text-align: center; border-bottom: 3px double #059669; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { margin: 0; color: #047857; text-transform: uppercase; font-size: 24px; font-weight: 900; }
            .header p { margin: 4px 0 0; color: #475569; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; }
            .meta { display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; margin-bottom: 20px; background: #f8fafc; padding: 14px 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #f1f5f9; text-transform: uppercase; font-weight: 900; font-size: 11px; color: #475569; padding: 10px; border: 1px solid #cbd5e1; text-align: left; }
            .total-bar { margin-top: 20px; padding: 15px 20px; background: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 12px; display: flex; justify-content: space-between; font-weight: 900; font-size: 16px; color: #047857; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: #64748b; }
            .sign { border-top: 2px solid #cbd5e1; width: 200px; text-align: center; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${shopName}</h1>
            <p>Customer Sales Record & Bill Statement</p>
          </div>
          <div class="meta">
            <div>
              <span style="color:#059669; text-transform:uppercase;">Customer Name:</span> <strong style="font-size:14px;">${customerName}</strong><br/>
              ${customerPhone ? `<span style="color:#475569;">Phone / Contact: ${customerPhone}</span>` : ''}
            </div>
            <div style="text-align:right;">
              <span>Date: ${saleDate}</span><br/>
              <span>Invoice ID: #${(sale._id || '').slice(-8).toUpperCase()}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align:center;">#</th>
                <th>Item Description</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Unit Price</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total-bar">
            <span>GRAND TOTAL AMOUNT PAID:</span>
            <span>RS ${totalAmount.toLocaleString('en-PK')}</span>
          </div>
          <div class="footer">
            <div class="sign">Customer Signature</div>
            <div class="sign">Yosafze Egg Traders Stamp</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handlePrintSummaryReport = (timeframe = reportTimeframe) => {
    const shopName = shop?.name || 'Peshawar Shop';
    const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    let title = 'Total Financial & Sales Summary Report';
    let salesVal = dashStats.totalRevenue;
    let profitVal = dashStats.totalProfit;
    let lossVal = dashStats.totalLoss;

    if (timeframe === 'DAY') {
      title = 'Daily (Today) Sales & Financial Report';
      salesVal = dashStats.todaySales;
      profitVal = dashStats.todayProfit || 0;
      lossVal = dashStats.todayLoss || 0;
    } else if (timeframe === 'MONTH') {
      title = 'Monthly Sales & Financial Report';
      salesVal = dashStats.monthlySales;
      profitVal = dashStats.monthlyProfit || 0;
      lossVal = dashStats.monthlyLoss || 0;
    } else if (timeframe === 'YEAR') {
      title = 'Yearly Sales & Financial Report';
      salesVal = dashStats.yearlySales;
      profitVal = dashStats.yearlyProfit || 0;
      lossVal = dashStats.yearlyLoss || 0;
    }

    const netVal = profitVal - lossVal;
    const timeLabel = timeframe === 'DAY' ? 'Today (Day)' : timeframe === 'MONTH' ? 'This Month (Month)' : timeframe === 'YEAR' ? 'This Year (Year)' : 'All-Time Cumulative';

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to view and print the report');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${shopName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #0f172a; background: #ffffff; }
            .header { text-align: center; border-bottom: 3px double #059669; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #047857; text-transform: uppercase; font-size: 26px; letter-spacing: 1px; }
            .header p { margin: 6px 0 0; color: #475569; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; }
            .meta { display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; margin-bottom: 25px; background: #f8fafc; padding: 14px 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin-bottom: 30px; }
            .card { border: 1px solid #cbd5e1; border-radius: 16px; padding: 20px; background: #fafafa; }
            .card label { display: block; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 1px; }
            .card .val { font-size: 24px; font-weight: 900; color: #0f172a; }
            .card.green { background: #ecfdf5; border-color: #a7f3d0; }
            .card.green .val { color: #059669; }
            .card.red { background: #fff1f2; border-color: #fecdd3; }
            .card.red .val { color: #e11d48; }
            .card.blue { background: #eff6ff; border-color: #bfdbfe; }
            .card.blue .val { color: #2563eb; }
            .table-sec { margin-top: 30px; }
            .table-sec h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #334155; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px 16px; font-size: 13px; text-align: left; }
            th { background: #f1f5f9; text-transform: uppercase; font-weight: 900; font-size: 11px; color: #475569; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; color: #64748b; }
            .sign { border-top: 2px solid #cbd5e1; width: 220px; text-align: center; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${shopName}</h1>
            <p>${title}</p>
          </div>
          <div class="meta">
            <span>Generated Date: ${dateStr}</span>
            <span>Period Filter: ${timeframe}</span>
            <span>Shop ID: ${shopId}</span>
          </div>
          <div class="grid">
            <div class="card blue">
              <label>Gross Sales Revenue (${timeframe})</label>
              <div class="val">RS ${salesVal.toLocaleString('en-PK')}</div>
            </div>
            <div class="card green">
              <label>Total Profit Earned (${timeframe})</label>
              <div class="val">RS ${profitVal.toLocaleString('en-PK')}</div>
            </div>
            <div class="card red">
              <label>Expenses & Return Loss (${timeframe})</label>
              <div class="val">RS ${lossVal.toLocaleString('en-PK')}</div>
            </div>
            <div class="card ${netVal >= 0 ? 'green' : 'red'}">
              <label>Net Earnings / Net Liquidity</label>
              <div class="val">RS ${netVal.toLocaleString('en-PK')}</div>
            </div>
          </div>
          <div class="table-sec">
            <h3>${timeLabel} Itemized Statement</h3>
            <table>
              <thead>
                <tr>
                  <th>Period Timeframe</th>
                  <th>Gross Sales</th>
                  <th>Profit Earned</th>
                  <th>Expenses & Returns</th>
                  <th>Net Liquidity</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background:#f0fdf4; font-weight:bold;">
                  <td><b>${timeLabel}</b></td>
                  <td>RS ${salesVal.toLocaleString('en-PK')}</td>
                  <td>RS ${profitVal.toLocaleString('en-PK')}</td>
                  <td>RS ${lossVal.toLocaleString('en-PK')}</td>
                  <td><b>RS ${netVal.toLocaleString('en-PK')}</b></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="footer">
            <div class="sign">Shop Admin / Manager Signature</div>
            <div class="sign">Yosafze Egg Traders Stamp</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeCategory !== 'All') params.set('category', activeCategory);
      const res = await fetch(`${API_CATALOG}/${shopId}?${params}`);
      const data = await res.json();
      if (res.ok) {
        setShop(data.shop);
        setItems(data.items);
        setCategories(data.categories);

        // Compute stats from catalog items
        const now = new Date();
        const totalStock = (data.items || []).filter(i => (i.stock || 0) > 0).length;
        const outOfStock = (data.items || []).filter(i => i.stock === 0).length;
        const lowStock = (data.items || []).filter(i => i.stock > 0 && i.stock <= (i.minStock || 5)).length;
        // Expired products: expiryDate is set and is before today
        const expiredProductsList = (data.items || []).filter(i => i.expiryDate && new Date(i.expiryDate) < now);

        // Stock Conversion: 1 Peti (Box) = 12 Trays = 360 Eggs | 1 Tray = 30 Eggs
        const totalStockEggs = (data.items || []).reduce((sum, i) => sum + (Number(i.stock) || 0), 0);
        const totalStockPetis = Number((totalStockEggs / 360).toFixed(1));
        const totalStockTrays = Math.round(totalStockEggs / 30);

        let totalInventoryValue = 0;
        (data.items || []).forEach(i => {
          const stk = Number(i.stock) || 0;
          const rate = Number(i.price) > 0 ? Number(i.price) : (Number(i.costPrice) || 0);
          const divisor = i.unitType === 'egg' ? 1 : i.unitType === 'tray' ? 30 : 360;
          totalInventoryValue += (stk * (rate / divisor));
        });

        // Purchases & Supplier Stats
        let totalPetisPurchased = 0;
        let totalPurchasesCount = 0;
        let totalPurchaseCost = 0;
        let cashPaidToSupplier = 0;
        let onlinePaidToSupplier = 0;
        let dueToSupplier = 0;

        (data.items || []).forEach(p => {
          const stockEggs = Number(p.stock || 0);
          const petiQty = Number(p.petiQuantity || 0);
          const trayQty = Number(p.trayQuantity || 0);
          const eggQty = Number(p.eggQuantity || 0);

          if (petiQty > 0 || trayQty > 0 || eggQty > 0) {
            totalPetisPurchased += petiQty + (trayQty / 12) + (eggQty / 360);
          } else if (stockEggs > 0) {
            totalPetisPurchased += stockEggs / 360;
          }

          const unitCost = Number(p.costPrice) > 0 ? Number(p.costPrice) : Number(p.price || 0);
          const unitDivisor = p.unitType === 'egg' ? 1 : p.unitType === 'tray' ? 30 : 360;

          const cost = Number(p.totalPurchaseCost) > 0
            ? Number(p.totalPurchaseCost)
            : (petiQty > 0 ? petiQty * unitCost : (stockEggs > 0 ? stockEggs * (unitCost / unitDivisor) : 0));

          const hasReceipt = !!(
            (p.paymentReceipt && typeof p.paymentReceipt === 'string' && p.paymentReceipt.trim()) ||
            (p.receipt && typeof p.receipt === 'string' && p.receipt.trim()) ||
            (p.paymentProof && typeof p.paymentProof === 'string' && p.paymentProof.trim())
          );

          const pMethodLower = String(p.paymentMethod || 'Cash').trim().toLowerCase();

          const isOnline = p.isOnlinePayment === true || hasReceipt || (
            pMethodLower.includes('bank') ||
            pMethodLower.includes('easy') ||
            pMethodLower.includes('jazz') ||
            pMethodLower.includes('online') ||
            pMethodLower.includes('cheque') ||
            pMethodLower.includes('transfer') ||
            pMethodLower.includes('card')
          );

          const isCredit = !isOnline && (
            pMethodLower.includes('credit') ||
            pMethodLower.includes('due') ||
            pMethodLower.includes('qaraz')
          );

          let due = 0;
          let paid = 0;

          if (p.amountPaidToSupplier !== undefined && p.amountPaidToSupplier !== null && p.amountPaidToSupplier !== '') {
            paid = Number(p.amountPaidToSupplier);
            due = Math.max(0, cost - paid);
          } else if (p.dueAmountToSupplier !== undefined && p.dueAmountToSupplier !== null && Number(p.dueAmountToSupplier) > 0) {
            due = Number(p.dueAmountToSupplier);
            paid = Math.max(0, cost - due);
          } else if (isCredit) {
            paid = 0;
            due = cost;
          } else {
            paid = cost;
            due = 0;
          }

          totalPurchaseCost += cost;
          dueToSupplier += due;
          if (isOnline) {
            onlinePaidToSupplier += paid;
          } else {
            cashPaidToSupplier += paid;
          }

          if (p.supplierName || paid > 0 || due > 0 || hasReceipt || petiQty > 0) {
            totalPurchasesCount++;
          }
        });

        let currentDmgList = damagedProductsList;
        if (!currentDmgList || currentDmgList.length === 0) {
          try {
            const local = localStorage.getItem(`nexflow_damaged_${shopId}`);
            currentDmgList = local ? JSON.parse(local) : [];
          } catch(e) {}
        }
        let totalDamagedEggs = 0;
        (currentDmgList || []).forEach(x => {
          const qty = Number(x.quantity || 0);
          const u = String(x.unitType || x.unit || 'egg').toLowerCase();
          if (x.deductedEggs && Number(x.deductedEggs) > 0) {
            totalDamagedEggs += Number(x.deductedEggs);
          } else if (u === 'peti') {
            totalDamagedEggs += qty * 360;
          } else if (u === 'tray') {
            totalDamagedEggs += qty * 30;
          } else {
            totalDamagedEggs += qty;
          }
        });
        const totalDamagedPetis = Number((totalDamagedEggs / 360).toFixed(1));
        const totalDamagedTrays = Math.round(totalDamagedEggs / 30);

        const netPetisPurchased = Math.max(0, totalPetisPurchased - totalDamagedPetis);
        const netTraysPurchased = Math.max(0, Math.round(totalPetisPurchased * 12) - totalDamagedTrays);
        const netEggsPurchased = Math.max(0, Math.round(totalPetisPurchased * 360) - totalDamagedEggs);

        setDashStats(prev => ({
          ...prev,
          totalProducts: (data.items || []).length,
          totalStock,
          totalStockEggs,
          totalStockPetis,
          totalStockTrays,
          totalInventoryValue: Math.round(totalInventoryValue),
          outOfStock,
          lowStock,
          expiredProducts: expiredProductsList.length,
          expiredProductsList,
          totalPetisPurchased: Number(netPetisPurchased.toFixed(1)),
          totalTraysPurchased: netTraysPurchased,
          totalEggsPurchased: netEggsPurchased,
          totalDamagedPetis,
          totalDamagedTrays,
          totalDamagedEggs,
          totalPurchasesCount,
          totalPurchaseCost: Math.round(totalPurchaseCost),
          cashPaidToSupplier: Math.round(cashPaidToSupplier),
          bankPaidToSupplier: Math.round(onlinePaidToSupplier),
          onlinePaidToSupplier: Math.round(onlinePaidToSupplier),
          dueToSupplier: Math.round(dueToSupplier),
        }));
      }
    } catch (e) { }
    setLoading(false);
  };

  // Fetch customer-specific or admin stats
  const fetchDashboardStats = async () => {
    if (!shopId) return;
    const token = localStorage.getItem('nexflow_token') || sessionStorage.getItem('nexflow_token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      if (isAdminUser && token) {
        // Fetch all three data sources in parallel
        const [custRes, salesRes, ordersRes] = await Promise.all([
          fetch(`/api/customers/all?shopId=${shopId}`).catch(() => null),
          fetch(`/api/sales?shopId=${shopId}`, { headers: authHeaders }).catch(() => null),
          fetch(`/api/checkout/orders?shopId=${shopId}`, { headers: authHeaders }).catch(() => null),
        ]);

        // ── Customers ──
        if (custRes?.ok) {
          const custData = await custRes.json();
          setDashStats(prev => ({ ...prev, totalCustomers: custData.count || 0 }));
        }

        // ── POS Sales ──
        let posSalesList = [];
        if (salesRes?.ok) {
          const salesData = await salesRes.json();
          const rawSales = Array.isArray(salesData) ? salesData : [];
          posSalesList = rawSales.filter(s => !s.shopId || String(s.shopId) === String(shopId));
        }

        // ── EasyPaisa / Customer Orders ──
        let checkoutOrders = [];
        if (ordersRes?.ok) {
          const ordData = await ordersRes.json();
          const rawOrders = Array.isArray(ordData.orders) ? ordData.orders : [];
          checkoutOrders = rawOrders.filter(o => !o.shopId || String(o.shopId) === String(shopId));
        }

        // ── Combine & Compute Revenue ──
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const thisYear = new Date(today.getFullYear(), 0, 1);

        // Valid POS sales (not returned/cancelled)
        const validPOS = posSalesList.filter(s => s.status !== 'returned' && s.status !== 'cancelled');
        const posRevenue = (dateFrom) => validPOS
          .filter(x => new Date(x.saleDate) >= dateFrom)
          .reduce((sum, x) => sum + (x.totalAmount || 0), 0);

        const posProfit = (dateFrom) => validPOS
          .filter(x => new Date(x.saleDate) >= dateFrom)
          .reduce((sum, x) => sum + (x.totalProfit || 0), 0);

        // Valid EasyPaisa orders: PAID only (approved by admin) for revenue
        const paidOrders = checkoutOrders.filter(o => o.paymentStatus === 'PAID');
        const orderRevenue = (dateFrom) => paidOrders
          .filter(x => new Date(x.createdAt) >= dateFrom)
          .reduce((sum, x) => sum + (x.totalAmount || 0), 0);

        const orderProfit = (dateFrom) => paidOrders
          .filter(x => new Date(x.createdAt) >= dateFrom)
          .reduce((sum, x) => sum + Math.round((x.totalAmount || 0) * 0.2), 0);

        const totalPosRevenue = validPOS.reduce((s, x) => s + (x.totalAmount || 0), 0);
        const totalOrderRevenue = paidOrders.reduce((s, x) => s + (x.totalAmount || 0), 0);

        const todayOrdersCount = validPOS.filter(x => new Date(x.saleDate) >= today).length + paidOrders.filter(x => new Date(x.createdAt) >= today).length;
        const monthlyOrdersCount = validPOS.filter(x => new Date(x.saleDate) >= thisMonth).length + paidOrders.filter(x => new Date(x.createdAt) >= thisMonth).length;
        const yearlyOrdersCount = validPOS.filter(x => new Date(x.saleDate) >= thisYear).length + paidOrders.filter(x => new Date(x.createdAt) >= thisYear).length;

        // Profit & Loss
        const returnedSales = posSalesList.filter(s => s.status === 'returned' || s.status === 'cancelled');
        const posLoss = (dateFrom) => returnedSales
          .filter(x => new Date(x.saleDate || x.createdAt) >= dateFrom)
          .reduce((sum, x) => sum + (x.totalAmount || 0), 0);

        const failedOrders = checkoutOrders.filter(o => o.paymentStatus === 'FAILED');
        const orderLoss = (dateFrom) => failedOrders
          .filter(x => new Date(x.createdAt) >= dateFrom)
          .reduce((sum, x) => sum + (x.totalAmount || 0), 0);

        const totalProfitSum = validPOS.reduce((s, x) => s + (x.totalProfit || 0), 0) + paidOrders.reduce((s, x) => s + Math.round((x.totalAmount || 0) * 0.2), 0);
        const totalLossSum = returnedSales.reduce((s, x) => s + (x.totalAmount || 0), 0) + failedOrders.reduce((s, x) => s + (x.totalAmount || 0), 0);

        // ── Manual Expenses Calculation ──
        let currentExpList = expensesList;
        if (!currentExpList || currentExpList.length === 0) {
          const local = localStorage.getItem(`nexflow_expenses_${shopId}`);
          currentExpList = local ? JSON.parse(local) : [];
        }

        const manualExpenseSum = (dateFrom) => (currentExpList || [])
          .filter(x => new Date(x.expenseDate || x.createdAt) >= dateFrom)
          .reduce((sum, x) => sum + (Number(x.amount) || 0), 0);

        const todayExpenseSum = manualExpenseSum(today);
        const monthlyExpenseSum = manualExpenseSum(thisMonth);
        const totalManualExpensesSum = (currentExpList || []).reduce((sum, x) => sum + (Number(x.amount) || 0), 0);

        // ── Damaged Products Calculation ──
        let currentDmgList = damagedProductsList;
        if (!currentDmgList || currentDmgList.length === 0) {
          const local = localStorage.getItem(`nexflow_damaged_${shopId}`);
          currentDmgList = local ? JSON.parse(local) : [];
        }

        const damagedLossSum = (dateFrom) => (currentDmgList || [])
          .filter(x => new Date(x.damageDate || x.createdAt) >= dateFrom)
          .reduce((sum, x) => sum + (Number(x.totalLoss) || 0), 0);

        const totalDamagedLossSum = (currentDmgList || []).reduce((sum, x) => sum + (Number(x.totalLoss) || 0), 0);

        let totalDamagedEggs = 0;
        (currentDmgList || []).forEach(x => {
          const e = Number(x.eggQuantity || x.quantity || 0);
          const p = Number(x.petiQuantity || 0);
          const t = Number(x.trayQuantity || 0);
          totalDamagedEggs += (p * 360) + (t * 30) + e;
        });
        const totalDamagedPetis = Number((totalDamagedEggs / 360).toFixed(1));
        const totalDamagedTrays = Math.round(totalDamagedEggs / 30);

        setDashStats(prev => ({
          ...prev,
          totalOrders: posSalesList.length + checkoutOrders.length,
          todayOrdersCount,
          monthlyOrdersCount,
          yearlyOrdersCount,
          totalRevenue: totalPosRevenue + totalOrderRevenue,
          todaySales: posRevenue(today) + orderRevenue(today),
          monthlySales: posRevenue(thisMonth) + orderRevenue(thisMonth),
          yearlySales: posRevenue(thisYear) + orderRevenue(thisYear),
          todayProfit: posProfit(today) + orderProfit(today),
          monthlyProfit: posProfit(thisMonth) + orderProfit(thisMonth),
          yearlyProfit: posProfit(thisYear) + orderProfit(thisYear),
          todayExpense: todayExpenseSum,
          monthlyExpense: monthlyExpenseSum,
          totalExpense: totalManualExpensesSum,
          todayLoss: posLoss(today) + orderLoss(today) + todayExpenseSum,
          monthlyLoss: posLoss(thisMonth) + orderLoss(thisMonth) + monthlyExpenseSum,
          yearlyLoss: posLoss(thisYear) + orderLoss(thisYear) + manualExpenseSum(thisYear),
          todayDamagedLoss: damagedLossSum(today),
          monthlyDamagedLoss: damagedLossSum(thisMonth),
          yearlyDamagedLoss: damagedLossSum(thisYear),
          totalDamagedEggs,
          totalDamagedPetis,
          totalDamagedTrays,
          totalDamagedLoss: totalDamagedLossSum,
          totalProfit: totalProfitSum,
          totalLoss: totalLossSum + totalManualExpensesSum,
        }));

      } else if (!isAdminUser) {
        // For customer: fetch their own orders using customerId as token
        const customerId = customer?._id || customer?.customerId;
        if (!customerId) return;
        const ordersRes = await fetch(`/api/checkout/orders`, {
          headers: { Authorization: `Bearer ${customerId}` }
        }).catch(() => null);
        if (ordersRes?.ok) {
          const ordData = await ordersRes.json();
          const myOrders = (ordData.orders || []).filter(
            o => String(o.customerId?._id || o.customerId) === String(customerId)
          );
          const spent = myOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
          setDashStats(prev => ({ ...prev, totalOrders: myOrders.length, totalSpent: spent }));
        }
      }
    } catch (e) {
      console.error('Dashboard stats fetch error:', e);
    }
  };

  useEffect(() => { fetchCatalog(); }, [shopId, search, activeCategory]);
  useEffect(() => {
    fetchExpenses();
    fetchDamagedProducts();
    fetchDashboardStats();
    const timer = setInterval(fetchDashboardStats, 8000);
    return () => clearInterval(timer);
  }, [shopId, customer, isAdminUser, activeView]);

  // Handle payment redirects (e.g. from Stripe)
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('payment') === 'success') {
      setAddedMsg('Payment Successful! Order Confirmed.');
      // clear URL
      window.history.replaceState(null, '', window.location.pathname);
    }
    if (query.get('payment') === 'cancel') {
      setAddedMsg('Payment Canceled.');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  if (!customer && !user) {
    return <CustomerAuthView shopInfo={shop} />;
  }

  const currency = shop?.currency || 'Rs.';

  const handleAddToCart = async (item) => {
    try {
      await addToCart(item, 1);
      setAddedMsg(`"${item.name}" added to cart!`);
      setTimeout(() => setAddedMsg(''), 2500);
    } catch (err) {
      alert(err.message);
    }
  };


  return (
    <div className={`flex flex-col h-[100dvh] overflow-hidden ${isAdminUser ? 'bg-slate-100 text-zinc-900' : 'bg-[#0f172a] text-white'} w-full tracking-tight`}>
      {/* Cart Drawer */}
      <CartDrawer currency={currency} />

      {/* Notification Toast */}
      {addedMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-[#1B3817] text-white px-6 py-3 rounded-2xl font-black text-xs shadow-2xl border border-white/20 flex items-center gap-2.5 animate-in slide-in-from-top duration-300 uppercase tracking-wider">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          {addedMsg}
        </div>
      )}

      {/* Top Navbar — Luxury Dark Black-Green Gradient */}
      <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#071306] via-[#152F12] to-[#0A1A08] backdrop-blur-xl border-b-4 border-b-blue-500 shadow-[0_15px_50px_rgba(37,99,235,0.9),_0_10px_30px_rgba(59,130,246,0.85)] transition-all duration-300">
        <div className="flex items-center justify-between h-20 gap-4 px-4 sm:px-6 max-w-[1600px] mx-auto">

          {/* Left branding */}
          <div className="flex items-center gap-4">
            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-2.5 -ml-2 text-white bg-[#0F220C] hover:bg-gradient-to-r hover:from-blue-600 hover:to-[#0F220C] hover:border-t-blue-300 rounded-xl transition-all duration-300 ease-out shadow-[0_6px_16px_rgba(37,99,235,0.55),_0_2px_5px_rgba(30,58,138,0.7)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.85),_0_4px_12px_rgba(37,99,235,0.7)] border-t border-t-white/30 border-b-4 border-b-[#071306] hover:scale-110 hover:-translate-y-0.5 active:translate-y-[2px] active:scale-95 cursor-pointer md:hidden"
              aria-label="Toggle Mobile Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Desktop Toggle */}
            <button
              onClick={() => setIsDesktopOpen(!isDesktopOpen)}
              className="p-2.5 -ml-2 text-white bg-[#0F220C] hover:bg-gradient-to-r hover:from-blue-600 hover:to-[#0F220C] hover:border-t-blue-300 rounded-xl transition-all duration-300 ease-out shadow-[0_6px_16px_rgba(37,99,235,0.55),_0_2px_5px_rgba(30,58,138,0.7)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.85),_0_4px_12px_rgba(37,99,235,0.7)] border-t border-t-white/30 border-b-4 border-b-[#071306] hover:scale-110 hover:-translate-y-0.5 active:translate-y-[2px] active:scale-95 cursor-pointer hidden md:block"
              aria-label="Toggle Desktop Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <button onClick={() => navigate('/shop')} className="p-2.5 bg-[#0F220C] hover:bg-gradient-to-r hover:from-blue-600 hover:to-[#0F220C] hover:border-t-blue-300 text-white rounded-xl transition-all duration-300 ease-out shadow-[0_6px_16px_rgba(37,99,235,0.55),_0_2px_5px_rgba(30,58,138,0.7)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.85),_0_4px_12px_rgba(37,99,235,0.7)] border-t border-t-white/30 border-b-4 border-b-[#071306] hover:scale-110 hover:-translate-y-0.5 active:translate-y-[2px] active:scale-95 cursor-pointer hidden md:block" title="Back to Stores">
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 group cursor-pointer">
              <button
                onClick={() => {
                  setActiveView('dashboard');
                  const mainContent = document.getElementById('main-store-content');
                  if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="relative bg-white rounded-xl w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(37,99,235,0.6),_0_2px_6px_rgba(30,58,138,0.5)] overflow-hidden border-2 border-white/80 ring-2 ring-blue-500/60 group-hover:scale-110 group-hover:rotate-3 group-hover:border-blue-300 group-hover:ring-blue-400 group-hover:shadow-[0_12px_32px_rgba(59,130,246,0.85),_0_4px_12px_rgba(37,99,235,0.7)] transition-all duration-300 ease-out p-0.5"
                title={isAdminUser ? "Go to Shop Admin Dashboard" : "Go to Customer Dashboard"}
              >
                {shop?.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <img src={companyLogo} alt="Yousafzai Agri Foods" className="w-full h-full object-cover rounded-lg" />
                )}
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-black tracking-tighter text-yellow-300 group-hover:text-amber-200 uppercase italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] leading-none truncate max-w-[140px] sm:max-w-xs md:max-w-md transition-all duration-300">{shop?.name || 'Customer Store'}</h1>
                {shop?.address && (
                  <p className="text-[10px] font-black text-emerald-300 group-hover:text-emerald-200 flex items-center gap-1 mt-1 truncate max-w-[140px] sm:max-w-xs md:max-w-md uppercase tracking-wider transition-all duration-300">
                    <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{shop.address}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Center Search Input */}
          <div className="flex-1 flex justify-center max-w-md mx-auto hidden sm:flex">
            <div className="relative w-full group">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                placeholder="Search products..."
                className="w-full bg-white/95 backdrop-blur-sm rounded-full py-3 flex items-center pl-6 pr-14 text-sm font-black text-gray-900 placeholder:text-gray-500 focus:bg-white focus:ring-4 focus:ring-blue-400/50 hover:bg-white transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.15),_0_8px_24px_rgba(37,99,235,0.55),_0_2px_8px_rgba(30,58,138,0.4)] hover:shadow-[0_12px_36px_rgba(59,130,246,0.85)] border-b-4 border-blue-600 focus:border-blue-500"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-[#1B3817] to-[#0F220C] hover:from-blue-600 hover:to-blue-800 text-white p-2 rounded-full transition-all duration-300 ease-out shadow-[0_6px_14px_rgba(37,99,235,0.6)] hover:shadow-[0_10px_25px_rgba(59,130,246,0.85)] border-t border-t-white/30 border-b-2 border-b-[#071306] hover:scale-115 hover:-rotate-12 active:scale-95 cursor-pointer">
                <Search className="w-4 h-4" />
              </button>

              {/* Desktop Search Dropdown */}
              {search.trim() && showSearchDropdown && (
                <div className="absolute top-full mt-2 w-full bg-[#1E293B] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {items.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto py-2 scrollbar-hide">
                      {items.map(item => (
                        <button
                          key={item._id}
                          onClick={() => { setSelectedItem(item); setSearch(''); setShowSearchDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left border-b border-slate-700/50 last:border-0"
                        >
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt={item.name} className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-700" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white truncate uppercase italic">{item.name}</p>
                            <p className="text-[10px] text-emerald-400 font-bold">{currency} {item.price.toLocaleString()}</p>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                            Stock: {item.stock}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                      No matching products found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Cart & User Badges */}
          <div className="flex items-center gap-3">
            {canBuy && (
              <button
                onClick={() => setOrderOpen(true)}
                className="relative p-2.5 sm:px-4 bg-gradient-to-r from-[#1B3817] to-[#0F220C] hover:from-blue-600 hover:to-[#1B3817] text-white rounded-full transition-all duration-300 ease-out border-t border-white/30 hover:border-t-blue-300 border-b-4 border-b-[#071306] shadow-[0_8px_20px_rgba(37,99,235,0.55),_0_2px_6px_rgba(30,58,138,0.7)] hover:shadow-[0_12px_32px_rgba(59,130,246,0.85),_0_4px_14px_rgba(37,99,235,0.7)] hover:scale-108 hover:-translate-y-0.5 active:translate-y-[2px] flex items-center justify-center gap-2 cursor-pointer"
                title="View My Orders & Payment Status"
              >
                <Truck className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">My Orders</span>
              </button>
            )}

            {canBuy ? (
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-3 bg-gradient-to-r from-[#1B3817] to-[#0F220C] hover:from-blue-600 hover:to-blue-800 text-white rounded-full transition-all duration-300 ease-out border-t border-white/30 hover:border-t-blue-200 border-b-4 border-b-[#071306] shadow-[0_8px_20px_rgba(37,99,235,0.55),_0_2px_6px_rgba(30,58,138,0.7)] hover:shadow-[0_12px_32px_rgba(59,130,246,0.85),_0_4px_14px_rgba(37,99,235,0.7)] hover:scale-115 hover:-translate-y-1 active:scale-95 flex items-center justify-center cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-black h-5.5 w-5.5 rounded-full flex items-center justify-center border-2 border-[#0F220C] shadow-[0_3px_8px_rgba(0,0,0,0.5)] animate-bounce">
                    {cartCount}
                  </span>
                )}
              </button>
            ) : isAdminUser ? (
              <button
                onClick={() => setActiveView('walkin')}
                className="relative p-3 bg-gradient-to-r from-[#1B3817] to-[#0F220C] hover:from-blue-600 hover:to-blue-800 text-white rounded-full transition-all duration-300 ease-out border-t border-white/30 hover:border-t-blue-200 border-b-4 border-b-[#071306] shadow-[0_8px_20px_rgba(37,99,235,0.55),_0_2px_6px_rgba(30,58,138,0.7)] hover:shadow-[0_12px_32px_rgba(59,130,246,0.85),_0_4px_14px_rgba(37,99,235,0.7)] hover:scale-115 hover:-translate-y-1 active:scale-95 flex items-center justify-center cursor-pointer"
                title="View Walk-in Customer Bill Cart"
              >
                <Receipt className="w-5 h-5 text-emerald-400" />
                {walkInCart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-black h-5.5 w-5.5 rounded-full flex items-center justify-center border-2 border-[#0F220C] shadow-[0_3px_8px_rgba(0,0,0,0.5)] animate-bounce">
                    {walkInCart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Main Area with Left Sidebar & Content */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Mobile Overlay */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* ─── Luxury Dark Green Sidebar (Matches Navbar) with 3D Glowing Shadow ─────────────────────── */}
        <aside
          className={`absolute md:relative top-0 h-full flex flex-col bg-gradient-to-b from-[#071306] via-[#152F12] to-[#0A1A08] text-white backdrop-blur-xl transition-all duration-300 ease-in-out border-r-4 border-r-blue-500 z-[100] md:z-20 overflow-hidden shadow-[18px_0_50px_rgba(37,99,235,0.9),_10px_0_30px_rgba(59,130,246,0.85),_4px_0_15px_rgba(147,197,253,0.7)] w-56 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            } ${!isDesktopOpen ? 'md:-ml-56' : 'md:ml-0'
            }`}
        >
          {/* User Profile Box */}
          <div className="mx-4 mb-6 mt-4 rounded-2xl flex items-center px-3.5 py-3 gap-3 border border-white/10 bg-white/5 backdrop-blur-sm shadow-inner">
            <div className="relative flex-shrink-0">
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#111827] rounded-full shadow-sm" />
              <UserCircle2 className="w-8 h-8 text-green-300" />
            </div>
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
              <span className="text-xs font-bold text-white truncate leading-tight" title={user?.fullName || customer?.fullName || 'User'}>
                {user?.fullName || user?.username || customer?.fullName || customer?.email || 'Guest User'}
              </span>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider mt-0.5 truncate">
                {user?.role === 'super_admin' ? 'SUPER ADMIN' : (user?.role === 'shop_admin' || customer?.role === 'shop_admin' || isShopAdmin()) ? 'SHOP ADMIN' : customer ? 'CUSTOMER' : 'GUEST'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-1 space-y-3">

            {/* Dashboard Link - Admin Only */}
            {isAdminUser && (
              <div>
                <p className="px-5 text-[11px] font-black text-emerald-200 mb-1.5 tracking-widest uppercase">Overview</p>
                <div className="space-y-1">
                  <button
                    onClick={() => { setActiveView('dashboard'); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 group px-3.5 py-2 mx-3 rounded-xl text-[13.5px] font-bold tracking-wide transition-all duration-300 ease-out max-w-[200px] ${activeView === 'dashboard'
                      ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black border-t border-t-amber-200 border-b-4 border-b-amber-800 shadow-[0_8px_22px_rgba(245,158,11,0.6)] translate-x-1"
                      : "text-white hover:text-zinc-950 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border-t border-t-transparent hover:border-t-amber-200 border-b-4 border-b-transparent hover:border-b-amber-800 hover:shadow-[0_8px_22px_rgba(245,158,11,0.6)] hover:translate-x-1.5 hover:scale-105"
                      }`}
                  >
                    <LayoutDashboard className="w-4 h-4 transition-colors group-hover:text-zinc-950" />
                    <span>Dashboard</span>
                  </button>
                </div>
              </div>
            )}

            {/* Shop Admin POS & Sales Section */}
            {isAdminUser && (
              <div>
                <p className="px-5 text-[11px] font-black text-emerald-200 mb-1.5 tracking-widest uppercase">Shop POS & Billing</p>
                <div className="space-y-1">
                  <button
                    onClick={() => { setActiveView('walkin'); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 group px-3.5 py-2 mx-3 rounded-xl text-[13.5px] font-bold tracking-wide transition-all duration-300 ease-out max-w-[200px] ${activeView === 'walkin'
                      ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black border-t border-t-amber-200 border-b-4 border-b-amber-800 shadow-[0_8px_22px_rgba(245,158,11,0.6)] translate-x-1"
                      : "text-white hover:text-zinc-950 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border-t border-t-transparent hover:border-t-amber-200 border-b-4 border-b-transparent hover:border-b-amber-800 hover:shadow-[0_8px_22px_rgba(245,158,11,0.6)] hover:translate-x-1.5 hover:scale-105"
                      }`}
                  >
                    <Receipt className="w-4 h-4 text-emerald-400 group-hover:text-zinc-950 transition-colors" />
                    <span className="truncate">Walk-in Sale / POS</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('sales'); fetchShopSales(); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 group px-3.5 py-2 mx-3 rounded-xl text-[13.5px] font-bold tracking-wide transition-all duration-300 ease-out max-w-[200px] ${activeView === 'sales'
                      ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black border-t border-t-amber-200 border-b-4 border-b-amber-800 shadow-[0_8px_22px_rgba(245,158,11,0.6)] translate-x-1"
                      : "text-white hover:text-zinc-950 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border-t border-t-transparent hover:border-t-amber-200 border-b-4 border-b-transparent hover:border-b-amber-800 hover:shadow-[0_8px_22px_rgba(245,158,11,0.6)] hover:translate-x-1.5 hover:scale-105"
                      }`}
                  >
                    <DollarSign className="w-4 h-4 text-amber-400 group-hover:text-zinc-950 transition-colors" />
                    <span className="truncate">Sales & Bills</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('orders'); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 group px-3.5 py-2 mx-3 rounded-xl text-[13.5px] font-bold tracking-wide transition-all duration-300 ease-out max-w-[200px] ${activeView === 'orders'
                      ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black border-t border-t-amber-200 border-b-4 border-b-amber-800 shadow-[0_8px_22px_rgba(245,158,11,0.6)] translate-x-1"
                      : "text-white hover:text-zinc-950 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border-t border-t-transparent hover:border-t-amber-200 border-b-4 border-b-transparent hover:border-b-amber-800 hover:shadow-[0_8px_22px_rgba(245,158,11,0.6)] hover:translate-x-1.5 hover:scale-105"
                      }`}
                  >
                    <Truck className="w-4 h-4 text-emerald-400 group-hover:text-zinc-950 transition-colors" />
                    <span className="truncate">EasyPaisa & Orders</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('purchases'); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 group px-3.5 py-2 mx-3 rounded-xl text-[13.5px] font-bold tracking-wide transition-all duration-300 ease-out max-w-[200px] ${activeView === 'purchases'
                      ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black border-t border-t-amber-200 border-b-4 border-b-amber-800 shadow-[0_8px_22px_rgba(245,158,11,0.6)] translate-x-1"
                      : "text-white hover:text-zinc-950 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border-t border-t-transparent hover:border-t-amber-200 border-b-4 border-b-transparent hover:border-b-amber-800 hover:shadow-[0_8px_22px_rgba(245,158,11,0.6)] hover:translate-x-1.5 hover:scale-105"
                      }`}
                  >
                    <Truck className="w-4 h-4 text-teal-400 group-hover:text-zinc-950 transition-colors" />
                    <span className="truncate">Purchases & Restocks</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('registered-customers'); fetchRegisteredCustomers(); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 group px-3.5 py-2 mx-3 rounded-xl text-[13.5px] font-bold tracking-wide transition-all duration-300 ease-out max-w-[200px] ${activeView === 'registered-customers'
                      ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black border-t border-t-amber-200 border-b-4 border-b-amber-800 shadow-[0_8px_22px_rgba(245,158,11,0.6)] translate-x-1"
                      : "text-white hover:text-zinc-950 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border-t border-t-transparent hover:border-t-amber-200 border-b-4 border-b-transparent hover:border-b-amber-800 hover:shadow-[0_8px_22px_rgba(245,158,11,0.6)] hover:translate-x-1.5 hover:scale-105"
                      }`}
                  >
                    <Users className="w-4 h-4 text-indigo-400 group-hover:text-zinc-950 transition-colors" />
                    <span className="truncate">Registered Customers</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('report-sales'); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 group px-3.5 py-2 mx-3 rounded-xl text-[13.5px] font-bold tracking-wide transition-all duration-300 ease-out max-w-[200px] ${activeView === 'report-sales'
                      ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black border-t border-t-amber-200 border-b-4 border-b-amber-800 shadow-[0_8px_22px_rgba(245,158,11,0.6)] translate-x-1"
                      : "text-white hover:text-zinc-950 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border-t border-t-transparent hover:border-t-amber-200 border-b-4 border-b-transparent hover:border-b-amber-800 hover:shadow-[0_8px_22px_rgba(245,158,11,0.6)] hover:translate-x-1.5 hover:scale-105"
                      }`}
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:text-zinc-950 transition-colors" />
                    <span className="truncate">Sales Report</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('report-profit'); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 group px-3.5 py-2 mx-3 rounded-xl text-[13.5px] font-bold tracking-wide transition-all duration-300 ease-out max-w-[200px] ${activeView === 'report-profit'
                      ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black border-t border-t-amber-200 border-b-4 border-b-amber-800 shadow-[0_8px_22px_rgba(245,158,11,0.6)] translate-x-1"
                      : "text-white hover:text-zinc-950 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border-t border-t-transparent hover:border-t-amber-200 border-b-4 border-b-transparent hover:border-b-amber-800 hover:shadow-[0_8px_22px_rgba(245,158,11,0.6)] hover:translate-x-1.5 hover:scale-105"
                      }`}
                  >
                    <DollarSign className="w-4 h-4 text-green-400 group-hover:text-zinc-950 transition-colors" />
                    <span className="truncate">Profit Report</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('report-expenses'); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 group px-3.5 py-2 mx-3 rounded-xl text-[13.5px] font-bold tracking-wide transition-all duration-300 ease-out max-w-[200px] ${activeView === 'report-expenses'
                      ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black border-t border-t-amber-200 border-b-4 border-b-amber-800 shadow-[0_8px_22px_rgba(245,158,11,0.6)] translate-x-1"
                      : "text-white hover:text-zinc-950 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border-t border-t-transparent hover:border-t-amber-200 border-b-4 border-b-transparent hover:border-b-amber-800 hover:shadow-[0_8px_22px_rgba(245,158,11,0.6)] hover:translate-x-1.5 hover:scale-105"
                      }`}
                  >
                    <FileText className="w-4 h-4 text-rose-400 group-hover:text-zinc-950 transition-colors" />
                    <span className="truncate">Expenses Report</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('damaged-products'); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 group px-3.5 py-2 mx-3 rounded-xl text-[13.5px] font-bold tracking-wide transition-all duration-300 ease-out max-w-[200px] ${activeView === 'damaged-products'
                      ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black border-t border-t-amber-200 border-b-4 border-b-amber-800 shadow-[0_8px_22px_rgba(245,158,11,0.6)] translate-x-1"
                      : "text-white hover:text-zinc-950 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border-t border-t-transparent hover:border-t-amber-200 border-b-4 border-b-transparent hover:border-b-amber-800 hover:shadow-[0_8px_22px_rgba(245,158,11,0.6)] hover:translate-x-1.5 hover:scale-105"
                      }`}
                  >
                    <PackageX className="w-4 h-4 text-amber-400 group-hover:text-zinc-950 transition-colors" />
                    <span className="truncate">Damaged Stock</span>
                  </button>
                </div>
              </div>
            )}

            {/* Products Section */}
            <div>
              <p className="px-5 text-[11px] font-black text-emerald-200 mb-1.5 tracking-widest uppercase">Catalog</p>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveView('products'); setActiveCategory('All'); setIsMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 group px-3.5 py-2 mx-3 rounded-xl text-[13.5px] font-bold tracking-wide transition-all duration-300 ease-out max-w-[200px] ${activeView === 'products' && activeCategory === 'All'
                    ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black border-t border-t-amber-200 border-b-4 border-b-amber-800 shadow-[0_8px_22px_rgba(245,158,11,0.6)] translate-x-1"
                    : "text-white hover:text-zinc-950 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border-t border-t-transparent hover:border-t-amber-200 border-b-4 border-b-transparent hover:border-b-amber-800 hover:shadow-[0_8px_22px_rgba(245,158,11,0.6)] hover:translate-x-1.5 hover:scale-105"
                    }`}
                >
                  <Store className="w-4 h-4 text-white group-hover:text-zinc-950 transition-colors" />
                  <span>All Products</span>
                </button>
              </div>
            </div>

            {/* Categories */}
            {categories.filter(c => c !== 'All').length > 0 && (
              <div>
                <p className="px-5 text-[11px] font-black text-emerald-200 mb-1.5 tracking-widest uppercase">Categories</p>
                <div className="space-y-1">
                  {categories.filter(c => c !== 'All').map(cat => {
                    const active = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => { setActiveView('products'); setActiveCategory(cat); setIsMobileOpen(false); }}
                        className={`w-full flex items-center gap-2.5 group px-3.5 py-2 mx-3 rounded-xl text-[13.5px] font-bold tracking-wide transition-all duration-300 ease-out max-w-[200px] ${activeView === 'products' && active
                          ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 font-black border-t border-t-amber-200 border-b-4 border-b-amber-800 shadow-[0_8px_22px_rgba(245,158,11,0.6)] translate-x-1"
                          : "text-white hover:text-zinc-950 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border-t border-t-transparent hover:border-t-amber-200 border-b-4 border-b-transparent hover:border-b-amber-800 hover:shadow-[0_8px_22px_rgba(245,158,11,0.6)] hover:translate-x-1.5 hover:scale-105"
                          }`}
                      >
                        <img src="/egg.png" alt="egg" className={`w-4 h-4 object-contain shrink-0 transition-all ${active ? 'brightness-125 scale-110' : 'brightness-90 group-hover:brightness-0'}`} />
                        <span className="capitalize truncate text-white">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cart Quick Access */}
            {canBuy && (
              <div>
                <p className="px-5 text-[11px] font-black text-emerald-200 mb-1.5 tracking-widest uppercase">Cart</p>
                <div className="space-y-1">
                  <button
                    onClick={() => { setCartOpen(true); setIsMobileOpen(false); }}
                    className="w-full flex items-center gap-3 group px-3.5 py-2 mx-3 rounded-xl text-[13.5px] font-bold tracking-wide text-white hover:text-zinc-950 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border-t border-t-transparent hover:border-t-amber-200 border-b-4 border-b-transparent hover:border-b-amber-800 hover:shadow-[0_8px_22px_rgba(245,158,11,0.6)] hover:translate-x-1.5 hover:scale-105 transition-all duration-300 ease-out max-w-[200px]"
                  >
                    <ShoppingCart className="w-4 h-4 text-white group-hover:text-zinc-950 transition-colors" />
                    <span>My Cart ({cartCount})</span>
                  </button>

                  <button
                    onClick={() => { setOrderOpen(true); setIsMobileOpen(false); }}
                    className="w-full flex items-center gap-3 group px-3.5 py-2 mx-3 rounded-xl text-[13.5px] font-bold tracking-wide text-white hover:text-zinc-950 hover:bg-gradient-to-r hover:from-amber-400 hover:to-amber-500 border-t border-t-transparent hover:border-t-amber-200 border-b-4 border-b-transparent hover:border-b-amber-800 hover:shadow-[0_8px_22px_rgba(245,158,11,0.6)] hover:translate-x-1.5 hover:scale-105 transition-all duration-300 ease-out max-w-[200px]"
                  >
                    <Truck className="w-4 h-4 text-white group-hover:text-zinc-950 transition-colors" />
                    <span>My Orders</span>
                  </button>
                </div>
              </div>
            )}

            {/* Logout Footer */}
            <div className="pb-4 pt-3 border-t border-white/10 mx-3">
              <button
                onClick={() => {
                  if (userLogout) userLogout();
                  if (customerLogout) customerLogout();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-[13.5px] font-bold tracking-wide text-rose-300 hover:text-white hover:bg-gradient-to-r hover:from-rose-600 hover:to-rose-900 border border-transparent hover:border-rose-300 hover:shadow-[0_8px_22px_rgba(244,63,94,0.6)] hover:scale-105 transition-all duration-300 ease-out"
              >
                <LogOut className="w-4 h-4 text-rose-400 group-hover:text-white transition-colors" />
                <span>Logout</span>
              </button>
            </div>

          </div>
        </aside>

        {/* ─── Main Content Pane with White/Light Background for Admin ──────── */}
        <div className={`flex-1 w-full min-w-0 flex flex-col overflow-hidden relative ${isAdminUser ? 'bg-slate-100 text-zinc-900' : 'bg-[#0f172a] text-white'}`}>
          <main id="main-store-content" className={`flex-1 w-full overflow-y-auto p-3 sm:p-4 lg:p-6 scroll-smooth ${isAdminUser ? 'bg-slate-100 text-zinc-900' : 'bg-[#0f172a] text-white'}`}>
            <div className="max-w-7xl mx-auto space-y-3">

              {/* ─── Header Banner (always visible) ─── */}
              <div className={`relative border rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 shadow-md flex items-center justify-between gap-4 overflow-hidden w-full ${isAdminUser ? 'bg-white border-zinc-200 text-zinc-900 shadow-xl' : 'bg-gradient-to-r from-[#1E293B] via-[#1B3817] to-[#0f172a] border-slate-700/60 text-white'}`}>
                <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] pointer-events-none">
                  <ShoppingBag className="w-24 h-24 sm:w-32 sm:h-32 text-emerald-400" />
                </div>
                <div className="relative z-10 flex items-center justify-between w-full gap-4 flex-wrap">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-700 text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> {user?.fullName || customer?.fullName || 'Shop Admin'}
                    </span>
                    <h1 className="text-xs sm:text-sm font-black tracking-tight uppercase text-zinc-900 truncate">
                      {activeView === 'dashboard' ? '📊 Executive Business Dashboard' : '📦 Products & Inventory Catalog'}
                    </h1>
                  </div>

                  {/* Right-Aligned 3D Action Buttons with Tabs */}
                  <div className="flex items-center gap-2 ml-auto flex-wrap">
                    {/* View Switcher Tabs */}
                    <div className="flex items-center p-1 bg-zinc-100 rounded-2xl border border-zinc-200">
                      <button
                        onClick={() => setActiveView('dashboard')}
                        className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${activeView === 'dashboard'
                          ? 'bg-zinc-900 text-white shadow-md'
                          : 'text-zinc-600 hover:text-zinc-950'
                          }`}
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                      </button>
                      <button
                        onClick={() => setActiveView('products')}
                        className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${activeView === 'products'
                          ? 'bg-zinc-900 text-white shadow-md'
                          : 'text-zinc-600 hover:text-zinc-950'
                          }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Products
                      </button>
                    </div>

                    {isAdminUser && (
                      <button
                        onClick={() => setAddProductModal(true)}
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-md border-b-2 border-amber-800 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                        <span>+ Add Product</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── DASHBOARD VIEW ─── */}
              {activeView === 'dashboard' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

                  {/* ─── SHOP ADMIN DASHBOARD (CLEAN WHITE THEME) ─── */}
                  {isAdminUser ? (
                    <div className="space-y-4">

                      {/* ─── EXECUTIVE BUSINESS DASHBOARD (CLEAN & MINIMAL) ─── */}
                      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-3.5 sm:p-5 shadow-xl text-slate-900 space-y-4">

                        {/* ─── LINE 1: 💰 REALIZED NET PROFIT & LOSS ─── */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="text-[11px] font-black uppercase text-slate-800 flex items-center gap-1.5 tracking-wider">
                              <DollarSign className="w-3.5 h-3.5 text-slate-700" /> 1. Realized Net Profit / Loss
                            </span>
                            <span className="text-[9px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full uppercase">
                              Sales Profit - Expenses - Damaged Loss
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {/* Today Net Profit (Gray & Yellow As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-slate-200 via-amber-100 to-slate-100 rounded-xl text-slate-900 shadow-sm flex items-center justify-between border border-slate-300 hover:border-amber-400 hover:shadow transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-slate-700 uppercase tracking-wide block">
                                  Today Net {netStats.todayNet >= 0 ? 'Profit' : 'Loss'}
                                </span>
                                <h4 className={`text-lg sm:text-xl font-black mt-0.5 ${netStats.todayNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {currency} {netStats.todayNet.toLocaleString('en-PK')}
                                </h4>
                                <span className="text-[8px] text-slate-500 font-bold block mt-0.5">
                                  Gross: Rs.{netStats.todayGrossProfit} | Exp: Rs.{netStats.todayExp} | Loss: Rs.{netStats.todayDmg}
                                </span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-slate-300/80 border border-slate-400/60 flex items-center justify-center text-slate-800 shrink-0">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Monthly Net Profit (Gray & Yellow As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-slate-200 via-amber-100 to-slate-100 rounded-xl text-slate-900 shadow-sm flex items-center justify-between border border-slate-300 hover:border-amber-400 hover:shadow transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-slate-700 uppercase tracking-wide block">
                                  Month Net {netStats.monthlyNet >= 0 ? 'Profit' : 'Loss'}
                                </span>
                                <h4 className={`text-lg sm:text-xl font-black mt-0.5 ${netStats.monthlyNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {currency} {netStats.monthlyNet.toLocaleString('en-PK')}
                                </h4>
                                <span className="text-[8px] text-slate-500 font-bold block mt-0.5">
                                  Gross: Rs.{netStats.monthlyGrossProfit} | Exp: Rs.{netStats.monthlyExp}
                                </span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-slate-300/80 border border-slate-400/60 flex items-center justify-center text-slate-800 shrink-0">
                                <DollarSign className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Yearly Net Profit (Yellow, Gray & Green As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-amber-300 via-slate-200 to-emerald-400 rounded-xl text-slate-950 shadow-md flex items-center justify-between border-2 border-amber-400 border-b-4 border-b-emerald-800 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-black text-slate-900 uppercase tracking-wide block">
                                  Year Net {netStats.yearlyNet >= 0 ? 'Profit' : 'Loss'}
                                </span>
                                <h4 className={`text-lg sm:text-xl font-black mt-0.5 ${netStats.yearlyNet >= 0 ? 'text-emerald-950' : 'text-rose-950'}`}>
                                  {currency} {netStats.yearlyNet.toLocaleString('en-PK')}
                                </h4>
                                <span className="text-[8.5px] text-emerald-950 font-bold block mt-0.5">
                                  This Year Realized
                                </span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-emerald-700 border border-emerald-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                <Calendar className="w-4 h-4" />
                              </div>
                            </div>

                            {/* All-Time Cumulative Net Profit (Gray & Yellow As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-slate-200 via-amber-100 to-slate-100 rounded-xl text-slate-900 shadow-sm flex items-center justify-between border border-slate-300 hover:border-amber-400 hover:shadow transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-slate-700 uppercase tracking-wide block">
                                  All-Time Net Profit
                                </span>
                                <h4 className={`text-lg sm:text-xl font-black mt-0.5 ${netStats.totalNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {currency} {netStats.totalNet.toLocaleString('en-PK')}
                                </h4>
                                <span className="text-[8px] text-slate-500 font-bold block mt-0.5">
                                  Pure Realized Balance
                                </span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-slate-300/80 border border-slate-400/60 flex items-center justify-center text-slate-800 shrink-0">
                                <Sparkles className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ─── LINE 2: 🛒 SALES & REVENUE ─── */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="text-[11px] font-black uppercase text-slate-800 flex items-center gap-1.5 tracking-wider">
                              <ShoppingBag className="w-3.5 h-3.5 text-slate-700" /> 2. Sales &amp; Revenue
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              Sales Volume &amp; Invoices
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {/* Today (Green & Blue Gradient As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-xl text-white shadow-md flex items-center justify-between border border-emerald-300/40 border-b-4 border-b-blue-950 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-emerald-100 uppercase tracking-wide block">Today</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">Rs. {(dashStats.todaySales || 0).toLocaleString('en-PK')}</h4>
                                <span className="text-[8.5px] text-blue-100/90 font-bold block">{dashStats.todayOrdersCount || 0} Orders</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                                <Calendar className="w-4 h-4" />
                              </div>
                            </div>

                            {/* This Month (Yellow, Green & Orange Gradient As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-amber-400 via-emerald-500 to-orange-500 rounded-xl text-white shadow-md flex items-center justify-between border border-amber-300/40 border-b-4 border-b-orange-950 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-amber-100 uppercase tracking-wide block">This Month</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">Rs. {(dashStats.monthlySales || 0).toLocaleString('en-PK')}</h4>
                                <span className="text-[8.5px] text-orange-100/90 font-bold block">{dashStats.monthlyOrdersCount || 0} Orders</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                            </div>

                            {/* This Year (Yellow, Green & Blue Gradient As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-amber-400 via-emerald-500 to-blue-600 rounded-xl text-white shadow-md flex items-center justify-between border border-amber-300/40 border-b-4 border-b-blue-950 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-amber-100 uppercase tracking-wide block">This Year</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">Rs. {(dashStats.yearlySales || 0).toLocaleString('en-PK')}</h4>
                                <span className="text-[8.5px] text-blue-100/90 font-bold block">{dashStats.yearlyOrdersCount || 0} Orders</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                                <ShoppingBag className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Total Sales (Orange, Yellow & Blue Gradient As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-orange-500 via-amber-400 to-blue-600 rounded-xl text-white shadow-md flex items-center justify-between border border-orange-300/40 border-b-4 border-b-blue-950 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-orange-100 uppercase tracking-wide block">Total Sales</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">Rs. {(dashStats.totalRevenue || 0).toLocaleString('en-PK')}</h4>
                                <span className="text-[8.5px] text-blue-100/90 font-bold block">{dashStats.totalOrders || 0} Orders</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-md shrink-0">
                                <DollarSign className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ─── LINE 3: 📦 AVAILABLE STOCK ─── */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="text-[11px] font-black uppercase text-slate-800 flex items-center gap-1.5 tracking-wider">
                              <Box className="w-3.5 h-3.5 text-slate-700" /> 3. Available Stock
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              Inventory Count &amp; Worth
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {/* Petis (Yellow & Green Gradient As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-600 rounded-xl text-white shadow-md flex items-center justify-between border border-amber-300/40 border-b-4 border-b-emerald-950 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold uppercase tracking-wide block text-amber-100">Petis</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">{(dashStats.totalStockPetis || 0).toFixed(1)} Petis</h4>
                                <span className="text-[8.5px] text-emerald-100/90 font-bold block">{dashStats.totalProducts || 0} Products</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                                <Box className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Trays (Gray & Blue Gradient As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-slate-600 via-sky-600 to-blue-700 rounded-xl text-white shadow-md flex items-center justify-between border border-sky-300/40 border-b-4 border-b-slate-950 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold uppercase tracking-wide block text-sky-100">Trays</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">{(dashStats.totalStockTrays || 0).toLocaleString('en-PK')} Trays</h4>
                                <span className="text-[8.5px] text-blue-100/90 font-bold block">Available</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Eggs (Gray & Blue Gradient As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-slate-700 via-blue-600 to-slate-800 rounded-xl text-white shadow-md flex items-center justify-between border border-blue-300/40 border-b-4 border-b-slate-950 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold uppercase tracking-wide block text-slate-200">Eggs</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">{(dashStats.totalStockEggs || 0).toLocaleString('en-PK')} Eggs</h4>
                                <span className="text-[8.5px] text-blue-100/90 font-bold block">Available</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                                <ShoppingBag className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Stock Worth (Yellow & Green Gradient As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-amber-400 via-emerald-500 to-emerald-700 rounded-xl text-white shadow-md flex items-center justify-between border border-amber-300/40 border-b-4 border-b-emerald-950 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-amber-100 uppercase tracking-wide block">Stock Worth</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">Rs. {(dashStats.totalInventoryValue || 0).toLocaleString('en-PK')}</h4>
                                <span className="text-[8.5px] text-emerald-100/90 font-bold block">Total Valuation</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ─── LINE 4: 🚚 PURCHASES & RESTOCK ─── */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="text-[11px] font-black uppercase text-slate-800 flex items-center gap-1.5 tracking-wider">
                              <Truck className="w-3.5 h-3.5 text-slate-700" /> 4. Purchases &amp; Restock
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              Restock Summary
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                            {/* Stock Bought (Gray Color As Requested) */}
                            <div className="p-3.5 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200/90 rounded-xl text-slate-900 shadow-sm flex items-center justify-between border border-slate-300 hover:border-slate-400 hover:shadow transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wide block">Purchased</span>
                                <h4 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{(Number(dashStats.totalPetisPurchased) || 0).toFixed(1)} Petis</h4>
                                <span className="text-[8.5px] text-slate-500 font-bold block">{(dashStats.totalTraysPurchased || 0)} Trays</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-slate-300/80 border border-slate-400/60 flex items-center justify-center text-slate-800 shrink-0">
                                <Truck className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Cash Paid to Supplier (Richer Vibrant Blue As Requested) */}
                            <div className="p-3.5 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 rounded-xl text-white shadow-md flex items-center justify-between border border-sky-300 border-b-4 border-b-blue-900 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-sky-100 uppercase tracking-wide block">Cash Paid</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">Rs. {(dashStats.cashPaidToSupplier || 0).toLocaleString('en-PK')}</h4>
                                <span className="text-[8.5px] text-sky-100/90 font-bold block">Paid in Cash</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                                <Banknote className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Bank Paid / Transfer (Yellow, Orange, Blue & Gray Blend As Requested) */}
                            <div className="p-3.5 bg-gradient-to-br from-amber-300 via-orange-200 to-slate-200 rounded-xl text-slate-950 shadow-md flex items-center justify-between border-2 border-orange-400/80 border-b-4 border-b-orange-700 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-slate-800 uppercase tracking-wide block">Bank Paid</span>
                                <h4 className="text-lg sm:text-xl font-black text-slate-950 mt-0.5">Rs. {(dashStats.bankPaidToSupplier || 0).toLocaleString('en-PK')}</h4>
                                <span className="text-[8.5px] text-slate-700 font-bold block">Paid via Bank</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-blue-600 border border-blue-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                <CreditCard className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Due Supplier Debt (Red and Gray Blend As Requested) */}
                            <div className="p-3.5 bg-gradient-to-br from-rose-100 via-red-100 to-slate-200 rounded-xl text-slate-950 shadow-md flex items-center justify-between border-2 border-rose-300 border-b-4 border-b-rose-700 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-black text-rose-700 uppercase tracking-wide block">Due Balance</span>
                                <h4 className="text-lg sm:text-xl font-black text-rose-950 mt-0.5">Rs. {(dashStats.dueToSupplier || 0).toLocaleString('en-PK')}</h4>
                                <span className="text-[8.5px] text-slate-600 font-bold block">Owed Debt</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-rose-600 border border-rose-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                <AlertCircle className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Total Cost / Investment (Moved to Right Side with Yellow & Green Color As Requested) */}
                            <div className="p-3.5 bg-gradient-to-br from-amber-400 via-yellow-400 to-emerald-500 rounded-xl text-slate-950 shadow-md flex items-center justify-between border border-amber-300 border-b-4 border-b-amber-700 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-black text-slate-900 uppercase tracking-wide block">Total Cost</span>
                                <h4 className="text-lg sm:text-xl font-black text-slate-950 mt-0.5">Rs. {(dashStats.totalPurchaseCost || 0).toLocaleString('en-PK')}</h4>
                                <span className="text-[8.5px] text-emerald-950 font-bold block">Total Investment</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/40 border border-white/50 flex items-center justify-center text-slate-950 shadow-sm shrink-0">
                                <DollarSign className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ─── LINE 5: 💸 SHOP EXPENSES (Red Theme As Requested) ─── */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="text-[11px] font-black uppercase text-rose-800 flex items-center gap-1.5 tracking-wider">
                              <FileText className="w-3.5 h-3.5 text-rose-600" /> 5. Shop Expenses
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              Expense Summary
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* Today's Expenses (Red, Blue, Green Gradient As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-rose-600 via-sky-600 to-emerald-600 rounded-xl text-white shadow-md flex items-center justify-between border border-rose-300/40 border-b-4 border-b-emerald-950 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-rose-100 uppercase tracking-wide block">Today Expense</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">Rs. {(dynamicExpenseStats.todayExp || 0).toLocaleString('en-PK')}</h4>
                                <span className="text-[8.5px] text-emerald-100/90 font-semibold block">{dynamicExpenseStats.todayExpCount} Entries Today</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Monthly Expenses (Red, Yellow, Black Gradient As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-rose-600 via-amber-500 to-slate-950 rounded-xl text-white shadow-md flex items-center justify-between border border-amber-300/40 border-b-4 border-b-slate-950 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-amber-200 uppercase tracking-wide block">Month Expense</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">Rs. {(dynamicExpenseStats.monthExp || 0).toLocaleString('en-PK')}</h4>
                                <span className="text-[8.5px] text-amber-100/90 font-semibold block">{dynamicExpenseStats.monthExpCount} Entries This Month</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                                <TrendingDown className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Total Cumulative Expenses (Yellow, Green, Blue Gradient As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-amber-400 via-emerald-500 to-blue-600 rounded-xl text-white shadow-md flex items-center justify-between border border-amber-300/40 border-b-4 border-b-blue-950 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-amber-100 uppercase tracking-wide block">Total Expense</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">Rs. {(dynamicExpenseStats.totalExp || 0).toLocaleString('en-PK')}</h4>
                                <span className="text-[8.5px] text-blue-100/90 font-semibold block">{dynamicExpenseStats.totalExpCount} Total Entries</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                                <DollarSign className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ─── LINE 6: 🥚 DAMAGED STOCK & LOSS (Red Theme As Requested) ─── */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="text-[11px] font-black uppercase text-red-800 flex items-center gap-1.5 tracking-wider">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> 6. Damaged Stock &amp; Loss
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              Damages &amp; Loss Summary
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* Damaged Stock Quantity (Red & Gray Gradient As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-rose-600 via-red-600 to-slate-800 rounded-xl text-white shadow-md flex items-center justify-between border border-rose-300/40 border-b-4 border-b-slate-950 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-rose-100 uppercase tracking-wide block">Damaged Stock</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">{(dashStats.totalDamagedPetis || 0).toFixed(1)} Petis</h4>
                                <span className="text-[9px] text-slate-200 font-bold block mt-0.5">
                                  {dashStats.totalDamagedTrays || 0} Trays • {(dashStats.totalDamagedEggs || 0).toLocaleString('en-PK')} Eggs
                                </span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                                <AlertCircle className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Today's Breakage Loss (Green & Blue Gradient As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 rounded-xl text-white shadow-md flex items-center justify-between border border-emerald-300/40 border-b-4 border-b-blue-950 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-emerald-100 uppercase tracking-wide block">Today Loss</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">Rs. {(dashStats.todayDamagedLoss || 0).toLocaleString('en-PK')}</h4>
                                <span className="text-[8.5px] text-blue-100/90 font-semibold block">Today</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                                <TrendingDown className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Total Breakage Loss (Yellow, Green & Blue Gradient As Requested) */}
                            <div className="p-3.5 bg-gradient-to-r from-amber-400 via-emerald-500 to-blue-600 rounded-xl text-white shadow-md flex items-center justify-between border border-amber-300/40 border-b-4 border-b-blue-950 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <div>
                                <span className="text-[9.5px] font-bold text-amber-100 uppercase tracking-wide block">Total Loss</span>
                                <h4 className="text-lg sm:text-xl font-black text-white mt-0.5">Rs. {(dashStats.totalDamagedLoss || 0).toLocaleString('en-PK')}</h4>
                                <span className="text-[8.5px] text-blue-100/90 font-semibold block">Total</span>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                                <DollarSign className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ─── BILLTEN ALERT ROW (3 ALERT PANELS AT BOTTOM) ─── */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">

                          {/* Alert 1: Low Stock Items */}
                          <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">LOW STOCK ITEMS</span>
                              <span className="text-lg font-black text-slate-900">{dashStats.lowStock || 0}</span>
                            </div>
                          </div>

                          {/* Alert 2: Negative / Damaged Stock */}
                          <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">DAMAGED STOCK</span>
                              <span className="text-lg font-black text-slate-900">{dashStats.totalDamagedLoss ? 1 : 0}</span>
                            </div>
                          </div>

                          {/* Alert 3: Expiring Products */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-slate-300 shrink-0" />
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">EXPIRING PRODUCTS</span>
                              <span className="text-lg font-black text-slate-900">{dashStats.expiredProducts || 0}</span>
                            </div>
                          </div>

                        </div>

                      </div>

                      {/* EasyPaisa & Customer Orders Verification */}
                      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl text-zinc-900">
                        <OrdersManagement shopId={shopId} />
                      </div>
                    </div>
                  ) : (
                    /* ─── CUSTOMER DASHBOARD ─── */
                    <>
                      {/* Customer Stat Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                          { label: 'Items in Cart', value: cartCount, icon: '🛒', color: 'from-blue-900/60 to-blue-800/40 border-blue-700/60', textColor: 'text-blue-300', sub: 'Ready to Order' },
                          { label: 'My Orders', value: dashStats.totalOrders, icon: '📋', color: 'from-emerald-900/60 to-emerald-800/40 border-emerald-700/60', textColor: 'text-emerald-300', sub: 'Placed Orders' },
                          { label: 'Total Spent', value: `RS ${dashStats.totalSpent.toLocaleString('en-PK')}`, icon: '💰', color: 'from-amber-900/60 to-amber-800/40 border-amber-700/60', textColor: 'text-amber-300', sub: 'All-Time Purchases' },
                          { label: 'Products Available', value: dashStats.totalProducts, icon: '📦', color: 'from-violet-900/60 to-violet-800/40 border-violet-700/60', textColor: 'text-violet-300', sub: 'In Shop Catalog' },
                          { label: 'In Stock', value: dashStats.totalStock > 0 ? dashStats.totalStock.toLocaleString('en-PK') : '—', icon: '✅', color: 'from-green-900/60 to-green-800/40 border-green-700/60', textColor: 'text-green-300', sub: 'Units Available' },
                          { label: 'Shop', value: shop?.name || 'My Shop', icon: '🏪', color: 'from-slate-800/80 to-slate-700/60 border-slate-600/60', textColor: 'text-white', sub: shop?.address || 'Your Store' },
                        ].map(({ label, value, icon, color, textColor, sub }) => (
                          <div key={label} className={`bg-gradient-to-br ${color} border rounded-2xl p-5 flex flex-col gap-2`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</span>
                              <span className="text-xl">{icon}</span>
                            </div>
                            <p className={`text-xl sm:text-2xl font-black ${textColor} tracking-tight`}>{value}</p>
                            <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider">{sub}</span>
                          </div>
                        ))}
                      </div>

                      {/* Customer Quick Actions */}
                      <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-5">
                        <h3 className="text-xs font-black text-white/60 uppercase tracking-widest mb-4">⚡ Quick Actions</h3>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => { setActiveView('products'); setActiveCategory('All'); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700/60 hover:bg-emerald-600/80 text-white text-xs font-black uppercase tracking-wider rounded-xl border border-emerald-600/40 transition-all"
                          >
                            <ShoppingBag className="w-4 h-4" /> Browse Products
                          </button>
                          {canBuy && (
                            <>
                              <button
                                onClick={() => setCartOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-700/60 hover:bg-blue-600/80 text-white text-xs font-black uppercase tracking-wider rounded-xl border border-blue-600/40 transition-all"
                              >
                                <ShoppingCart className="w-4 h-4" /> My Cart ({cartCount})
                              </button>
                              <button
                                onClick={() => setOrderOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-violet-700/60 hover:bg-violet-600/80 text-white text-xs font-black uppercase tracking-wider rounded-xl border border-violet-600/40 transition-all"
                              >
                                <Truck className="w-4 h-4" /> My Orders
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ─── PURCHASES & RESTOCKS VIEW FOR SHOP ADMIN ─── */}
              {activeView === 'purchases' && (
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl text-zinc-900">
                  <PurchasesManagement
                    products={items}
                    onAddProduct={() => setAddProductModal(true)}
                    onEditProduct={(p) => setEditModalProduct(p)}
                    onDeleteProduct={handleDirectDeleteProduct}
                    onViewProduct={(p) => setSelectedItem(p)}
                  />
                </div>
              )}

              {/* ─── PRODUCTS VIEW ─── */}
              {activeView === 'products' && (
                <>
                  {/* Mobile Search Bar */}
                  <div className="relative w-full sm:hidden z-30">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      onFocus={() => setShowSearchDropdown(true)}
                      onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                    {/* Mobile Search Dropdown */}
                    {search.trim() && showSearchDropdown && (
                      <div className="absolute top-full mt-2 w-full bg-[#1E293B] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {items.length > 0 ? (
                          <div className="max-h-60 overflow-y-auto py-2 scrollbar-hide">
                            {items.map(item => (
                              <button
                                key={item._id}
                                onClick={() => { setSelectedItem(item); setSearch(''); setShowSearchDropdown(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 transition-colors text-left border-b border-slate-700/50 last:border-0"
                              >
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-700">
                                  {item.images?.[0] ? <img src={item.images[0]} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 m-1.5 text-slate-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-white text-[11px] truncate uppercase tracking-tight">{item.name}</p>
                                  <p className="text-emerald-400 font-black text-[9px]">{currency} {item.price}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-center text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                            No products found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Category Pills (Mobile/Quick Filter) */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-widest pr-2 border-r border-slate-700">
                      <Filter className="w-3.5 h-3.5" /> Filter
                    </div>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeCategory === cat
                          ? 'bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                          }`}
                      >
                        {cat !== 'All' && <img src="/egg.png" alt="" className="w-3.5 h-3.5 object-contain" />}
                        {cat}
                      </button>
                    ))}
                    {/* Add Product button for ShopAdmin — inside category bar */}
                    {isAdminUser && (
                      <button
                        onClick={() => setAddProductModal(true)}
                        className="ml-auto whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40 shadow-lg transition-all shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Product
                      </button>
                    )}
                  </div>

                  {/* Products Cards Grid */}
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Catalog...</p>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/40 border border-slate-700/60 rounded-3xl flex flex-col items-center">
                      <Package className="w-16 h-16 text-slate-600 mb-3" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No products found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                      {items.map(item => {
                        const itemStock = Number(item.stock) || 0;
                        const itemMinStock = Number(item.minStock) || 5;
                        const itemOutOfStock = itemStock <= 0;
                        const itemLowStock = itemStock > 0 && itemStock <= itemMinStock;

                        return (
                          <div
                            key={item._id}
                            className={`group bg-[#1E293B] border rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex flex-col ${itemOutOfStock
                              ? 'border-red-500/40 opacity-80'
                              : itemLowStock
                                ? 'border-amber-500/60 shadow-amber-500/10'
                                : 'border-slate-700/60 hover:border-emerald-500/50'
                              }`}
                          >
                            {/* Image Container */}
                            <button onClick={() => setSelectedItem(item)} className="block aspect-square bg-slate-900 overflow-hidden relative">
                              {item.images?.[0] ? (
                                <img src={item.images[0]} alt={item.name} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${itemOutOfStock ? 'grayscale opacity-60' : ''}`} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Egg className="w-12 h-12 text-slate-700" />
                                </div>
                              )}
                              <div className="absolute top-3 left-3 bg-[#111827]/90 px-3 py-1 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest border border-slate-700">
                                {item.category}
                              </div>

                              {/* Stock Badge - Top Right */}
                              <div className="absolute top-3 right-3">
                                {itemOutOfStock ? (
                                  <span className="bg-red-600/90 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-red-400 shadow-md backdrop-blur-md">
                                    Out of Stock
                                  </span>
                                ) : itemLowStock ? (
                                  <span className="bg-amber-500 text-zinc-950 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-amber-300 shadow-md backdrop-blur-md animate-pulse">
                                    ⚠️ Low Stock ({itemStock})
                                  </span>
                                ) : (
                                  <span className="bg-emerald-600/90 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-400/60 shadow-md backdrop-blur-md">
                                    Stock: {itemStock}
                                  </span>
                                )}
                              </div>
                            </button>

                            {/* Item Info & Action */}
                            <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                              <button onClick={() => setSelectedItem(item)} className="text-left space-y-1">
                                <h3 className="font-black text-white text-sm leading-snug line-clamp-2 uppercase tracking-tight group-hover:text-emerald-300 transition-colors">
                                  {item.name}
                                </h3>
                                <p className="text-emerald-400 font-black text-lg">{currency} {item.price.toLocaleString()}</p>
                              </button>

                              {/* Low Stock / Out of Stock Banner */}
                              {itemLowStock && (
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[10px] uppercase justify-center">
                                  <span>⚠️ Low Stock: Only {itemStock} left!</span>
                                </div>
                              )}

                              {itemOutOfStock && (
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 font-bold text-[10px] uppercase justify-center">
                                  <span>Out of Stock (0 remaining)</span>
                                </div>
                              )}

                              {isAdminUser ? (
                                <div className="flex flex-col gap-1.5 w-full pt-1">
                                  {!itemOutOfStock && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); addToWalkInCart(item); }}
                                      className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md border-t border-emerald-400/30 border-b-2 border-emerald-950 active:translate-y-[1px] transition-all cursor-pointer"
                                      title="Add product to Customer Walk-in Bill"
                                    >
                                      <Receipt className="w-3.5 h-3.5" />
                                      <span>+ Add to Bill</span>
                                    </button>
                                  )}
                                  <div className="grid grid-cols-3 gap-1.5 w-full">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                                      className="py-1.5 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 border border-slate-600/60 shadow-md active:translate-y-[1px] transition-all cursor-pointer"
                                      title="View Product Details"
                                    >
                                      <Eye className="w-3 h-3 text-emerald-400" />
                                      <span>View</span>
                                    </button>

                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditModalProduct(item); }}
                                      className="py-1.5 px-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-md border-t border-blue-400/30 border-b-2 border-indigo-900 active:translate-y-[1px] transition-all cursor-pointer"
                                      title="Edit Product"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>

                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDirectDeleteProduct(item); }}
                                      className="py-1.5 px-1 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-md border-t border-rose-400/30 border-b-2 border-rose-950 active:translate-y-[1px] transition-all cursor-pointer"
                                      title="Delete Product"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              ) : canBuy ? (
                                !itemOutOfStock ? (
                                  <button
                                    onClick={() => handleAddToCart(item)}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#1B3817] hover:bg-[#12290D] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-md active:translate-y-[2px] active:border-b-0"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add to Cart
                                  </button>
                                ) : null
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ─── WALK-IN POS & BILLING VIEW ─── */}
              {activeView === 'walkin' && isAdminUser && (
                <div className="space-y-4">
                  {/* Top Banner - white/gray */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-700 text-xs font-black uppercase tracking-widest mb-0.5">
                        <Receipt className="w-4 h-4" /> Walk-in POS
                      </div>
                      <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Customer Sale & Billing</h2>
                      <p className="text-gray-400 text-xs mt-0.5">Select items, enter customer details, complete sale & generate bill.</p>
                    </div>
                    <button
                      onClick={() => { setActiveView('sales'); fetchShopSales(); }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4 text-emerald-600" /> Sales History
                    </button>
                  </div>

                  {/* POS Split Screen */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                    {/* ── Left: Product Catalog (7 cols) ── */}
                    <div className="lg:col-span-7 space-y-3">
                      {/* Search & Filter */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-xl py-2.5 pl-9 pr-3 text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 transition-colors shadow-sm"
                          />
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <select
                          value={activeCategory}
                          onChange={e => setActiveCategory(e.target.value)}
                          className="bg-white border border-gray-300 text-gray-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-emerald-500 shadow-sm"
                        >
                          {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Product Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto pr-1">
                        {items.map(product => {
                          const petiPrice = getProductUnitPrice(product, 'peti');
                          const trayPrice = getProductUnitPrice(product, 'tray');
                          const eggPrice = getProductUnitPrice(product, 'egg');

                          return (
                            <div
                              key={product._id}
                              className="bg-white border-2 border-gray-200 hover:border-emerald-400 rounded-2xl p-3 flex flex-col justify-between gap-2.5 hover:shadow-md transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                                  {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-6 h-6 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-black text-gray-900 text-xs uppercase tracking-tight truncate">{product.name}</h4>
                                  <p className="text-emerald-700 font-extrabold text-[11px] mt-0.5">
                                    {currency} {trayPrice.toLocaleString()} <span className="text-[9px] font-normal text-gray-400">/ Tray</span>
                                  </p>
                                  <span className={`text-[9px] font-bold uppercase ${product.stock > 0 ? 'text-gray-400' : 'text-rose-500'}`}>
                                    Stock: {product.stock} eggs ({(product.stock / 360).toFixed(1)} Petis)
                                  </span>
                                </div>
                              </div>

                              {/* 3 Direct Unit Add Buttons: Peti, Tray, Egg */}
                              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-gray-100">
                                <button
                                  type="button"
                                  onClick={() => product.stock > 0 && addToWalkInCart(product, 'peti')}
                                  disabled={product.stock <= 0}
                                  className="py-1 px-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[9px] font-black uppercase tracking-wider flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-40"
                                  title={`Add 1 Peti (${currency} ${petiPrice})`}
                                >
                                  <span>📦 Peti</span>
                                  <span className="text-[8px] font-extrabold text-amber-900">{currency}{petiPrice}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => product.stock > 0 && addToWalkInCart(product, 'tray')}
                                  disabled={product.stock <= 0}
                                  className="py-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[9px] font-black uppercase tracking-wider flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-40"
                                  title={`Add 1 Tray (${currency} ${trayPrice})`}
                                >
                                  <span>🍱 Tray</span>
                                  <span className="text-[8px] font-extrabold text-emerald-900">{currency}{trayPrice}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => product.stock > 0 && addToWalkInCart(product, 'egg')}
                                  disabled={product.stock <= 0}
                                  className="py-1 px-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[9px] font-black uppercase tracking-wider flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-40"
                                  title={`Add 1 Egg (${currency} ${eggPrice})`}
                                >
                                  <span>🥚 Egg</span>
                                  <span className="text-[8px] font-extrabold text-blue-900">{currency}{eggPrice}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Right: Bill / Receipt Panel (5 cols) ── */}
                    <div className="lg:col-span-5">
                      <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden flex flex-col">

                        {/* Bill Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white">
                            <Receipt className="w-4 h-4" />
                            <span className="font-black text-sm uppercase tracking-wide">Bill Cart ({walkInCart.length})</span>
                          </div>
                          {walkInCart.length > 0 && (
                            <button
                              onClick={() => setWalkInCart([])}
                              className="text-[10px] font-bold text-emerald-100 hover:text-white uppercase tracking-widest cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>

                        <div className="p-4 space-y-4 flex-1">
                          {/* Customer Details */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Customer Details</p>
                            <input
                              type="text"
                              placeholder="Customer Name (e.g. Ahmad Khan)"
                              value={walkInCustomerName}
                              onChange={e => setWalkInCustomerName(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 transition-colors"
                            />
                            <input
                              type="text"
                              placeholder="WhatsApp / Phone (e.g. +923001234567)"
                              value={walkInCustomerPhone}
                              onChange={e => setWalkInCustomerPhone(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>

                          {/* Payment Method */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Payment Method</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setWalkInPaymentMethod('CASH')}
                                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${walkInPaymentMethod === 'CASH'
                                  ? 'bg-emerald-500 text-white shadow border border-emerald-400'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
                                  }`}
                              >
                                <DollarSign className="w-3.5 h-3.5" /> Cash
                              </button>
                              <button
                                type="button"
                                onClick={() => setWalkInPaymentMethod('BANK_TRANSFER')}
                                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${walkInPaymentMethod === 'BANK_TRANSFER'
                                  ? 'bg-amber-500 text-white shadow border border-amber-400'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
                                  }`}
                              >
                                <Building2 className="w-3.5 h-3.5" /> Bank
                              </button>
                            </div>

                            {walkInPaymentMethod === 'BANK_TRANSFER' && (
                              <div className="space-y-2 animate-in fade-in duration-200">
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                                  <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">🏦 Official Bank Account</p>
                                  {(() => {
                                    const sName = (shop?.name || '').toLowerCase();
                                    const sAddr = (shop?.address || '').toLowerCase();
                                    if (sName.includes('mardan') || sAddr.includes('mardan')) {
                                      return <p className="text-xs font-mono font-black text-gray-900 bg-white border border-amber-200 px-2 py-1 rounded-lg">Bank Al Habib: 2013008100773501</p>;
                                    }
                                    if (sName.includes('peshawar') || sAddr.includes('peshawar')) {
                                      return <p className="text-xs font-mono font-black text-gray-900 bg-white border border-amber-200 px-2 py-1 rounded-lg">Meezan Bank: 07190104740373</p>;
                                    }
                                    return <p className="text-xs font-mono font-black text-gray-900 bg-white border border-amber-200 px-2 py-1 rounded-lg">UBL: 0109000306243543</p>;
                                  })()}
                                </div>
                                <input
                                  type="text"
                                  placeholder="Transaction / Ref ID"
                                  value={walkInTransactionId}
                                  onChange={e => setWalkInTransactionId(e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-amber-500"
                                />
                                <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1">Upload Payment Receipt</label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleReceiptUpload}
                                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-amber-500 file:text-white hover:file:bg-amber-600 cursor-pointer"
                                  />
                                  {walkInPaymentProof && (
                                    <div className="mt-2 w-14 h-14 rounded-lg overflow-hidden border border-amber-300">
                                      <img src={walkInPaymentProof} alt="Receipt" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Bill Items List with Peti, Tray, Egg Unit Selectors */}
                          <div className="space-y-2 max-h-[260px] overflow-y-auto">
                            {walkInCart.length === 0 ? (
                              <div className="text-center py-8 text-gray-300 text-xs font-bold uppercase tracking-widest border-2 border-dashed border-gray-200 rounded-xl">
                                No items added yet
                              </div>
                            ) : (
                              walkInCart.map(item => {
                                const currentUnit = item.selectedUnit || 'tray';
                                const itemRate = item.unitPrice || getProductUnitPrice(item.product, currentUnit);
                                const itemTotal = itemRate * (Number(item.quantity) || 1);

                                return (
                                  <div
                                    key={`${item.product._id}_${currentUnit}`}
                                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-2 hover:border-emerald-300 transition-all shadow-sm"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-black text-gray-900 uppercase truncate text-xs">{item.product.name}</p>
                                        <span className="text-[10px] font-bold text-emerald-700">
                                          {currency} {itemRate.toLocaleString()} <span className="text-[9px] font-normal text-gray-400">/ {currentUnit.toUpperCase()}</span>
                                        </span>
                                      </div>

                                      <div className="text-right flex items-center gap-2">
                                        <p className="font-black text-gray-900 text-sm">{currency} {itemTotal.toLocaleString()}</p>
                                        <button
                                          type="button"
                                          onClick={() => removeFromWalkInCart(item.product._id, currentUnit)}
                                          className="text-gray-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                          title="Remove from bill"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Unit Selection Pills (Peti, Tray, Egg) & Qty Counter */}
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200/60">
                                      {/* Unit Pills */}
                                      <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200">
                                        {[
                                          { id: 'peti', label: '📦 Peti' },
                                          { id: 'tray', label: '🍱 Tray' },
                                          { id: 'egg', label: '🥚 Egg' },
                                        ].map(u => (
                                          <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => updateWalkInUnit(item.product._id, currentUnit, u.id)}
                                            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${currentUnit === u.id
                                              ? 'bg-emerald-600 text-white shadow-sm'
                                              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                              }`}
                                          >
                                            {u.label}
                                          </button>
                                        ))}
                                      </div>

                                      {/* Qty +/- */}
                                      <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200">
                                        <button
                                          type="button"
                                          onClick={() => updateWalkInQty(item.product._id, currentUnit, -1)}
                                          className="w-5 h-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center justify-center cursor-pointer font-black text-xs"
                                        >
                                          -
                                        </button>
                                        <span className="font-black text-gray-900 text-xs w-6 text-center">{item.quantity}</span>
                                        <button
                                          type="button"
                                          onClick={() => updateWalkInQty(item.product._id, currentUnit, 1)}
                                          className="w-5 h-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center justify-center cursor-pointer font-black text-xs"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>

                                    {/* Live Dynamic Breakdown: 1 Peti = 12 Trays • 360 Eggs */}
                                    {(() => {
                                      const tPerPeti = item.product?.traysPerPeti || 12;
                                      const ePerTray = item.product?.eggsPerTray || 30;
                                      const ePerPeti = tPerPeti * ePerTray;
                                      const qty = Number(item.quantity) || 1;
                                      let breakdownStr = '';
                                      if (currentUnit === 'peti') {
                                        const totalTrays = (qty * tPerPeti).toFixed(1).replace(/\.0$/, '');
                                        const totalEggs = Math.round(qty * ePerPeti).toLocaleString();
                                        breakdownStr = `${totalTrays} Trays • ${totalEggs} Eggs`;
                                      } else if (currentUnit === 'tray') {
                                        const totalEggs = Math.round(qty * ePerTray).toLocaleString();
                                        const totalPetis = (qty / tPerPeti).toFixed(2).replace(/\.00$/, '');
                                        breakdownStr = `${totalEggs} Eggs • ${totalPetis} Peti`;
                                      } else {
                                        const totalTrays = (qty / ePerTray).toFixed(1).replace(/\.0$/, '');
                                        const totalPetis = (qty / ePerPeti).toFixed(2).replace(/\.00$/, '');
                                        breakdownStr = `${totalTrays} Trays • ${totalPetis} Peti`;
                                      }

                                      return (
                                        <div className="flex items-center justify-between px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg text-[10px] font-black text-emerald-800">
                                          <span className="uppercase text-emerald-700 flex items-center gap-1 font-bold">
                                            <span>⚡</span> {qty} {currentUnit.toUpperCase()} =
                                          </span>
                                          <span className="font-extrabold text-emerald-900 tracking-tight">{breakdownStr}</span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Bill Total & Complete */}
                        <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Amount</span>
                            <span className="text-2xl font-black text-emerald-600">
                              {currency} {walkInCart.reduce((sum, i) => {
                                const rate = i.unitPrice || getProductUnitPrice(i.product, i.selectedUnit || 'tray');
                                return sum + (rate * (Number(i.quantity) || 1));
                              }, 0).toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={handleCompleteWalkInSale}
                            disabled={walkInCart.length === 0 || isProcessingWalkIn}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs uppercase tracking-[0.15em] rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {isProcessingWalkIn ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Receipt className="w-4 h-4" />
                                <span>Complete Sale & Generate Bill</span>
                              </>
                            )}
                          </button>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ─── SHOPADMIN SALES & BILLS HISTORY VIEW ─── */}
              {activeView === 'sales' && isAdminUser && (
                <div className="space-y-4">
                  {/* Top Banner - white/gray theme */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-700 text-xs font-black uppercase tracking-widest mb-0.5">
                        <DollarSign className="w-4 h-4" /> Sales & Bills History
                      </div>
                      <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">All Customer Sales Records</h2>
                      <p className="text-gray-500 text-xs mt-0.5">Print, share on WhatsApp, or delete records.</p>
                    </div>
                    <button
                      onClick={() => setActiveView('walkin')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 shadow transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> New Sale
                    </button>
                  </div>

                  {/* Summary Cards - light theme */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Sales</p>
                      <p className="text-xl font-black text-gray-900 mt-0.5">{shopSalesList.length}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue</p>
                      <p className="text-xl font-black text-emerald-600 mt-0.5">
                        {currency} {shopSalesList.reduce((sum, s) => sum + (s.totalAmount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profit</p>
                      <p className="text-xl font-black text-amber-600 mt-0.5">
                        {currency} {shopSalesList.reduce((sum, s) => sum + (s.totalProfit || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Sales Table - white/gray, compact, responsive */}
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    {/* Table Header */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">All Sales Records</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleExportAllSalesExcel}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Export
                        </button>
                        <button
                          onClick={fetchShopSales}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-700 uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>

                    {loadingSales ? (
                      <div className="p-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                        Loading sales...
                      </div>
                    ) : shopSalesList.length === 0 ? (
                      <div className="p-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                        No sales records found yet
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="px-3 py-2.5">#</th>
                              <th className="px-3 py-2.5">Date</th>
                              <th className="px-3 py-2.5">Customer</th>
                              <th className="px-3 py-2.5">Payment</th>
                              <th className="px-3 py-2.5">Items</th>
                              <th className="px-3 py-2.5 text-right">Total</th>
                              <th className="px-3 py-2.5 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {shopSalesList.map(sale => {
                              const serialNo = sale.serialNumber || (sale.invoiceNumber ? sale.invoiceNumber.replace(/\D/g, '') : '') || String(sale._id || '').slice(-6);
                              return (
                                <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                                  {/* Serial */}
                                  <td className="px-3 py-2.5">
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 font-mono font-black text-[10px] rounded">
                                      #{serialNo}
                                    </span>
                                  </td>
                                  {/* Date */}
                                  <td className="px-3 py-2.5 text-gray-500 font-medium whitespace-nowrap">
                                    {new Date(sale.saleDate || sale.createdAt).toLocaleString()}
                                  </td>
                                  {/* Customer */}
                                  <td className="px-3 py-2.5">
                                    <p className="font-black text-gray-900 uppercase text-[11px]">{sale.customerName || 'Walk-in'}</p>
                                    {sale.customerPhone && <p className="text-gray-400 text-[10px] font-mono">{sale.customerPhone}</p>}
                                  </td>
                                  {/* Payment */}
                                  <td className="px-3 py-2.5">
                                    {sale.paymentMethod === 'BANK_TRANSFER' || sale.paymentMethod === 'EASYPAISA' || sale.paymentMethod === 'ONLINE' ? (
                                      <div className="space-y-1">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase ${sale.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                          <Building2 className="w-2.5 h-2.5" />
                                          {sale.approvalStatus === 'APPROVED' ? 'Bank ✓' : 'Bank ⏳'}
                                        </span>
                                        {sale.paymentProof && (
                                          <button onClick={() => setViewingReceiptModal(sale.paymentProof)} className="block text-[9px] text-indigo-600 font-bold underline cursor-pointer">
                                            View Receipt
                                          </button>
                                        )}
                                        {sale.approvalStatus !== 'APPROVED' && (
                                          <button onClick={() => handleApproveSale(sale._id)} className="block text-[9px] text-emerald-600 font-bold underline cursor-pointer">
                                            Approve
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-black uppercase">
                                        <DollarSign className="w-2.5 h-2.5" /> Cash
                                      </span>
                                    )}
                                  </td>
                                  {/* Items */}
                                  <td className="px-3 py-2.5 text-gray-500 text-[10px] max-w-[160px]">
                                    <span className="line-clamp-2">{(sale.items || []).map(i => `${i.name}(${i.quantity})`).join(', ')}</span>
                                  </td>
                                  {/* Total */}
                                  <td className="px-3 py-2.5 text-right font-black text-emerald-600 text-sm whitespace-nowrap">
                                    {currency} {(sale.totalAmount || 0).toLocaleString()}
                                  </td>
                                  {/* Actions */}
                                  <td className="px-3 py-2.5">
                                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                      <button
                                        onClick={() => setCompletedBill(sale)}
                                        className="px-2 py-1 bg-gray-100 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[9px] uppercase border border-gray-200 hover:border-emerald-200 transition-all flex items-center gap-1 cursor-pointer"
                                        title="View Bill"
                                      >
                                        <Receipt className="w-3 h-3" /> Bill
                                      </button>
                                      <button
                                        onClick={() => handlePrintCustomerSingleRecord(sale)}
                                        className="px-2 py-1 bg-gray-100 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[9px] uppercase border border-gray-200 hover:border-blue-200 transition-all flex items-center gap-1 cursor-pointer"
                                        title="Print Record"
                                      >
                                        <Printer className="w-3 h-3" /> Print
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSale(sale._id)}
                                        className="px-2 py-1 bg-gray-100 hover:bg-red-100 text-red-600 rounded-lg font-bold text-[9px] uppercase border border-gray-200 hover:border-red-200 transition-all flex items-center gap-1 cursor-pointer"
                                        title="Delete Sale Record"
                                      >
                                        <Trash2 className="w-3 h-3" /> Del
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── EASYPAISA & CUSTOMER ORDERS VIEW FOR SHOP ADMIN ─── */}
              {activeView === 'orders' && isAdminUser && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <OrdersManagement shopId={shopId} />
                </div>
              )}

              {/* ─── REGISTERED CUSTOMERS DIRECTORY VIEW FOR SHOP ADMIN ─── */}
              {activeView === 'registered-customers' && isAdminUser && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-gradient-to-r from-[#1B3817] via-[#24491F] to-[#0f172a] p-6 rounded-3xl border border-white/10 shadow-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-widest mb-1">
                        <Users className="w-4 h-4" /> Customer Management Directory
                      </div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tight">Registered Customers Directory</h2>
                      <p className="text-slate-300 text-xs mt-1">
                        View all customer accounts registered to this shop and print individual customer statement records.
                      </p>
                    </div>

                    <button
                      onClick={fetchRegisteredCustomers}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" /> Refresh Customers List
                    </button>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-3xl overflow-visible shadow-sm">
                    <div className="p-4 sm:p-5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        All Registered Customer Accounts ({registeredCustomersList.length})
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest">
                        {shop?.name || 'Shop'} Portal
                      </span>
                    </div>

                    {loadingCustomers ? (
                      <div className="p-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                        Loading registered customers directory...
                      </div>
                    ) : registeredCustomersList.length === 0 ? (
                      <div className="p-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                        No registered customer accounts found for this shop yet
                      </div>
                    ) : (
                      <div className="overflow-x-auto min-h-[320px] pb-28 relative">
                        {/* Backdrop overlay to close dropdown on click outside */}
                        {activeCustMenuId && (
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setActiveCustMenuId(null)}
                          />
                        )}

                        <table className="w-full text-left text-xs text-gray-800">
                          <thead className="bg-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="p-3.5 text-center">Serial #</th>
                              <th className="p-3.5">Customer Name</th>
                              <th className="p-3.5">Email Address</th>
                              <th className="p-3.5">Phone / Contact</th>
                              <th className="p-3.5">Total Shopping Spent</th>
                              <th className="p-3.5">Orders Count</th>
                              <th className="p-3.5">Registration Date</th>
                              <th className="p-3.5 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {registeredCustomersList.map((cust, idx) => {
                              const { totalSpent, ordersCount } = getCustomerStats(cust);
                              const serialNo = idx + 1;
                              const uniqueId = `CUST-${String(serialNo).padStart(4, '0')}`;
                              const isMenuOpen = activeCustMenuId === cust._id;

                              return (
                                <tr key={cust._id} className="hover:bg-gray-50/80 transition-colors">
                                  <td className="p-3.5 text-center">
                                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-black">
                                      #{serialNo}
                                    </span>
                                  </td>
                                  <td className="p-3.5 font-black uppercase text-gray-900 flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-black text-xs shrink-0">
                                      {(cust.fullName || 'C')[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <span className="block font-black text-gray-900">{cust.fullName}</span>
                                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mt-0.5">
                                        {uniqueId}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3.5 font-bold text-gray-600">{cust.email}</td>
                                  <td className="p-3.5 font-bold text-teal-700">{cust.phone || '—'}</td>
                                  <td className="p-3.5 font-black text-emerald-700 text-sm">
                                    {currency} {totalSpent.toLocaleString('en-PK')}
                                  </td>
                                  <td className="p-3.5 font-black text-amber-800">
                                    <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold">
                                      {ordersCount} {ordersCount === 1 ? 'Order' : 'Orders'}
                                    </span>
                                  </td>
                                  <td className="p-3.5 font-semibold text-gray-500">
                                    {new Date(cust.createdAt || Date.now()).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="p-3.5 text-center relative">
                                    <div className="flex items-center justify-center">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveCustMenuId(isMenuOpen ? null : cust._id);
                                        }}
                                        className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm flex items-center justify-center active:scale-95 relative z-40 ${isMenuOpen
                                          ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                                          }`}
                                        title="Actions & Export Options"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* 3-Dot Dropdown Menu (Guaranteed Visible) */}
                                    {isMenuOpen && (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute right-2 top-11 w-52 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 text-left"
                                      >
                                        <button
                                          onClick={() => {
                                            setActiveCustMenuId(null);
                                            handlePrintRegisteredCustomerRecord(cust, idx);
                                          }}
                                          className="w-full px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                        >
                                          <Printer className="w-4 h-4 text-indigo-600" />
                                          <span>Print Statement</span>
                                        </button>

                                        <button
                                          onClick={() => {
                                            setActiveCustMenuId(null);
                                            handlePrintRegisteredCustomerRecord(cust, idx);
                                          }}
                                          className="w-full px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-rose-50 hover:text-rose-700 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                        >
                                          <FileText className="w-4 h-4 text-rose-600" />
                                          <span>PDF Statement</span>
                                        </button>

                                        <button
                                          onClick={() => {
                                            setActiveCustMenuId(null);
                                            handleWhatsAppCustomerShare(cust, idx);
                                          }}
                                          className="w-full px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                        >
                                          <Send className="w-4 h-4 text-emerald-600" />
                                          <span>WhatsApp</span>
                                        </button>

                                        <button
                                          onClick={() => {
                                            setActiveCustMenuId(null);
                                            handleExportCustomerExcel(cust, idx);
                                          }}
                                          className="w-full px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                        >
                                          <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                          <span>Excel Sheet</span>
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── 1. SALES REPORT VIEW FOR SHOP ADMIN ─── */}
              {activeView === 'report-sales' && isAdminUser && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-7 rounded-[2rem] border border-slate-700/80 shadow-2xl text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight">
                            Sales Analytics Report
                          </h2>
                          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                            Real-time Revenue, Orders, Egg Quantities &amp; Invoices
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handlePrintSingleReport('sales', reportTimeframe)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider border border-slate-600 transition-all cursor-pointer shadow-sm hover:border-emerald-400"
                        title="Print PDF Sales Report"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Print PDF</span>
                      </button>

                      <button
                        onClick={() => handleWhatsAppReportShare('sales', reportTimeframe)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider border border-emerald-500 transition-all cursor-pointer shadow-sm"
                        title="Share via WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5 text-white" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleExportExcelReport(reportTimeframe)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider border border-emerald-600 transition-all cursor-pointer shadow-sm"
                        title="Export Excel (.csv) Report"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Excel</span>
                      </button>

                      <button
                        onClick={fetchShopSales}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                        title="Refresh Sales"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      {/* Day / Month / Year Timeframe Selector */}
                      <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                        {[
                          { id: 'ALL', label: 'All-Time' },
                          { id: 'DAY', label: 'Today (Day)' },
                          { id: 'MONTH', label: 'This Month' },
                          { id: 'YEAR', label: 'This Year' },
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setReportTimeframe(t.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${reportTimeframe === t.id
                              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                              }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Top 4 Dynamic Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Card 1: Total Sales Revenue */}
                    <div className="bg-white border-2 border-emerald-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                          {reportTimeframe === 'DAY' ? 'Today Revenue' : reportTimeframe === 'MONTH' ? 'Monthly Revenue' : reportTimeframe === 'YEAR' ? 'Yearly Revenue' : 'Total Revenue'}
                        </span>
                        <div className="p-1.5 bg-emerald-100 rounded-lg">
                          <Banknote className="w-3.5 h-3.5 text-emerald-700" />
                        </div>
                      </div>
                      <h4 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-700">
                        {currency} {Number(salesReportStats.totalRevenue || 0).toLocaleString('en-PK')}
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400 uppercase mt-1 block">
                        Cash: Rs. {Number(salesReportStats.cashSales || 0).toLocaleString('en-PK')} • Bank: Rs. {Number(salesReportStats.onlineSales || 0).toLocaleString('en-PK')}
                      </span>
                    </div>

                    {/* Card 2: Total Orders / Bills */}
                    <div className="bg-white border-2 border-blue-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">
                          Orders / Bills
                        </span>
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Receipt className="w-3.5 h-3.5 text-blue-700" />
                        </div>
                      </div>
                      <h4 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
                        {salesReportStats.totalBills} <span className="text-base text-blue-700">Bills</span>
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400 uppercase mt-1 block">
                        Avg Sale: Rs. {Number(salesReportStats.avgBill || 0).toLocaleString('en-PK')}
                      </span>
                    </div>

                    {/* Card 3: Stock Eggs Sold */}
                    <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
                          Eggs Sold (Volume)
                        </span>
                        <div className="p-1.5 bg-amber-100 rounded-lg">
                          <Box className="w-3.5 h-3.5 text-amber-700" />
                        </div>
                      </div>
                      <h4 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
                        {salesReportStats.totalPetis} <span className="text-base text-amber-700">Petis</span>
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400 uppercase mt-1 block">
                        {salesReportStats.totalTrays} Trays • {Number(salesReportStats.totalEggs || 0).toLocaleString('en-PK')} Eggs
                      </span>
                    </div>

                    {/* Card 4: Net Profit Earned */}
                    <div className="bg-white border-2 border-teal-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-teal-700 uppercase tracking-widest">
                          Net Profit Earned
                        </span>
                        <div className="p-1.5 bg-teal-100 rounded-lg">
                          <DollarSign className="w-3.5 h-3.5 text-teal-700" />
                        </div>
                      </div>
                      <h4 className="text-xl sm:text-2xl font-black tracking-tight text-teal-700">
                        {currency} {Number(salesReportStats.totalProfit || 0).toLocaleString('en-PK')}
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400 uppercase mt-1 block">
                        Filtered Period Earnings
                      </span>
                    </div>
                  </div>

                  {/* Search and Invoices Section */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-emerald-600" /> Itemized Sales Invoices ({filteredSalesForReport.length})
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                          Filtered by <strong className="text-gray-700">{reportTimeframe}</strong> timeframe
                        </p>
                      </div>

                      {/* Search Input */}
                      <div className="flex items-center gap-2 bg-gray-100 px-3.5 py-1.5 rounded-xl w-full sm:w-72 border border-gray-200">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input
                          type="text"
                          value={salesReportSearchTerm}
                          onChange={(e) => setSalesReportSearchTerm(e.target.value)}
                          placeholder="Search Invoice, Customer, Phone..."
                          className="bg-transparent text-xs font-bold outline-none w-full text-gray-800 placeholder:text-gray-400"
                        />
                        {salesReportSearchTerm && (
                          <button
                            onClick={() => setSalesReportSearchTerm('')}
                            className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sales Table */}
                    <div className="overflow-x-auto rounded-2xl border border-gray-200">
                      <table className="w-full text-left text-xs text-gray-800">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">Invoice #</th>
                            <th className="p-3">Date &amp; Time</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Items Purchased</th>
                            <th className="p-3 text-center">Payment</th>
                            <th className="p-3 text-right">Total Amount</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredSalesForReport.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="p-8 text-center text-gray-400 font-bold">
                                No sales records found for this period.
                              </td>
                            </tr>
                          ) : (
                            filteredSalesForReport.map((s, idx) => {
                              const inv = s.invoiceNumber || (s.serialNumber ? `#${s.serialNumber}` : `INV-${String(idx + 1).padStart(4, '0')}`);
                              const sDate = new Date(s.saleDate || s.createdAt || Date.now()).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                              const cust = s.customerName || 'Walk-in Customer';
                              const phone = s.customerPhone || '';
                              const method = s.paymentMethod || 'CASH';
                              const total = Number(s.totalAmount) || 0;
                              const isCash = method === 'CASH';

                              return (
                                <tr key={s._id || idx} className="hover:bg-gray-50/80 transition-colors">
                                  <td className="p-3 font-bold text-gray-400">{idx + 1}</td>
                                  <td className="p-3 font-black text-gray-900">{inv}</td>
                                  <td className="p-3 text-[11px] font-bold text-gray-600">{sDate}</td>
                                  <td className="p-3">
                                    <div className="font-extrabold text-gray-900">{cust}</div>
                                    {phone && <div className="text-[10px] text-teal-700 font-bold">📞 {phone}</div>}
                                  </td>
                                  <td className="p-3">
                                    <div className="space-y-0.5 max-w-xs">
                                      {(s.items || []).map((i, iIdx) => (
                                        <span key={iIdx} className="inline-block bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-md mr-1 mb-0.5">
                                          {i.name} (x{i.quantity})
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isCash
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                      }`}>
                                      {method}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-black text-emerald-700">
                                    {currency} {total.toLocaleString('en-PK')}
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setCompletedBill(s)}
                                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all cursor-pointer"
                                        title="View & Print Bill"
                                      >
                                        <Printer className="w-3.5 h-3.5 text-gray-700" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSale(s._id)}
                                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer"
                                        title="Delete Sale"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                        {filteredSalesForReport.length > 0 && (
                          <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-black text-xs">
                            <tr>
                              <td colSpan="6" className="p-3 text-right text-gray-600 uppercase">
                                Total ({filteredSalesForReport.length} Sales):
                              </td>
                              <td className="p-3 text-right text-emerald-700 text-sm">
                                {currency} {Number(salesReportStats.totalRevenue || 0).toLocaleString('en-PK')}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── 2. PROFIT REPORT VIEW FOR SHOP ADMIN ─── */}
              {activeView === 'report-profit' && isAdminUser && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Executive Dark Navy / Emerald Header Banner */}
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-7 rounded-[2rem] border border-slate-800 shadow-2xl text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
                          <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                            Official Financial Profit &amp; Loss Ledger
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-0.5">
                            Pure Realized Net Profit Statement
                          </h2>
                          <p className="text-slate-400 text-xs font-medium mt-1">
                            Sales Revenue minus Purchases (Petis • Trays • Eggs), Operating Expenses &amp; Damaged Stock Losses
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={() => handlePrintSingleReport('profit', reportTimeframe)}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider border border-slate-700 transition-all cursor-pointer shadow-sm hover:border-emerald-400 flex items-center gap-1.5"
                        title="Print PDF Profit Report"
                      >
                        <Printer className="w-4 h-4 text-emerald-400" />
                        <span>Print PDF</span>
                      </button>

                      <button
                        onClick={() => handleWhatsAppReportShare('profit', reportTimeframe)}
                        className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider border border-emerald-500/40 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                        title="Share via WhatsApp"
                      >
                        <Send className="w-4 h-4 text-white" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleExportExcelReport('profit', reportTimeframe)}
                        className="px-3.5 py-2.5 rounded-xl bg-green-800 hover:bg-green-700 text-white text-xs font-black uppercase tracking-wider border border-green-600/40 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                        title="Export Excel Report"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                        <span>Excel Sheet</span>
                      </button>

                      <button
                        onClick={() => { fetchShopSales(); fetchExpenses(); fetchDamagedProducts(); }}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                        title="Refresh Data"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      {/* Day / Month / Year Timeframe Selector */}
                      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
                        {[
                          { id: 'ALL', label: 'All-Time' },
                          { id: 'DAY', label: 'Today (Day)' },
                          { id: 'MONTH', label: 'This Month' },
                          { id: 'YEAR', label: 'This Year' },
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setReportTimeframe(t.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${reportTimeframe === t.id
                              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800'
                              }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ─── 1. Period Sales & Gross Profit Summary (Day, Month, Year & Total) ─── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        1. Sales Revenue &amp; Gross Profit Overview (Day • Month • Year)
                      </h4>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Sales Performance
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Today's Sales */}
                      <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1.5">
                          <span>Today's Sales</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[9px]">DAILY</span>
                        </div>
                        <h4 className="text-xl font-black text-emerald-700 tracking-tight">
                          {currency} {(profitReportStats.todaySalesTotal || 0).toLocaleString('en-PK')}
                        </h4>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-100 text-[11px] font-bold">
                          <span className="text-gray-500">Gross Profit:</span>
                          <span className="text-emerald-700 font-black">{currency} {(profitReportStats.todayProfitTotal || 0).toLocaleString('en-PK')}</span>
                        </div>
                      </div>

                      {/* This Month's Sales */}
                      <div className="bg-white border border-indigo-200/80 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-indigo-700 mb-1.5">
                          <span>This Month Sales</span>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full text-[9px]">MONTHLY</span>
                        </div>
                        <h4 className="text-xl font-black text-indigo-700 tracking-tight">
                          {currency} {(profitReportStats.monthSalesTotal || 0).toLocaleString('en-PK')}
                        </h4>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-100 text-[11px] font-bold">
                          <span className="text-gray-500">Gross Profit:</span>
                          <span className="text-indigo-700 font-black">{currency} {(profitReportStats.monthProfitTotal || 0).toLocaleString('en-PK')}</span>
                        </div>
                      </div>

                      {/* This Year's Sales */}
                      <div className="bg-white border border-purple-200/80 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-purple-700 mb-1.5">
                          <span>This Year Sales</span>
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-full text-[9px]">YEARLY</span>
                        </div>
                        <h4 className="text-xl font-black text-purple-700 tracking-tight">
                          {currency} {(profitReportStats.yearSalesTotal || 0).toLocaleString('en-PK')}
                        </h4>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-purple-100 text-[11px] font-bold">
                          <span className="text-gray-500">Gross Profit:</span>
                          <span className="text-purple-700 font-black">{currency} {(profitReportStats.yearProfitTotal || 0).toLocaleString('en-PK')}</span>
                        </div>
                      </div>

                      {/* Lifetime Total Sales */}
                      <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1.5">
                          <span>All-Time Total Sales</span>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[9px]">ALL-TIME</span>
                        </div>
                        <h4 className="text-xl font-black text-amber-700 tracking-tight">
                          {currency} {(profitReportStats.allSalesTotal || 0).toLocaleString('en-PK')}
                        </h4>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-100 text-[11px] font-bold">
                          <span className="text-gray-500">Total Profit:</span>
                          <span className="text-amber-700 font-black">{currency} {(profitReportStats.allProfitTotal || 0).toLocaleString('en-PK')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ─── 2. Step-by-Step Financial Deductions Flow ─── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-teal-600" />
                        2. Net Profit Calculation Flow ({reportTimeframe === 'DAY' ? 'Today' : reportTimeframe === 'MONTH' ? 'This Month' : reportTimeframe === 'YEAR' ? 'This Year' : 'All-Time'})
                      </h4>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Revenue - Purchases - Expenses - Damage = Net Profit
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                      {/* Card 1: Total Sales Revenue */}
                      <div className="bg-white border-2 border-emerald-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                              (+) 1. Total Sales
                            </span>
                            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                              <TrendingUp className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <h4 className="text-lg sm:text-xl font-black tracking-tight text-emerald-700">
                            + {currency} {Number(profitReportStats.totalRevenue || 0).toLocaleString('en-PK')}
                          </h4>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] font-bold text-gray-500">
                          {profitReportStats.filteredSalesCount} Invoices
                        </div>
                      </div>

                      {/* Card 2: Purchased Products (Cost) */}
                      <div className="bg-white border-2 border-blue-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">
                              (-) 2. Purchases Cost
                            </span>
                            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
                              <Truck className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <h4 className="text-lg sm:text-xl font-black tracking-tight text-blue-700">
                            - {currency} {Number(profitReportStats.totalPurchasesCost || 0).toLocaleString('en-PK')}
                          </h4>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-blue-50 space-y-1">
                          <div className="flex flex-wrap gap-1 text-[9px] font-black">
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded">
                              📦 {profitReportStats.totalPurchasesPetis} P
                            </span>
                            <span className="px-1.5 py-0.5 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded">
                              🍱 {profitReportStats.totalPurchasesTrays} T
                            </span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                              🥚 {profitReportStats.totalPurchasesEggs.toLocaleString('en-PK')} E
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Shop Operating Expenses */}
                      <div className="bg-white border-2 border-rose-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest">
                              (-) 3. Shop Expenses
                            </span>
                            <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <h4 className="text-lg sm:text-xl font-black tracking-tight text-rose-700">
                            - {currency} {Number(profitReportStats.totalExpenses || 0).toLocaleString('en-PK')}
                          </h4>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] font-bold text-gray-500">
                          {profitReportStats.filteredExpensesCount} Expense Logs
                        </div>
                      </div>

                      {/* Card 4: Damaged Egg Loss */}
                      <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
                              (-) 4. Damaged Loss
                            </span>
                            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                              <PackageX className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <h4 className="text-lg sm:text-xl font-black tracking-tight text-amber-700">
                            - {currency} {Number(profitReportStats.totalDamagedLoss || 0).toLocaleString('en-PK')}
                          </h4>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] font-bold text-amber-800">
                          {profitReportStats.filteredDamagedCount} Logs ({profitReportStats.totalDamagedEggs} Eggs)
                        </div>
                      </div>

                      {/* Card 5: Final Pure Realized Net Profit */}
                      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border-2 border-emerald-400 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black text-emerald-900 uppercase tracking-widest">
                              (=) 5. Pure Net Profit
                            </span>
                            <div className="p-1.5 bg-emerald-200 rounded-lg text-emerald-900">
                              <DollarSign className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <h4 className={`text-lg sm:text-xl font-black tracking-tight ${profitReportStats.finalNetProfit >= 0 ? 'text-emerald-900' : 'text-rose-700'}`}>
                            {currency} {Number(profitReportStats.finalNetProfit || 0).toLocaleString('en-PK')}
                          </h4>
                        </div>
                        <div className="mt-3 pt-2 border-t border-emerald-200 text-[10px] font-black text-emerald-800 uppercase">
                          Realized Cash Balance
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ─── 3. Financial Reconciliation Statement Table (White & Gray) ─── */}
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          Financial Profit &amp; Loss Statement ({reportTimeframe})
                        </h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                          Transparent ledger deducting product purchases, operating expenses &amp; damaged stock
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest">
                        {shop?.name || 'Shop'} Accounts
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-gray-200">
                      <table className="w-full text-left text-xs text-gray-800">
                        <thead className="bg-gray-100 text-[10px] font-black text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="p-3.5 text-center">#</th>
                            <th className="p-3.5">Financial Line Item &amp; Description</th>
                            <th className="p-3.5 text-center">Source / Stock Details</th>
                            <th className="p-3.5 text-center">Records / Quantity</th>
                            <th className="p-3.5 text-right">Amount (RS)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-bold">
                          {/* Row 1: Total Sales Revenue */}
                          <tr className="hover:bg-gray-50/80 transition-colors">
                            <td className="p-3.5 text-center text-gray-400 font-bold">1</td>
                            <td className="p-3.5 text-emerald-800 font-extrabold flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              (+) Total Sales Revenue Earned
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Sales Revenue
                              </span>
                            </td>
                            <td className="p-3.5 text-center text-gray-600">
                              {profitReportStats.filteredSalesCount} Sales Invoices
                            </td>
                            <td className="p-3.5 text-right text-emerald-700 font-black text-sm">
                              + {currency} {Number(profitReportStats.totalRevenue || 0).toLocaleString('en-PK')}
                            </td>
                          </tr>

                          {/* Row 2: Purchased Products Cost */}
                          <tr className="hover:bg-gray-50/80 transition-colors">
                            <td className="p-3.5 text-center text-gray-400 font-bold">2</td>
                            <td className="p-3.5 text-blue-900 font-extrabold">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                (-) Purchased Products / Restocks Cost
                              </div>
                              <div className="text-[10px] text-gray-500 font-normal pl-4 mt-0.5">
                                Stock acquired from suppliers during this period
                              </div>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="inline-flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-black">
                                  📦 {profitReportStats.totalPurchasesPetis} Petis
                                </span>
                                <span className="px-2 py-0.5 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded text-[9px] font-black">
                                  🍱 {profitReportStats.totalPurchasesTrays} Trays
                                </span>
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[9px] font-black">
                                  🥚 {profitReportStats.totalPurchasesEggs.toLocaleString('en-PK')} Eggs
                                </span>
                              </div>
                            </td>
                            <td className="p-3.5 text-center text-gray-600">
                              {profitReportStats.filteredPurchasesCount} Restocks
                            </td>
                            <td className="p-3.5 text-right text-blue-700 font-black text-sm">
                              - {currency} {Number(profitReportStats.totalPurchasesCost || 0).toLocaleString('en-PK')}
                            </td>
                          </tr>

                          {/* Row 3: Shop Operational Expenses */}
                          <tr className="hover:bg-gray-50/80 transition-colors">
                            <td className="p-3.5 text-center text-gray-400 font-bold">3</td>
                            <td className="p-3.5 text-rose-800 font-extrabold">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                (-) Shop Operational Expenses (Bills, Rent, Logistics)
                              </div>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-rose-50 text-rose-800 border border-rose-200">
                                Overhead Cost
                              </span>
                            </td>
                            <td className="p-3.5 text-center text-gray-600">
                              {profitReportStats.filteredExpensesCount} Expense Logs
                            </td>
                            <td className="p-3.5 text-right text-rose-700 font-black text-sm">
                              - {currency} {Number(profitReportStats.totalExpenses || 0).toLocaleString('en-PK')}
                            </td>
                          </tr>

                          {/* Row 4: Damaged Egg Loss */}
                          <tr className="hover:bg-gray-50/80 transition-colors">
                            <td className="p-3.5 text-center text-gray-400 font-bold">4</td>
                            <td className="p-3.5 text-amber-800 font-extrabold">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                (-) Damaged / Broken Egg Inventory Loss
                              </div>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                                Waste &amp; Breakage
                              </span>
                            </td>
                            <td className="p-3.5 text-center text-gray-600">
                              {profitReportStats.filteredDamagedCount} Logs ({profitReportStats.totalDamagedEggs} Eggs)
                            </td>
                            <td className="p-3.5 text-right text-amber-700 font-black text-sm">
                              - {currency} {Number(profitReportStats.totalDamagedLoss || 0).toLocaleString('en-PK')}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-emerald-50 border-t-2 border-emerald-200 font-black text-xs">
                          <tr>
                            <td colSpan="4" className="p-4 text-right text-emerald-950 uppercase font-black text-xs tracking-wider">
                              (=) FINAL PURE REALIZED NET PROFIT:
                            </td>
                            <td className={`p-4 text-right text-base font-black ${profitReportStats.finalNetProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                              {currency} {Number(profitReportStats.finalNetProfit || 0).toLocaleString('en-PK')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── 3. EXPENSES & LOSS REPORT VIEW FOR SHOP ADMIN ─── */}
              {activeView === 'report-expenses' && isAdminUser && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Executive Slate-Gray Header Banner */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-7 rounded-[2rem] border border-slate-700 shadow-2xl text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-400">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-rose-300 text-xs font-black uppercase tracking-widest">
                            Shop Expenses &amp; Returns Loss Analytics
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-0.5">
                            Business Expenses &amp; Loss Report
                          </h2>
                          <p className="text-slate-300 text-xs font-medium mt-1">
                            Track and analyze operating overheads, rent, utilities, transport, and egg breakage losses.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={() => setShowAddExpenseModal(true)}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Log Expense
                      </button>
                      <button
                        onClick={() => handlePrintSingleReport('expenses', reportTimeframe)}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" /> Print PDF Report
                      </button>
                      <button
                        onClick={() => handleWhatsAppReportShare('expenses', reportTimeframe)}
                        className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all active:scale-95 border border-emerald-500/40 cursor-pointer"
                      >
                        <Send className="w-4 h-4" /> Share WhatsApp
                      </button>
                      <button
                        onClick={() => handleExportExcelReport('expenses', reportTimeframe)}
                        className="px-4 py-2.5 bg-green-700 hover:bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all active:scale-95 border border-green-500/40 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" /> Generate Excel
                      </button>
                    </div>
                  </div>

                  {/* 4 Clean White & Gray KPI Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">
                        <span>Today's Expenses</span>
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[9px] font-black">DAILY</span>
                      </div>
                      <h4 className="text-2xl font-black text-rose-600 tracking-tight">
                        {currency} {(dynamicExpenseStats.todayExp || 0).toLocaleString('en-PK')}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">{dynamicExpenseStats.todayExpCount} expense entries logged today</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">
                        <span>This Month Expenses</span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-black">MONTHLY</span>
                      </div>
                      <h4 className="text-2xl font-black text-amber-600 tracking-tight">
                        {currency} {(dynamicExpenseStats.monthExp || 0).toLocaleString('en-PK')}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">{dynamicExpenseStats.monthExpCount} cumulative expenses this month</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">
                        <span>This Year Expenses</span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[9px] font-black">YEARLY</span>
                      </div>
                      <h4 className="text-2xl font-black text-indigo-600 tracking-tight">
                        {currency} {(dynamicExpenseStats.yearExp || 0).toLocaleString('en-PK')}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">{dynamicExpenseStats.yearExpCount} full yearly operating costs</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">
                        <span>Damaged Egg Loss</span>
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[9px] font-black">BREAKAGE</span>
                      </div>
                      <h4 className="text-2xl font-black text-orange-600 tracking-tight">
                        {currency} {(dynamicExpenseStats.totalDamaged || 0).toLocaleString('en-PK')}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">{dynamicExpenseStats.totalDamagedEggs} egg cracked/broken stock losses</p>
                    </div>
                  </div>

                  {/* Main Expenses Table Container (White & Gray) */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl text-slate-800 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-4 h-4 text-rose-600" />
                          Expenses Timeframe Filter (Day / Month / Year)
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Filter and analyze operating expense entries and breakage losses by selected duration
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                        {[
                          { id: 'DAY', label: 'Today (Day)' },
                          { id: 'MONTH', label: 'This Month' },
                          { id: 'YEAR', label: 'This Year' },
                          { id: 'ALL', label: 'All-Time' },
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setReportTimeframe(t.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${reportTimeframe === t.id
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                              }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filtered Period Highlight Bar */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest block mb-1">
                          {reportTimeframe === 'DAY' ? 'Today (Day) Expenses & Losses' : reportTimeframe === 'MONTH' ? 'Monthly Expenses & Losses' : reportTimeframe === 'YEAR' ? 'Yearly Expenses & Losses' : 'All-Time Cumulative Expenses'}
                        </span>
                        <h4 className="text-3xl font-black text-slate-900 tracking-tight">
                          {currency} {(
                            reportTimeframe === 'DAY' ? dynamicExpenseStats.todayTotalLoss :
                              reportTimeframe === 'MONTH' ? dynamicExpenseStats.monthTotalLoss :
                                reportTimeframe === 'YEAR' ? dynamicExpenseStats.yearTotalLoss :
                                  dynamicExpenseStats.grandTotalLoss
                          ).toLocaleString('en-PK')}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setShowAddExpenseModal(true)}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Log Entry
                        </button>
                        <button
                          onClick={() => handlePrintSingleReport('expenses', reportTimeframe)}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Statement
                        </button>
                        <button
                          onClick={() => handleWhatsAppReportShare('expenses', reportTimeframe)}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs uppercase rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> WhatsApp
                        </button>
                        <button
                          onClick={() => handleExportExcelReport('expenses', reportTimeframe)}
                          className="px-3.5 py-2 bg-green-700 hover:bg-green-600 text-white font-black text-xs uppercase rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Logged Expenses Table */}
                    {(() => {
                      const now = new Date();
                      const filteredExpForTable = expensesList.filter(exp => {
                        const d = new Date(exp.expenseDate || exp.createdAt || Date.now());
                        if (reportTimeframe === 'DAY') return d.toDateString() === now.toDateString();
                        if (reportTimeframe === 'MONTH') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        if (reportTimeframe === 'YEAR') return d.getFullYear() === now.getFullYear();
                        return true;
                      });

                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                              <FileText className="w-4 h-4 text-rose-600" />
                              Itemized Logged Expenses ({filteredExpForTable.length} Entries)
                            </h4>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              {reportTimeframe === 'DAY' ? 'Today' : reportTimeframe === 'MONTH' ? 'This Month' : reportTimeframe === 'YEAR' ? 'This Year' : 'All-Time'}
                            </span>
                          </div>

                          {filteredExpForTable.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">No manual expenses logged for this period.</p>
                              <p className="text-[11px] text-slate-400 mt-1">Click "+ Log Entry" above to add shop rent, electricity, packaging, or egg damage expenses.</p>
                              <button
                                onClick={() => setShowAddExpenseModal(true)}
                                className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add First Expense
                              </button>
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-2xl border border-slate-200 min-h-[350px] pb-24">
                              <table className="w-full text-left text-xs text-slate-800">
                                <thead className="bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200">
                                  <tr>
                                    <th className="p-3.5 text-center">#</th>
                                    <th className="p-3.5">Expense Date</th>
                                    <th className="p-3.5">Expense Title / Description</th>
                                    <th className="p-3.5 text-center">Category</th>
                                    <th className="p-3.5 text-center">Payment Status</th>
                                    <th className="p-3.5">Amount (RS)</th>
                                    <th className="p-3.5">Logged By / Notes</th>
                                    <th className="p-3.5 text-center">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {filteredExpForTable.map((exp, idx) => {
                                    const isNearBottom = idx >= Math.max(1, filteredExpForTable.length - 3);
                                    return (
                                      <tr key={exp._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-3.5 text-center font-bold text-slate-400">
                                          {idx + 1}
                                        </td>
                                        <td className="p-3.5 font-bold text-slate-600">
                                          {new Date(exp.expenseDate || exp.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-3.5 font-black text-slate-900 uppercase">
                                          {exp.title}
                                        </td>
                                        <td className="p-3.5 text-center">
                                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${exp.category === 'Rent' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                            exp.category === 'Utilities / Bills' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                              exp.category === 'Salaries' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                                exp.category === 'Egg Damage / Loss' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                  exp.category === 'Transport & Freight' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            }`}>
                                            {exp.category}
                                          </span>
                                        </td>
                                        <td className="p-3.5 text-center">
                                          <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 font-black">
                                            ✓ Paid
                                          </span>
                                        </td>
                                        <td className="p-3.5 font-black text-rose-600 text-sm">
                                          {currency} {(Number(exp.amount) || 0).toLocaleString('en-PK')}
                                        </td>
                                        <td className="p-3.5 text-slate-500 text-[11px]">
                                          {exp.notes || exp.createdBy || 'Shop Admin'}
                                        </td>
                                        <td className="p-3.5 text-center relative">
                                          <div className="relative inline-block text-left">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveExpenseMenuId(activeExpenseMenuId === exp._id ? null : exp._id);
                                              }}
                                              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-sm border border-slate-200 hover:border-slate-300"
                                              title="Actions"
                                            >
                                              <MoreVertical className="w-4 h-4" />
                                            </button>

                                            {activeExpenseMenuId === exp._id && (
                                              <>
                                                <div
                                                  className="fixed inset-0 z-40"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveExpenseMenuId(null);
                                                  }}
                                                />
                                                <div className={`absolute right-0 ${isNearBottom ? 'bottom-full mb-2' : 'top-full mt-2'} z-50 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl p-1.5 text-left space-y-0.5 animate-in fade-in zoom-in-95 duration-150`}>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setActiveExpenseMenuId(null);
                                                      handleEditExpense(exp);
                                                    }}
                                                    className="w-full px-3 py-2 hover:bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer"
                                                  >
                                                    <Edit className="w-4 h-4 text-indigo-600" /> Edit Expense
                                                  </button>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setActiveExpenseMenuId(null);
                                                      handlePrintSingleExpense(exp, idx);
                                                    }}
                                                    className="w-full px-3 py-2 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer"
                                                  >
                                                    <Printer className="w-4 h-4 text-rose-600" /> Print (PDF)
                                                  </button>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setActiveExpenseMenuId(null);
                                                      handleWhatsAppSingleExpense(exp, idx);
                                                    }}
                                                    className="w-full px-3 py-2 hover:bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer"
                                                  >
                                                    <Send className="w-4 h-4 text-emerald-600" /> WhatsApp
                                                  </button>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setActiveExpenseMenuId(null);
                                                      handleExportSingleExpenseExcel(exp, idx);
                                                    }}
                                                    className="w-full px-3 py-2 hover:bg-green-50 text-green-700 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer"
                                                  >
                                                    <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel Sheet
                                                  </button>
                                                  <div className="border-t border-slate-100 my-1"></div>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setActiveExpenseMenuId(null);
                                                      handleDeleteExpense(exp._id);
                                                    }}
                                                    className="w-full px-3 py-2 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer"
                                                  >
                                                    <Trash2 className="w-4 h-4 text-red-600" /> Delete Entry
                                                  </button>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* ─── 4. DAMAGED PRODUCTS VIEW FOR SHOP ADMIN ─── */}
              {activeView === 'damaged-products' && isAdminUser && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-gradient-to-r from-[#1B3817] via-[#24491F] to-[#0f172a] p-6 rounded-3xl border border-white/10 shadow-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest mb-1">
                        <PackageX className="w-4 h-4" /> Damaged Stock & Inventory Loss Tracking
                      </div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tight">Damaged Products Loss Report</h2>
                      <p className="text-slate-300 text-xs mt-1">
                        Log egg breakages, cracked eggs, expired inventory, and transport losses dynamically.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setShowAddDamagedModal(true)}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> + Log Damaged
                      </button>
                      <button
                        onClick={() => handlePrintSingleReport('damaged', reportTimeframe)}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" /> Print PDF Report
                      </button>
                      <button
                        onClick={() => handleWhatsAppReportShare('damaged', reportTimeframe)}
                        className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all active:scale-95 border border-emerald-500/40 cursor-pointer"
                      >
                        <Send className="w-4 h-4" /> Share WhatsApp
                      </button>
                      <button
                        onClick={() => handleExportExcelReport('damaged', reportTimeframe)}
                        className="px-4 py-2.5 bg-green-700 hover:bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all active:scale-95 border border-green-500/40 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" /> Generate Excel
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl text-zinc-900 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black text-zinc-800 uppercase tracking-[0.15em] flex items-center gap-2">
                          <PackageX className="w-4 h-4 text-amber-600" />
                          Damaged Timeframe Selector (Days / Months / Year)
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                          Select time filter to isolate and display only that period's damaged stock report
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        {[
                          { id: 'DAY', label: 'Today (Day)' },
                          { id: 'MONTH', label: 'This Month' },
                          { id: 'YEAR', label: 'This Year' },
                          { id: 'ALL', label: 'All-Time' },
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setReportTimeframe(t.id)}
                            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${reportTimeframe === t.id
                              ? 'bg-amber-600 text-white shadow-md'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                              }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block mb-1">
                          {reportTimeframe === 'DAY' ? 'Today (Day) Damaged Stock Loss' : reportTimeframe === 'MONTH' ? 'Monthly Damaged Stock Loss' : reportTimeframe === 'YEAR' ? 'Yearly Damaged Stock Loss' : 'All-Time Total Damaged Loss'}
                        </span>
                        <h4 className="text-3xl font-black text-amber-600 tracking-tight">
                          {currency} {(
                            reportTimeframe === 'DAY' ? (dashStats.todayDamagedLoss || 0) :
                              reportTimeframe === 'MONTH' ? (dashStats.monthlyDamagedLoss || 0) :
                                reportTimeframe === 'YEAR' ? (dashStats.yearlyDamagedLoss || 0) :
                                  (dashStats.totalDamagedLoss || 0)
                          ).toLocaleString('en-PK')}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setShowAddDamagedModal(true)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-md cursor-pointer"
                        >
                          + Log Damaged
                        </button>
                        <button
                          onClick={() => handlePrintSingleReport('damaged', reportTimeframe)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print PDF Sheet
                        </button>
                        <button
                          onClick={() => handleWhatsAppReportShare('damaged', reportTimeframe)}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs uppercase rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Send WhatsApp
                        </button>
                        <button
                          onClick={() => handleExportExcelReport('damaged', reportTimeframe)}
                          className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-black text-xs uppercase rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Generate Excel
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-zinc-700 uppercase tracking-wider">Filtered Damaged Stock Period Statement</h4>
                      <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                        <table className="w-full text-left text-xs text-zinc-800">
                          <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-zinc-200">
                            <tr>
                              <th className="p-3.5">Selected Period</th>
                              <th className="p-3.5">Damaged Loss Amount (RS)</th>
                              <th className="p-3.5 text-right">Filter Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            {reportTimeframe === 'DAY' && (
                              <tr className="bg-amber-100/80 font-bold">
                                <td className="p-3.5 font-bold">Today (Daily Damaged Report)</td>
                                <td className="p-3.5 text-amber-700 font-bold">{currency} {(dashStats.todayDamagedLoss || 0).toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right"><span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 rounded-full font-black text-[9px]">TODAY ONLY</span></td>
                              </tr>
                            )}
                            {reportTimeframe === 'MONTH' && (
                              <tr className="bg-amber-100/80 font-bold">
                                <td className="p-3.5 font-bold">This Month (Monthly Damaged Report)</td>
                                <td className="p-3.5 text-amber-700 font-bold">{currency} {(dashStats.monthlyDamagedLoss || 0).toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right"><span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full font-black text-[9px]">MONTHLY ONLY</span></td>
                              </tr>
                            )}
                            {reportTimeframe === 'YEAR' && (
                              <tr className="bg-amber-100/80 font-bold">
                                <td className="p-3.5 font-bold">This Year (Yearly Damaged Report)</td>
                                <td className="p-3.5 text-amber-700 font-bold">{currency} {(dashStats.yearlyDamagedLoss || 0).toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right"><span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 rounded-full font-black text-[9px]">YEARLY ONLY</span></td>
                              </tr>
                            )}
                            {reportTimeframe === 'ALL' && (
                              <tr className="bg-slate-900 text-white font-bold">
                                <td className="p-3.5 font-black uppercase text-yellow-400">All-Time Cumulative Damaged Loss</td>
                                <td className="p-3.5 text-amber-300 font-black text-sm">{currency} {(dashStats.totalDamagedLoss || 0).toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right text-yellow-300 font-black">ALL-TIME DAMAGED LOSS</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* ─── DYNAMIC LOGGED DAMAGED PRODUCTS TABLE ─── */}
                    <div className="space-y-3 pt-6 border-t border-zinc-100">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                          <PackageX className="w-4 h-4 text-amber-600" />
                          Damaged Products List ({damagedProductsList.length})
                        </h4>
                        <button
                          onClick={() => setShowAddDamagedModal(true)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Log Damaged Entry
                        </button>
                      </div>

                      {damagedProductsList.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No damaged products or stock losses logged yet.</p>
                          <p className="text-[10px] text-slate-400 mt-1">Click "+ Log Damaged Product" to record egg breakage, cracked eggs, or spoiled stock losses.</p>
                          <button
                            onClick={() => setShowAddDamagedModal(true)}
                            className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Log First Damaged Product
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                          <table className="w-full text-left text-xs text-zinc-800">
                            <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-zinc-200">
                              <tr>
                                <th className="p-3.5">Date & Time</th>
                                <th className="p-3.5">Product Name</th>
                                <th className="p-3.5">Reason / Cause</th>
                                <th className="p-3.5 text-center">Damaged Qty</th>
                                <th className="p-3.5">Unit Price</th>
                                <th className="p-3.5">Total Loss (RS)</th>
                                <th className="p-3.5">Logged By / Notes</th>
                                <th className="p-3.5 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                              {damagedProductsList.map(dmg => (
                                <tr key={dmg._id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3.5 font-bold text-slate-500">
                                    {new Date(dmg.damageDate || dmg.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="p-3.5 font-black text-slate-900">
                                    {dmg.productName}
                                  </td>
                                  <td className="p-3.5">
                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[9px] font-black uppercase tracking-wider">
                                      {dmg.reason || 'Egg Breakage'}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-center font-black text-slate-900">
                                    {(dmg.petiQuantity > 0 || dmg.trayQuantity > 0 || dmg.eggQuantity > 0) ? (
                                      <div className="flex flex-wrap items-center justify-center gap-1 text-[11px]">
                                        {dmg.petiQuantity > 0 && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300/80 rounded font-black">{dmg.petiQuantity} Petis</span>}
                                        {dmg.trayQuantity > 0 && <span className="px-1.5 py-0.5 bg-sky-100 text-sky-900 border border-sky-300/80 rounded font-black">{dmg.trayQuantity} Trays</span>}
                                        {dmg.eggQuantity > 0 && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300/80 rounded font-black">{dmg.eggQuantity} Eggs</span>}
                                      </div>
                                    ) : (
                                      <span>{dmg.quantity || dmg.deductedEggs || 0} Units</span>
                                    )}
                                  </td>
                                  <td className="p-3.5 font-bold text-slate-600">
                                    {currency} {(Number(dmg.unitPrice) || 0).toLocaleString('en-PK')}
                                  </td>
                                  <td className="p-3.5 font-black text-amber-700 text-sm">
                                    {currency} {(Number(dmg.totalLoss) || 0).toLocaleString('en-PK')}
                                  </td>
                                  <td className="p-3.5 text-slate-500 text-[11px]">
                                    {dmg.notes || dmg.reportedBy || 'Shop Admin'}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    <button
                                      onClick={() => handleDeleteDamaged(dmg._id)}
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
                                      title="Delete Entry"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedItem(null)}>
          <div
            className="bg-[#1E293B] border border-slate-700 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 text-white"
            onClick={e => e.stopPropagation()}
          >
            {selectedItem.images?.[0] && (
              <div className="aspect-video overflow-hidden relative">
                <img src={selectedItem.images[0]} alt={selectedItem.name} className="w-full h-full object-cover" />
                <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-black rounded-full text-white backdrop-blur-md transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="p-6 sm:p-8 space-y-4">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{selectedItem.category}</span>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">{selectedItem.name}</h2>
              </div>

              {selectedItem.description && (
                <p className="text-slate-300 text-xs leading-relaxed font-medium">{selectedItem.description}</p>
              )}

              <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-2xl">
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Price per unit</p>
                  <p className="text-2xl font-black text-emerald-400">{currency} {selectedItem.price.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Stock Status</p>
                  <p className={`text-xl font-black ${(Number(selectedItem.stock) || 0) <= 0 ? 'text-red-400' : (Number(selectedItem.stock) || 0) <= (Number(selectedItem.minStock) || 5) ? 'text-amber-400' : 'text-white'}`}>
                    {(Number(selectedItem.stock) || 0) <= 0 ? 'Out of Stock' : `${selectedItem.stock} units`}
                  </p>
                </div>
              </div>

              {/* Low Stock or Out of Stock Alert */}
              {(Number(selectedItem.stock) || 0) > 0 && (Number(selectedItem.stock) || 0) <= (Number(selectedItem.minStock) || 5) && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-300 font-bold text-xs flex items-center gap-2">
                  <span>⚠️ Low Stock Warning: Only {selectedItem.stock} items left in stock!</span>
                </div>
              )}

              {(Number(selectedItem.stock) || 0) <= 0 && (
                <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 font-bold text-xs flex items-center gap-2">
                  <span>🚫 Out of Stock: This product is currently unavailable.</span>
                </div>
              )}

              {isAdminUser ? (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => { const item = selectedItem; setSelectedItem(null); setEditModalProduct(item); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Product
                  </button>
                  <button
                    onClick={() => { const item = selectedItem; setSelectedItem(null); setDeleteDialog({ isOpen: true, item }); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Product
                  </button>
                </div>
              ) : canBuy ? (
                (Number(selectedItem.stock) || 0) > 0 ? (
                  <button
                    onClick={() => { handleAddToCart(selectedItem); setSelectedItem(null); }}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-[#1B3817] hover:bg-[#12290D] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:translate-y-[2px]"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                ) : null
              ) : null}
            </div>
          </div>
        </div>
      )}

      {
        orderOpen &&
        <>
          <UserOrderModal setOrderOpen={setOrderOpen} />
        </>
      }

      {/* Edit Product Modal for Shop Admin */}
      <ProductModal
        isOpen={Boolean(editModalProduct)}
        onClose={() => setEditModalProduct(null)}
        onSave={handleEditProductSubmit}
        product={editModalProduct}
        categories={categories}
        title="Edit Product"
        mode="edit"
      />

      {/* Add New Product Modal for Shop Admin */}
      <ProductModal
        isOpen={addProductModal}
        onClose={() => setAddProductModal(false)}
        onSave={handleAddProductSubmit}
        product={null}
        categories={categories}
        title="Add New Product"
        mode="add"
      />

      {/* Delete Product Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, item: null })}
        onConfirm={confirmDeleteProduct}
        title="Confirm Product Deletion"
        message="Are you sure you want to remove this product from inventory?"
        itemName={deleteDialog.item?.name || ''}
        isDeleting={isDeleting}
      />

      {/* Walk-in Bill Modal (for printing, downloading PDF, or sharing on WhatsApp) */}
      <WalkInBillModal
        bill={completedBill}
        shop={shop}
        onClose={() => setCompletedBill(null)}
        currency={currency}
      />

      {/* ─── ADD MANUAL EXPENSE MODAL ─── */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-zinc-200 text-zinc-900 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-black text-sm uppercase tracking-wider">
                {editingExpenseId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingExpenseId ? 'Edit Expense Entry' : 'Add New Manual Expense'}
              </div>
              <button
                onClick={() => {
                  setShowAddExpenseModal(false);
                  setEditingExpenseId(null);
                }}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-rose-100 text-zinc-500 hover:text-rose-600 flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpenseSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop Rent, Electricity Bill, Packaging Bags..."
                  value={expenseFormData.title}
                  onChange={e => setExpenseFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Category</label>
                  <select
                    value={expenseFormData.category}
                    onChange={e => setExpenseFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-rose-500"
                  >
                    <option value="Rent">Shop Rent</option>
                    <option value="Utilities / Bills">Utilities / Bills</option>
                    <option value="Packaging & Bags">Packaging & Bags</option>
                    <option value="Transport & Freight">Transport & Freight</option>
                    <option value="Salaries">Worker Salaries</option>
                    <option value="Egg Damage / Loss">Egg Damage / Loss</option>
                    <option value="Other">Other Expenses</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Amount (RS) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={expenseFormData.amount}
                    onChange={e => setExpenseFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-rose-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">
                  Payment Status / Method
                </label>
                <div className="py-2.5 px-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-black text-emerald-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-base">✓</span> Paid
                  </span>
                  <span className="text-[9.5px] font-black bg-emerald-200/60 px-2 py-0.5 rounded-md text-emerald-800 uppercase tracking-wider">
                    Paid
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Expense Date</label>
                <input
                  type="date"
                  value={expenseFormData.expenseDate}
                  onChange={e => setExpenseFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Notes / Remarks (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Additional details..."
                  value={expenseFormData.notes}
                  onChange={e => setExpenseFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-rose-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExpenseModal(false);
                    setEditingExpenseId(null);
                  }}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  {editingExpenseId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingExpenseId ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD DAMAGED PRODUCT MODAL ─── */}
      {showAddDamagedModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-zinc-200 text-zinc-900 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2 text-amber-600 font-black text-sm uppercase tracking-wider">
                <PackageX className="w-5 h-5" /> Log Damaged Product / Stock Loss
              </div>
              <button
                onClick={() => setShowAddDamagedModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-amber-100 text-zinc-500 hover:text-amber-600 flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {(() => {
              const selectedProduct = (items || []).find(i => 
                String(i._id) === String(damagedFormData.productId) || 
                (damagedFormData.productName && i.name?.toLowerCase().trim() === damagedFormData.productName.toLowerCase().trim())
              );

              const tPerP = Number(selectedProduct?.traysPerPeti) || 12;
              const ePerT = Number(selectedProduct?.eggsPerTray) || 30;
              const ePerP = tPerP * ePerT;

              const basePrice = Number(selectedProduct?.price || selectedProduct?.costPrice || selectedProduct?.salePrice || 0);
              const pUnit = selectedProduct?.unitType || 'peti';

              let petiPrice = 0;
              let trayPrice = 0;
              let eggPrice = 0;

              if (selectedProduct && basePrice > 0) {
                if (pUnit === 'peti') {
                  petiPrice = basePrice;
                  trayPrice = Math.round((basePrice / tPerP) * 10) / 10;
                  eggPrice = Math.round((basePrice / ePerP) * 10) / 10;
                } else if (pUnit === 'tray') {
                  petiPrice = Math.round(basePrice * tPerP);
                  trayPrice = basePrice;
                  eggPrice = Math.round((basePrice / ePerT) * 10) / 10;
                } else {
                  petiPrice = Math.round(basePrice * ePerP);
                  trayPrice = Math.round(basePrice * ePerT);
                  eggPrice = basePrice;
                }
              }

              return (
                <form onSubmit={handleAddDamagedSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Product Name *</label>
                    <select
                      value={damagedFormData.productId || ''}
                      onChange={e => {
                        const selected = items.find(i => String(i._id) === String(e.target.value));
                        if (selected) {
                          const sTPerP = Number(selected.traysPerPeti) || 12;
                          const sEPerT = Number(selected.eggsPerTray) || 30;
                          const sEPerP = sTPerP * sEPerT;
                          const sBasePrice = Number(selected.price || selected.costPrice || selected.salePrice || 0);
                          const sUnit = selected.unitType || 'peti';

                          let defaultPrice = sBasePrice;
                          if (sUnit === 'peti') {
                            defaultPrice = (damagedFormData.unitType === 'egg') 
                              ? Math.round((sBasePrice / sEPerP) * 10) / 10 
                              : (damagedFormData.unitType === 'tray' ? Math.round((sBasePrice / sTPerP) * 10) / 10 : sBasePrice);
                          }

                          setDamagedFormData(prev => ({
                            ...prev,
                            productId: selected._id,
                            productName: selected.name,
                            unitPrice: defaultPrice || ''
                          }));
                        } else if (e.target.value === 'CUSTOM') {
                          setDamagedFormData(prev => ({ ...prev, productId: '', productName: '', unitType: 'egg', unitPrice: '' }));
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-amber-500 mb-2"
                    >
                      <option value="">-- Select Catalog Item (Optional) --</option>
                      {(items || []).map(i => (
                        <option key={i._id} value={i._id}>
                          {i.name} (Stock: {(Number(i.petiQuantity) || 0).toFixed(1)} Petis / {i.eggQuantity || i.stock || 0} Eggs)
                        </option>
                      ))}
                      <option value="CUSTOM">Custom Product Name</option>
                    </select>

                    <input
                      type="text"
                      required
                      placeholder="e.g. Loman Brown Eggs, Golden Eggs..."
                      value={damagedFormData.productName}
                      onChange={e => setDamagedFormData(prev => ({ ...prev, productName: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* ─── 3 SEPARATE DAMAGED QUANTITY INPUTS: PETI, TRAY, EGG ─── */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-600 block mb-1.5">
                      Damaged Quantities (Petis / Trays / Eggs) *
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {/* Petis Damaged */}
                      <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-2.5 text-center focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all">
                        <span className="text-[9.5px] font-black text-amber-900 uppercase block tracking-wider">Petis</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={damagedFormData.petiQuantity}
                          onChange={e => setDamagedFormData(prev => ({ ...prev, petiQuantity: e.target.value }))}
                          className="w-full text-center text-sm font-black text-amber-950 bg-transparent focus:outline-none mt-1"
                        />
                        <span className="text-[8.5px] text-amber-700 font-bold block mt-0.5">
                          {petiPrice > 0 ? `Rs. ${petiPrice}/Peti` : '360 Eggs'}
                        </span>
                      </div>

                      {/* Trays Damaged */}
                      <div className="bg-sky-50/70 border border-sky-200/90 rounded-2xl p-2.5 text-center focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-400/20 transition-all">
                        <span className="text-[9.5px] font-black text-sky-900 uppercase block tracking-wider">Trays</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={damagedFormData.trayQuantity}
                          onChange={e => setDamagedFormData(prev => ({ ...prev, trayQuantity: e.target.value }))}
                          className="w-full text-center text-sm font-black text-sky-950 bg-transparent focus:outline-none mt-1"
                        />
                        <span className="text-[8.5px] text-sky-700 font-bold block mt-0.5">
                          {trayPrice > 0 ? `Rs. ${trayPrice}/Tray` : '30 Eggs'}
                        </span>
                      </div>

                      {/* Eggs Damaged */}
                      <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-2.5 text-center focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                        <span className="text-[9.5px] font-black text-emerald-900 uppercase block tracking-wider">Eggs</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={damagedFormData.eggQuantity}
                          onChange={e => setDamagedFormData(prev => ({ ...prev, eggQuantity: e.target.value }))}
                          className="w-full text-center text-sm font-black text-emerald-950 bg-transparent focus:outline-none mt-1"
                        />
                        <span className="text-[8.5px] text-emerald-700 font-bold block mt-0.5">
                          {eggPrice > 0 ? `Rs. ${eggPrice}/Egg` : '1 Egg'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Reason / Cause</label>
                    <select
                      value={damagedFormData.reason}
                      onChange={e => setDamagedFormData(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Egg Breakage / Crack">Egg Breakage / Crack</option>
                      <option value="Spoiled / Expired">Spoiled / Expired</option>
                      <option value="Transport Damage">Transport Damage</option>
                      <option value="Storage Loss">Storage Loss</option>
                      <option value="Other">Other Cause</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Total Loss Amount (RS)</label>
                    {(() => {
                      const pQ = Number(damagedFormData.petiQuantity || 0);
                      const tQ = Number(damagedFormData.trayQuantity || 0);
                      const eQ = Number(damagedFormData.eggQuantity || 0);
                      const totalDmgE = Math.round((pQ * ePerP) + (tQ * ePerT) + eQ);
                      const totalLossCalc = Math.round((pQ * petiPrice) + (tQ * trayPrice) + (eQ * eggPrice));

                      return (
                        <div className="w-full px-4 py-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-black text-amber-700 flex items-center justify-between">
                          <div>
                            <span className="text-sm">RS {totalLossCalc.toLocaleString('en-PK')}</span>
                            {totalDmgE > 0 && (
                              <span className="text-[9.5px] text-amber-900 font-bold block">
                                Total {totalDmgE} Eggs ({(totalDmgE / ePerP).toFixed(1)} Petis / {(totalDmgE / ePerT).toFixed(1)} Trays)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-amber-800 font-bold">⚠️ Deducted automatically from product stock</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Damage Date</label>
                    <input
                      type="date"
                      value={damagedFormData.damageDate}
                      onChange={e => setDamagedFormData(prev => ({ ...prev, damageDate: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Notes / Remarks (Optional)</label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Cracked during transport tray unloading..."
                      value={damagedFormData.notes}
                      onChange={e => setDamagedFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-amber-500"
                    ></textarea>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setShowAddDamagedModal(false)}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-600/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Save Damaged Log
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* Receipt Screenshot Modal */}
      {viewingReceiptModal && (
        <div className="fixed inset-0 z-[400] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-white space-y-4 shadow-2xl relative">
            <button
              onClick={() => setViewingReceiptModal(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest">
              <Building2 className="w-4 h-4" /> Bank Transfer Receipt / Screenshot Proof
            </div>
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">Customer Payment Receipt Proof</h3>

            <div className="rounded-2xl overflow-hidden border border-slate-700 max-h-[60vh] bg-black flex items-center justify-center p-2 shadow-inner">
              <img src={viewingReceiptModal} alt="Bank Transfer Receipt" className="max-w-full max-h-[55vh] object-contain rounded-xl" />
            </div>

            <button
              onClick={() => setViewingReceiptModal(null)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Close Receipt Preview
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── All Shops Selector List Component ───────────────────────────────────────
function ShopsList() {
  const navigate = useNavigate();
  const [allShops, setAllShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_CATALOG).then(r => r.json()).then(d => { setAllShops(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-emerald-500/30 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-slate-800/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl w-full z-10 py-6 sm:py-10">
        {/* Top Header Navigation with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-black text-emerald-400 hover:text-emerald-300 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
            <span className="uppercase tracking-wider">Back to SuperAdmin</span>
          </button>
        </div>

        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex p-2 bg-white rounded-2xl mb-1 shadow-xl">
            <img src={companyLogo} alt="Yosafze Egg Traders" className="h-14 sm:h-16 w-auto object-contain drop-shadow-md" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase italic">
            YOSAFZE EGG TRADERS
          </h1>
          <p className="text-emerald-400 font-black uppercase tracking-[0.25em] text-[11px]">
            Multi-Branch Portal (Peshawar, Attock, Mardan & All Branches)
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {allShops.map((s, idx) => (
              <button
                key={s._id}
                onClick={() => navigate(`/shop/${s._id}`)}
                className="group bg-[#1E293B]/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/70 rounded-2xl p-4 sm:p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-2.5 bg-white rounded-xl group-hover:scale-105 transition-transform shadow-md flex-shrink-0">
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt={s.name} className="w-7 h-7 object-contain rounded-lg" />
                      ) : (
                        <img src={companyLogo} alt="Yosafze Egg Traders" className="w-7 h-7 object-contain rounded-lg" />
                      )}
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Branch #{idx + 1}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h2 className="text-base font-black text-white tracking-tight uppercase italic group-hover:text-emerald-300 transition-colors line-clamp-1">
                      {s.name}
                    </h2>
                    {s.address && (
                      <p className="text-slate-400 text-[11px] font-semibold mt-0.5 uppercase tracking-wider line-clamp-1">
                        {s.address}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 mb-4 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
                      <span className="text-emerald-400 font-mono text-[9px] uppercase">Unique ID</span>
                      <span className="font-mono text-white text-[9px] truncate max-w-[140px]">{s._id}</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
                      <span className="text-slate-500 text-[9px] uppercase">Shortcut</span>
                      <span className="text-amber-300 font-mono text-[9px]">/shop/{idx + 1}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-emerald-400 text-[10px] font-black uppercase tracking-wider pt-2.5 border-t border-slate-700/60 mt-auto">
                  <span>Enter Portal</span>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
            {allShops.length === 0 && (
              <div className="col-span-2 text-center text-slate-400 py-20 font-black uppercase tracking-widest text-xs">
                No active stores found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root Export ─────────────────────────────────────────────────────────────
export function CustomerStorefront() {
  const { shopId } = useParams();
  const { user } = useUser();

  const activeShopId = shopId || (user?.shopId ? String(user.shopId) : null);
  if (!activeShopId) return <ShopsList />;

  return (
    <CustomerAuthProvider shopId={activeShopId}>
      <StoreContent shopId={activeShopId} />
    </CustomerAuthProvider>
  );
}
