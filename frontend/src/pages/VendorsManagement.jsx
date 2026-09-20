import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Truck,
  Plus,
  Search,
  Filter,
  Phone,
  MapPin,
  Calendar,
  Banknote,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Printer,
  X,
  Box,
  Egg,
  Layers,
  ArrowUpDown,
  DollarSign,
  UserCheck,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  UploadCloud,
  Loader2,
  MoreVertical,
  Send,
  FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useProducts } from '../contexts/ProductContext';
import { useUser } from '../contexts/UserContext';
import { getItems, settleSupplierCredit } from '../services/api';
import { CountUpNumber } from '../components/CountUpNumber';
import { toast } from 'sonner';

export function VendorsManagement({ onAddProduct, onEditProduct }) {
  const { user } = useUser?.() || {};
  const { products: contextProducts = [], fetchData } = useProducts() || {};
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, DUE, SETTLED
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMenuVendorId, setActiveMenuVendorId] = useState(null);

  // Settlement Modal State
  const [settleModal, setSettleModal] = useState({
    isOpen: false,
    item: null,
    paymentMethod: 'Cash',
    amountPaid: '',
    isSubmitting: false,
    error: null,
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await getItems(user?.shopId);
      const list = Array.isArray(res) ? res : res?.items || res?.data || [];
      setItems(list.length > 0 ? list : contextProducts);
    } catch (err) {
      console.error(err);
      setItems(contextProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contextProducts && contextProducts.length > 0) {
      setItems(contextProducts);
    } else {
      loadItems();
    }
  }, [contextProducts]);

  // Aggregate products by Vendor / Supplier
  const vendorData = useMemo(() => {
    const map = new Map();

    (items || []).forEach(p => {
      const vName = (p.supplierName && p.supplierName.trim()) ? p.supplierName.trim() : 'Direct / Unassigned Farm';
      const vKey = vName.toLowerCase();

      if (!map.has(vKey)) {
        map.set(vKey, {
          name: vName,
          phone: p.supplierPhone || p.supplierContact || '',
          location: p.supplierLocation || p.farmLocation || '',
          products: [],
          totalPurchasesCost: 0,
          totalPaid: 0,
          totalDue: 0,
          totalPetis: 0,
          totalTrays: 0,
          totalEggs: 0,
          lastPurchaseDate: null,
        });
      }

      const vObj = map.get(vKey);
      if (!vObj.phone && p.supplierPhone) vObj.phone = p.supplierPhone;
      if (!vObj.location && p.supplierLocation) vObj.location = p.supplierLocation;

      const pStock = Number(p.stock || 0);
      const pPeti = Number(p.petiQuantity || 0);
      const pTray = Number(p.trayQuantity || 0);
      const pEgg = Number(p.eggQuantity || 0);

      const effectiveCost = Number(p.totalPurchaseCost) > 0
        ? Number(p.totalPurchaseCost)
        : (pPeti > 0 ? pPeti * (Number(p.costPrice) || Number(p.price) || 0) : pStock * ((Number(p.costPrice) || Number(p.price) || 0) / 360));

      const rawDue = p.dueAmountToSupplier !== undefined ? Number(p.dueAmountToSupplier) : (effectiveCost - (Number(p.amountPaidToSupplier) || 0));
      const due = Math.max(0, Math.min(effectiveCost, rawDue));
      const paid = Math.max(0, effectiveCost - due);

      vObj.products.push({
        ...p,
        computedCost: Math.round(effectiveCost),
        computedPaid: Math.round(paid),
        computedDue: Math.round(due),
      });

      vObj.totalPurchasesCost += effectiveCost;
      vObj.totalPaid += paid;
      vObj.totalDue += due;

      if (pPeti > 0 || pTray > 0 || pEgg > 0) {
        vObj.totalPetis += pPeti + (pTray / 12) + (pEgg / 360);
        vObj.totalTrays += (pPeti * 12) + pTray + (pEgg / 30);
      } else {
        vObj.totalPetis += pStock / 360;
        vObj.totalTrays += pStock / 30;
      }
      vObj.totalEggs += pStock || (pPeti * 360);

      const pDate = p.createdAt || p.mfgDate || p.lastUpdated;
      if (pDate) {
        const dObj = new Date(pDate);
        if (!vObj.lastPurchaseDate || dObj > vObj.lastPurchaseDate) {
          vObj.lastPurchaseDate = dObj;
        }
      }
    });

    return Array.from(map.values()).map(v => ({
      ...v,
      totalPurchasesCost: Math.round(v.totalPurchasesCost),
      totalPaid: Math.round(v.totalPaid),
      totalDue: Math.round(v.totalDue),
      totalPetis: Number(v.totalPetis.toFixed(1)),
      totalTrays: Math.round(v.totalTrays),
    }));
  }, [items]);

  // Overall Global Stats
  const globalStats = useMemo(() => {
    let totalSpend = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalEggCount = 0;

    vendorData.forEach(v => {
      totalSpend += v.totalPurchasesCost;
      totalPaid += v.totalPaid;
      totalDue += v.totalDue;
      totalEggCount += v.totalEggs;
    });

    return {
      vendorCount: vendorData.length,
      totalSpend,
      totalPaid,
      totalDue,
      totalEggCount,
    };
  }, [vendorData]);

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendorData.filter(v => {
      const matchSearch =
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.products.some(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (statusFilter === 'DUE') return v.totalDue > 0;
      if (statusFilter === 'SETTLED') return v.totalDue === 0;
      return true;
    });
  }, [vendorData, searchTerm, statusFilter]);

  // Handle Settle Supplier Payment
  const handleOpenSettle = (item, e) => {
    if (e) e.stopPropagation();
    setSettleModal({
      isOpen: true,
      item,
      paymentMethod: 'Cash',
      amountPaid: String(item.computedDue || item.dueAmountToSupplier || ''),
      isSubmitting: false,
      error: null,
    });
  };

  const handleConfirmSettle = async (e) => {
    if (e) e.preventDefault();
    if (!settleModal.item) return;

    const payAmt = Number(settleModal.amountPaid);
    if (isNaN(payAmt) || payAmt <= 0) {
      setSettleModal(prev => ({ ...prev, error: 'Please enter a valid amount greater than 0' }));
      return;
    }

    try {
      setSettleModal(prev => ({ ...prev, isSubmitting: true, error: null }));
      const itemId = settleModal.item._id || settleModal.item.id;
      await settleSupplierCredit(itemId, {
        amountPaid: payAmt,
        paymentMethod: settleModal.paymentMethod,
        isOnlinePayment: settleModal.paymentMethod.toLowerCase().includes('bank'),
      });

      toast.success(`Payment of Rs. ${payAmt.toLocaleString()} recorded successfully!`);
      setSettleModal({ isOpen: false, item: null, paymentMethod: 'Cash', amountPaid: '', isSubmitting: false, error: null });
      if (fetchData) await fetchData();
      await loadItems();
    } catch (err) {
      console.error(err);
      setSettleModal(prev => ({ ...prev, isSubmitting: false, error: err?.response?.data?.message || err.message || 'Payment settlement failed' }));
    }
  };

  // Direct Print Vendor Statement
  const handleDirectPrintVendor = (vendor) => {
    const printWin = window.open('', '_blank', 'width=900,height=800');
    if (!printWin) {
      alert('Please allow browser popups to print vendor statement');
      return;
    }

    const tableRows = vendor.products.map((p, idx) => {
      const petis = p.petiQuantity || 0;
      const trays = p.trayQuantity || 0;
      const eggs = p.eggQuantity || p.stock || 0;
      const rate = p.costPrice || p.price || 0;
      const cost = p.computedCost || 0;
      const paid = p.computedPaid || 0;
      const due = p.computedDue || 0;
      return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td><strong>${p.name || 'Unnamed Product'}</strong></td>
          <td>${p.category || 'Eggs'}</td>
          <td style="text-align:center;">${petis}P / ${trays}T / ${Number(eggs).toLocaleString()}E</td>
          <td style="text-align:right;">Rs. ${Number(rate).toLocaleString()}</td>
          <td style="text-align:right; font-weight:bold;">Rs. ${Number(cost).toLocaleString()}</td>
          <td style="text-align:right; color:#059669; font-weight:bold;">Rs. ${Number(paid).toLocaleString()}</td>
          <td style="text-align:right; color:${due > 0 ? '#e11d48' : '#64748b'}; font-weight:bold;">Rs. ${Number(due).toLocaleString()}</td>
          <td style="text-align:center;"><span class="badge ${due > 0 ? 'badge-due' : 'badge-paid'}">${due > 0 ? 'Credit Due' : 'Paid'}</span></td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vendor Statement - ${vendor.name}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: portrait; margin: 8mm 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 15px; color: #0f172a; background: #fff; font-size: 11px; margin: 0; }
            .no-print { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
            .btn-print { padding: 8px 18px; background: #0f766e; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 12px; }
            .btn-close { padding: 8px 18px; background: #64748b; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 12px; }
            .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 8px; margin-bottom: 12px; }
            .header h1 { margin: 0; color: #0f766e; text-transform: uppercase; font-size: 18px; font-weight: 900; letter-spacing: 1px; }
            .header p { margin: 3px 0 0; color: #64748b; font-weight: 800; font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; }
            .meta { display: flex; justify-content: space-between; font-size: 9.5px; font-weight: 800; margin-bottom: 10px; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .stats-grid { display: flex; gap: 8px; margin-bottom: 12px; }
            .stat-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px; text-align: center; }
            .stat-card label { font-size: 8px; font-weight: 900; color: #64748b; text-transform: uppercase; display: block; }
            .stat-card .val { font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th, td { border: 1px solid #cbd5e1; padding: 5px 6px; font-size: 9.5px; text-align: left; }
            th { background: #f1f5f9; text-transform: uppercase; font-weight: 900; font-size: 8px; color: #475569; }
            .badge { padding: 2px 6px; border-radius: 4px; font-size: 7.5px; font-weight: 900; text-transform: uppercase; }
            .badge-paid { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
            .badge-due { background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 8.5px; font-weight: 800; color: #64748b; }
            .sign { border-top: 1.5px solid #94a3b8; width: 150px; text-align: center; padding-top: 5px; }
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button class="btn-print" onclick="window.print()">🖨️ Direct Print</button>
            <button class="btn-close" onclick="window.close()">✕ Close</button>
          </div>
          <div class="header">
            <h1>YOSAFZE EGG TRADERS</h1>
            <p>Vendor Purchase Statement &amp; Ledger</p>
          </div>
          <div class="meta">
            <div>
              <strong>Vendor / Farm:</strong> ${vendor.name} ${vendor.phone ? `| 📞 ${vendor.phone}` : ''} ${vendor.location ? `| 📍 ${vendor.location}` : ''}
            </div>
            <div>
              <strong>Date:</strong> ${new Date().toLocaleDateString('en-PK')}
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <label>Total Purchased</label>
              <div class="val">Rs. ${Number(vendor.totalPurchasesCost).toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <label style="color:#059669;">Total Paid</label>
              <div class="val" style="color:#059669;">Rs. ${Number(vendor.totalPaid).toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <label style="color:${vendor.totalDue > 0 ? '#e11d48' : '#64748b'};">Due Balance</label>
              <div class="val" style="color:${vendor.totalDue > 0 ? '#e11d48' : '#64748b'};">Rs. ${Number(vendor.totalDue).toLocaleString()}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:25px; text-align:center;">#</th>
                <th>Product Name</th>
                <th>Category</th>
                <th style="text-align:center;">Volume (P/T/E)</th>
                <th style="text-align:right;">Rate</th>
                <th style="text-align:right;">Total Cost</th>
                <th style="text-align:right;">Paid</th>
                <th style="text-align:right;">Due</th>
                <th style="text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            <div class="sign">Vendor Signature</div>
            <div class="sign">Authorized Signature</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 150);
            };
          </script>
        </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      try { printWin.print(); } catch (e) { console.error(e); }
    }, 250);
  };

  // Export Vendor Report PDF
  const exportVendorPDF = (vendor) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Vendor Statement: ${vendor.name}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Contact: ${vendor.phone || 'N/A'} | Location: ${vendor.location || 'N/A'}`, 14, 28);
    doc.text(`Total Purchases: Rs. ${vendor.totalPurchasesCost.toLocaleString()} | Paid: Rs. ${vendor.totalPaid.toLocaleString()} | Due Balance: Rs. ${vendor.totalDue.toLocaleString()}`, 14, 34);

    const tableData = vendor.products.map(p => [
      p.name || 'Unnamed Product',
      p.category || 'Eggs',
      `${p.petiQuantity || 0}P / ${p.trayQuantity || 0}T / ${p.eggQuantity || 0}E`,
      `Rs. ${(p.costPrice || p.price || 0).toLocaleString()}`,
      `Rs. ${(p.computedCost || 0).toLocaleString()}`,
      `Rs. ${(p.computedPaid || 0).toLocaleString()}`,
      `Rs. ${(p.computedDue || 0).toLocaleString()}`,
      p.paymentMethod || 'Cash'
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Product', 'Category', 'Quantity', 'Rate', 'Total Cost', 'Paid', 'Due', 'Payment Method']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 118, 110] },
    });

    doc.save(`vendor_statement_${vendor.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleWhatsAppVendor = (vendor) => {
    const phoneClean = (vendor.phone || '').replace(/[^0-9]/g, '');
    const targetPhone = phoneClean.startsWith('0') ? `92${phoneClean.slice(1)}` : phoneClean.startsWith('92') ? phoneClean : phoneClean;
    
    let msg = `*YOSAFZE EGG TRADERS - VENDOR STATEMENT*\n`;
    msg += `*Vendor:* ${vendor.name}\n`;
    if (vendor.location) msg += `*Location:* ${vendor.location}\n`;
    msg += `*Date:* ${new Date().toLocaleDateString()}\n`;
    msg += `--------------------------------\n`;
    msg += `*Total Purchased Value:* Rs. ${vendor.totalPurchasesCost.toLocaleString()}\n`;
    msg += `*Total Paid Amount:* Rs. ${vendor.totalPaid.toLocaleString()}\n`;
    msg += `*Current Due Balance:* Rs. ${vendor.totalDue.toLocaleString()}\n`;
    msg += `--------------------------------\n`;
    msg += `*Supplied Products:*\n`;
    vendor.products.forEach((p, idx) => {
      msg += `${idx + 1}. ${p.name} - ${p.petiQuantity || 0}P / ${p.trayQuantity || 0}T - Rs. ${(p.computedCost || 0).toLocaleString()} (Due: Rs. ${(p.computedDue || 0).toLocaleString()})\n`;
    });
    msg += `\nThank you for your business!`;

    const url = targetPhone 
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleExportVendorCsv = (vendor) => {
    const headers = ['Vendor Name', 'Phone', 'Location', 'Product Name', 'Category', 'Petis', 'Trays', 'Eggs', 'Unit Rate (Rs.)', 'Total Cost (Rs.)', 'Paid Amount (Rs.)', 'Due Amount (Rs.)', 'Payment Method'];
    const rows = vendor.products.map(p => [
      `"${vendor.name.replace(/"/g, '""')}"`,
      `"${(vendor.phone || '').replace(/"/g, '""')}"`,
      `"${(vendor.location || '').replace(/"/g, '""')}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      p.petiQuantity || 0,
      p.trayQuantity || 0,
      p.eggQuantity || p.stock || 0,
      p.costPrice || p.price || 0,
      p.computedCost || 0,
      p.computedPaid || 0,
      p.computedDue || 0,
      `"${(p.paymentMethod || 'Cash').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Vendor_${vendor.name.replace(/\s+/g, '_')}_Ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-teal-900 via-slate-900 to-zinc-950 p-4 sm:p-5 rounded-3xl border border-teal-500/30 shadow-2xl text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/20 border border-teal-400/40 rounded-2xl text-teal-300 shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-500/30">
                Supplier &amp; Farm Directory
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-0.5">
              Vendors &amp; Suppliers Management
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              if (onAddProduct) onAddProduct();
            }}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>+ Purchase from Vendor</span>
          </button>
          <button
            onClick={loadItems}
            disabled={loading}
            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white transition-all cursor-pointer"
            title="Refresh Vendors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <span>Total Vendors</span>
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            <CountUpNumber value={globalStats.vendorCount} />
          </div>
          <p className="text-[9px] font-bold text-slate-400">Active egg suppliers &amp; farms</p>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <span>Total Purchased</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            Rs. <CountUpNumber value={globalStats.totalSpend} />
          </div>
          <p className="text-[9px] font-bold text-blue-600 uppercase">Gross Purchase Value</p>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <span>Total Paid (Cash/Bank)</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            Rs. <CountUpNumber value={globalStats.totalPaid} />
          </div>
          <p className="text-[9px] font-bold text-emerald-600 uppercase">Settled to Suppliers</p>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <span>Total Dues (Payable)</span>
            <CreditCard className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">
            Rs. <CountUpNumber value={globalStats.totalDue} />
          </div>
          <p className="text-[9px] font-bold text-rose-600 uppercase">Outstanding Balance</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendor name, phone, farm, product..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-teal-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Vendors' },
            { id: 'DUE', label: '⚠️ With Outstanding Due' },
            { id: 'SETTLED', label: '✅ Fully Settled' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors List Grid */}
      {filteredVendors.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-slate-800 uppercase">No Vendors Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? `No vendor matches "${searchTerm}"` : "You haven't recorded any product purchases from suppliers yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredVendors.map((vendor, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedVendor(vendor)}
              className="bg-white border-2 border-slate-200 hover:border-teal-500 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all space-y-3.5 cursor-pointer flex flex-col justify-between group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center text-teal-700 font-black text-base shrink-0">
                    {vendor.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-teal-700 transition-colors uppercase leading-tight line-clamp-1">
                      {vendor.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-bold">
                      {vendor.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {vendor.phone}
                        </span>
                      )}
                      {vendor.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {vendor.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                    vendor.totalDue > 0
                      ? 'bg-rose-100 text-rose-700 border border-rose-300'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  }`}
                >
                  {vendor.totalDue > 0 ? `Due: Rs. ${vendor.totalDue.toLocaleString()}` : 'Fully Settled'}
                </span>
              </div>

              {/* Purchase Quantity Summary */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-2xl border border-slate-100 text-center">
                <div>
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase block">Petis</span>
                  <span className="text-xs font-black text-amber-700">{vendor.totalPetis}</span>
                </div>
                <div className="border-x border-slate-200">
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase block">Trays</span>
                  <span className="text-xs font-black text-teal-700">{vendor.totalTrays}</span>
                </div>
                <div>
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase block">Products</span>
                  <span className="text-xs font-black text-slate-900">{vendor.products.length}</span>
                </div>
              </div>

              {/* Financial Balance Summary */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-2 rounded-2xl text-[10px]">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Purchased:</span>
                  <span className="font-black text-slate-900">Rs. {vendor.totalPurchasesCost.toLocaleString()}</span>
                </div>
                <div className="flex flex-col border-l border-slate-200 pl-1.5">
                  <span className="text-[8px] font-bold text-emerald-700 uppercase">Paid:</span>
                  <span className="font-black text-emerald-700">Rs. {vendor.totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex flex-col border-l border-slate-200 pl-1.5">
                  <span className="text-[8px] font-bold text-rose-600 uppercase">Due:</span>
                  <span className={`font-black ${vendor.totalDue > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                    Rs. {vendor.totalDue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 relative">
                <span className="text-[9.5px] font-bold text-teal-700 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  View Ledger &amp; Products <ChevronRight className="w-3.5 h-3.5" />
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDirectPrintVendor(vendor);
                    }}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                    title="Direct Print Statement"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuVendorId(activeMenuVendorId === idx ? null : idx);
                      }}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        activeMenuVendorId === idx
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                      title="More Options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {activeMenuVendorId === idx && (
                      <div
                        className="absolute right-0 bottom-full mb-2 w-52 bg-slate-900 border border-slate-700 text-white rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-left"
                        onClick={(e) => e.stopPropagation()}
                        onMouseLeave={() => setActiveMenuVendorId(null)}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            handleDirectPrintVendor(vendor);
                            setActiveMenuVendorId(null);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-[11px] font-black flex items-center gap-2 hover:bg-white/10 text-emerald-400 transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>🖨️ Direct Print Statement</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            exportVendorPDF(vendor);
                            setActiveMenuVendorId(null);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-[11px] font-black flex items-center gap-2 hover:bg-white/10 text-cyan-300 transition-all cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>📄 Download PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleWhatsAppVendor(vendor);
                            setActiveMenuVendorId(null);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-[11px] font-black flex items-center gap-2 hover:bg-white/10 text-teal-300 transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span>📱 Send on WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleExportVendorCsv(vendor);
                            setActiveMenuVendorId(null);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-[11px] font-black flex items-center gap-2 hover:bg-white/10 text-green-300 transition-all cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          <span>📊 Export Excel (.csv)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── VENDOR DRILLDOWN MODAL / DRAWER ─── */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedVendor(null)} />

          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-zinc-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 border border-teal-400/40 rounded-2xl text-teal-300">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white leading-tight">
                    {selectedVendor.name} • Purchase Ledger
                  </h2>
                  <p className="text-[10px] text-teal-400 font-bold flex items-center gap-3 mt-0.5">
                    {selectedVendor.phone && <span>📞 {selectedVendor.phone}</span>}
                    {selectedVendor.location && <span>📍 {selectedVendor.location}</span>}
                    <span>📦 {selectedVendor.products.length} Products Purchased</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDirectPrintVendor(selectedVendor)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 border border-emerald-400 shadow-sm transition-all cursor-pointer"
                  title="Direct Print Statement"
                >
                  <Printer className="w-3.5 h-3.5" /> 🖨️ Direct Print
                </button>
                <button
                  onClick={() => exportVendorPDF(selectedVendor)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={() => handleWhatsAppVendor(selectedVendor)}
                  className="px-3 py-1.5 bg-teal-600/60 hover:bg-teal-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 border border-teal-400/50 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button
                  onClick={() => handleExportVendorCsv(selectedVendor)}
                  className="px-3 py-1.5 bg-green-700/60 hover:bg-green-700 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 border border-green-500/50 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
                </button>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Financial Summary Banner */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-100 border-b border-slate-200 text-xs">
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Total Spend</span>
                <span className="text-sm sm:text-base font-black text-slate-900">
                  Rs. {selectedVendor.totalPurchasesCost.toLocaleString()}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center">
                <span className="text-[9px] font-bold text-emerald-700 uppercase block">Total Paid</span>
                <span className="text-sm sm:text-base font-black text-emerald-700">
                  Rs. {selectedVendor.totalPaid.toLocaleString()}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center">
                <span className="text-[9px] font-bold text-rose-600 uppercase block">Due Balance</span>
                <span className={`text-sm sm:text-base font-black ${selectedVendor.totalDue > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                  Rs. {selectedVendor.totalDue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Products Table */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Box className="w-4 h-4 text-teal-600" /> Products Purchased from {selectedVendor.name}
              </h3>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                      <th className="p-2.5">Product &amp; Category</th>
                      <th className="p-2.5">Stock Breakdown</th>
                      <th className="p-2.5">Unit Rate</th>
                      <th className="p-2.5">Total Cost</th>
                      <th className="p-2.5">Paid</th>
                      <th className="p-2.5">Due</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                    {selectedVendor.products.map((p, pIdx) => (
                      <tr key={pIdx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            {p.images && p.images[0] ? (
                              <img src={p.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                <Egg className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <span className="font-black text-slate-900 block leading-tight">{p.name || 'Unnamed Product'}</span>
                              <span className="text-[9.5px] text-teal-700 font-bold">{p.category || 'Eggs'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-2.5 text-[11px]">
                          <span className="text-amber-700 font-black">{p.petiQuantity || 0}P</span> •{' '}
                          <span className="text-teal-700 font-black">{p.trayQuantity || 0}T</span> •{' '}
                          <span className="text-emerald-700 font-black">{p.eggQuantity || p.stock || 0}E</span>
                        </td>
                        <td className="p-2.5 text-slate-600 font-black">
                          Rs. {(p.costPrice || p.price || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-slate-900 font-black">
                          Rs. {(p.computedCost || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-emerald-700 font-black">
                          Rs. {(p.computedPaid || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5">
                          <span className={`font-black ${p.computedDue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            Rs. {(p.computedDue || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="p-2.5 text-right space-x-1">
                          {p.computedDue > 0 && (
                            <button
                              onClick={(e) => handleOpenSettle(p, e)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                            >
                              Settle Due
                            </button>
                          )}
                          {onEditProduct && (
                            <button
                              onClick={() => {
                                setSelectedVendor(null);
                                onEditProduct(p);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedVendor(null)}
                className="px-5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── SETTLE SUPPLIER CREDIT MODAL ─── */}
      {settleModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSettleModal({ ...settleModal, isOpen: false })} />

          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-700">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Settle Supplier Due</h3>
                  <p className="text-[10px] text-slate-500 font-bold">{settleModal.item?.supplierName || 'Supplier'}</p>
                </div>
              </div>
              <button
                onClick={() => setSettleModal({ ...settleModal, isOpen: false })}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {settleModal.error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
                {settleModal.error}
              </div>
            )}

            <form onSubmit={handleConfirmSettle} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-600">Current Outstanding Due:</span>
                <span className="text-sm font-black text-rose-600">
                  Rs. {(settleModal.item?.computedDue || settleModal.item?.dueAmountToSupplier || 0).toLocaleString()}
                </span>
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Cash', 'Bank Transfer'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSettleModal(prev => ({ ...prev, paymentMethod: m }))}
                      className={`py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer border ${
                        settleModal.paymentMethod === m
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount to Pay */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase">Amount to Pay (Rs.) *</label>
                <input
                  type="number"
                  step="any"
                  value={settleModal.amountPaid}
                  onChange={(e) => setSettleModal(prev => ({ ...prev, amountPaid: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-sm font-black text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  placeholder="Enter payment amount"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleModal({ ...settleModal, isOpen: false })}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settleModal.isSubmitting}
                  className="flex-[1.5] py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                >
                  {settleModal.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm Settlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
