import { useState, useEffect, useMemo } from 'react';
import { Truck, Plus, Search, Filter, Box, Banknote, CreditCard, AlertCircle, Image as ImageIcon, ExternalLink, ShieldCheck, X, FileSpreadsheet, ChevronDown, Printer, Share2, Eye, Edit2, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useProducts } from '../contexts/ProductContext';
import { getItems, deleteItem } from '../services/api';
import { CountUpNumber } from './CountUpNumber.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const getReceiptImg = (p) => {
  if (!p) return null;
  if (p.paymentReceipt && typeof p.paymentReceipt === 'string' && p.paymentReceipt.trim()) return p.paymentReceipt;
  if (p.receipt && typeof p.receipt === 'string' && p.receipt.trim()) return p.receipt;
  if (p.paymentProof && typeof p.paymentProof === 'string' && p.paymentProof.trim()) return p.paymentProof;
  return null;
};

export function PurchasesManagement({ products: propProducts, onAddProduct, onEditProduct, onDeleteProduct, onViewProduct }) {
  const productCtx = useProducts() || {};
  const contextProducts = productCtx.products || [];
  const [apiProducts, setApiProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [localDeleteDialog, setLocalDeleteDialog] = useState({ isOpen: false, item: null, isDeleting: false });

  const [deletedIds, setDeletedIds] = useState(new Set());

  const reloadItems = async () => {
    try {
      const res = await getItems();
      const itemsList = Array.isArray(res) ? res : res?.items || res?.data || [];
      if (itemsList.length > 0) {
        setApiProducts(itemsList);
      }
    } catch (err) {
      console.error('Failed to reload items:', err);
    }
  };

  // Fetch items directly if prop or context is empty
  useEffect(() => {
    reloadItems();
  }, []);

  const handleDeleteClick = async (item) => {
    if (!item) return;
    const itemId = typeof item === 'string' ? item : (item._id || item.id);
    const itemName = typeof item === 'string' ? 'this product' : (item.name || 'Product');
    if (!itemId || itemId === 'undefined') return;
    if (!window.confirm(`Are you sure you want to delete product "${itemName}"?`)) return;
    
    // 1. Instantly remove from local UI state
    setDeletedIds(prev => new Set([...prev, itemId]));
    setApiProducts(prev => prev.filter(p => p._id !== itemId));

    // 2. Call backend API
    try {
      await deleteItem(itemId, '', 'shop_admin');
    } catch (err) {
      console.error('[Direct Delete Item API]:', err);
    }

    // 3. Notify parent and product context
    if (onDeleteProduct) {
      try { await onDeleteProduct(item); } catch (_) {}
    }
    if (productCtx.deleteProduct) {
      try { await productCtx.deleteProduct(itemId); } catch (_) {}
    }
  };

  const products = useMemo(() => {
    const raw = (propProducts && propProducts.length > 0)
      ? propProducts
      : ((contextProducts && contextProducts.length > 0) ? contextProducts : apiProducts);
    return raw.filter(p => !deletedIds.has(p._id));
  }, [propProducts, contextProducts, apiProducts, deletedIds]);

  // Timeframe date filtering logic
  const filteredByTimeframeProducts = useMemo(() => {
    if (timeframe === 'ALL') return products;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return products.filter((p) => {
      const dateVal = p.purchaseDate || p.createdAt || p.updatedAt;
      if (!dateVal) return true;

      const pDate = new Date(dateVal);
      if (isNaN(pDate.getTime())) return true;

      if (timeframe === 'DAY') {
        return pDate.toISOString().split('T')[0] === todayStr;
      }
      if (timeframe === 'MONTH') {
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
      }
      if (timeframe === 'YEAR') {
        return pDate.getFullYear() === currentYear;
      }
      return true;
    });
  }, [products, timeframe]);

  const purchaseItems = useMemo(() => {
    return filteredByTimeframeProducts.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.supplierName && p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });
  }, [filteredByTimeframeProducts, searchTerm]);

  const stats = useMemo(() => {
    let totalPurchasesCost = 0;
    let cashPaid = 0;
    let onlinePaid = 0;
    let totalDue = 0;
    let totalPetisPurchased = 0;

    filteredByTimeframeProducts.forEach((p) => {
      const stockEggs = Number(p.stock) || 0;
      const petiQty = Number(p.petiQuantity) || 0;
      const trayQty = Number(p.trayQuantity) || 0;
      const eggQty = Number(p.eggQuantity) || 0;

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

      const receiptImg = getReceiptImg(p);
      const pMethod = String(p.paymentMethod || 'Cash').trim().toLowerCase();

      // 1. Determine payment channel
      const isOnline = p.isOnlinePayment === true || !!receiptImg || (
        pMethod.includes('bank') || 
        pMethod.includes('easy') || 
        pMethod.includes('jazz') || 
        pMethod.includes('online') || 
        pMethod.includes('cheque') || 
        pMethod.includes('transfer') ||
        pMethod.includes('card')
      );

      const isCredit = !isOnline && (
        pMethod.includes('credit') || 
        pMethod.includes('due') || 
        pMethod.includes('qaraz')
      );

      // 2. Strict Routed Paid vs Due (Qaraz) calculation (No overlap)
      const hasExplicitDue = p.dueAmountToSupplier !== undefined && p.dueAmountToSupplier !== null && Number(p.dueAmountToSupplier) > 0;
      let due = 0;
      let paid = 0;

      if (hasExplicitDue || isCredit) {
        const rawDue = hasExplicitDue ? Number(p.dueAmountToSupplier) : cost;
        due = Math.min(cost, Math.max(0, rawDue));
        paid = Math.max(0, cost - due);
      } else {
        // 100% Cash / Bank Paid (No Qaraz)
        paid = cost;
        due = 0;
      }

      // 3. Aggregate totals
      totalPurchasesCost += isNaN(cost) ? 0 : cost;
      totalDue += isNaN(due) ? 0 : due;
      cashPaid += isNaN(paid) ? 0 : paid;
    });

    return {
      totalPurchasesCost: isNaN(totalPurchasesCost) ? 0 : Math.round(totalPurchasesCost),
      cashPaid: isNaN(cashPaid) ? 0 : Math.round(cashPaid),
      totalDue: isNaN(totalDue) ? 0 : Math.round(totalDue),
      totalPetis: isNaN(totalPetisPurchased) ? 0 : Number(totalPetisPurchased.toFixed(1)),
      totalTrays: isNaN(totalPetisPurchased) ? 0 : Math.round(totalPetisPurchased * 12),
      totalEggs: isNaN(totalPetisPurchased) ? 0 : Math.round(totalPetisPurchased * 360)
    };
  }, [filteredByTimeframeProducts]);

  const attachedReceipts = useMemo(() => {
    return filteredByTimeframeProducts.filter(p => !!getReceiptImg(p));
  }, [filteredByTimeframeProducts]);

  const totalReceiptsAmount = useMemo(() => {
    return attachedReceipts.reduce((sum, p) => {
      const stockEggs = Number(p.stock) || 0;
      const cost = Number(p.totalPurchaseCost) || (Number(p.costPrice) > 0 ? (stockEggs * (Number(p.costPrice) / (p.unitType === 'egg' ? 1 : p.unitType === 'tray' ? 30 : 360))) : 0);
      const receiptImg = getReceiptImg(p);
      const paid = Number(p.amountPaidToSupplier) || (receiptImg ? cost : 0);
      return sum + (isNaN(paid) ? 0 : paid);
    }, 0);
  }, [attachedReceipts]);

  const fmt = (n) => Number(n || 0).toLocaleString('en-PK');

  // Print Purchases Report Handler
  // ── PDF Generator via jsPDF & autoTable ──
  const generatePurchasesPDF = () => {
    const doc = new jsPDF('portrait', 'pt', 'a4');
    const timeTitle = timeframe === 'DAY' ? 'Today (Day)' : timeframe === 'MONTH' ? 'This Month' : timeframe === 'YEAR' ? 'This Year' : 'All-Time';
    const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 595, 60, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('YOSAFZE EGG TRADERS', 30, 26);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Official Purchases & Restock Ledger Report • Filter: ${timeTitle}`, 30, 44);
    doc.text(`Generated: ${dateStr}`, 430, 44);

    // Summary Stat Bar
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(30, 72, 535, 42, 6, 6, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('STOCK PURCHASED', 45, 87);
    doc.text('TOTAL INVESTMENT', 180, 87);
    doc.text('CASH PAID', 320, 87);
    doc.text('DUE (QARAZ)', 455, 87);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${stats.totalPetis} Petis`, 45, 104);
    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${fmt(stats.totalPurchasesCost)}`, 180, 104);
    doc.setTextColor(16, 185, 129);
    doc.text(`Rs. ${fmt(stats.cashPaid)}`, 320, 104);
    doc.setTextColor(stats.totalDue > 0 ? 225 : 100, stats.totalDue > 0 ? 29 : 116, stats.totalDue > 0 ? 72 : 139);
    doc.text(`Rs. ${fmt(stats.totalDue)}`, 455, 104);

    // Items Table
    const tableData = purchaseItems.map((item, idx) => {
      const petis = item.petiQuantity || (item.stock ? (item.stock / 360).toFixed(1) : 0);
      const trays = item.trayQuantity || (item.stock ? Math.round(item.stock / 30) : 0);
      const eggs = item.stock || 0;
      const cost = item.totalPurchaseCost || 0;
      const paid = item.amountPaidToSupplier || 0;
      const due = item.dueAmountToSupplier || 0;

      return [
        idx + 1,
        item.name,
        item.supplierName || 'Farm Supplier',
        `${petis} Petis (${trays} T)`,
        Number(eggs).toLocaleString(),
        `Rs. ${fmt(cost)}`,
        `Rs. ${fmt(paid)}`,
        `Rs. ${fmt(due)}`,
        due > 0 ? 'Qaraz' : 'Cash'
      ];
    });

    autoTable(doc, {
      startY: 125,
      head: [['#', 'Product Name', 'Supplier', 'Stock (P/T)', 'Eggs', 'Cost', 'Cash Paid', 'Qaraz', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 3.5, overflow: 'linebreak' },
      margin: { left: 30, right: 30 },
    });

    const fileName = `Purchases_Report_${timeTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    return fileName;
  };

  // ── Clean Compact HTML Print Preview ──
  const handlePrintPurchasesReport = () => {
    const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const timeTitle = timeframe === 'DAY' ? 'Today (Day)' : timeframe === 'MONTH' ? 'This Month' : timeframe === 'YEAR' ? 'This Year' : 'All-Time';

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to print the purchases report');
      return;
    }

    const tableRows = purchaseItems.map((item, idx) => {
      const petis = item.petiQuantity || (item.stock ? (item.stock / 360).toFixed(1) : 0);
      const trays = item.trayQuantity || (item.stock ? Math.round(item.stock / 30) : 0);
      const eggs = item.stock || 0;
      const cost = item.totalPurchaseCost || 0;
      const paid = item.amountPaidToSupplier || 0;
      const due = item.dueAmountToSupplier || 0;

      return `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${item.name}</strong></td>
        <td>${item.supplierName || 'Farm Supplier'}</td>
        <td style="text-align:center;">${petis} P</td>
        <td style="text-align:center;">${trays} T</td>
        <td style="text-align:center;">${Number(eggs).toLocaleString()}</td>
        <td style="text-align:right; font-weight:bold;">Rs. ${fmt(cost)}</td>
        <td style="text-align:right; color:#059669; font-weight:bold;">Rs. ${fmt(paid)}</td>
        <td style="text-align:right; color:${due > 0 ? '#e11d48' : '#64748b'}; font-weight:bold;">Rs. ${fmt(due)}</td>
        <td style="text-align:center;"><span class="badge ${due > 0 ? 'badge-due' : 'badge-paid'}">${due > 0 ? 'Qaraz' : 'Cash'}</span></td>
      </tr>`;
    }).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchases Ledger Report - ${timeTitle}</title>
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
            .badge-paid { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
            .badge-due { background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; }
            .total-row { background: #f8fafc; font-weight: 900; font-size: 10px; }
            .footer { margin-top: 25px; display: flex; justify-content: space-between; font-size: 8.5px; font-weight: 800; color: #64748b; }
            .sign { border-top: 1.5px solid #94a3b8; width: 140px; text-align: center; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>YOSAFZE EGG TRADERS</h1>
            <p>Purchases &amp; Restock Ledger Report</p>
          </div>
          <div class="meta">
            <span>Generated: ${dateStr}</span>
            <span>Filter: ${timeTitle}</span>
            <span>Items: ${purchaseItems.length} Products</span>
          </div>
          <div class="stats-grid">
            <div class="stat-card"><label>Stock Purchased</label><div class="val">${stats.totalPetis} Petis</div></div>
            <div class="stat-card"><label>Total Investment</label><div class="val" style="color:#059669;">Rs. ${fmt(stats.totalPurchasesCost)}</div></div>
            <div class="stat-card"><label>Cash Paid</label><div class="val" style="color:#10b981;">Rs. ${fmt(stats.cashPaid)}</div></div>
            <div class="stat-card"><label>Qaraz (Due)</label><div class="val" style="color:#e11d48;">Rs. ${fmt(stats.totalDue)}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:20px; text-align:center;">#</th>
                <th>Product Name</th>
                <th>Supplier</th>
                <th style="text-align:center;">Petis</th>
                <th style="text-align:center;">Trays</th>
                <th style="text-align:center;">Eggs</th>
                <th style="text-align:right;">Cost</th>
                <th style="text-align:right;">Cash Paid</th>
                <th style="text-align:right;">Qaraz</th>
                <th style="text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="10" style="text-align:center; padding:15px;">No purchases recorded for this period.</td></tr>'}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3" style="text-align:right;">TOTALS:</td>
                <td style="text-align:center;">${stats.totalPetis} P</td>
                <td style="text-align:center;">${stats.totalTrays} T</td>
                <td style="text-align:center;">${fmt(stats.totalEggs)}</td>
                <td style="text-align:right; color:#059669;">Rs. ${fmt(stats.totalPurchasesCost)}</td>
                <td style="text-align:right; color:#10b981;">Rs. ${fmt(stats.cashPaid)}</td>
                <td style="text-align:right; color:#e11d48;">Rs. ${fmt(stats.totalDue)}</td>
                <td></td>
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

  // ── WhatsApp PDF Generation & Share Handler ──
  const handleWhatsAppPurchasesShare = () => {
    // 1. Generate & auto-download official PDF document
    const pdfFileName = generatePurchasesPDF();

    // 2. Direct to WhatsApp with clean formatted statement
    const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeTitle = timeframe === 'DAY' ? 'Today (Day)' : timeframe === 'MONTH' ? 'This Month' : timeframe === 'YEAR' ? 'This Year' : 'All-Time';

    let message = `📄 *YOSAFZE EGG TRADERS - PURCHASES REPORT*\n`;
    message += `📅 *Timeframe:* ${timeTitle} (${dateStr})\n`;
    message += `===============================\n`;
    message += `📦 *Stock Restocked:* ${stats.totalPetis} Petis (${stats.totalTrays} Trays • ${fmt(stats.totalEggs)} Eggs)\n`;
    message += `💰 *Total Investment:* Rs. ${fmt(stats.totalPurchasesCost)}\n`;
    message += `💵 *Cash Paid:* Rs. ${fmt(stats.cashPaid)}\n`;
    message += `⚠️ *Qaraz (Debt Due):* Rs. ${fmt(stats.totalDue)}\n`;
    message += `===============================\n`;
    message += `🛒 *PURCHASED PRODUCTS:* (${purchaseItems.length} items)\n`;

    purchaseItems.slice(0, 8).forEach((item, idx) => {
      const petis = item.petiQuantity || (item.stock ? (item.stock / 360).toFixed(1) : 0);
      const paid = item.amountPaidToSupplier || 0;
      const due = item.dueAmountToSupplier || 0;
      message += `${idx + 1}. *${item.name}* (${petis} Petis)\n`;
      message += `   • Cost: Rs. ${fmt(item.totalPurchaseCost)} | Paid: Rs. ${fmt(paid)} | Due: Rs. ${fmt(due)}\n`;
    });

    if (purchaseItems.length > 8) {
      message += `... and ${purchaseItems.length - 8} more items (see PDF).\n`;
    }

    message += `===============================\n`;
    message += `📎 *Official PDF File (${pdfFileName}) downloaded to your device.*\n`;
    message += `_Yosafze Egg Traders Management System_`;

    const encodedText = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  // Excel CSV Export Handler
  const handleExportPurchasesExcel = () => {
    const timeTitle = timeframe === 'DAY' ? 'Today' : timeframe === 'MONTH' ? 'ThisMonth' : timeframe === 'YEAR' ? 'ThisYear' : 'AllTime';

    let csvContent = `Product Name,Supplier Name,Peti Quantity,Tray Quantity,Egg Quantity,Total Purchase Cost (Rs),Amount Paid To Supplier (Rs),Due Balance (Rs),Payment Method\n`;

    purchaseItems.forEach((item) => {
      const petis = item.petiQuantity || (item.stock ? (item.stock / 360).toFixed(1) : 0);
      const trays = item.trayQuantity || (item.stock ? Math.round(item.stock / 30) : 0);
      const eggs = item.stock || 0;
      const name = `"${(item.name || '').replace(/"/g, '""')}"`;
      const supplier = `"${(item.supplierName || 'Farm Supplier').replace(/"/g, '""')}"`;
      const cost = item.totalPurchaseCost || 0;
      const paid = item.amountPaidToSupplier || 0;
      const due = item.dueAmountToSupplier || Math.max(0, cost - paid);
      const method = item.paymentMethod || 'Cash';

      csvContent += `${name},${supplier},${petis},${trays},${eggs},${cost},${paid},${due},${method}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Purchases_Report_${timeTitle}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 sm:p-7 rounded-[2rem] border border-slate-700/80 shadow-2xl text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 border border-teal-500/40 rounded-2xl text-teal-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">
                Purchases Page
              </h2>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                Full Stock Purchase Records • Day, Month &amp; Year Cost History
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Actions: Print PDF, WhatsApp Share, Excel Export */}
          <button
            onClick={handlePrintPurchasesReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider border border-slate-600 transition-all cursor-pointer shadow-sm hover:border-teal-400"
            title="Print PDF Purchases Report"
          >
            <Printer className="w-3.5 h-3.5 text-teal-400" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={handleWhatsAppPurchasesShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider border border-emerald-500 transition-all cursor-pointer shadow-sm"
            title="Share via WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5 text-white" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleExportPurchasesExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider border border-emerald-600 transition-all cursor-pointer shadow-sm"
            title="Export Excel (.csv) Report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            <span>Excel</span>
          </button>

          {onAddProduct && (
            <button
              onClick={onAddProduct}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-md active:translate-y-0.5 cursor-pointer font-extrabold"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>+ Add Product</span>
            </button>
          )}

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
                onClick={() => setTimeframe(t.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  timeframe === t.id
                    ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold'
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
        {/* Card 1: Stock Purchased */}
        <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
              {timeframe === 'DAY' ? 'Today Stock' : timeframe === 'MONTH' ? 'Month Stock' : timeframe === 'YEAR' ? 'Year Stock' : 'Stock Purchased'}
            </span>
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Box className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          <h4 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">{stats.totalPetis} <span className="text-base text-amber-600">Petis</span></h4>
          <span className="text-[10px] font-bold text-gray-400 uppercase mt-1 block">
            {stats.totalTrays} Trays • {fmt(stats.totalEggs)} Eggs
          </span>
        </div>

        {/* Card 2: Cash Paid */}
        <div className="bg-white border-2 border-emerald-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Cash Paid</span>
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <h4 className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">Rs. <CountUpNumber value={stats.cashPaid} /></h4>
          <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 block">Total Cash Paid</span>
        </div>

        {/* Card 3: Due Balance (Qaraz) */}
        <div className={`bg-white border-2 rounded-2xl p-4 shadow-sm flex flex-col justify-between ${stats.totalDue > 0 ? 'border-rose-300 bg-rose-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">⚠️ Qaraz (Debt)</span>
            <div className="p-1.5 bg-rose-100 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
          </div>
          <h4 className={`text-xl sm:text-2xl font-black tracking-tight ${stats.totalDue > 0 ? 'text-rose-600' : 'text-gray-400'}`}>Rs. <CountUpNumber value={stats.totalDue} /></h4>
          <span className={`text-[10px] font-bold uppercase mt-1 block ${stats.totalDue > 0 ? 'text-rose-500' : 'text-gray-400'}`}>
            {stats.totalDue > 0 ? '🔴 Pending Owed Debt' : '✅ No Pending Debt'}
          </span>
        </div>

        {/* Card 4: Grand Total Purchase Cost */}
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
              {timeframe === 'DAY' ? 'Today Cost' : timeframe === 'MONTH' ? 'Month Cost' : timeframe === 'YEAR' ? 'Year Cost' : 'Total Investment'}
            </span>
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            </div>
          </div>
          <h4 className="text-xl sm:text-2xl font-black text-blue-700 tracking-tight">Rs. <CountUpNumber value={stats.totalPurchasesCost} /></h4>
          <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 block">Total Purchase Value</span>
        </div>
      </div>


      {/* ─── LOW STOCK ALERT SECTION ─── */}
      {(() => {
        const lowStockItems = products.filter(p => (Number(p.stock) || 0) <= 50 && p.name);
        if (lowStockItems.length === 0) return null;
        return (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-black text-rose-700 uppercase tracking-widest">Low Stock Alert — {lowStockItems.length} Product(s) Running Low</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(p => (
                <div key={p._id} className="flex items-center gap-2 bg-white border border-rose-200 rounded-xl px-3 py-1.5 shadow-sm">
                  <span className="text-xs font-black text-gray-900 uppercase">{p.name}</span>
                  <span className="text-[10px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-lg">
                    Stock: {p.stock}
                  </span>
                  {p.supplierName && <span className="text-[10px] text-gray-400 font-bold">{p.supplierName}</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })()}


      {/* Search Control */}
      <div className="bg-white p-3.5 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-2">
        <div className="flex items-center gap-2 bg-zinc-100 px-3.5 py-2 rounded-xl w-full">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Supplier, Farm, or Product name..."
            className="bg-transparent text-xs font-bold outline-none w-full text-zinc-800 placeholder:text-zinc-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-[10px] font-black text-zinc-400 hover:text-zinc-600 uppercase"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Purchases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {purchaseItems.map((item) => {
          const itemPetis = item.petiQuantity || (item.stock ? (item.stock / 360).toFixed(1) : 0);
          const itemTrays = item.trayQuantity || (item.stock ? Math.round(item.stock / 30) : 0);
          const itemEggs = item.stock || 0;
          const pMethod = String(item.paymentMethod || 'Cash').trim();
          
          const unitCost = Number(item.costPrice) > 0 ? Number(item.costPrice) : Number(item.price || 0);
          const unitDivisor = item.unitType === 'egg' ? 1 : item.unitType === 'tray' ? 30 : 360;
          const costVal = Number(item.totalPurchaseCost) > 0
            ? Number(item.totalPurchaseCost)
            : (itemPetis > 0 ? itemPetis * unitCost : (Number(item.stock || 0) * (unitCost / unitDivisor)));
          
          const isCreditMethod = pMethod.toLowerCase().includes('credit') || pMethod.toLowerCase().includes('due') || pMethod.toLowerCase().includes('qaraz') || pMethod.toLowerCase().includes('partial');
          const hasExplicitDue = item.dueAmountToSupplier !== undefined && item.dueAmountToSupplier !== null && Number(item.dueAmountToSupplier) > 0;
          
          let dueBalanceAmount = 0;
          let paidAmount = 0;

          if (hasExplicitDue || isCreditMethod) {
            const rawDue = hasExplicitDue ? Number(item.dueAmountToSupplier) : costVal;
            dueBalanceAmount = Math.min(costVal, Math.max(0, rawDue));
            paidAmount = Math.max(0, costVal - dueBalanceAmount);
          } else {
            paidAmount = costVal;
            dueBalanceAmount = 0;
          }

          const hasDue = dueBalanceAmount > 0;

          return (
            <div
              key={item._id}
              className="bg-white border-2 border-gray-200 hover:border-teal-500 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                {/* Header: Product Name & Category & Status Badge */}
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-gray-900 text-sm tracking-tight uppercase truncate">{item.name}</h4>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">
                      Supplier: <span className="text-gray-800 font-black">{item.supplierName || 'Farm Supplier'}</span>
                      {item.supplierPhone && <span className="text-teal-700 font-bold ml-1">📞 {item.supplierPhone}</span>}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                    hasDue
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {hasDue ? '⚠️ Qaraz' : '✓ Cash'}
                  </span>
                </div>

                {/* Stock Quantity Badge */}
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Available Stock:</span>
                  <span className="font-black text-amber-700">
                    📦 {itemPetis} Petis <span className="text-gray-400 font-medium">({itemTrays} Trays • {Number(itemEggs).toLocaleString()} Eggs)</span>
                  </span>
                </div>

                {/* Price & Cost Breakdown */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase block">Buy Cost:</span>
                    <span className="font-black text-gray-900 text-xs">Rs. {fmt(item.costPrice || 0)}</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2">
                    <span className="text-[9px] font-black text-emerald-600 uppercase block">Sell Retail:</span>
                    <span className="font-black text-emerald-700 text-xs">Rs. {fmt(item.price || 0)}</span>
                  </div>
                </div>

                {/* Payment Breakdown (Cash Paid vs Qaraz) */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2">
                    <span className="text-[9px] font-black text-emerald-700 uppercase block">💵 Cash Paid:</span>
                    <span className="font-black text-emerald-700 text-xs">Rs. {fmt(paidAmount)}</span>
                  </div>
                  <div className={`rounded-xl p-2 border ${hasDue ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'}`}>
                    <span className={`text-[9px] font-black uppercase block ${hasDue ? 'text-rose-600' : 'text-gray-400'}`}>⚠️ Qaraz (Due):</span>
                    <span className={`font-black text-xs ${hasDue ? 'text-rose-600' : 'text-gray-400'}`}>Rs. {fmt(dueBalanceAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer: View, Edit, Delete */}
              <div className="pt-2.5 border-t border-gray-100 grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onViewProduct ? onViewProduct(item) : (onEditProduct && onEditProduct(item))}
                  className="py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
                  title="View Details"
                >
                  <Eye className="w-3 h-3 text-gray-600" />
                  <span>View</span>
                </button>

                <button
                  type="button"
                  onClick={() => onEditProduct && onEditProduct(item)}
                  className="py-1.5 px-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                  title="Edit Product"
                >
                  <Edit2 className="w-3 h-3 text-white" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteClick(item)}
                  className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
                  title="Delete Product"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Right Action Bar: Single Export & Print Dropdown Menu */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 bg-white p-4 rounded-2xl shadow-sm">
        <div className="text-xs text-slate-500 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          <span>Filter Active: <strong className="text-slate-800 uppercase">{timeframe}</strong> ({purchaseItems.length} Products)</span>
        </div>

        <div className="relative ml-auto">
          <button
            onClick={() => setReportMenuOpen(!reportMenuOpen)}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-emerald-500"
            title="Print, WhatsApp & Export Purchases"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export &amp; Print</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${reportMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {reportMenuOpen && (
            <div
              className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 border border-slate-700 text-white rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
              onMouseLeave={() => setReportMenuOpen(false)}
            >
              <button
                onClick={() => { handlePrintPurchasesReport(); setReportMenuOpen(false); }}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-black text-left flex items-center gap-2 hover:bg-white/10 text-emerald-300 transition-all cursor-pointer"
              >
                <Truck className="w-4 h-4 text-emerald-400" /> Print Purchases Report
              </button>

              <button
                onClick={() => { handleWhatsAppPurchasesShare(); setReportMenuOpen(false); }}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-black text-left flex items-center gap-2 hover:bg-white/10 text-teal-300 transition-all cursor-pointer"
              >
                <Truck className="w-4 h-4 text-teal-400" /> WhatsApp PDF Report
              </button>

              <button
                onClick={() => { handleExportPurchasesExcel(); setReportMenuOpen(false); }}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-black text-left flex items-center gap-2 hover:bg-white/10 text-green-300 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-400" /> Export Excel (.csv)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="relative max-w-lg w-full bg-zinc-900 border border-zinc-700 rounded-3xl p-4 text-white shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-black uppercase text-teal-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Supplier Payment Screenshot / Receipt
                </span>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-hidden rounded-2xl border border-zinc-800 bg-black flex items-center justify-center">
                <img src={selectedReceipt} alt="Supplier Receipt" className="w-full h-full object-contain max-h-[65vh]" />
              </div>

              <div className="flex justify-between items-center pt-2">
                <a
                  href={selectedReceipt}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-black text-teal-400 underline hover:text-teal-300"
                >
                  Open Original Image in New Tab
                </a>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
      {/* Local Delete Confirmation Modal */}
      {localDeleteDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-gray-900 uppercase">Delete Product?</h3>
              <p className="text-xs text-gray-500 font-bold">
                Are you sure you want to delete <strong className="text-gray-900">{localDeleteDialog.item?.name}</strong> from stock?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLocalDeleteDialog({ isOpen: false, item: null, isDeleting: false })}
                disabled={localDeleteDialog.isDeleting}
                className="py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-black text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLocalDelete}
                disabled={localDeleteDialog.isDeleting}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {localDeleteDialog.isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
