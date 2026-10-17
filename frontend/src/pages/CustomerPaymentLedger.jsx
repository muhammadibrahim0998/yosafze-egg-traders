import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  DollarSign,
  Building2,
  CreditCard,
  Users,
  Search,
  Filter,
  Calendar,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Package,
  Layers,
  Banknote,
  Receipt,
  ChevronDown,
  ChevronUp,
  FileText,
  ArrowRight,
  X,
  Sparkles,
  Pencil,
  Trash2,
  Tag
} from 'lucide-react';
import api, { getPaymentLedger, getCustomerCredits, updateSale, deleteSale } from '../services/api';
import { useProducts } from '../contexts/ProductContext';
import { useUser } from '../contexts/UserContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function CustomerPaymentLedger({ shopId: propShopId }) {
  const { user } = useUser();
  const { sales = [], products = [], categories = [], fetchData } = useProducts();

  // Local state
  const [viewMode, setViewMode] = useState('transactions'); // 'transactions' | 'customerwise'
  const [expandedCustomers, setExpandedCustomers] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL'); // 'ALL' | 'CASH' | 'BANK' | 'SPLIT' | 'CREDIT'
  const [customerCredits, setCustomerCredits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Edit & Delete Modal States
  const [editingSale, setEditingSale] = useState(null);
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    customerPhone: '',
    category: 'Eggs',
    totalAmount: 0,
    cashPaid: 0,
    bankPaid: 0,
    dueAmount: 0,
    paymentMethod: 'CASH'
  });
  const [deletingSale, setDeletingSale] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const activeShopId = propShopId || (user?.shopId ? (typeof user.shopId === 'object' ? (user.shopId._id || user.shopId.id) : String(user.shopId)) : null);

  // Dynamic Ledger data from API
  const [ledgerApiData, setLedgerApiData] = useState({
    summary: null,
    sales: []
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ledgerRes, creditsRes] = await Promise.allSettled([
        getPaymentLedger(activeShopId),
        getCustomerCredits(activeShopId)
      ]);

      if (ledgerRes.status === 'fulfilled' && ledgerRes.value?.success) {
        setLedgerApiData({
          summary: ledgerRes.value.summary || null,
          sales: Array.isArray(ledgerRes.value.sales) ? ledgerRes.value.sales : []
        });
      }

      if (creditsRes.status === 'fulfilled' && Array.isArray(creditsRes.value)) {
        setCustomerCredits(creditsRes.value);
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error loading Customer Payment Ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeShopId]);

  const handleRefresh = async () => {
    if (fetchData) await fetchData();
    await loadData();
  };

  const fmt = (num) => Number(num || 0).toLocaleString('en-PK');

  // Quick preset helper
  const applyPreset = (preset) => {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      const str = toYMD(today);
      setStartDate(str);
      setEndDate(str);
    } else if (preset === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(toYMD(startOfMonth));
      setEndDate(toYMD(today));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Date filter helper
  const isInDateRange = (itemDate) => {
    if (!itemDate) return true;
    const date = new Date(itemDate);
    if (isNaN(date.getTime())) return true;

    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      if (date < s) return false;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      if (date > e) return false;
    }
    return true;
  };

  // 1. Process Customer Sales Ledger List
  const customerLedgerList = useMemo(() => {
    const rawList = (ledgerApiData.sales && ledgerApiData.sales.length > 0)
      ? ledgerApiData.sales
      : (sales || []);

    return (rawList || [])
      .filter(s => s && s.status !== 'cancelled')
      .map(s => {
        const total = Number(s.totalAmount) || 0;
        let cash = Number(s.cashPaid) || 0;
        let bank = Number(s.bankPaid) || 0;
        let due = Number(s.dueAmount) || 0;
        const pMethod = String(s.paymentMethod || 'CASH').toUpperCase();

        if (cash === 0 && bank === 0 && due === 0) {
          if (pMethod === 'CASH') cash = total;
          else if (pMethod.includes('BANK') || pMethod.includes('ONLINE') || pMethod.includes('EASYPAISA')) bank = total;
          else if (pMethod.includes('CREDIT') || pMethod.includes('DUE')) due = total;
          else cash = total;
        }

        let itemsList = [];
        if (Array.isArray(s.items)) {
          itemsList = s.items;
        } else if (typeof s.items === 'string') {
          try { itemsList = JSON.parse(s.items); } catch {}
        }

        let totalPetisBought = Number(s.petisBought) || 0;
        let totalEggsBought = Number(s.eggsBought) || 0;
        let itemsSummary = [];
        let determinedCategory = s.category || itemsList[0]?.category || '';

        if (itemsList.length > 0) {
          itemsSummary = [];
          itemsList.forEach(it => {
            const qty = Number(it.quantity) || 1;
            const uType = it.unitLabel || it.unit || it.unitType || 'peti';
            let petiCount = 0;
            let eggCount = 0;

            if (uType === 'peti') {
              petiCount = qty;
              eggCount = qty * 360;
            } else if (uType === 'tray') {
              petiCount = qty / 12;
              eggCount = qty * 30;
            } else {
              petiCount = qty / 360;
              eggCount = qty;
            }

            if (Number(it.petiQuantity) > 0) petiCount = Number(it.petiQuantity);
            if (Number(it.totalEggs) > 0) eggCount = Number(it.totalEggs);

            if (totalPetisBought === 0) totalPetisBought += petiCount;
            if (totalEggsBought === 0) totalEggsBought += eggCount;
            itemsSummary.push(`${it.rawProductName || it.name || 'Eggs'} (${qty} ${uType})`);
            if (!determinedCategory && it.category) determinedCategory = it.category;
          });
        }

        const finalItemsDesc = itemsSummary.length > 0
          ? itemsSummary.join(', ')
          : (s.itemsDescription && s.itemsDescription !== 'Eggs Stock' ? s.itemsDescription : 'Eggs Stock');

        if (!determinedCategory) {
          determinedCategory = 'Eggs';
        }

        return {
          id: s._id || s.id,
          date: s.saleDate || s.date || s.createdAt,
          invoiceNumber: s.invoiceNumber || `INV-${String(s.serialNumber || s.id).slice(-5)}`,
          customerName: s.customerName || (due > 0 ? 'Credit Customer' : 'Walk-in Customer'),
          customerPhone: s.customerPhone || '',
          category: determinedCategory,
          totalAmount: total,
          cashPaid: cash,
          bankPaid: bank,
          dueAmount: due,
          paymentMethod: pMethod,
          petisBought: totalPetisBought > 0 ? Number(totalPetisBought.toFixed(2)) : 0,
          eggsBought: Math.round(totalEggsBought),
          itemsDescription: finalItemsDesc,
          items: itemsList,
          isCredit: due > 0 || pMethod.includes('CREDIT')
        };
      })
      .filter(item => isInDateRange(item.date))
      .filter(item => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          item.customerName.toLowerCase().includes(q) ||
          item.customerPhone.toLowerCase().includes(q) ||
          item.invoiceNumber.toLowerCase().includes(q) ||
          item.itemsDescription.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      })
      .filter(item => {
        if (paymentMethodFilter === 'ALL') return true;
        if (paymentMethodFilter === 'CASH') return item.cashPaid > 0 && item.bankPaid === 0 && item.dueAmount === 0;
        if (paymentMethodFilter === 'BANK') return item.bankPaid > 0 && item.cashPaid === 0 && item.dueAmount === 0;
        if (paymentMethodFilter === 'SPLIT') return (item.cashPaid > 0 && item.bankPaid > 0) || (item.dueAmount > 0 && (item.cashPaid > 0 || item.bankPaid > 0));
        if (paymentMethodFilter === 'CREDIT') return item.dueAmount > 0;
        return true;
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [ledgerApiData.sales, sales, startDate, endDate, searchTerm, paymentMethodFilter]);

  // 2. Grouped Customer Ledger
  const groupedCustomerLedger = useMemo(() => {
    const map = {};
    customerLedgerList.forEach(item => {
      const key = item.customerName || 'Walk-in Customer';
      if (!map[key]) {
        map[key] = {
          customerName: key,
          customerPhone: item.customerPhone || '',
          totalAmount: 0,
          cashPaid: 0,
          bankPaid: 0,
          creditDue: 0,
          totalPetis: 0,
          transactions: []
        };
      }
      map[key].totalAmount += item.totalAmount;
      map[key].cashPaid += item.cashPaid;
      map[key].bankPaid += item.bankPaid;
      map[key].creditDue += item.dueAmount;
      map[key].totalPetis += item.petisBought;
      map[key].transactions.push(item);
    });
    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [customerLedgerList]);

  // 3. Stats calculation
  const stats = useMemo(() => {
    const customerTotalRevenue = customerLedgerList.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCashReceived = customerLedgerList.reduce((sum, s) => sum + s.cashPaid, 0);
    const totalBankReceived = customerLedgerList.reduce((sum, s) => sum + s.bankPaid, 0);
    const customerCreditDueTotal = customerLedgerList.reduce((sum, s) => sum + s.dueAmount, 0);
    const totalPetisSold = customerLedgerList.reduce((sum, s) => sum + s.petisBought, 0);
    const totalInvoices = customerLedgerList.length;

    return {
      customerTotalRevenue,
      totalCashReceived,
      totalBankReceived,
      customerCreditDueTotal,
      totalPetisSold,
      totalInvoices
    };
  }, [customerLedgerList]);

  const toggleCustomer = (custName) => {
    setExpandedCustomers(prev => ({
      ...prev,
      [custName]: !prev[custName]
    }));
  };

  // Open Edit Modal
  const handleOpenEdit = (txn) => {
    setEditingSale(txn);
    setEditFormData({
      customerName: txn.customerName || '',
      customerPhone: txn.customerPhone || '',
      category: txn.category || 'Eggs',
      totalAmount: txn.totalAmount || 0,
      cashPaid: txn.cashPaid || 0,
      bankPaid: txn.bankPaid || 0,
      dueAmount: txn.dueAmount || 0,
      paymentMethod: txn.paymentMethod || 'CASH'
    });
  };

  // Submit Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSale) return;

    setActionLoading(true);
    try {
      const payload = {
        customerName: editFormData.customerName,
        customerPhone: editFormData.customerPhone,
        totalAmount: Number(editFormData.totalAmount) || 0,
        cashPaid: Number(editFormData.cashPaid) || 0,
        bankPaid: Number(editFormData.bankPaid) || 0,
        dueAmount: Number(editFormData.dueAmount) || 0,
        paymentMethod: editFormData.paymentMethod
      };

      try {
        await api.put(`/sales/${editingSale.id}`, payload);
      } catch (saleErr) {
        await api.put(`/sales/customer-payment-ledger/${editingSale.id}`, {
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          totalAmount: payload.totalAmount,
          cashPaid: payload.cashPaid,
          bankPaid: payload.bankPaid,
          dueAmount: payload.dueAmount,
          paymentMethod: payload.paymentMethod,
          category: editFormData.category || 'Eggs',
          status: payload.dueAmount === 0 ? 'PAID' : 'PARTIAL'
        });
      }
      toast.success('Sale invoice updated successfully!');
      setEditingSale(null);
      await handleRefresh();
    } catch (err) {
      console.error('Update sale error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update sale invoice');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Delete
  const handleConfirmDelete = async () => {
    if (!deletingSale) return;

    setActionLoading(true);
    try {
      try {
        await api.delete(`/sales/${deletingSale.id}`);
      } catch (delErr) {
        await api.delete(`/sales/customer-payment-ledger/${deletingSale.id}`);
      }
      toast.success(`Invoice ${deletingSale.invoiceNumber} deleted successfully!`);
      setDeletingSale(null);
      await handleRefresh();
    } catch (err) {
      console.error('Delete sale error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to delete sale invoice');
    } finally {
      setActionLoading(false);
    }
  };

  // PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('CUSTOMER PAYMENT LEDGER', 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()} | Range: ${startDate || 'All'} to ${endDate || 'Present'}`, 14, 22);

    const tableData = customerLedgerList.map(c => [
      c.invoiceNumber,
      new Date(c.date).toLocaleDateString(),
      c.customerName,
      c.customerPhone || '-',
      c.category,
      c.itemsDescription,
      `${c.petisBought} P`,
      `Rs. ${fmt(c.cashPaid)}`,
      `Rs. ${fmt(c.bankPaid)}`,
      `Rs. ${fmt(c.dueAmount)}`,
      `Rs. ${fmt(c.totalAmount)}`,
      c.dueAmount === 0 ? 'PAID' : (c.cashPaid > 0 || c.bankPaid > 0 ? 'PARTIAL' : 'CREDIT')
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['Invoice #', 'Date', 'Customer', 'Phone', 'Category', 'Products', 'Petis', 'Cash Paid', 'Bank Paid', 'Credit Due', 'Total (Rs)', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      foot: [[
        'Total', '', '', '', '', '',
        `${stats.totalPetisSold.toFixed(1)} P`,
        `Rs. ${fmt(stats.totalCashReceived)}`,
        `Rs. ${fmt(stats.totalBankReceived)}`,
        `Rs. ${fmt(stats.customerCreditDueTotal)}`,
        `Rs. ${fmt(stats.customerTotalRevenue)}`,
        ''
      ]],
      footStyles: { fillColor: [244, 244, 245], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save(`Customer_Payment_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-3.5 text-zinc-900 animate-in fade-in duration-300">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Header Bar */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0 border-t border-emerald-300">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 uppercase">
                Customer Payment Ledger
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                👥 Customer Flow
              </span>
            </div>
            <p className="text-[11px] font-bold text-zinc-500 tracking-wide mt-0.5">
              Live customer cash inflows, bank transfers, credit due &amp; product sales breakdown
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-600" />
            <span>Print</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-900/10 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4 Requested KPI Cards: Cash -> Bank -> Credit -> Total */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-emerald-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white border-b border-emerald-600">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-emerald-200" />
            <span className="text-[11px] font-black uppercase tracking-widest">👥 Customer Payment Summary</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-100">
            Total {stats.totalInvoices} Invoices | {stats.totalPetisSold.toFixed(1)} Petis
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-100">
          
          {/* 1. Cash */}
          <div className="p-3.5 sm:p-4 space-y-1 hover:bg-emerald-50/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">💵 Cash</span>
              <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Banknote className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-700 tracking-tight">Rs. {fmt(stats.totalCashReceived)}</div>
            <p className="text-[9px] font-bold text-zinc-400 uppercase">Cash Inflow</p>
          </div>

          {/* 2. Bank */}
          <div className="p-3.5 sm:p-4 space-y-1 hover:bg-blue-50/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">🏦 Bank</span>
              <div className="p-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-blue-700 tracking-tight">Rs. {fmt(stats.totalBankReceived)}</div>
            <p className="text-[9px] font-bold text-zinc-400 uppercase">Bank / Online</p>
          </div>

          {/* 3. Credit */}
          <div className="p-3.5 sm:p-4 space-y-1 hover:bg-amber-50/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">📋 Credit</span>
              <div className="p-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-600 tracking-tight">Rs. {fmt(stats.customerCreditDueTotal)}</div>
            <p className="text-[9px] font-bold text-zinc-400 uppercase">Receivable Due</p>
          </div>

          {/* 4. Total */}
          <div className="p-3.5 sm:p-4 space-y-1 bg-emerald-50/20 hover:bg-emerald-100/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600">💰 Total</span>
              <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-300">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-900 tracking-tight">Rs. {fmt(stats.customerTotalRevenue)}</div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase">Total Revenue</p>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Filter and Date Calendar Range Bar */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Sub-View Switcher */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl w-fit">
            <button
              onClick={() => setViewMode('transactions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'transactions'
                  ? 'bg-white text-emerald-700 shadow-xs border border-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Invoices ({customerLedgerList.length})</span>
            </button>

            <button
              onClick={() => setViewMode('customerwise')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'customerwise'
                  ? 'bg-white text-emerald-700 shadow-xs border border-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customer-wise ({groupedCustomerLedger.length})</span>
            </button>
          </div>

          {/* Calendar Date Picker: Start Date & End Date */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black uppercase text-zinc-400">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer"
                  title="Start Date"
                />
              </div>
              <ArrowRight className="w-3 h-3 text-zinc-300" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black uppercase text-zinc-400">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer"
                  title="End Date"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => applyPreset('all')}
                  className="ml-1 p-0.5 hover:bg-zinc-200 rounded text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  title="Clear Dates"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick date shortcuts */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => applyPreset('today')}
                className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 text-zinc-600 border border-zinc-200 cursor-pointer transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => applyPreset('month')}
                className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 text-zinc-600 border border-zinc-200 cursor-pointer transition-colors"
              >
                Month
              </button>
              <button
                onClick={() => applyPreset('all')}
                className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200 cursor-pointer transition-colors"
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* Search & Method Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-100">
          <div className="relative md:col-span-2">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer name, phone, invoice #, products, category..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-emerald-500 focus:outline-none text-xs font-bold transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-emerald-500 focus:outline-none text-xs font-bold transition-all cursor-pointer"
            >
              <option value="ALL">All Payment Types</option>
              <option value="CASH">Cash Only</option>
              <option value="BANK">Bank / Online Only</option>
              <option value="SPLIT">Split (Cash + Bank)</option>
              <option value="CREDIT">Credit Only (Pending Due)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW 1: Compact Full-Width Transactions Table with Category & Actions */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {viewMode === 'transactions' && (
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden w-full">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-900">
                Customer Sales &amp; Payment Transactions
              </h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">
                Every sale invoice with products, category, cash, bank, credit &amp; actions
              </p>
            </div>
            <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
              {customerLedgerList.length} Records
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600 uppercase text-[9.5px] font-black tracking-wider">
                <tr>
                  <th className="py-2.5 px-2.5 whitespace-nowrap">Date</th>
                  <th className="py-2.5 px-2 whitespace-nowrap">Invoice #</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap">Customer</th>
                  <th className="py-2.5 px-2 whitespace-nowrap">Category</th>
                  <th className="py-2.5 px-2.5">Products / Description</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">Petis</th>
                  <th className="py-2.5 px-2 text-right whitespace-nowrap">Cash Paid</th>
                  <th className="py-2.5 px-2 text-right whitespace-nowrap">Bank Paid</th>
                  <th className="py-2.5 px-2 text-right whitespace-nowrap">Credit Due</th>
                  <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Total</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-bold text-zinc-700">
                {customerLedgerList.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-10 text-center text-zinc-400">
                      <Users className="w-7 h-7 mx-auto mb-1.5 opacity-30" />
                      <p className="text-xs uppercase font-black">No customer transactions match your filter</p>
                    </td>
                  </tr>
                ) : (
                  customerLedgerList.map((txn) => (
                    <tr key={txn.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-2 px-2.5 whitespace-nowrap text-zinc-500 text-[10.5px]">
                        {new Date(txn.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap font-black text-zinc-900 text-[11px]">
                        {txn.invoiceNumber}
                      </td>
                      <td className="py-2 px-2.5 max-w-[120px]">
                        <div className="font-black text-zinc-900 truncate" title={txn.customerName}>{txn.customerName}</div>
                        {txn.customerPhone && (
                          <div className="text-[9.5px] text-zinc-400 font-semibold truncate">{txn.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Tag className="w-2.5 h-2.5" />
                          {txn.category || 'Eggs'}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 max-w-[220px]">
                        {Array.isArray(txn.items) && txn.items.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {txn.items.map((it, iIdx) => (
                              <span
                                key={iIdx}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200"
                                title={`${it.name || it.rawProductName} (Qty: ${it.quantity} ${it.unitLabel || it.unit || ''})`}
                              >
                                <span className="truncate max-w-[110px]">{it.rawProductName || it.name}</span>
                                <span className="font-black text-emerald-800 bg-emerald-100/90 px-1 rounded text-[8.5px]">
                                  x{it.quantity} {it.unitLabel || it.unit || ''}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-zinc-700 font-bold text-[10.5px]" title={txn.itemsDescription}>
                            {txn.itemsDescription}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap font-black text-emerald-800">
                        {txn.petisBought > 0 ? `${txn.petisBought} P` : '-'}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap font-black text-emerald-700">
                        {txn.cashPaid > 0 ? `Rs. ${fmt(txn.cashPaid)}` : <span className="text-zinc-300">-</span>}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap font-black text-blue-700">
                        {txn.bankPaid > 0 ? `Rs. ${fmt(txn.bankPaid)}` : <span className="text-zinc-300">-</span>}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap font-black text-amber-600">
                        {txn.dueAmount > 0 ? `Rs. ${fmt(txn.dueAmount)}` : <span className="text-zinc-300">-</span>}
                      </td>
                      <td className="py-2 px-2.5 text-right whitespace-nowrap font-black text-zinc-900">
                        Rs. {fmt(txn.totalAmount)}
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        {txn.dueAmount === 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Paid
                          </span>
                        ) : txn.cashPaid > 0 || txn.bankPaid > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                            Partial
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                            Credit
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(txn)}
                            className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Edit Invoice"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingSale(txn)}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW 2: Customer-wise Grouped Ledger */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {viewMode === 'customerwise' && (
        <div className="space-y-3">
          {groupedCustomerLedger.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center text-zinc-400">
              <Users className="w-7 h-7 mx-auto mb-1.5 opacity-30" />
              <p className="text-xs uppercase font-black">No customer ledger records available</p>
            </div>
          ) : (
            groupedCustomerLedger.map((cust) => {
              const isExpanded = !!expandedCustomers[cust.customerName];
              return (
                <div key={cust.customerName} className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden transition-all">
                  
                  {/* Customer Summary Bar */}
                  <div
                    onClick={() => toggleCustomer(cust.customerName)}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-zinc-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                        {cust.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-black text-zinc-900 uppercase">{cust.customerName}</h3>
                          <span className="text-[9.5px] font-black bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                            {cust.transactions.length} sales
                          </span>
                        </div>
                        {cust.customerPhone && (
                          <p className="text-[10px] font-bold text-zinc-400">{cust.customerPhone}</p>
                        )}
                      </div>
                    </div>

                    {/* Summary metrics */}
                    <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">Cash Paid</span>
                        <span className="text-xs font-black text-emerald-700">Rs. {fmt(cust.cashPaid)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">Bank Paid</span>
                        <span className="text-xs font-black text-blue-700">Rs. {fmt(cust.bankPaid)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">Credit Due</span>
                        <span className={`text-xs font-black ${cust.creditDue > 0 ? 'text-amber-600' : 'text-zinc-400'}`}>
                          Rs. {fmt(cust.creditDue)}
                        </span>
                      </div>
                      <div className="text-right pl-3 border-l border-zinc-200">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase block">Total Sales</span>
                        <span className="text-xs sm:text-sm font-black text-zinc-900">Rs. {fmt(cust.totalAmount)}</span>
                      </div>
                      <div className="text-zinc-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Invoices / Products List */}
                  {isExpanded && (
                    <div className="border-t border-zinc-100 bg-zinc-50/50 p-3.5 space-y-2.5 animate-in fade-in duration-200">
                      <h4 className="text-[9.5px] font-black uppercase tracking-wider text-zinc-500">
                        Purchased Products &amp; Invoice Breakdown
                      </h4>

                      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-zinc-100/70 border-b border-zinc-200 text-zinc-600 text-[9.5px] font-black uppercase">
                            <tr>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Invoice #</th>
                              <th className="py-2 px-3">Category</th>
                              <th className="py-2 px-3">Product Details</th>
                              <th className="py-2 px-3 text-center">Petis</th>
                              <th className="py-2 px-3 text-right">Cash</th>
                              <th className="py-2 px-3 text-right">Bank</th>
                              <th className="py-2 px-3 text-right">Credit Due</th>
                              <th className="py-2 px-3 text-right">Total</th>
                              <th className="py-2 px-3 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-bold text-zinc-700">
                            {cust.transactions.map(t => (
                              <tr key={t.id} className="hover:bg-zinc-50">
                                <td className="py-2 px-3 whitespace-nowrap text-zinc-500 text-[10.5px]">
                                  {new Date(t.date).toLocaleDateString('en-PK')}
                                </td>
                                <td className="py-2 px-3 font-black text-zinc-900 whitespace-nowrap">
                                  {t.invoiceNumber}
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {t.category || 'Eggs'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-zinc-600 text-[10.5px]">
                                  {Array.isArray(t.items) && t.items.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {t.items.map((it, iIdx) => (
                                        <span
                                          key={iIdx}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                                        >
                                          <span>{it.rawProductName || it.name}</span>
                                          <span className="font-black text-emerald-900 bg-emerald-100/90 px-1 rounded text-[8px]">x{it.quantity} {it.unitLabel || it.unit || ''}</span>
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span>{t.itemsDescription}</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center font-black text-emerald-800">
                                  {t.petisBought > 0 ? `${t.petisBought} P` : '-'}
                                </td>
                                <td className="py-2 px-3 text-right text-emerald-700 font-black">
                                  {t.cashPaid > 0 ? `Rs. ${fmt(t.cashPaid)}` : '-'}
                                </td>
                                <td className="py-2 px-3 text-right text-blue-700 font-black">
                                  {t.bankPaid > 0 ? `Rs. ${fmt(t.bankPaid)}` : '-'}
                                </td>
                                <td className="py-2 px-3 text-right text-amber-600 font-black">
                                  {t.dueAmount > 0 ? `Rs. ${fmt(t.dueAmount)}` : '-'}
                                </td>
                                <td className="py-2 px-3 text-right font-black text-zinc-900">
                                  Rs. {fmt(t.totalAmount)}
                                </td>
                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleOpenEdit(t)}
                                      className="p-1 rounded text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                                      title="Edit"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingSale(t)}
                                      className="p-1 rounded text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EDIT MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {editingSale && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900 uppercase">Edit Sale Invoice</h3>
                  <p className="text-[10px] text-zinc-400 font-bold">{editingSale.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingSale(null)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editFormData.customerName}
                    onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-bold focus:bg-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Customer Phone</label>
                  <input
                    type="text"
                    value={editFormData.customerPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-bold focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Category</label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-bold focus:bg-white focus:border-emerald-500 focus:outline-none"
                >
                  {categories && categories.length > 0 ? (
                    categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                  ) : (
                    <>
                      <option value="Eggs">Eggs</option>
                      <option value="Poultry">Poultry</option>
                      <option value="Feed">Feed</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Total (Rs)</label>
                  <input
                    type="number"
                    value={editFormData.totalAmount}
                    onChange={(e) => {
                      const total = Number(e.target.value) || 0;
                      const paid = Number(editFormData.cashPaid || 0) + Number(editFormData.bankPaid || 0);
                      setEditFormData({
                        ...editFormData,
                        totalAmount: total,
                        dueAmount: Math.max(0, total - paid)
                      });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-black text-zinc-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-emerald-700 mb-1">Cash Paid (Rs)</label>
                  <input
                    type="number"
                    value={editFormData.cashPaid}
                    onChange={(e) => {
                      const cash = Number(e.target.value) || 0;
                      const paid = cash + Number(editFormData.bankPaid || 0);
                      const total = Number(editFormData.totalAmount || 0);
                      setEditFormData({
                        ...editFormData,
                        cashPaid: cash,
                        dueAmount: Math.max(0, total - paid)
                      });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-black text-emerald-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-blue-700 mb-1">Bank Paid (Rs)</label>
                  <input
                    type="number"
                    value={editFormData.bankPaid}
                    onChange={(e) => {
                      const bank = Number(e.target.value) || 0;
                      const paid = Number(editFormData.cashPaid || 0) + bank;
                      const total = Number(editFormData.totalAmount || 0);
                      setEditFormData({
                        ...editFormData,
                        bankPaid: bank,
                        dueAmount: Math.max(0, total - paid)
                      });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-black text-blue-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-amber-600 mb-1">Remaining Due / Credit (Rs)</label>
                <input
                  type="number"
                  value={editFormData.dueAmount}
                  onChange={(e) => setEditFormData({ ...editFormData, dueAmount: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 font-black text-amber-700 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 font-black uppercase text-[11px] hover:bg-zinc-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[11px] shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {deletingSale && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-black text-zinc-900 uppercase">Delete Invoice Record</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Are you sure you want to permanently delete invoice <span className="font-black text-zinc-900">{deletingSale.invoiceNumber}</span> for <span className="font-black text-zinc-900">{deletingSale.customerName}</span>?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSale(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 font-black uppercase text-xs hover:bg-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-xs shadow-sm cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CustomerPaymentLedger;
