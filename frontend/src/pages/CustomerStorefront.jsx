import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingBag, MapPin, Phone, Package,
  ChevronDown, X, ArrowLeft, ShoppingCart,
  Plus, Minus, Trash2, User, Lock, Mail, LogOut, Eye, EyeOff,
  CheckCircle, AlertCircle, Sparkles, UserCircle2, Store,
  Layers, ShoppingBasket, Shirt, Home, Watch, Smartphone, Footprints,
  Menu, Filter, HelpCircle, LayoutDashboard,
  Truck, Edit2, Receipt, Printer, DollarSign, FileText, Send, TrendingUp, PackageX, AlertTriangle
} from 'lucide-react';
import { CustomerAuthProvider, useCustomerAuth } from '../contexts/CustomerAuthContext.jsx';
import { useUser } from '../contexts/UserContext.jsx';
import companyLogo from '../logo1.jpeg';
import { CheckoutModal } from '../components/CheckoutModal.jsx';
import UserOrderModal from '../components/UserOrderModal.jsx';
import { ProductModal } from '../components/ProductModal.jsx';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal.jsx';
import WalkInBillModal from '../components/WalkInBillModal.jsx';
import { OrdersManagement } from '../components/OrdersManagement.jsx';
import { CountUpNumber } from '../components/CountUpNumber.jsx';
import { updateItem, deleteItem as apiDeleteItem, createItem, createSale, getSales } from '../services/api.js';

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
  const isAdminUser =
    isShopAdmin() ||
    isSuperAdmin() ||
    user?.role === 'shop_admin' ||
    user?.role === 'super_admin' ||
    customer?.role === 'shop_admin' ||
    customer?.role === 'super_admin' ||
    Boolean(customer?.fullName && customer.fullName.toLowerCase().includes('admin')) ||
    Boolean(customer?.email && customer.email.toLowerCase().includes('admin')) ||
    Boolean(localStorage.getItem('nexflow_token') || sessionStorage.getItem('nexflow_token'));

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
  const [orderOpen, setOrderOpen] = useState(false); // new state to show orders of user
  const [activeView, setActiveView] = useState(isAdminUser ? 'dashboard' : 'products'); // 'dashboard', 'products', 'walkin', 'sales'

  // ─── Walk-in Sales & Billing State for ShopAdmin ───
  const [walkInCart, setWalkInCart] = useState([]);
  const [walkInCustomerName, setWalkInCustomerName] = useState('');
  const [walkInCustomerPhone, setWalkInCustomerPhone] = useState('');
  const [completedBill, setCompletedBill] = useState(null);
  const [isProcessingWalkIn, setIsProcessingWalkIn] = useState(false);
  const [shopSalesList, setShopSalesList] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);

  const addToWalkInCart = (product) => {
    if ((product.stock || 0) <= 0) {
      alert('Product is out of stock!');
      return;
    }
    setWalkInCart(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Only ${product.stock} units available in stock`);
          return prev;
        }
        return prev.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setAddedMsg(`Added ${product.name} to bill`);
    setTimeout(() => setAddedMsg(''), 2000);
  };

  const updateWalkInQty = (productId, delta) => {
    setWalkInCart(prev =>
      prev.map(item => {
        if (item.product._id === productId) {
          const newQty = item.quantity + delta;
          if (newQty > item.product.stock) {
            alert(`Only ${item.product.stock} units available in stock`);
            return item;
          }
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeFromWalkInCart = (productId) => {
    setWalkInCart(prev => prev.filter(item => item.product._id !== productId));
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

  const handleCompleteWalkInSale = async () => {
    if (walkInCart.length === 0) {
      alert('Walk-in cart is empty!');
      return;
    }
    setIsProcessingWalkIn(true);
    try {
      const saleItems = walkInCart.map(item => ({
        productId: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        costPrice: item.product.costPrice || 0,
        subtotal: item.product.price * item.quantity,
        profit: (item.product.price - (item.product.costPrice || 0)) * item.quantity
      }));

      const totalAmount = walkInCart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
      const totalProfit = saleItems.reduce((sum, i) => sum + i.profit, 0);

      const saleData = {
        shopId,
        items: saleItems,
        totalAmount,
        totalProfit,
        cashierName: user?.fullName || 'Shop Admin',
        customerName: walkInCustomerName.trim() || 'Walk-in Customer',
        customerPhone: walkInCustomerPhone.trim()
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

  const confirmDeleteProduct = async () => {
    if (!deleteDialog.item) return;
    setIsDeleting(true);
    try {
      const role = user?.role || 'shop_admin';
      await apiDeleteItem(deleteDialog.item._id, '', role);
      setAddedMsg('Product deleted successfully!');
      setDeleteDialog({ isOpen: false, item: null });
      fetchCatalog();
      fetchDashboardStats();
      setTimeout(() => setAddedMsg(''), 2500);
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };
  const [reportTimeframe, setReportTimeframe] = useState('ALL'); // 'DAY', 'MONTH', 'YEAR', 'ALL'
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
    // Profit / Loss
    totalProfit: 0,
    totalLoss: 0,
  });

  // Dynamic Manual Expenses Tracking State
  const [expensesList, setExpensesList] = useState([]);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    category: 'Utilities / Bills',
    amount: '',
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

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseFormData.title || !expenseFormData.amount) {
      alert('Please enter expense title and amount');
      return;
    }

    const newExpenseItem = {
      _id: 'exp_' + Date.now(),
      shopId,
      title: expenseFormData.title,
      category: expenseFormData.category,
      amount: Number(expenseFormData.amount),
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
      expenseDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setTimeout(fetchDashboardStats, 300);
  };

  const handleDeleteExpense = async (id) => {
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
    quantity: '1',
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
    if (!damagedFormData.productName || !damagedFormData.quantity) {
      alert('Please enter product name and damaged quantity');
      return;
    }

    const qty = Number(damagedFormData.quantity) || 1;
    const price = Number(damagedFormData.unitPrice) || 0;
    const loss = qty * price;

    const newDamagedItem = {
      _id: 'dmg_' + Date.now(),
      shopId,
      productName: damagedFormData.productName,
      productId: damagedFormData.productId || '',
      quantity: qty,
      unitPrice: price,
      totalLoss: loss,
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
      quantity: '1',
      unitPrice: '',
      reason: 'Egg Breakage / Crack',
      damageDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setTimeout(fetchDashboardStats, 300);
  };

  const handleDeleteDamaged = async (id) => {
    if (!window.confirm('Are you sure you want to delete this damaged product record?')) return;
    try {
      await fetch(`/api/damaged-products/${id}`, { method: 'DELETE' });
    } catch (e) { }
    setDamagedProductsList(prev => prev.filter(x => String(x._id) !== String(id)));
    setTimeout(fetchDashboardStats, 300);
  };

  const handleWhatsAppReportShare = (type = 'sales', timeframe = reportTimeframe) => {
    const shopName = shop?.name || 'Peshawar Shop';
    const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    let title = 'Sales Revenue Report';
    let val = dashStats.totalRevenue;
    if (type === 'sales') {
      title = 'Sales Revenue Report';
      val = timeframe === 'DAY' ? dashStats.todaySales : timeframe === 'MONTH' ? dashStats.monthlySales : timeframe === 'YEAR' ? dashStats.yearlySales : dashStats.totalRevenue;
    } else if (type === 'profit') {
      title = 'Net Profit Report';
      val = timeframe === 'DAY' ? (dashStats.todayProfit || 0) : timeframe === 'MONTH' ? (dashStats.monthlyProfit || 0) : timeframe === 'YEAR' ? (dashStats.yearlyProfit || 0) : dashStats.totalProfit;
    } else if (type === 'expenses') {
      title = 'Expenses & Loss Report';
      val = timeframe === 'DAY' ? (dashStats.todayLoss || 0) : timeframe === 'MONTH' ? (dashStats.monthlyLoss || 0) : timeframe === 'YEAR' ? (dashStats.yearlyLoss || 0) : dashStats.totalLoss;
    } else if (type === 'damaged') {
      title = 'Damaged Products Loss Report';
      val = timeframe === 'DAY' ? (dashStats.todayDamagedLoss || 0) : timeframe === 'MONTH' ? (dashStats.monthlyDamagedLoss || 0) : timeframe === 'YEAR' ? (dashStats.yearlyDamagedLoss || 0) : (dashStats.totalDamagedLoss || 0);
    }

    const timeLabel = timeframe === 'DAY' ? 'Daily (Today)' : timeframe === 'MONTH' ? 'Monthly (This Month)' : timeframe === 'YEAR' ? 'Yearly (This Year)' : 'All-Time Total';

    let message = `*${shopName} - Financial Report*\n`;
    message += `📅 Period: *${timeLabel}*\n`;
    message += `📊 Report Type: *${title}*\n`;
    message += `💰 Total Amount: *RS ${val.toLocaleString('en-PK')}*\n`;
    message += `🕒 Date: ${dateStr}\n\n`;
    message += `_Generated by Yosafze Egg Traders System_`;

    const encodedText = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  const handlePrintSingleReport = (type = 'sales', timeframe = reportTimeframe) => {
    const shopName = shop?.name || 'Peshawar Shop';
    const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    let typeTitle = 'Sales Revenue';
    let val = dashStats.totalRevenue;
    let themeColor = '#059669';

    if (type === 'sales') {
      typeTitle = 'Sales Revenue';
      themeColor = '#059669';
      val = timeframe === 'DAY' ? dashStats.todaySales : timeframe === 'MONTH' ? dashStats.monthlySales : timeframe === 'YEAR' ? dashStats.yearlySales : dashStats.totalRevenue;
    } else if (type === 'profit') {
      typeTitle = 'Net Profit';
      themeColor = '#16a34a';
      val = timeframe === 'DAY' ? (dashStats.todayProfit || 0) : timeframe === 'MONTH' ? (dashStats.monthlyProfit || 0) : timeframe === 'YEAR' ? (dashStats.yearlyProfit || 0) : dashStats.totalProfit;
    } else if (type === 'expenses') {
      typeTitle = 'Expenses & Return Losses';
      themeColor = '#e11d48';
      val = timeframe === 'DAY' ? (dashStats.todayLoss || 0) : timeframe === 'MONTH' ? (dashStats.monthlyLoss || 0) : timeframe === 'YEAR' ? (dashStats.yearlyLoss || 0) : dashStats.totalLoss;
    } else if (type === 'damaged') {
      typeTitle = 'Damaged Products Loss';
      themeColor = '#d97706';
      val = timeframe === 'DAY' ? (dashStats.todayDamagedLoss || 0) : timeframe === 'MONTH' ? (dashStats.monthlyDamagedLoss || 0) : timeframe === 'YEAR' ? (dashStats.yearlyDamagedLoss || 0) : (dashStats.totalDamagedLoss || 0);
    }

    const timeTitle = timeframe === 'DAY' ? 'Daily (Today)' : timeframe === 'MONTH' ? 'Monthly (This Month)' : timeframe === 'YEAR' ? 'Yearly (This Year)' : 'All-Time Total';

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to view and print the report');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${timeTitle} ${typeTitle} Report - ${shopName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #0f172a; background: #ffffff; }
            .header { text-align: center; border-bottom: 3px double ${themeColor}; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: ${themeColor}; text-transform: uppercase; font-size: 26px; letter-spacing: 1px; }
            .header p { margin: 6px 0 0; color: #475569; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; }
            .meta { display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; margin-bottom: 25px; background: #f8fafc; padding: 14px 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .hero-card { border: 2px solid ${themeColor}; border-radius: 20px; padding: 25px; background: #f8fafc; text-align: center; margin-bottom: 30px; }
            .hero-card label { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #64748b; letter-spacing: 1.5px; }
            .hero-card .val { font-size: 36px; font-weight: 900; color: ${themeColor}; margin-top: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px 16px; font-size: 13px; text-align: left; }
            th { background: #f1f5f9; text-transform: uppercase; font-weight: 900; font-size: 11px; color: #475569; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; color: #64748b; }
            .sign { border-top: 2px solid #cbd5e1; width: 220px; text-align: center; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${shopName}</h1>
            <p>${timeTitle} ${typeTitle} Report</p>
          </div>
          <div class="meta">
            <span>Generated Date: ${dateStr}</span>
            <span>Period Filter: ${timeframe}</span>
            <span>Report Category: ${typeTitle}</span>
          </div>
          <div class="hero-card">
            <label>Total ${timeTitle} ${typeTitle}</label>
            <div class="val">RS ${val.toLocaleString('en-PK')}</div>
          </div>
          <div class="table-sec">
            <h3>Selected Period (${timeTitle}) Statement</h3>
            <table>
              <thead>
                <tr>
                  <th>Period Timeframe</th>
                  <th>Metric Amount (RS)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background:#f0fdf4; font-weight:bold;">
                  <td>${timeTitle}</td>
                  <td>RS ${val.toLocaleString('en-PK')}</td>
                  <td>Active Filtered Statement</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="footer">
            <div class="sign">Manager Signature</div>
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
        setDashStats(prev => ({
          ...prev,
          totalProducts: (data.items || []).length,
          totalStock,
          outOfStock,
          lowStock,
          expiredProducts: expiredProductsList.length,
          expiredProductsList,
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

        setDashStats(prev => ({
          ...prev,
          totalOrders: posSalesList.length + checkoutOrders.length,
          totalRevenue: totalPosRevenue + totalOrderRevenue,
          todaySales: posRevenue(today) + orderRevenue(today),
          monthlySales: posRevenue(thisMonth) + orderRevenue(thisMonth),
          yearlySales: posRevenue(thisYear) + orderRevenue(thisYear),
          todayProfit: posProfit(today) + orderProfit(today),
          monthlyProfit: posProfit(thisMonth) + orderProfit(thisMonth),
          yearlyProfit: posProfit(thisYear) + orderProfit(thisYear),
          todayLoss: posLoss(today) + orderLoss(today) + manualExpenseSum(today),
          monthlyLoss: posLoss(thisMonth) + orderLoss(thisMonth) + manualExpenseSum(thisMonth),
          yearlyLoss: posLoss(thisYear) + orderLoss(thisYear) + manualExpenseSum(thisYear),
          todayDamagedLoss: damagedLossSum(today),
          monthlyDamagedLoss: damagedLossSum(thisMonth),
          yearlyDamagedLoss: damagedLossSum(thisYear),
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

      {/* Top Navbar — Gray/Green Theme matching main App Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-[#2D5A27]/90 backdrop-blur-md border-b border-green-800/50 shadow-md transition-all duration-300">
        <div className="flex items-center justify-between h-20 gap-4 px-4 sm:px-6 max-w-[1600px] mx-auto">

          {/* Left branding */}
          <div className="flex items-center gap-4">
            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-2.5 -ml-2 text-white/90 hover:text-white hover:bg-white/15 rounded-full transition-all shadow-md border border-white/10 md:hidden"
              aria-label="Toggle Mobile Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Desktop Toggle */}
            <button
              onClick={() => setIsDesktopOpen(!isDesktopOpen)}
              className="p-2.5 -ml-2 text-white/90 hover:text-white hover:bg-white/15 rounded-full transition-all shadow-md border border-white/10 hidden md:block"
              aria-label="Toggle Desktop Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <button onClick={() => navigate('/shop')} className="p-2 -ml-2 text-white/80 hover:text-white transition-colors hidden md:block" title="Back to Stores">
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveView('dashboard');
                  const mainContent = document.getElementById('main-store-content');
                  if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="relative bg-white rounded-xl w-12 h-12 flex items-center justify-center shrink-0 shadow-[0_8px_15px_rgba(0,0,0,0.4)] overflow-hidden border-2 border-white/40 ring-2 ring-black/20 hover:scale-105 transition-transform"
                title={isAdminUser ? "Go to Shop Admin Dashboard" : "Go to Customer Dashboard"}
              >
                {shop?.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-contain" />
                ) : (
                  <img src={companyLogo} alt="Yousafzai Agri Foods" className="w-full h-full object-contain" />
                )}
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-black tracking-tighter text-white uppercase italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-none truncate max-w-[140px] sm:max-w-xs md:max-w-md">{shop?.name || 'Customer Store'}</h1>
                {shop?.address && (
                  <p className="text-[10px] font-bold text-emerald-300 flex items-center gap-1 mt-1 truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                    <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{shop.address}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Center Search Input */}
          <div className="flex-1 flex justify-center max-w-md mx-auto hidden sm:flex">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                placeholder="Search products..."
                className="w-full bg-white/90 backdrop-blur-sm rounded-full py-3 flex items-center pl-6 pr-14 text-sm font-black text-gray-800 placeholder:text-gray-400 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.15),_0_10px_20px_rgba(0,0,0,0.25)] border-b-4 border-gray-300"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#1B3817] text-white p-2 rounded-full shadow-md">
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
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-700">
                            {item.images?.[0] ? <img src={item.images[0]} className="w-full h-full object-cover" /> : <Egg className="w-6 h-6 m-2 text-slate-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-xs truncate uppercase tracking-tight">{item.name}</p>
                            <p className="text-emerald-400 font-black text-[10px]">{currency} {item.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      No products found
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
                className="relative p-2.5 sm:px-4 bg-[#1B3817] hover:bg-[#0C1D08] text-white rounded-full transition-all border-t border-white/20 border-b-4 shadow-[0_8px_15px_rgba(0,0,0,0.3)] hover:scale-105 active:translate-y-[2px] flex items-center justify-center gap-2"
                title="View My Orders & Payment Status"
              >
                <Truck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">My Orders</span>
              </button>
            )}

            {canBuy ? (
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-3 bg-[#1B3817] hover:bg-[#0C1D08] text-white rounded-full transition-all border-t border-white/20 border-b-4 shadow-[0_8px_15px_rgba(0,0,0,0.3)] hover:scale-105 active:translate-y-[2px]"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-black h-5.5 w-5.5 rounded-full flex items-center justify-center border-2 border-[#1B3817] shadow-md">
                    {cartCount}
                  </span>
                )}
              </button>
            ) : isAdminUser ? (
              <button
                onClick={() => setActiveView('walkin')}
                className="relative p-3 bg-[#1B3817] hover:bg-[#0C1D08] text-white rounded-full transition-all border-t border-white/20 border-b-4 shadow-[0_8px_15px_rgba(0,0,0,0.3)] hover:scale-105 active:translate-y-[2px] flex items-center justify-center"
                title="View Walk-in Customer Bill Cart"
              >
                <Receipt className="w-5 h-5 text-emerald-400" />
                {walkInCart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-black h-5.5 w-5.5 rounded-full flex items-center justify-center border-2 border-[#1B3817] shadow-md">
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

        {/* ─── Green Gradient Sidebar matching main app ─────────────────────── */}
        <aside
          className={`absolute md:relative top-0 h-full flex flex-col bg-gradient-to-b from-[#2D5A27] via-[#24491F] to-[#1B3817] text-white backdrop-blur-xl transition-all duration-300 ease-in-out border-r border-white/10 z-[100] md:z-20 overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.3)] w-56 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
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
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-2 space-y-6">

            {/* Dashboard Link */}
            <div>
              <p className="px-8 text-[11px] font-bold text-white/30 mb-3 tracking-wider uppercase">Overview</p>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveView('dashboard'); setIsMobileOpen(false); }}
                  className={`w-full flex items-center gap-4 group px-3 py-3 mx-4 rounded-2xl text-[13px] font-bold transition-all duration-300 max-w-[192px] ${activeView === 'dashboard'
                    ? "bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-[0_8px_15px_rgba(0,0,0,0.3)]"
                    : "text-white/60 hover:text-white hover:bg-[#1B3817] border-t border-t-transparent hover:border-t-white/20 border-b-4 border-b-transparent hover:border-b-[#12290D]"
                    }`}
                >
                  <LayoutDashboard className="w-5 h-5 text-white" />
                  <span>Dashboard</span>
                </button>
              </div>
            </div>

            {/* Shop Admin POS & Sales Section */}
            {isAdminUser && (
              <div>
                <p className="px-8 text-[11px] font-bold text-white/30 mb-3 tracking-wider uppercase">Shop POS & Billing</p>
                <div className="space-y-1">
                  <button
                    onClick={() => { setActiveView('walkin'); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-4 group px-3 py-3 mx-4 rounded-2xl text-[13px] font-bold transition-all duration-300 max-w-[192px] ${activeView === 'walkin'
                      ? "bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-[0_8px_15px_rgba(0,0,0,0.3)]"
                      : "text-emerald-300 hover:text-white hover:bg-[#1B3817] border-t border-t-transparent hover:border-t-white/20 border-b-4 border-b-transparent hover:border-b-[#12290D]"
                      }`}
                  >
                    <Receipt className="w-5 h-5 text-emerald-400" />
                    <span className="truncate">Walk-in Sale / POS</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('sales'); fetchShopSales(); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-4 group px-3 py-3 mx-4 rounded-2xl text-[13px] font-bold transition-all duration-300 max-w-[192px] ${activeView === 'sales'
                      ? "bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-[0_8px_15px_rgba(0,0,0,0.3)]"
                      : "text-white/60 hover:text-white hover:bg-[#1B3817] border-t border-t-transparent hover:border-t-white/20 border-b-4 border-b-transparent hover:border-b-[#12290D]"
                      }`}
                  >
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    <span className="truncate">Sales & Bills</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('orders'); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-4 group px-3 py-3 mx-4 rounded-2xl text-[13px] font-bold transition-all duration-300 max-w-[192px] ${activeView === 'orders'
                      ? "bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-[0_8px_15px_rgba(0,0,0,0.3)]"
                      : "text-white/60 hover:text-white hover:bg-[#1B3817] border-t border-t-transparent hover:border-t-white/20 border-b-4 border-b-transparent hover:border-b-[#12290D]"
                      }`}
                  >
                    <Truck className="w-5 h-5 text-emerald-400" />
                    <span className="truncate">EasyPaisa & Orders</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('report-sales'); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-4 group px-3 py-3 mx-4 rounded-2xl text-[13px] font-bold transition-all duration-300 max-w-[192px] ${activeView === 'report-sales'
                      ? "bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-[0_8px_15px_rgba(0,0,0,0.3)]"
                      : "text-emerald-300 hover:text-white hover:bg-[#1B3817] border-t border-t-transparent hover:border-t-white/20 border-b-4 border-b-transparent hover:border-b-[#12290D]"
                      }`}
                  >
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span className="truncate">Sales Report</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('report-profit'); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-4 group px-3 py-3 mx-4 rounded-2xl text-[13px] font-bold transition-all duration-300 max-w-[192px] ${activeView === 'report-profit'
                      ? "bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-[0_8px_15px_rgba(0,0,0,0.3)]"
                      : "text-green-300 hover:text-white hover:bg-[#1B3817] border-t border-t-transparent hover:border-t-white/20 border-b-4 border-b-transparent hover:border-b-[#12290D]"
                      }`}
                  >
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span className="truncate">Profit Report</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('report-expenses'); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-4 group px-3 py-3 mx-4 rounded-2xl text-[13px] font-bold transition-all duration-300 max-w-[192px] ${activeView === 'report-expenses'
                      ? "bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-[0_8px_15px_rgba(0,0,0,0.3)]"
                      : "text-rose-300 hover:text-white hover:bg-[#1B3817] border-t border-t-transparent hover:border-t-white/20 border-b-4 border-b-transparent hover:border-b-[#12290D]"
                      }`}
                  >
                    <FileText className="w-5 h-5 text-rose-400" />
                    <span className="truncate">Expenses Report</span>
                  </button>

                  <button
                    onClick={() => { setActiveView('damaged-products'); setIsMobileOpen(false); }}
                    className={`w-full flex items-center gap-4 group px-3 py-3 mx-4 rounded-2xl text-[13px] font-bold transition-all duration-300 max-w-[192px] ${activeView === 'damaged-products'
                      ? "bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-[0_8px_15px_rgba(0,0,0,0.3)]"
                      : "text-amber-300 hover:text-white hover:bg-[#1B3817] border-t border-t-transparent hover:border-t-white/20 border-b-4 border-b-transparent hover:border-b-[#12290D]"
                      }`}
                  >
                    <PackageX className="w-5 h-5 text-amber-400" />
                    <span className="truncate">Damaged Stock</span>
                  </button>
                </div>
              </div>
            )}

            {/* Products Section */}
            <div>
              <p className="px-8 text-[11px] font-bold text-white/30 mb-3 tracking-wider uppercase">Catalog</p>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveView('products'); setActiveCategory('All'); setIsMobileOpen(false); }}
                  className={`w-full flex items-center gap-4 group px-3 py-3 mx-4 rounded-2xl text-[13px] font-bold transition-all duration-300 max-w-[192px] ${activeView === 'products' && activeCategory === 'All'
                    ? "bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-[0_8px_15px_rgba(0,0,0,0.3)]"
                    : "text-white/60 hover:text-white hover:bg-[#1B3817] border-t border-t-transparent hover:border-t-white/20 border-b-4 border-b-transparent hover:border-b-[#12290D]"
                    }`}
                >
                  <Store className="w-5 h-5 text-white" />
                  <span>All Products</span>
                </button>
              </div>
            </div>

            {/* Categories */}
            {categories.filter(c => c !== 'All').length > 0 && (
              <div>
                <p className="px-8 text-[11px] font-bold text-white/30 mb-3 tracking-wider uppercase">Categories</p>
                <div className="space-y-1">
                  {categories.filter(c => c !== 'All').map(cat => {
                    const active = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => { setActiveView('products'); setActiveCategory(cat); setIsMobileOpen(false); }}
                        className={`w-full flex items-center gap-3 group px-3 py-2 mx-4 rounded-xl text-[12px] font-bold transition-all duration-300 max-w-[192px] ${activeView === 'products' && active
                          ? "bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-[0_8px_15px_rgba(0,0,0,0.3)]"
                          : "text-white/60 hover:text-white hover:bg-[#1B3817] border-t border-t-transparent hover:border-t-white/20 border-b-4 border-b-transparent hover:border-b-[#12290D]"
                          }`}
                      >
                        <img src="/egg.png" alt="egg" className={`w-5 h-5 object-contain shrink-0 transition-all ${active ? 'brightness-125 scale-110' : 'brightness-75'}`} />
                        <span className="capitalize truncate">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}



            {/* Cart Quick Access */}
            {canBuy && (
              <div>
                <p className="px-8 text-[11px] font-bold text-white/30 mb-3 tracking-wider uppercase">Cart</p>
                <div className="space-y-1">
                  <button
                    onClick={() => { setCartOpen(true); setIsMobileOpen(false); }}
                    className="w-full flex items-center gap-4 group px-3 py-3 mx-4 rounded-2xl text-[13px] font-bold text-white/60 hover:text-white hover:bg-[#1B3817] border-t border-t-transparent hover:border-t-white/20 border-b-4 border-b-transparent hover:border-b-[#12290D] max-w-[192px]"
                  >
                    <ShoppingCart className="w-5 h-5 text-white" />
                    <span>My Cart ({cartCount})</span>
                  </button>

                  <button
                    onClick={() => { setOrderOpen(true); setIsMobileOpen(false); }}
                    className="w-full flex items-center gap-4 group px-3 py-3 mx-4 rounded-2xl text-[13px] font-bold text-white/60 hover:text-white hover:bg-[#1B3817] border-t border-t-transparent hover:border-t-white/20 border-b-4 border-b-transparent hover:border-b-[#12290D] max-w-[192px]"
                  >
                    <Truck className="w-5 h-5 text-white" />
                    <span>My Oders</span>
                  </button>
                </div>
              </div>
            )}



            {/* Logout Footer */}
            <div className="pb-6 pt-4 border-t border-white/10 mx-4">
              <button
                onClick={() => {
                  if (userLogout) userLogout();
                  if (customerLogout) customerLogout();
                }}
                className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-[13px] font-bold text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/20 transition-all"
              >
                <LogOut className="w-5 h-5 text-rose-400" />
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
              <div className={`relative border rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 overflow-hidden ${isAdminUser ? 'bg-white border-zinc-200 text-zinc-900 shadow-xl' : 'bg-gradient-to-r from-[#1E293B] via-[#1B3817] to-[#0f172a] border-slate-700/60 text-white'}`}>
                <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] pointer-events-none">
                  <ShoppingBag className="w-24 h-24 sm:w-32 sm:h-32 text-emerald-400" />
                </div>
                <div className="relative z-10 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[9px] font-black uppercase tracking-widest shrink-0">
                      <Sparkles className="w-3 h-3 text-emerald-400" /> Welcome, {user?.fullName || customer?.fullName || 'User'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${isAdminUser ? 'bg-amber-500/20 border-amber-400/30 text-amber-300' : 'bg-blue-500/20 border-blue-400/30 text-blue-300'}`}>
                      {isAdminUser ? '🛡 SHOP ADMIN' : '🛒 CUSTOMER'}
                    </span>
                  </div>
                  <h1 className={`text-sm sm:text-base md:text-lg font-black tracking-tight uppercase italic truncate ${isAdminUser ? 'text-zinc-900' : 'text-white'}`}>
                    {activeView === 'dashboard'
                      ? (isAdminUser ? 'Shop Admin Dashboard' : 'My Customer Dashboard')
                      : 'Fresh Inventory & Products Catalog'}
                  </h1>
                  <p className="text-[10px] sm:text-xs text-slate-400 max-w-xl font-medium line-clamp-1 sm:line-clamp-none">
                    {activeView === 'dashboard'
                      ? (isAdminUser ? 'Overview of your shop performance and statistics.' : 'Your order history, cart summary and spending stats.')
                      : 'Browse products, check stock levels, and add items to your cart easily.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => navigate('/shop')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-[10px] font-black uppercase tracking-widest transition-all shadow border border-slate-700 cursor-pointer active:scale-95"
                    title="Switch or Select Shop Branch"
                  >
                    <Store className="w-3.5 h-3.5 text-amber-400" /> Switch Branch
                  </button>
                  {isAdminUser && (
                    <button
                      onClick={() => setAddProductModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg border border-amber-400/60 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Product
                    </button>
                  )}
                  <button
                    onClick={() => setActiveView(activeView === 'dashboard' ? 'products' : 'dashboard')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow border border-emerald-500/40"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    {activeView === 'dashboard' ? 'View Products' : 'Dashboard'}
                  </button>
                </div>
              </div>

              {/* ─── DASHBOARD VIEW ─── */}
              {activeView === 'dashboard' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

                  {/* ─── SHOP ADMIN DASHBOARD (CLEAN WHITE THEME) ─── */}
                  {isAdminUser ? (
                    <div className="space-y-6">
                      {/* Top Stat Cards - White Theme */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          { label: 'Registered Customers', value: dashStats.totalCustomers, icon: '👥', color: 'bg-white border-zinc-200 text-blue-600', textColor: 'text-zinc-900', sub: 'Shop Accounts' },
                          { label: 'Total Products', value: dashStats.totalProducts, icon: '📦', color: 'bg-white border-zinc-200 text-emerald-600', textColor: 'text-zinc-900', sub: 'In Catalog' },
                          { label: 'Available Stock', value: dashStats.totalStock.toLocaleString('en-PK'), icon: '🏪', color: 'bg-white border-zinc-200 text-green-600', textColor: 'text-zinc-900', sub: 'Total Units' },
                          { label: 'Total Sales Orders', value: dashStats.totalOrders, icon: '🛒', color: 'bg-white border-zinc-200 text-orange-600', textColor: 'text-zinc-900', sub: 'All Time' },
                          { label: 'Low Stock Items', value: dashStats.lowStock, icon: '⚠️', color: 'bg-white border-zinc-200 text-amber-600', textColor: 'text-amber-600', sub: 'Need Attention' },
                          { label: 'Out of Stock', value: dashStats.outOfStock, icon: '🚫', color: 'bg-white border-zinc-200 text-rose-600', textColor: 'text-rose-600', sub: 'Restock Needed' },
                        ].map(({ label, value, icon, color, textColor, sub }) => (
                          <div key={label} className={`${color} border rounded-3xl p-5 shadow-xl flex flex-col gap-2`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
                              <span className="text-xl">{icon}</span>
                            </div>
                            <p className={`text-2xl font-black ${textColor} tracking-tight`}>
                              <CountUpNumber value={value} />
                            </p>
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{sub}</span>
                          </div>
                        ))}
                      </div>

                      {/* Profit & Loss Summary */}
                      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl text-zinc-900">
                        <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <span>💹</span> Profit & Loss Summary
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Total Profit Earned</p>
                            <p className="text-2xl font-black text-emerald-600">
                              <CountUpNumber value={`${currency} ${dashStats.totalProfit || 0}`} />
                            </p>
                            <p className="text-[9px] text-emerald-600/70 uppercase mt-1">From completed sales</p>
                          </div>
                          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest mb-1">Shop Expenses & Loss</p>
                            <p className="text-2xl font-black text-rose-600">
                              <CountUpNumber value={`${currency} ${dashStats.totalLoss || 0}`} />
                            </p>
                            <p className="text-[9px] text-rose-600/70 uppercase mt-1">Expenses & Returns</p>
                          </div>
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Damaged Stock Loss</p>
                            <p className="text-2xl font-black text-amber-600">
                              <CountUpNumber value={`${currency} ${dashStats.totalDamagedLoss || 0}`} />
                            </p>
                            <p className="text-[9px] text-amber-700/80 uppercase mt-1">Egg Breakage & Loss</p>
                          </div>
                          <div className={`border rounded-2xl p-4 ${(dashStats.totalProfit - dashStats.totalLoss) >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Net Earnings / Balance</p>
                            <p className={`text-2xl font-black ${(dashStats.totalProfit - dashStats.totalLoss) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {(dashStats.totalProfit - dashStats.totalLoss) >= 0 ? '+' : '-'} <CountUpNumber value={`${currency} ${Math.abs(dashStats.totalProfit - dashStats.totalLoss)}`} />
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Revenue Analytics (Day / Month / Year) */}
                      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl text-zinc-900">
                        <h3 className="text-xs font-black text-zinc-700 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600" /> Revenue Analytics (Day / Month / Year)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Today Sales (Day)</span>
                            <h4 className="text-xl font-black text-emerald-600 tracking-tight">
                              <CountUpNumber value={`${currency} ${dashStats.todaySales || 0}`} />
                            </h4>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Daily Gross Sales</span>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">This Month (Month)</span>
                            <h4 className="text-xl font-black text-emerald-600 tracking-tight">
                              <CountUpNumber value={`${currency} ${dashStats.monthlySales || 0}`} />
                            </h4>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Monthly Gross Sales</span>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">This Year (Year)</span>
                            <h4 className="text-xl font-black text-blue-600 tracking-tight">
                              <CountUpNumber value={`${currency} ${dashStats.yearlySales || 0}`} />
                            </h4>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Yearly Gross Sales</span>
                          </div>

                          <div className="p-4 bg-[#1B3817] text-white rounded-2xl border border-green-800 shadow-lg">
                            <span className="text-[10px] font-black text-yellow-300 uppercase tracking-widest block mb-1">Total Revenue</span>
                            <h4 className="text-xl font-black text-white tracking-tight">
                              <CountUpNumber value={`${currency} ${dashStats.totalRevenue || 0}`} />
                            </h4>
                            <span className="text-[9px] text-white/60 font-bold uppercase">All-Time Cumulative Sales</span>
                          </div>
                        </div>
                      </div>

                      {/* ─── TOTAL FINANCIAL & SALES REPORTS CENTER ─── */}
                      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl text-zinc-900 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                          <div>
                            <h3 className="text-sm font-black text-zinc-800 uppercase tracking-[0.15em] flex items-center gap-2">
                              <FileText className="w-4 h-4 text-emerald-600" />
                              Total Summary Reports Center (Sales, Profit & Expenses)
                            </h3>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                              Generate, inspect & print itemized financial reports for Day, Month, Year & All-Time
                            </p>
                          </div>

                          {/* Timeframe selector buttons */}
                          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            {[
                              { id: 'ALL', label: 'All-Time' },
                              { id: 'DAY', label: 'Today (Day)' },
                              { id: 'MONTH', label: 'This Month' },
                              { id: 'YEAR', label: 'This Year' },
                            ].map(t => (
                              <button
                                key={t.id}
                                onClick={() => setReportTimeframe(t.id)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${reportTimeframe === t.id
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                  }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Active Filter Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block mb-1">
                              {reportTimeframe === 'DAY' ? 'Today Gross Sales' : reportTimeframe === 'MONTH' ? 'Monthly Gross Sales' : reportTimeframe === 'YEAR' ? 'Yearly Gross Sales' : 'Total Revenue'}
                            </span>
                            <h4 className="text-2xl font-black text-emerald-600 tracking-tight">
                              {currency} {(
                                reportTimeframe === 'DAY' ? dashStats.todaySales :
                                  reportTimeframe === 'MONTH' ? dashStats.monthlySales :
                                    reportTimeframe === 'YEAR' ? dashStats.yearlySales :
                                      dashStats.totalRevenue
                              ).toLocaleString('en-PK')}
                            </h4>
                            <span className="text-[9px] text-emerald-600/70 font-bold uppercase">Sales Revenue</span>
                          </div>

                          <div className="p-4 bg-green-50/70 border border-green-200/80 rounded-2xl">
                            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest block mb-1">
                              {reportTimeframe === 'DAY' ? 'Today Profit' : reportTimeframe === 'MONTH' ? 'Monthly Profit' : reportTimeframe === 'YEAR' ? 'Yearly Profit' : 'Total Profit Earned'}
                            </span>
                            <h4 className="text-2xl font-black text-green-600 tracking-tight">
                              {currency} {(
                                reportTimeframe === 'DAY' ? (dashStats.todayProfit || 0) :
                                  reportTimeframe === 'MONTH' ? (dashStats.monthlyProfit || 0) :
                                    reportTimeframe === 'YEAR' ? (dashStats.yearlyProfit || 0) :
                                      dashStats.totalProfit
                              ).toLocaleString('en-PK')}
                            </h4>
                            <span className="text-[9px] text-green-600/70 font-bold uppercase">Net Profit</span>
                          </div>

                          <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl">
                            <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest block mb-1">
                              {reportTimeframe === 'DAY' ? 'Today Expenses & Losses' : reportTimeframe === 'MONTH' ? 'Monthly Expenses & Losses' : reportTimeframe === 'YEAR' ? 'Yearly Expenses & Losses' : 'Total Loss / Returns'}
                            </span>
                            <h4 className="text-2xl font-black text-rose-600 tracking-tight">
                              {currency} {(
                                reportTimeframe === 'DAY' ? (dashStats.todayLoss || 0) :
                                  reportTimeframe === 'MONTH' ? (dashStats.monthlyLoss || 0) :
                                    reportTimeframe === 'YEAR' ? (dashStats.yearlyLoss || 0) :
                                      dashStats.totalLoss
                              ).toLocaleString('en-PK')}
                            </h4>
                            <span className="text-[9px] text-rose-600/70 font-bold uppercase">Expenses & Returns</span>
                          </div>

                          <div className="p-4 bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-lg">
                            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block mb-1">
                              Net Liquidity / Balance
                            </span>
                            <h4 className="text-2xl font-black text-white tracking-tight">
                              {currency} {(
                                (reportTimeframe === 'DAY' ? ((dashStats.todayProfit || 0) - (dashStats.todayLoss || 0)) :
                                  reportTimeframe === 'MONTH' ? ((dashStats.monthlyProfit || 0) - (dashStats.monthlyLoss || 0)) :
                                    reportTimeframe === 'YEAR' ? ((dashStats.yearlyProfit || 0) - (dashStats.yearlyLoss || 0)) :
                                      (dashStats.totalProfit - dashStats.totalLoss))
                              ).toLocaleString('en-PK')}
                            </h4>
                            <span className="text-[9px] text-white/60 font-bold uppercase">Net Profit - Expenses</span>
                          </div>
                        </div>

                        {/* Generate & Print Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-100">
                          <div className="text-xs text-zinc-500 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Showing <span className="font-black text-zinc-800">{reportTimeframe}</span> report summary for {shop?.name || 'Shop'}.
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handlePrintSummaryReport(reportTimeframe)}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                              <Printer className="w-4 h-4" /> Print / Download {reportTimeframe} Report
                            </button>
                            <button
                              onClick={() => handlePrintSummaryReport('ALL')}
                              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4" /> Print All-Time Total Summary
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* EasyPaisa & Customer Orders Verification */}
                      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl text-zinc-900">
                        <OrdersManagement />
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
                      {items.map(item => (
                        <div
                          key={item._id}
                          className="group bg-[#1E293B] border border-slate-700/60 hover:border-emerald-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex flex-col"
                        >
                          {/* Image Container */}
                          <button onClick={() => setSelectedItem(item)} className="block aspect-square bg-slate-900 overflow-hidden relative">
                            {item.images?.[0] ? (
                              <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Egg className="w-12 h-12 text-slate-700" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3 bg-[#111827]/90 px-3 py-1 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest border border-slate-700">
                              {item.category}
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

                            {isAdminUser ? (
                              <div className="flex flex-col gap-1.5 w-full pt-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); addToWalkInCart(item); }}
                                  className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md border-t border-emerald-400/30 border-b-2 border-emerald-950 active:translate-y-[1px] transition-all cursor-pointer"
                                  title="Add product to Customer Walk-in Bill"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>+ Add to Bill</span>
                                </button>
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
                                    onClick={(e) => { e.stopPropagation(); setDeleteDialog({ isOpen: true, item }); }}
                                    className="py-1.5 px-1 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-md border-t border-rose-400/30 border-b-2 border-rose-950 active:translate-y-[1px] transition-all cursor-pointer"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            ) : canBuy ? (
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-[#1B3817] hover:bg-[#12290D] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-md active:translate-y-[2px] active:border-b-0"
                              >
                                <Plus className="w-4 h-4" />
                                Add to Cart
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ─── WALK-IN POS & BILLING VIEW ─── */}
              {activeView === 'walkin' && isAdminUser && (
                <div className="space-y-6">
                  {/* Top Banner */}
                  <div className="bg-gradient-to-r from-[#2D5A27] via-[#24491F] to-[#1B3817] p-6 rounded-3xl border border-white/10 shadow-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest mb-1">
                        <Receipt className="w-4 h-4" /> Shop Admin Walk-in POS
                      </div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tight">Customer Sale & Billing System</h2>
                      <p className="text-slate-300 text-xs mt-1">Select items for the customer, enter customer details, and generate printable PDF / WhatsApp bill.</p>
                    </div>
                    <button
                      onClick={() => { setActiveView('sales'); fetchShopSales(); }}
                      className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2 shadow-lg transition-all"
                    >
                      <DollarSign className="w-4 h-4 text-amber-400" /> View Sales History
                    </button>
                  </div>

                  {/* POS Split Screen */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left: Product Catalog Selection (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                      {/* POS Search & Filter */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Search products for customer..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-emerald-500 transition-colors shadow-inner"
                          />
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                        <select
                          value={activeCategory}
                          onChange={e => setActiveCategory(e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-white rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-500"
                        >
                          {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Items Grid for POS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                        {items.map(product => {
                          const inCart = walkInCart.find(i => i.product._id === product._id);
                          return (
                            <div
                              key={product._id}
                              className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-3 flex gap-3 items-center hover:border-emerald-500/50 transition-all"
                            >
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-700">
                                {product.images?.[0] ? (
                                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-8 h-8 m-4 text-slate-700" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-black text-white text-xs uppercase tracking-tight truncate">{product.name}</h4>
                                <p className="text-emerald-400 font-black text-xs">{currency} {product.price.toLocaleString()}</p>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${product.stock > 0 ? 'text-slate-400' : 'text-rose-400'}`}>
                                  Stock: {product.stock}
                                </span>
                              </div>
                              <button
                                onClick={() => addToWalkInCart(product)}
                                disabled={product.stock <= 0}
                                className={`p-2.5 rounded-xl font-black text-xs transition-all ${inCart
                                  ? 'bg-emerald-600 text-white shadow-lg'
                                  : product.stock > 0
                                    ? 'bg-slate-800 hover:bg-emerald-700 text-white border border-slate-600'
                                    : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                                  }`}
                                title="Add to Bill"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Walk-in Cart & Customer Billing Details (5 cols) */}
                    <div className="lg:col-span-5 bg-[#1E293B] border border-slate-700/60 rounded-3xl p-5 space-y-5 shadow-2xl flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-emerald-400" /> Customer Bill Cart ({walkInCart.length})
                          </h3>
                          {walkInCart.length > 0 && (
                            <button
                              onClick={() => setWalkInCart([])}
                              className="text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest"
                            >
                              Clear Bill
                            </button>
                          )}
                        </div>

                        {/* Customer Information Inputs */}
                        <div className="space-y-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Customer Details (Optional)</p>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Customer Full Name (e.g. Ahmad Khan)"
                              value={walkInCustomerName}
                              onChange={e => setWalkInCustomerName(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
                            />
                            <input
                              type="text"
                              placeholder="WhatsApp / Phone Number (e.g. +923001234567)"
                              value={walkInCustomerPhone}
                              onChange={e => setWalkInCustomerPhone(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Items List in Bill */}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {walkInCart.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-xs font-bold uppercase tracking-widest border border-dashed border-slate-700 rounded-2xl">
                              No products added to bill yet
                            </div>
                          ) : (
                            walkInCart.map(item => (
                              <div
                                key={item.product._id}
                                className="flex items-center justify-between p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl gap-2 text-xs"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-white uppercase truncate">{item.product.name}</p>
                                  <p className="text-[10px] text-emerald-400 font-bold">{currency} {item.product.price} each</p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateWalkInQty(item.product._id, -1)}
                                    className="p-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="font-black text-white px-1.5">{item.quantity}</span>
                                  <button
                                    onClick={() => updateWalkInQty(item.product._id, 1)}
                                    className="p-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="text-right min-w-[60px]">
                                  <p className="font-black text-white">{currency} {(item.product.price * item.quantity).toLocaleString()}</p>
                                </div>

                                <button
                                  onClick={() => removeFromWalkInCart(item.product._id)}
                                  className="p-1 text-slate-400 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Total & Complete Sale Button */}
                      <div className="space-y-4 pt-4 border-t border-slate-700">
                        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-700">
                          <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Total Bill Amount</span>
                          <span className="text-2xl font-black text-emerald-400">
                            {currency} {walkInCart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0).toLocaleString()}
                          </span>
                        </div>

                        <button
                          onClick={handleCompleteWalkInSale}
                          disabled={walkInCart.length === 0 || isProcessingWalkIn}
                          className="w-full py-4 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl border-t border-emerald-400/30 border-b-4 border-emerald-950 transition-all flex items-center justify-center gap-2 active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessingWalkIn ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              )}

              {/* ─── SHOPADMIN SALES & BILLS HISTORY VIEW ─── */}
              {activeView === 'sales' && isAdminUser && (
                <div className="space-y-6">
                  {/* Top Stats Banner */}
                  <div className="bg-gradient-to-r from-[#2D5A27] via-[#24491F] to-[#1B3817] p-6 rounded-3xl border border-white/10 shadow-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest mb-1">
                        <DollarSign className="w-4 h-4" /> Shop Sales Dashboard
                      </div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tight">Sales & Customer Bills History</h2>
                      <p className="text-slate-300 text-xs mt-1">Review all past transactions, print receipts, and share bills on WhatsApp.</p>
                    </div>

                    <button
                      onClick={() => setActiveView('walkin')}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 shadow-lg transition-all"
                    >
                      <Plus className="w-4 h-4" /> New Walk-in Sale
                    </button>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sales Completed</p>
                      <p className="text-2xl font-black text-white mt-1">{shopSalesList.length}</p>
                    </div>

                    <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue Generated</p>
                      <p className="text-2xl font-black text-emerald-400 mt-1">
                        {currency} {shopSalesList.reduce((sum, s) => sum + (s.totalAmount || 0), 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Profit Earned</p>
                      <p className="text-2xl font-black text-amber-400 mt-1">
                        {currency} {shopSalesList.reduce((sum, s) => sum + (s.totalProfit || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Sales Table */}
                  <div className="bg-[#1E293B] border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-4 bg-slate-900/80 border-b border-slate-700/60 flex items-center justify-between">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">All Sales Records</h3>
                      <button
                        onClick={fetchShopSales}
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest"
                      >
                        Refresh List
                      </button>
                    </div>

                    {loadingSales ? (
                      <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Loading sales history...
                      </div>
                    ) : shopSalesList.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                        No sales records found for this shop yet
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-white">
                          <thead className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-700">
                            <tr>
                              <th className="p-4">Date & Time</th>
                              <th className="p-4">Customer</th>
                              <th className="p-4">Items Breakdown</th>
                              <th className="p-4 text-right">Total Paid</th>
                              <th className="p-4 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80">
                            {shopSalesList.map(sale => (
                              <tr key={sale._id} className="hover:bg-slate-800/40">
                                <td className="p-4 font-bold text-slate-300">
                                  {new Date(sale.saleDate || sale.createdAt).toLocaleString()}
                                </td>
                                <td className="p-4 font-black uppercase text-white">
                                  {sale.customerName || 'Walk-in Customer'}
                                </td>
                                <td className="p-4 text-slate-300">
                                  {(sale.items || []).map(i => `${i.name} (${i.quantity})`).join(', ')}
                                </td>
                                <td className="p-4 text-right font-black text-emerald-400 text-sm">
                                  {currency} {(sale.totalAmount || 0).toLocaleString()}
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => setCompletedBill(sale)}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-800 text-emerald-300 rounded-xl font-bold text-[10px] uppercase tracking-wider border border-slate-700 transition-all flex items-center gap-1.5 mx-auto"
                                  >
                                    <Receipt className="w-3.5 h-3.5" /> View Bill
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
              )}

              {/* ─── EASYPAISA & CUSTOMER ORDERS VIEW FOR SHOP ADMIN ─── */}
              {activeView === 'orders' && isAdminUser && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <OrdersManagement />
                </div>
              )}

              {/* ─── 1. SALES REPORT VIEW FOR SHOP ADMIN ─── */}
              {activeView === 'report-sales' && isAdminUser && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-gradient-to-r from-[#1B3817] via-[#24491F] to-[#0f172a] p-6 rounded-3xl border border-white/10 shadow-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest mb-1">
                        <TrendingUp className="w-4 h-4" /> Customer & POS Sales Report
                      </div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tight">Sales Revenue Analytics Report</h2>
                      <p className="text-slate-300 text-xs mt-1">
                        View itemized gross sales filtered strictly by Days (Today), Months, Years, or All-Time.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrintSingleReport('sales', reportTimeframe)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95"
                      >
                        <Printer className="w-4 h-4" /> Print PDF Report
                      </button>
                      <button
                        onClick={() => handleWhatsAppReportShare('sales', reportTimeframe)}
                        className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 border border-emerald-500/40"
                      >
                        <Send className="w-4 h-4" /> Share WhatsApp
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl text-zinc-900 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black text-zinc-800 uppercase tracking-[0.15em] flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          Sales Timeframe Selector (Days / Months / Year)
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                          Select time filter to isolate and display only that period's sales report
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
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                              }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block mb-1">
                          {reportTimeframe === 'DAY' ? 'Today (Day) Sales Revenue' : reportTimeframe === 'MONTH' ? 'Monthly Sales Revenue' : reportTimeframe === 'YEAR' ? 'Yearly Sales Revenue' : 'All-Time Cumulative Sales'}
                        </span>
                        <h4 className="text-3xl font-black text-emerald-600 tracking-tight">
                          {currency} {(
                            reportTimeframe === 'DAY' ? dashStats.todaySales :
                              reportTimeframe === 'MONTH' ? dashStats.monthlySales :
                                reportTimeframe === 'YEAR' ? dashStats.yearlySales :
                                  dashStats.totalRevenue
                          ).toLocaleString('en-PK')}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintSingleReport('sales', reportTimeframe)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-xl shadow-md"
                        >
                          Print PDF Sheet
                        </button>
                        <button
                          onClick={() => handleWhatsAppReportShare('sales', reportTimeframe)}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs uppercase rounded-xl shadow-md flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Send WhatsApp
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-zinc-700 uppercase tracking-wider">Filtered Sales Period Statement</h4>
                      <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                        <table className="w-full text-left text-xs text-zinc-800">
                          <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-zinc-200">
                            <tr>
                              <th className="p-3.5">Selected Period</th>
                              <th className="p-3.5">Sales Revenue (RS)</th>
                              <th className="p-3.5 text-right">Filter Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            {reportTimeframe === 'DAY' && (
                              <tr className="bg-emerald-100/80 font-bold">
                                <td className="p-3.5 font-bold">Today (Daily Sales Report)</td>
                                <td className="p-3.5 text-emerald-600 font-bold">{currency} {dashStats.todaySales.toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-black text-[9px]">TODAY ONLY</span></td>
                              </tr>
                            )}
                            {reportTimeframe === 'MONTH' && (
                              <tr className="bg-emerald-100/80 font-bold">
                                <td className="p-3.5 font-bold">This Month (Monthly Sales Report)</td>
                                <td className="p-3.5 text-emerald-600 font-bold">{currency} {dashStats.monthlySales.toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right"><span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full font-black text-[9px]">MONTHLY ONLY</span></td>
                              </tr>
                            )}
                            {reportTimeframe === 'YEAR' && (
                              <tr className="bg-emerald-100/80 font-bold">
                                <td className="p-3.5 font-bold">This Year (Yearly Sales Report)</td>
                                <td className="p-3.5 text-emerald-600 font-bold">{currency} {dashStats.yearlySales.toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right"><span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 rounded-full font-black text-[9px]">YEARLY ONLY</span></td>
                              </tr>
                            )}
                            {reportTimeframe === 'ALL' && (
                              <tr className="bg-slate-900 text-white font-bold">
                                <td className="p-3.5 font-black uppercase text-yellow-400">All-Time Cumulative Sales</td>
                                <td className="p-3.5 text-emerald-300 font-black text-sm">{currency} {dashStats.totalRevenue.toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right text-yellow-300 font-black">ALL-TIME TOTAL</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── 2. PROFIT REPORT VIEW FOR SHOP ADMIN ─── */}
              {activeView === 'report-profit' && isAdminUser && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-gradient-to-r from-[#1B3817] via-[#24491F] to-[#0f172a] p-6 rounded-3xl border border-white/10 shadow-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-green-400 text-xs font-black uppercase tracking-widest mb-1">
                        <DollarSign className="w-4 h-4" /> Shop Net Profit Report
                      </div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tight">Net Profit Analytics Report</h2>
                      <p className="text-slate-300 text-xs mt-1">
                        View itemized profit earned filtered strictly by Days (Today), Months, Years, or All-Time.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrintSingleReport('profit', reportTimeframe)}
                        className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95"
                      >
                        <Printer className="w-4 h-4" /> Print PDF Report
                      </button>
                      <button
                        onClick={() => handleWhatsAppReportShare('profit', reportTimeframe)}
                        className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 border border-emerald-500/40"
                      >
                        <Send className="w-4 h-4" /> Share WhatsApp
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl text-zinc-900 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black text-zinc-800 uppercase tracking-[0.15em] flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          Profit Timeframe Selector (Days / Months / Year)
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                          Select time filter to isolate and display only that period's profit report
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
                                ? 'bg-green-600 text-white shadow-md'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                              }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-green-50/80 border border-green-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black text-green-700 uppercase tracking-widest block mb-1">
                          {reportTimeframe === 'DAY' ? 'Today (Day) Profit Earned' : reportTimeframe === 'MONTH' ? 'Monthly Profit Earned' : reportTimeframe === 'YEAR' ? 'Yearly Profit Earned' : 'All-Time Total Profit'}
                        </span>
                        <h4 className="text-3xl font-black text-green-600 tracking-tight">
                          {currency} {(
                            reportTimeframe === 'DAY' ? (dashStats.todayProfit || 0) :
                              reportTimeframe === 'MONTH' ? (dashStats.monthlyProfit || 0) :
                                reportTimeframe === 'YEAR' ? (dashStats.yearlyProfit || 0) :
                                  dashStats.totalProfit
                          ).toLocaleString('en-PK')}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintSingleReport('profit', reportTimeframe)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase rounded-xl shadow-md"
                        >
                          Print PDF Sheet
                        </button>
                        <button
                          onClick={() => handleWhatsAppReportShare('profit', reportTimeframe)}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs uppercase rounded-xl shadow-md flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Send WhatsApp
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-zinc-700 uppercase tracking-wider">Filtered Profit Period Statement</h4>
                      <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                        <table className="w-full text-left text-xs text-zinc-800">
                          <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-zinc-200">
                            <tr>
                              <th className="p-3.5">Selected Period</th>
                              <th className="p-3.5">Profit Earned (RS)</th>
                              <th className="p-3.5 text-right">Filter Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            {reportTimeframe === 'DAY' && (
                              <tr className="bg-green-100/80 font-bold">
                                <td className="p-3.5 font-bold">Today (Daily Profit Report)</td>
                                <td className="p-3.5 text-green-600 font-bold">{currency} {(dashStats.todayProfit || 0).toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right"><span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full font-black text-[9px]">TODAY ONLY</span></td>
                              </tr>
                            )}
                            {reportTimeframe === 'MONTH' && (
                              <tr className="bg-green-100/80 font-bold">
                                <td className="p-3.5 font-bold">This Month (Monthly Profit Report)</td>
                                <td className="p-3.5 text-green-600 font-bold">{currency} {(dashStats.monthlyProfit || 0).toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right"><span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full font-black text-[9px]">MONTHLY ONLY</span></td>
                              </tr>
                            )}
                            {reportTimeframe === 'YEAR' && (
                              <tr className="bg-green-100/80 font-bold">
                                <td className="p-3.5 font-bold">This Year (Yearly Profit Report)</td>
                                <td className="p-3.5 text-green-600 font-bold">{currency} {(dashStats.yearlyProfit || 0).toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right"><span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 rounded-full font-black text-[9px]">YEARLY ONLY</span></td>
                              </tr>
                            )}
                            {reportTimeframe === 'ALL' && (
                              <tr className="bg-slate-900 text-white font-bold">
                                <td className="p-3.5 font-black uppercase text-yellow-400">All-Time Cumulative Profit</td>
                                <td className="p-3.5 text-green-300 font-black text-sm">{currency} {dashStats.totalProfit.toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right text-yellow-300 font-black">ALL-TIME PROFIT</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── 3. EXPENSES & LOSS REPORT VIEW FOR SHOP ADMIN ─── */}
              {activeView === 'report-expenses' && isAdminUser && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-gradient-to-r from-[#1B3817] via-[#24491F] to-[#0f172a] p-6 rounded-3xl border border-white/10 shadow-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-rose-400 text-xs font-black uppercase tracking-widest mb-1">
                        <FileText className="w-4 h-4" /> Shop Expenses & Returns Loss Report
                      </div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tight">Expenses & Loss Analytics Report</h2>
                      <p className="text-slate-300 text-xs mt-1">
                        Log custom manual expenses (Rent, Bills, Packaging, Transport, Egg Damage) dynamically.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setShowAddExpenseModal(true)}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> + Add Manual Expense
                      </button>
                      <button
                        onClick={() => handlePrintSingleReport('expenses', reportTimeframe)}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95"
                      >
                        <Printer className="w-4 h-4" /> Print PDF Report
                      </button>
                      <button
                        onClick={() => handleWhatsAppReportShare('expenses', reportTimeframe)}
                        className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 border border-emerald-500/40"
                      >
                        <Send className="w-4 h-4" /> Share WhatsApp
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl text-zinc-900 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black text-zinc-800 uppercase tracking-[0.15em] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-rose-600" />
                          Expenses Timeframe Selector (Days / Months / Year)
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                          Select time filter to isolate and display only that period's expenses report
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
                                ? 'bg-rose-600 text-white shadow-md'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                              }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-rose-50/80 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest block mb-1">
                          {reportTimeframe === 'DAY' ? 'Today (Day) Expenses & Losses' : reportTimeframe === 'MONTH' ? 'Monthly Expenses & Losses' : reportTimeframe === 'YEAR' ? 'Yearly Expenses & Losses' : 'All-Time Total Expenses'}
                        </span>
                        <h4 className="text-3xl font-black text-rose-600 tracking-tight">
                          {currency} {(
                            reportTimeframe === 'DAY' ? (dashStats.todayLoss || 0) :
                              reportTimeframe === 'MONTH' ? (dashStats.monthlyLoss || 0) :
                                reportTimeframe === 'YEAR' ? (dashStats.yearlyLoss || 0) :
                                  dashStats.totalLoss
                          ).toLocaleString('en-PK')}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowAddExpenseModal(true)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-md cursor-pointer"
                        >
                          + Add Expense
                        </button>
                        <button
                          onClick={() => handlePrintSingleReport('expenses', reportTimeframe)}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase rounded-xl shadow-md"
                        >
                          Print PDF Sheet
                        </button>
                        <button
                          onClick={() => handleWhatsAppReportShare('expenses', reportTimeframe)}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs uppercase rounded-xl shadow-md flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Send WhatsApp
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-zinc-700 uppercase tracking-wider">Filtered Expenses Period Statement</h4>
                      <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                        <table className="w-full text-left text-xs text-zinc-800">
                          <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-zinc-200">
                            <tr>
                              <th className="p-3.5">Selected Period</th>
                              <th className="p-3.5">Expenses & Loss (RS)</th>
                              <th className="p-3.5 text-right">Filter Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            {reportTimeframe === 'DAY' && (
                              <tr className="bg-rose-100/80 font-bold">
                                <td className="p-3.5 font-bold">Today (Daily Expenses Report)</td>
                                <td className="p-3.5 text-rose-600 font-bold">{currency} {(dashStats.todayLoss || 0).toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right"><span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded-full font-black text-[9px]">TODAY ONLY</span></td>
                              </tr>
                            )}
                            {reportTimeframe === 'MONTH' && (
                              <tr className="bg-rose-100/80 font-bold">
                                <td className="p-3.5 font-bold">This Month (Monthly Expenses Report)</td>
                                <td className="p-3.5 text-rose-600 font-bold">{currency} {(dashStats.monthlyLoss || 0).toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right"><span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full font-black text-[9px]">MONTHLY ONLY</span></td>
                              </tr>
                            )}
                            {reportTimeframe === 'YEAR' && (
                              <tr className="bg-rose-100/80 font-bold">
                                <td className="p-3.5 font-bold">This Year (Yearly Expenses Report)</td>
                                <td className="p-3.5 text-rose-600 font-bold">{currency} {(dashStats.yearlyLoss || 0).toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right"><span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded-full font-black text-[9px]">YEARLY ONLY</span></td>
                              </tr>
                            )}
                            {reportTimeframe === 'ALL' && (
                              <tr className="bg-slate-900 text-white font-bold">
                                <td className="p-3.5 font-black uppercase text-yellow-400">All-Time Cumulative Expenses & Loss</td>
                                <td className="p-3.5 text-rose-300 font-black text-sm">{currency} {dashStats.totalLoss.toLocaleString('en-PK')}</td>
                                <td className="p-3.5 text-right text-yellow-300 font-black">ALL-TIME EXPENSES</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* ─── DYNAMIC LOGGED MANUAL EXPENSES TABLE ─── */}
                    <div className="space-y-3 pt-6 border-t border-zinc-100">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-4 h-4 text-rose-600" />
                          Shop Expenses List ({expensesList.length})
                        </h4>
                        <button
                          onClick={() => setShowAddExpenseModal(true)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow"
                        >
                          <Plus className="w-3.5 h-3.5" /> Log Expense Entry
                        </button>
                      </div>

                      {expensesList.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No manual shop expenses logged yet.</p>
                          <p className="text-[10px] text-slate-400 mt-1">Click "+ Add Manual Expense" to enter shop rent, electricity, packaging, or egg damage expenses.</p>
                          <button
                            onClick={() => setShowAddExpenseModal(true)}
                            className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add First Expense
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                          <table className="w-full text-left text-xs text-zinc-800">
                            <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-zinc-200">
                              <tr>
                                <th className="p-3.5">Date & Time</th>
                                <th className="p-3.5">Expense Title</th>
                                <th className="p-3.5">Category</th>
                                <th className="p-3.5">Amount (RS)</th>
                                <th className="p-3.5">Logged By / Notes</th>
                                <th className="p-3.5 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                              {expensesList.map(exp => (
                                <tr key={exp._id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3.5 font-bold text-slate-500">
                                    {new Date(exp.expenseDate || exp.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="p-3.5 font-black text-slate-900">
                                    {exp.title}
                                  </td>
                                  <td className="p-3.5">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${exp.category === 'Rent' ? 'bg-blue-100 text-blue-700' :
                                        exp.category === 'Utilities / Bills' ? 'bg-amber-100 text-amber-700' :
                                          exp.category === 'Salaries' ? 'bg-purple-100 text-purple-700' :
                                            exp.category === 'Egg Damage / Loss' ? 'bg-rose-100 text-rose-700' :
                                              exp.category === 'Transport & Freight' ? 'bg-indigo-100 text-indigo-700' :
                                                'bg-emerald-100 text-emerald-700'
                                      }`}>
                                      {exp.category}
                                    </span>
                                  </td>
                                  <td className="p-3.5 font-black text-rose-600 text-sm">
                                    {currency} {(Number(exp.amount) || 0).toLocaleString('en-PK')}
                                  </td>
                                  <td className="p-3.5 text-slate-500 text-[11px]">
                                    {exp.notes || exp.createdBy || 'Shop Admin'}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    <button
                                      onClick={() => handleDeleteExpense(exp._id)}
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
                                      title="Delete Expense"
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
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> + Log Damaged Product
                      </button>
                      <button
                        onClick={() => handlePrintSingleReport('damaged', reportTimeframe)}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95"
                      >
                        <Printer className="w-4 h-4" /> Print PDF Report
                      </button>
                      <button
                        onClick={() => handleWhatsAppReportShare('damaged', reportTimeframe)}
                        className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 border border-emerald-500/40"
                      >
                        <Send className="w-4 h-4" /> Share WhatsApp
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowAddDamagedModal(true)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-md cursor-pointer"
                        >
                          + Log Damaged Product
                        </button>
                        <button
                          onClick={() => handlePrintSingleReport('damaged', reportTimeframe)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase rounded-xl shadow-md"
                        >
                          Print PDF Sheet
                        </button>
                        <button
                          onClick={() => handleWhatsAppReportShare('damaged', reportTimeframe)}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs uppercase rounded-xl shadow-md flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Send WhatsApp
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
                                    {dmg.quantity} Units
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
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">In Stock</p>
                  <p className="text-xl font-black text-white">{selectedItem.stock} <span className="text-xs text-slate-400">units</span></p>
                </div>
              </div>

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
                <button
                  onClick={() => { handleAddToCart(selectedItem); setSelectedItem(null); }}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[#1B3817] hover:bg-[#12290D] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:translate-y-[2px]"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
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
                <Plus className="w-5 h-5" /> Add New Manual Expense
              </div>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-rose-100 text-zinc-500 hover:text-rose-600 flex items-center justify-center font-bold text-sm transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
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
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Save Expense
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
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-amber-100 text-zinc-500 hover:text-amber-600 flex items-center justify-center font-bold text-sm transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDamagedSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Product Name *</label>
                <select
                  onChange={e => {
                    const selected = items.find(i => String(i._id) === String(e.target.value));
                    if (selected) {
                      setDamagedFormData(prev => ({
                        ...prev,
                        productId: selected._id,
                        productName: selected.name,
                        unitPrice: selected.price || selected.salePrice || ''
                      }));
                    } else if (e.target.value === 'CUSTOM') {
                      setDamagedFormData(prev => ({ ...prev, productId: '', productName: '' }));
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-amber-500 mb-2"
                >
                  <option value="">-- Select Catalog Item (Optional) --</option>
                  {(items || []).map(i => (
                    <option key={i._id} value={i._id}>{i.name} (RS {i.price || i.salePrice || 0})</option>
                  ))}
                  <option value="CUSTOM">Custom Product Name</option>
                </select>

                <input
                  type="text"
                  required
                  placeholder="e.g. Loman Brown Eggs, China Eggs..."
                  value={damagedFormData.productName}
                  onChange={e => setDamagedFormData(prev => ({ ...prev, productName: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Damaged Qty (Units) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 30"
                    value={damagedFormData.quantity}
                    onChange={e => setDamagedFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Unit Price / Cost (RS)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 30"
                    value={damagedFormData.unitPrice}
                    onChange={e => setDamagedFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Total Loss Amount (RS)</label>
                  <div className="w-full px-4 py-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-black text-amber-700">
                    RS {((Number(damagedFormData.quantity) || 0) * (Number(damagedFormData.unitPrice) || 0)).toLocaleString('en-PK')}
                  </div>
                </div>
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
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold uppercase tracking-wider"
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
      <div className="max-w-4xl w-full z-10 py-12">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex p-2 bg-white rounded-[2rem] mb-2 shadow-2xl">
            <img src={companyLogo} alt="Attock Shop" className="h-20 w-auto object-contain drop-shadow-xl" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase italic">
            YOSAFZE EGG TRADERS
          </h1>
          <p className="text-emerald-400 font-black uppercase tracking-[0.3em] text-xs">
            Multi-Branch Portal (Peshawar, Attock, Mardan & All Branches)
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {allShops.map((s, idx) => (
              <button
                key={s._id}
                onClick={() => navigate(`/shop/${s._id}`)}
                className="group bg-[#1E293B] hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-[2rem] p-7 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Branch #{idx + 1}
                </div>
                <div className="flex items-center gap-5 mb-3">
                  <div className="p-4 bg-white rounded-2xl group-hover:scale-110 transition-transform shadow-md">
                    {s.logoUrl ? (
                      <img src={s.logoUrl} alt={s.name} className="w-10 h-10 object-contain rounded-xl" />
                    ) : (
                      <img src={companyLogo} alt="Yosafze Egg Traders" className="w-10 h-10 object-contain rounded-xl" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight uppercase italic group-hover:text-emerald-300 transition-colors">{s.name}</h2>
                    {s.address && <p className="text-slate-400 text-xs font-bold mt-0.5 uppercase tracking-wider">{s.address}</p>}
                  </div>
                </div>
                <div className="space-y-1 mb-4">
                  <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <span className="text-emerald-400 font-mono">Unique ID:</span>
                    <span className="font-mono text-white text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700/80">{s._id}</span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-500">
                    Shortcut URL: <span className="text-amber-300 font-mono">/shop/{idx + 1}</span>
                  </p>
                </div>
                <div className="flex items-center justify-between text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] pt-4 border-t border-slate-700/60">
                  <span>Enter {s.name} Portal</span>
                  <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
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
