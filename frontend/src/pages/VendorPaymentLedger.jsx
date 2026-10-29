import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  DollarSign,
  Building2,
  CreditCard,
  Truck,
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
  Pencil,
  Trash2,
  Tag
} from 'lucide-react';
import api, { getPaymentLedger, getPurchaseCredits, deletePurchaseCredit, updateItem } from '../services/api';
import { useProducts } from '../contexts/ProductContext';
import { useUser } from '../contexts/UserContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function VendorPaymentLedger({ shopId: propShopId }) {
  const { user, isPageOpAllowed } = useUser();
  const { products = [], categories = [], fetchData } = useProducts();

  // Local state
  const [viewMode, setViewMode] = useState('transactions'); // 'transactions' | 'vendorwise'
  const [expandedVendors, setExpandedVendors] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL'); // 'ALL' | 'CASH' | 'BANK' | 'SPLIT' | 'CREDIT'
  const [purchaseCredits, setPurchaseCredits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Edit & Delete Modal States
  const [editingBill, setEditingBill] = useState(null);
  const [editFormData, setEditFormData] = useState({
    supplierName: '',
    supplierPhone: '',
    productName: '',
    category: 'Eggs',
    petisPurchased: 0,
    totalCost: 0,
    cashPaid: 0,
    bankPaid: 0,
    dueAmount: 0
  });
  const [deletingBill, setDeletingBill] = useState(null);
  const activeShopId = propShopId || (user?.shopId ? (typeof user.shopId === 'object' ? (user.shopId._id || user.shopId.id) : String(user.shopId)) : null);
  const isEditAllowed = isPageOpAllowed ? isPageOpAllowed('vendors', 'edit', activeShopId) : true;
  const isDeleteAllowed = isPageOpAllowed ? isPageOpAllowed('vendors', 'delete', activeShopId) : true;
  const [actionLoading, setActionLoading] = useState(false);

  // Dynamic Ledger data from API
  const [ledgerApiData, setLedgerApiData] = useState({
    summary: null,
    purchases: []
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ledgerRes, creditsRes] = await Promise.allSettled([
        getPaymentLedger(activeShopId),
        getPurchaseCredits(activeShopId)
      ]);

      if (ledgerRes.status === 'fulfilled' && ledgerRes.value?.success) {
        setLedgerApiData({
          summary: ledgerRes.value.summary || null,
          purchases: Array.isArray(ledgerRes.value.purchases) ? ledgerRes.value.purchases : []
        });
      }

      if (creditsRes.status === 'fulfilled' && Array.isArray(creditsRes.value)) {
        setPurchaseCredits(creditsRes.value);
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error loading Vendor Payment Ledger data:', err);
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
  const parseSafeDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === 'number') {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }
    const str = String(val).trim();
    if (!str) return null;
    const isoStr = str.includes(' ') && !str.includes('T') ? str.replace(' ', 'T') : str;
    let d = new Date(isoStr);
    if (!isNaN(d.getTime())) return d;
    const m = str.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) {
      d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  const isInDateRange = (itemDate) => {
    if (!startDate && !endDate) return true;
    if (!itemDate) return true;
    const date = parseSafeDate(itemDate);
    if (!date) return true;

    const pad = (n) => String(n).padStart(2, '0');
    const localYMD = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const utcYMD = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

    let startTs = null;
    if (startDate) {
      const parts = startDate.split('-').map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        startTs = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0).getTime();
      }
    }
    let endTs = null;
    if (endDate) {
      const parts = endDate.split('-').map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        endTs = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999).getTime();
      }
    }

    const itemTs = date.getTime();

    if (startDate && endDate) {
      const inStr = (localYMD >= startDate && localYMD <= endDate) ||
                    (utcYMD >= startDate && utcYMD <= endDate);
      const inTs = (startTs !== null && itemTs >= startTs) && (endTs !== null && itemTs <= endTs);
      return inStr || inTs;
    }

    if (startDate) {
      const inStr = localYMD >= startDate || utcYMD >= startDate;
      const inTs = startTs !== null && itemTs >= startTs;
      return inStr || inTs;
    }

    if (endDate) {
      const inStr = localYMD <= endDate || utcYMD <= endDate;
      const inTs = endTs !== null && itemTs <= endTs;
      return inStr || inTs;
    }

    return true;
  };

  // 1. Process Supplier Purchases List
  const supplierLedgerList = useMemo(() => {
    let list = [];

    const processItem = (p) => {
      const cost = Math.round(Number(p.totalCost || p.totalAmount || p.purchasePrice || 0));
      const due = Math.round(Number(p.dueAmount || p.remainingAmount || 0));
      let paid = Math.round(Number(p.amountPaid || p.paidAmount || 0));
      if (paid === 0 && cost > 0 && due < cost) {
        paid = cost - due;
      }
      let cash = Math.round(Number(p.cashPaid) || 0);
      let bank = Math.round(Number(p.bankPaid) || 0);

      const rawMethod = String(p.paymentMethod || p.paymentType || '').toUpperCase().trim();

      // If cash and bank are 0 but paid > 0, assign based on payment method
      if (cash === 0 && bank === 0 && paid > 0) {
        if (rawMethod.includes('BANK') || rawMethod.includes('ONLINE') || rawMethod.includes('TRANSFER') || rawMethod.includes('EASYPAISA')) {
          bank = paid;
        } else if (rawMethod.includes('SPLIT')) {
          cash = Math.floor(paid / 2);
          bank = paid - cash;
        } else {
          cash = paid;
        }
      }

      // Standardized display payment method: CASH, BANK, CREDIT, or SPLIT
      let displayMethod = 'CASH';
      if (due > 0 && paid === 0) {
        displayMethod = 'CREDIT';
      } else if (cash > 0 && bank > 0) {
        displayMethod = 'SPLIT';
      } else if (bank > 0 && cash === 0) {
        displayMethod = 'BANK';
      } else if (cash > 0 && bank === 0) {
        displayMethod = 'CASH';
      } else if (rawMethod.includes('BANK') || rawMethod.includes('ONLINE')) {
        displayMethod = 'BANK';
      } else if (rawMethod.includes('CREDIT')) {
        displayMethod = 'CREDIT';
      } else {
        displayMethod = 'CASH';
      }

      // Peti, Tray, Egg breakdown
      const rawPetis = Number(p.petisPurchased || p.petiQuantity || 0);
      const rawTrays = Number(p.trayQuantity || p.traysCount || p.trays || 0);
      const rawEggs = Number(p.eggQuantity || p.totalEggsCount || p.quantity || 0);

      let totalEggs = 0;
      if (rawEggs > 0 && rawEggs >= (rawPetis * 360 + rawTrays * 30)) {
        totalEggs = rawEggs;
      } else if (rawPetis > 0 || rawTrays > 0 || rawEggs > 0) {
        totalEggs = (rawPetis * 360) + (rawTrays * 30) + (rawEggs > 0 && rawEggs < 30 ? rawEggs : 0);
        if (totalEggs === 0 && rawEggs > 0) totalEggs = rawEggs;
      }

      const petisCount = rawPetis > 0 ? rawPetis : Math.floor(totalEggs / 360);
      const traysCount = rawTrays > 0 ? rawTrays : Math.floor((totalEggs > 0 ? totalEggs : (petisCount * 360)) / 30);
      const finalEggsCount = totalEggs > 0 ? totalEggs : (petisCount * 360);

      return {
        id: p._id || p.id,
        date: p.date || p.purchaseDate || p.createdAt,
        supplierName: p.supplierName || p.vendorName || 'Farm Vendor',
        supplierPhone: p.supplierPhone || p.vendorPhone || '',
        supplierLocation: p.supplierLocation || '',
        productName: p.productName || p.rawProductName || 'Eggs Stock',
        category: p.category || 'Eggs',
        petisPurchased: petisCount,
        petisCount: petisCount,
        traysCount: traysCount,
        totalEggsCount: finalEggsCount,
        eggQuantity: finalEggsCount,
        totalCost: cost,
        amountPaid: paid,
        cashPaid: cash,
        bankPaid: bank,
        dueAmount: due,
        paymentMethod: displayMethod,
        status: due === 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID')
      };
    };

    if (ledgerApiData.purchases && ledgerApiData.purchases.length > 0) {
      list = ledgerApiData.purchases.map(processItem);
    } else if (purchaseCredits && purchaseCredits.length > 0) {
      list = purchaseCredits.map(processItem);
    }

    return list
      .filter(item => isInDateRange(item.date))
      .filter(item => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          item.supplierName.toLowerCase().includes(q) ||
          item.supplierPhone.toLowerCase().includes(q) ||
          item.productName.toLowerCase().includes(q) ||
          (item.category && item.category.toLowerCase().includes(q))
        );
      })
      .filter(item => {
        if (paymentMethodFilter === 'ALL') return true;
        if (paymentMethodFilter === 'CASH') return item.paymentMethod === 'CASH' || (item.cashPaid > 0 && item.bankPaid === 0 && item.dueAmount === 0);
        if (paymentMethodFilter === 'BANK') return item.paymentMethod === 'BANK' || (item.bankPaid > 0 && item.cashPaid === 0 && item.dueAmount === 0);
        if (paymentMethodFilter === 'SPLIT') return item.paymentMethod === 'SPLIT' || (item.cashPaid > 0 && item.bankPaid > 0);
        if (paymentMethodFilter === 'CREDIT') return item.paymentMethod === 'CREDIT' || item.dueAmount > 0;
        return true;
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [ledgerApiData.purchases, purchaseCredits, startDate, endDate, searchTerm, paymentMethodFilter]);

  // 2. Grouped Vendor Ledger
  const groupedVendorLedger = useMemo(() => {
    const map = {};
    supplierLedgerList.forEach(item => {
      const key = item.supplierName || 'Farm Vendor';
      if (!map[key]) {
        map[key] = {
          vendorName: key,
          vendorPhone: item.supplierPhone || '',
          vendorLocation: item.supplierLocation || '',
          totalCost: 0,
          cashPaid: 0,
          bankPaid: 0,
          creditDue: 0,
          totalPetis: 0,
          bills: []
        };
      }
      map[key].totalCost += item.totalCost;
      map[key].cashPaid += item.cashPaid;
      map[key].bankPaid += item.bankPaid;
      map[key].creditDue += item.dueAmount;
      map[key].totalPetis += item.petisPurchased;
      map[key].bills.push(item);
    });
    return Object.values(map).sort((a, b) => b.totalCost - a.totalCost);
  }, [supplierLedgerList]);

  // 3. Stats calculation
  const stats = useMemo(() => {
    const supplierTotalCost = supplierLedgerList.reduce((sum, s) => sum + s.totalCost, 0);
    const supplierCashPaid = supplierLedgerList.reduce((sum, s) => sum + s.cashPaid, 0);
    const supplierBankPaid = supplierLedgerList.reduce((sum, s) => sum + s.bankPaid, 0);
    const supplierCreditDueTotal = supplierLedgerList.reduce((sum, s) => sum + s.dueAmount, 0);
    const totalPetisPurchased = supplierLedgerList.reduce((sum, s) => sum + s.petisPurchased, 0);
    const totalBills = supplierLedgerList.length;

    return {
      supplierTotalCost,
      supplierCashPaid,
      supplierBankPaid,
      supplierCreditDueTotal,
      totalPetisPurchased,
      totalBills
    };
  }, [supplierLedgerList]);

  // Master Today Vendor Purchases Stats
  const todayStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const isMatchToday = (raw) => {
      if (!raw) return false;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return false;
      if (d.toDateString() === now.toDateString()) return true;
      const dLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dLocal === localToday) return true;
      return d.toISOString().split('T')[0] === todayStr;
    };

    const todayList = (supplierLedgerList || []).filter(s => isMatchToday(s.date || s.createdAt));
    const supplierTotalCost = todayList.reduce((sum, s) => sum + s.totalCost, 0);
    const supplierCashPaid = todayList.reduce((sum, s) => sum + s.cashPaid, 0);
    const supplierBankPaid = todayList.reduce((sum, s) => sum + s.bankPaid, 0);
    const supplierCreditDueTotal = todayList.reduce((sum, s) => sum + s.dueAmount, 0);
    const totalPetisPurchased = todayList.reduce((sum, s) => sum + s.petisPurchased, 0);
    const totalBills = todayList.length;

    return {
      supplierTotalCost,
      supplierCashPaid,
      supplierBankPaid,
      supplierCreditDueTotal,
      totalPetisPurchased,
      totalBills
    };
  }, [supplierLedgerList]);

  const toggleVendor = (vName) => {
    setExpandedVendors(prev => ({
      ...prev,
      [vName]: !prev[vName]
    }));
  };

  // Open Edit Modal
  const handleOpenEdit = (txn) => {
    if (!isEditAllowed) {
      toast.error("🔒 Super Admin Approval Required: Vendor bill editing is locked for this branch.");
      return;
    }
    setEditingBill(txn);
    setEditFormData({
      supplierName: txn.supplierName || '',
      supplierPhone: txn.supplierPhone || '',
      productName: txn.productName || '',
      category: txn.category || 'Eggs',
      petisPurchased: txn.petisPurchased || 0,
      totalCost: txn.totalCost || 0,
      cashPaid: txn.cashPaid || 0,
      bankPaid: txn.bankPaid || 0,
      dueAmount: txn.dueAmount || 0
    });
  };

  // Submit Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingBill) return;

    setActionLoading(true);
    try {
      const cleanId = String(editingBill.id).replace('vpl-', '').replace('item-', '');
      const totalCost = Number(editFormData.totalCost) || 0;
      const cash = Number(editFormData.cashPaid) || 0;
      const bank = Number(editFormData.bankPaid) || 0;
      const due = Number(editFormData.dueAmount) || Math.max(0, totalCost - (cash + bank));

      const payload = {
        name: editFormData.productName,
        category: editFormData.category,
        supplierName: editFormData.supplierName,
        supplierPhone: editFormData.supplierPhone,
        petiQuantity: Number(editFormData.petisPurchased) || 0,
        totalPurchaseCost: totalCost,
        amountPaidToSupplier: cash + bank,
        cashPaidToSupplier: cash,
        bankPaidToSupplier: bank,
        dueAmountToSupplier: due
      };

      try {
        await api.put(`/items/${cleanId}`, payload);
      } catch (itErr) {
        // Fallback to dedicated vendor payment ledger endpoint
        await api.put(`/sales/vendor-payment-ledger/${editingBill.id}`, {
          supplierName: payload.supplierName,
          supplierPhone: payload.supplierPhone,
          productName: payload.name,
          category: payload.category,
          petisPurchased: payload.petiQuantity,
          totalCost: payload.totalPurchaseCost,
          amountPaid: payload.amountPaidToSupplier,
          cashPaid: payload.cashPaidToSupplier,
          bankPaid: payload.bankPaidToSupplier,
          dueAmount: payload.dueAmountToSupplier,
          status: payload.dueAmountToSupplier === 0 ? 'PAID' : 'PARTIAL'
        });
      }

      toast.success('Vendor bill updated successfully!');
      setEditingBill(null);
      await handleRefresh();
    } catch (err) {
      console.error('Update purchase bill error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update vendor bill');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Delete
  const handleConfirmDelete = async () => {
    if (!deletingBill) return;
    if (!isDeleteAllowed) {
      toast.error("🔒 Super Admin Approval Required: Vendor bill deletion is locked for this branch.");
      return;
    }

    setActionLoading(true);
    try {
      const cleanId = String(deletingBill.id).replace('vpl-', '').replace('item-', '');
      try {
        await deletePurchaseCredit(cleanId);
      } catch (delErr) {
        // Fallback to direct vendor payment ledger delete
        await api.delete(`/sales/vendor-payment-ledger/${deletingBill.id}`);
      }
      toast.success(`Purchase bill from ${deletingBill.supplierName} deleted successfully!`);
      setDeletingBill(null);
      await handleRefresh();
    } catch (err) {
      console.error('Delete purchase bill error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to delete purchase bill');
    } finally {
      setActionLoading(false);
    }
  };

  // PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('VENDOR PAYMENT LEDGER', 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()} | Range: ${startDate || 'All'} to ${endDate || 'Present'}`, 14, 22);

    const tableData = supplierLedgerList.map(s => [
      s.supplierName,
      s.supplierPhone || '-',
      s.category,
      s.productName,
      new Date(s.date).toLocaleDateString(),
      `${s.petisPurchased} P`,
      s.paymentMethod || 'CASH',
      `Rs. ${fmt(s.cashPaid)}`,
      `Rs. ${fmt(s.bankPaid)}`,
      `Rs. ${fmt(s.dueAmount)}`,
      `Rs. ${fmt(s.totalCost)}`,
      s.status
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['Vendor', 'Phone', 'Category', 'Product', 'Date', 'Petis', 'Method', 'Cash Paid', 'Bank Paid', 'Credit Remaining', 'Total Cost (Rs)', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] },
      foot: [[
        'Total', '', '', '', '',
        `${stats.totalPetisPurchased.toFixed(1)} P`,
        '',
        `Rs. ${fmt(stats.supplierCashPaid)}`,
        `Rs. ${fmt(stats.supplierBankPaid)}`,
        `Rs. ${fmt(stats.supplierCreditDueTotal)}`,
        `Rs. ${fmt(stats.supplierTotalCost)}`,
        ''
      ]],
      footStyles: { fillColor: [244, 244, 245], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save(`Vendor_Payment_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-3.5 text-zinc-900 animate-in fade-in duration-300">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Header Bar */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-orange-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0 border-t border-orange-300">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 uppercase">
                Vendor Payment Ledger
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                🚚 Supplier Payables
              </span>
            </div>
            <p className="text-[11px] font-bold text-zinc-500 tracking-wide mt-0.5">
              Live vendor payments in cash, bank transfers, credit payables &amp; purchase bills
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-orange-900/10 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4 Requested KPI Cards: Cash -> Bank -> Credit -> Total */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-orange-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white border-b border-orange-600">
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-orange-200" />
            <span className="text-[11px] font-black uppercase tracking-widest">🚚 Vendor Payment Summary</span>
          </div>
          <span className="text-[10px] font-bold text-orange-100">
            Total {stats.totalBills} Purchase Bills | {stats.totalPetisPurchased.toFixed(1)} Petis
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-100">
          
          {/* 1. Cash Paid */}
          <div className="p-3.5 sm:p-4 space-y-1 hover:bg-emerald-50/40 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">💵 Cash</span>
                <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Banknote className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-700 tracking-tight">Rs. {fmt(stats.supplierCashPaid)}</div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase">Cash Paid</p>
            </div>
          </div>

          {/* 2. Bank Paid */}
          <div className="p-3.5 sm:p-4 space-y-1 hover:bg-blue-50/40 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">🏦 Bank</span>
                <div className="p-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-blue-700 tracking-tight">Rs. {fmt(stats.supplierBankPaid)}</div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase">Bank Paid</p>
            </div>
          </div>

          {/* 3. Credit Remaining */}
          <div className="p-3.5 sm:p-4 space-y-1 hover:bg-rose-50/40 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">📋 Credit</span>
                <div className="p-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-rose-600 tracking-tight">Rs. {fmt(stats.supplierCreditDueTotal)}</div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase">Remaining Due</p>
            </div>
          </div>

          {/* 4. Total Cost */}
          <div className="p-3.5 sm:p-4 space-y-1 bg-orange-50/20 hover:bg-orange-100/30 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600">💰 Total</span>
                <div className="p-1 rounded-lg bg-orange-100 text-orange-700 border border-orange-300">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-orange-900 tracking-tight">Rs. {fmt(stats.supplierTotalCost)}</div>
              <p className="text-[9px] font-bold text-zinc-500 uppercase">Total Purchases</p>
            </div>
          </div>

        </div>

        {/* Dedicated Today Vendor Payment Summary Banner */}
        <div className="p-4 sm:p-5 bg-slate-100 border-t-2 border-slate-300 flex flex-wrap items-center justify-between gap-3 text-sm sm:text-base font-black text-slate-900 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <span className="text-slate-900 flex items-center gap-2 text-sm sm:text-base font-black">
              <Truck className="w-5 h-5 text-slate-700" />
              TODAY'S VENDOR PURCHASES &amp; SETTLEMENTS:
            </span>
            <span className="text-slate-700 font-bold text-xs sm:text-sm">{todayStats.totalBills} Purchase Invoices &bull; {todayStats.totalPetisPurchased.toFixed(1)} Petis</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap text-xs sm:text-sm">
            <span className="bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border-2 border-slate-300 text-slate-900 shadow-xs font-black">
              💵 Today Cash: Rs. {fmt(todayStats.supplierCashPaid)}
            </span>
            <span className="bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border-2 border-slate-300 text-slate-900 shadow-xs font-black">
              🏦 Today Bank: Rs. {fmt(todayStats.supplierBankPaid)}
            </span>
            <span className="bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border-2 border-slate-300 text-slate-900 shadow-xs font-black">
              📋 Today Credit: Rs. {fmt(todayStats.supplierCreditDueTotal)}
            </span>
            <span className="bg-slate-900 text-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-xs font-black">
              💰 Total Today: Rs. {fmt(todayStats.supplierTotalCost)}
            </span>
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
                  ? 'bg-white text-orange-700 shadow-xs border border-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Purchase Bills ({supplierLedgerList.length})</span>
            </button>

            <button
              onClick={() => setViewMode('vendorwise')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'vendorwise'
                  ? 'bg-white text-orange-700 shadow-xs border border-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Vendor-wise ({groupedVendorLedger.length})</span>
            </button>
          </div>

          {/* Calendar Date Picker: Start Date & End Date */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-orange-600 shrink-0" />
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
                className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-zinc-100 hover:bg-orange-50 hover:text-orange-700 text-zinc-600 border border-zinc-200 cursor-pointer transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => applyPreset('month')}
                className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-zinc-100 hover:bg-orange-50 hover:text-orange-700 text-zinc-600 border border-zinc-200 cursor-pointer transition-colors"
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
              placeholder="Search vendor name, contact, product name, category..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-orange-500 focus:outline-none text-xs font-bold transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-orange-500 focus:outline-none text-xs font-bold transition-all cursor-pointer"
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
      {/* VIEW 1: Compact Full-Width Purchases Table with Category & Actions */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {viewMode === 'transactions' && (
        <div className="bg-white border border-gray-300 rounded-xl shadow-xs overflow-hidden w-full">
          <div className="px-4 py-3 border-b border-gray-300 flex items-center justify-between bg-zinc-50/50">
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-900">
                Vendor Supply &amp; Purchase Bills
              </h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">
                Every purchase transaction with vendor name, category, product, cash, bank, credit &amp; actions
              </p>
            </div>
            <span className="text-[11px] font-black text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200 shrink-0">
              {supplierLedgerList.length} Records
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-[11px] border-collapse border border-gray-300">
              <thead className="bg-zinc-100 border-b border-gray-300 text-zinc-700 uppercase text-[9.5px] font-black tracking-wider">
                <tr className="border-b border-gray-300">
                  <th className="py-2.5 px-2.5 whitespace-nowrap border border-gray-300">Date</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap border border-gray-300">Vendor / Supplier</th>
                  <th className="py-2.5 px-2 whitespace-nowrap border border-gray-300">Category</th>
                  <th className="py-2.5 px-2.5 border border-gray-300">Product (Peti • Tray • Egg)</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap border border-gray-300">Petis</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap border border-gray-300">Method</th>
                  <th className="py-2.5 px-2 text-right whitespace-nowrap border border-gray-300">Cash Paid</th>
                  <th className="py-2.5 px-2 text-right whitespace-nowrap border border-gray-300">Bank Paid</th>
                  <th className="py-2.5 px-2 text-right whitespace-nowrap border border-gray-300">Credit Due</th>
                  <th className="py-2.5 px-2.5 text-right whitespace-nowrap border border-gray-300">Total</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap border border-gray-300">Status</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap border border-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 font-bold text-zinc-700">
                {supplierLedgerList.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-10 text-center text-zinc-400 border border-gray-300">
                      <Truck className="w-7 h-7 mx-auto mb-1.5 opacity-30" />
                      <p className="text-xs uppercase font-black">No vendor purchase records match your filter</p>
                    </td>
                  </tr>
                ) : (
                  supplierLedgerList.map((txn) => (
                    <tr key={txn.id} className="hover:bg-orange-50/20 transition-colors border-b border-gray-300">
                      <td className="py-2 px-2.5 whitespace-nowrap text-zinc-500 text-[10.5px] border border-gray-300">
                        {new Date(txn.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-2 px-2.5 max-w-[120px] border border-gray-300">
                        <div className="font-black text-zinc-900 truncate" title={txn.supplierName}>{txn.supplierName}</div>
                        {txn.supplierPhone && (
                          <div className="text-[9.5px] text-zinc-400 font-semibold truncate">{txn.supplierPhone}</div>
                        )}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap border border-gray-300">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-50 text-orange-800 border border-orange-200">
                          <Tag className="w-2.5 h-2.5" />
                          {txn.category || 'Eggs'}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 border border-gray-300">
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <span className="font-black text-zinc-900 text-[11px] truncate max-w-[90px]" title={txn.productName}>
                            {txn.productName}
                          </span>
                          {/* Compact Simple 3-Box strip for Peti • Tray • Egg */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <div className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-center min-w-[30px]">
                              <span className="text-[7px] font-black text-gray-600 uppercase block leading-none">Peti</span>
                              <span className="text-[10px] font-black text-gray-950 leading-tight block mt-0.5">
                                {txn.petisCount > 0 ? txn.petisCount : (txn.petisPurchased > 0 ? txn.petisPurchased : '0')}
                              </span>
                            </div>
                            <div className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-center min-w-[30px]">
                              <span className="text-[7px] font-black text-gray-600 uppercase block leading-none">Tray</span>
                              <span className="text-[10px] font-black text-gray-950 leading-tight block mt-0.5">
                                {txn.traysCount > 0 ? txn.traysCount : '0'}
                              </span>
                            </div>
                            <div className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-center min-w-[38px]">
                              <span className="text-[7px] font-black text-gray-600 uppercase block leading-none">Egg</span>
                              <span className="text-[10px] font-black text-gray-950 leading-tight block mt-0.5">
                                {txn.totalEggsCount > 0 ? txn.totalEggsCount.toLocaleString('en-PK') : (txn.eggQuantity > 0 ? txn.eggQuantity.toLocaleString('en-PK') : '0')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap font-black text-orange-800 border border-gray-300">
                        <div className="font-black text-orange-800 text-[11px]">
                          {txn.petisPurchased > 0 ? `${txn.petisPurchased} P` : (txn.petisCount > 0 ? `${txn.petisCount} P` : '-')}
                        </div>
                        {txn.totalEggsCount > 0 && (
                          <div className="text-[8px] font-bold text-zinc-400">
                            {txn.totalEggsCount.toLocaleString('en-PK')} Eggs
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap border border-gray-300">
                        {txn.paymentMethod === 'BANK' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                            <Building2 className="w-2.5 h-2.5 text-blue-600" />
                            Bank
                          </span>
                        ) : txn.paymentMethod === 'CREDIT' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                            <CreditCard className="w-2.5 h-2.5 text-amber-600" />
                            Credit
                          </span>
                        ) : txn.paymentMethod === 'SPLIT' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                            <CreditCard className="w-2.5 h-2.5 text-purple-600" />
                            Split
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Banknote className="w-2.5 h-2.5 text-emerald-600" />
                            Cash
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap font-black text-emerald-700 border border-gray-300">
                        {txn.cashPaid > 0 ? `Rs. ${fmt(txn.cashPaid)}` : <span className="text-zinc-300">-</span>}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap font-black text-blue-700 border border-gray-300">
                        {txn.bankPaid > 0 ? `Rs. ${fmt(txn.bankPaid)}` : <span className="text-zinc-300">-</span>}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap font-black text-rose-600 border border-gray-300">
                        {txn.dueAmount > 0 ? `Rs. ${fmt(txn.dueAmount)}` : <span className="text-zinc-300">-</span>}
                      </td>
                      <td className="py-2 px-2.5 text-right whitespace-nowrap font-black text-zinc-900 border border-gray-300">
                        Rs. {fmt(txn.totalCost)}
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap border border-gray-300">
                        {txn.status === 'PAID' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Paid
                          </span>
                        ) : txn.status === 'PARTIAL' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                            Partial
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                            Payable
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-center whitespace-nowrap border border-gray-300">
                        <div className="flex items-center justify-center gap-1.5">
                          {isEditAllowed && (
                            <button
                              onClick={() => handleOpenEdit(txn)}
                              className="p-1 rounded-lg text-orange-700 hover:bg-orange-100 transition-colors cursor-pointer"
                              title="Edit Bill"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isDeleteAllowed && (
                            <button
                              onClick={() => setDeletingBill(txn)}
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Delete Bill"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
      {/* VIEW 2: Vendor-wise Grouped Ledger */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {viewMode === 'vendorwise' && (
        <div className="space-y-3">
          {groupedVendorLedger.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center text-zinc-400">
              <Truck className="w-7 h-7 mx-auto mb-1.5 opacity-30" />
              <p className="text-xs uppercase font-black">No vendor ledger records available</p>
            </div>
          ) : (
            groupedVendorLedger.map((vnd) => {
              const isExpanded = !!expandedVendors[vnd.vendorName];
              return (
                <div key={vnd.vendorName} className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden transition-all">
                  
                  {/* Vendor Summary Bar */}
                  <div
                    onClick={() => toggleVendor(vnd.vendorName)}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-zinc-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-xs shrink-0">
                        {vnd.vendorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-black text-zinc-900 uppercase">{vnd.vendorName}</h3>
                          <span className="text-[9.5px] font-black bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                            {vnd.bills.length} bills
                          </span>
                        </div>
                        {vnd.vendorPhone && (
                          <p className="text-[10px] font-bold text-zinc-400">{vnd.vendorPhone}</p>
                        )}
                      </div>
                    </div>

                    {/* Summary metrics */}
                    <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">Cash Paid</span>
                        <span className="text-xs font-black text-emerald-700">Rs. {fmt(vnd.cashPaid)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">Bank Paid</span>
                        <span className="text-xs font-black text-blue-700">Rs. {fmt(vnd.bankPaid)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">Credit Due</span>
                        <span className={`text-xs font-black ${vnd.creditDue > 0 ? 'text-rose-600' : 'text-zinc-400'}`}>
                          Rs. {fmt(vnd.creditDue)}
                        </span>
                      </div>
                      <div className="text-right pl-3 border-l border-zinc-200">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase block">Total Purchases</span>
                        <span className="text-xs sm:text-sm font-black text-zinc-900">Rs. {fmt(vnd.totalCost)}</span>
                      </div>
                      <div className="text-zinc-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Bills List */}
                  {isExpanded && (
                    <div className="border-t border-zinc-100 bg-zinc-50/50 p-3.5 space-y-2.5 animate-in fade-in duration-200">
                      <h4 className="text-[9.5px] font-black uppercase tracking-wider text-zinc-500">
                        Purchased Products &amp; Bill Breakdown
                      </h4>

                      <div className="overflow-x-auto rounded-xl border border-gray-300 bg-white">
                        <table className="w-full text-left text-[11px] border-collapse border border-gray-300">
                          <thead className="bg-zinc-100 border-b border-gray-300 text-zinc-700 text-[9.5px] font-black uppercase">
                            <tr className="border-b border-gray-300">
                              <th className="py-2 px-3 border border-gray-300">Date</th>
                              <th className="py-2 px-3 border border-gray-300">Category</th>
                              <th className="py-2 px-3 border border-gray-300">Product (Peti • Tray • Egg)</th>
                              <th className="py-2 px-3 text-center border border-gray-300">Petis</th>
                              <th className="py-2 px-3 text-center border border-gray-300">Method</th>
                              <th className="py-2 px-3 text-right border border-gray-300">Cash Paid</th>
                              <th className="py-2 px-3 text-right border border-gray-300">Bank Paid</th>
                              <th className="py-2 px-3 text-right border border-gray-300">Credit Due</th>
                              <th className="py-2 px-3 text-right border border-gray-300">Total Cost</th>
                              <th className="py-2 px-3 text-center border border-gray-300">Status</th>
                              <th className="py-2 px-3 text-center border border-gray-300">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-300 font-bold text-zinc-700">
                            {vnd.bills.map(b => (
                              <tr key={b.id} className="hover:bg-zinc-50 border-b border-gray-300">
                                <td className="py-2 px-3 whitespace-nowrap text-zinc-500 text-[10.5px] border border-gray-300">
                                  {new Date(b.date).toLocaleDateString('en-PK')}
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap border border-gray-300">
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-50 text-orange-700 border border-orange-200">
                                    {b.category || 'Eggs'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 font-black text-zinc-900 border border-gray-300">
                                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                    <span className="truncate max-w-[90px]" title={b.productName}>{b.productName}</span>
                                    {/* Compact 3-box strip for Peti • Tray • Egg */}
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <div className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-center min-w-[28px]">
                                        <span className="text-[7px] font-black text-gray-600 uppercase block leading-none">Peti</span>
                                        <span className="text-[10px] font-black text-gray-950 leading-tight block mt-0.5">
                                          {b.petisCount > 0 ? b.petisCount : (b.petisPurchased > 0 ? b.petisPurchased : '0')}
                                        </span>
                                      </div>
                                      <div className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-center min-w-[28px]">
                                        <span className="text-[7px] font-black text-gray-600 uppercase block leading-none">Tray</span>
                                        <span className="text-[10px] font-black text-gray-950 leading-tight block mt-0.5">
                                          {b.traysCount > 0 ? b.traysCount : '0'}
                                        </span>
                                      </div>
                                      <div className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-center min-w-[34px]">
                                        <span className="text-[7px] font-black text-gray-600 uppercase block leading-none">Egg</span>
                                        <span className="text-[10px] font-black text-gray-950 leading-tight block mt-0.5">
                                          {b.totalEggsCount > 0 ? b.totalEggsCount.toLocaleString('en-PK') : (b.eggQuantity > 0 ? b.eggQuantity.toLocaleString('en-PK') : '0')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-center font-black text-orange-800 border border-gray-300">
                                  <div>{b.petisPurchased > 0 ? `${b.petisPurchased} P` : (b.petisCount > 0 ? `${b.petisCount} P` : '-')}</div>
                                  {b.totalEggsCount > 0 && (
                                    <div className="text-[8px] font-bold text-zinc-400">{b.totalEggsCount.toLocaleString('en-PK')} Eggs</div>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center whitespace-nowrap border border-gray-300">
                                  {b.paymentMethod === 'BANK' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-800 border border-blue-200">
                                      <Building2 className="w-2.5 h-2.5 text-blue-600" />
                                      Bank
                                    </span>
                                  ) : b.paymentMethod === 'CREDIT' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                                      <CreditCard className="w-2.5 h-2.5 text-amber-600" />
                                      Credit
                                    </span>
                                  ) : b.paymentMethod === 'SPLIT' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-50 text-purple-800 border border-purple-200">
                                      <CreditCard className="w-2.5 h-2.5 text-purple-600" />
                                      Split
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      <Banknote className="w-2.5 h-2.5 text-emerald-600" />
                                      Cash
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right text-emerald-700 font-black border border-gray-300">
                                  {b.cashPaid > 0 ? `Rs. ${fmt(b.cashPaid)}` : '-'}
                                </td>
                                <td className="py-2 px-3 text-right text-blue-700 font-black border border-gray-300">
                                  {b.bankPaid > 0 ? `Rs. ${fmt(b.bankPaid)}` : '-'}
                                </td>
                                <td className="py-2 px-3 text-right text-rose-600 font-black border border-gray-300">
                                  {b.dueAmount > 0 ? `Rs. ${fmt(b.dueAmount)}` : '-'}
                                </td>
                                <td className="py-2 px-3 text-right font-black text-zinc-900 border border-gray-300">
                                  Rs. {fmt(b.totalCost)}
                                </td>
                                <td className="py-2 px-3 text-center border border-gray-300">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                    b.status === 'PAID'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : b.status === 'PARTIAL'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {b.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center whitespace-nowrap border border-gray-300">
                                  <div className="flex items-center justify-center gap-1">
                                    {isEditAllowed && (
                                      <button
                                        onClick={() => handleOpenEdit(b)}
                                        className="p-1 rounded text-orange-700 hover:bg-orange-100 transition-colors cursor-pointer"
                                        title="Edit"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                    )}
                                    {isDeleteAllowed && (
                                      <button
                                        onClick={() => setDeletingBill(b)}
                                        className="p-1 rounded text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
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
      {editingBill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-100 text-orange-700 rounded-xl">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900 uppercase">Edit Vendor Purchase Bill</h3>
                  <p className="text-[10px] text-zinc-400 font-bold">{editingBill.supplierName}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingBill(null)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Vendor / Supplier</label>
                  <input
                    type="text"
                    value={editFormData.supplierName}
                    onChange={(e) => setEditFormData({ ...editFormData, supplierName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-bold focus:bg-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Vendor Phone</label>
                  <input
                    type="text"
                    value={editFormData.supplierPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, supplierPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-bold focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={editFormData.productName}
                    onChange={(e) => setEditFormData({ ...editFormData, productName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-bold focus:bg-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Category</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-bold focus:bg-white focus:border-orange-500 focus:outline-none"
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
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Petis</label>
                  <input
                    type="number"
                    value={editFormData.petisPurchased}
                    onChange={(e) => setEditFormData({ ...editFormData, petisPurchased: Number(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-black text-orange-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Total Cost (Rs)</label>
                  <input
                    type="number"
                    value={editFormData.totalCost}
                    onChange={(e) => {
                      const total = Number(e.target.value) || 0;
                      const paid = Number(editFormData.cashPaid || 0) + Number(editFormData.bankPaid || 0);
                      setEditFormData({
                        ...editFormData,
                        totalCost: total,
                        dueAmount: Math.max(0, total - paid)
                      });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-black text-zinc-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-emerald-700 mb-1">Cash Paid (Rs)</label>
                  <input
                    type="number"
                    value={editFormData.cashPaid}
                    onChange={(e) => {
                      const cash = Number(e.target.value) || 0;
                      const paid = cash + Number(editFormData.bankPaid || 0);
                      const total = Number(editFormData.totalCost || 0);
                      setEditFormData({
                        ...editFormData,
                        cashPaid: cash,
                        dueAmount: Math.max(0, total - paid)
                      });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-black text-emerald-700 focus:bg-white focus:border-orange-500 focus:outline-none"
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
                      const total = Number(editFormData.totalCost || 0);
                      setEditFormData({
                        ...editFormData,
                        bankPaid: bank,
                        dueAmount: Math.max(0, total - paid)
                      });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-black text-blue-700 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-rose-600 mb-1">Remaining Due (Rs)</label>
                  <input
                    type="number"
                    value={editFormData.dueAmount}
                    onChange={(e) => setEditFormData({ ...editFormData, dueAmount: Number(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 rounded-xl border border-rose-200 bg-rose-50 font-black text-rose-700 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingBill(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 font-black uppercase text-[11px] hover:bg-zinc-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-[11px] shadow-sm cursor-pointer disabled:opacity-50"
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
      {deletingBill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-black text-zinc-900 uppercase">Delete Vendor Bill</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Are you sure you want to permanently delete purchase bill for <span className="font-black text-zinc-900">{deletingBill.productName}</span> from <span className="font-black text-zinc-900">{deletingBill.supplierName}</span>?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBill(null)}
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

export default VendorPaymentLedger;
