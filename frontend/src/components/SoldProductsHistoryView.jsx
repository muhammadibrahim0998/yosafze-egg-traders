import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  History,
  Calendar,
  Printer,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ArrowUpDown,
  Send,
  Package,
  CreditCard,
  User,
  Phone,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  Eye,
  Clock,
  Sparkles,
  ImageIcon,
  Trash2
} from 'lucide-react';
import { getImageUrl } from '../utils/imageHelper.js';

export default function SoldProductsHistoryView({
  shopId = '1',
  shop = null,
  currency = 'Rs.',
  unifiedSalesList = [],
  shopSalesList = [],
  catalogItems = [],
  onDeleteSale = null,
  onRefresh = null,
  setActiveView = () => {},
  isAdminUser = true
}) {
  // Default to 'ALL' so sold products stay visible continuously until explicitly deleted by shop admin
  const [timeframe, setTimeframe] = useState('ALL'); // 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' | 'AMOUNT_HIGH' | 'QTY_HIGH'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState(null);

  const shopName = shop?.name || `Branch #${shopId}`;
  const shopAddress = shop?.address || 'Karkhano Market, Peshawar';
  const shopPhone = shop?.phone || '03098216202';

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayLocalStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  // ─── Timezone-safe Date Parser ───
  const parseRecordDate = (raw) => {
    if (!raw) return null;
    if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
    if (typeof raw === 'number') {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      if (trimmed.includes(' ') && !trimmed.includes('T')) {
        const d = new Date(trimmed.replace(' ', 'T'));
        if (!isNaN(d.getTime())) return d;
      }
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  const formatRecordDateTime = (raw) => {
    const d = parseRecordDate(raw) || new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[d.getMonth()] || 'Nov';
    const year = d.getFullYear();
    const dateFormatted = `${day}-${month}-${year}`;

    let timeFormatted = '';
    try {
      timeFormatted = d.toLocaleTimeString('en-PK', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (_) {
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      timeFormatted = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }

    return {
      date: dateFormatted,
      time: timeFormatted,
      full: `${dateFormatted}, ${timeFormatted}`
    };
  };

  // ─── Product Image Resolver Helper ───
  const resolveProductImage = (prodName, prodId, directImage) => {
    if (directImage) {
      const url = getImageUrl(directImage);
      if (url && url !== '/egg2.png') return url;
    }

    if (Array.isArray(catalogItems) && catalogItems.length > 0) {
      // 1. By ID match
      if (prodId) {
        const byId = catalogItems.find(c => String(c._id || c.id) === String(prodId));
        if (byId) {
          const img = (byId.images && byId.images.length > 0 && byId.images[0]) || byId.image;
          if (img) return getImageUrl(img);
        }
      }

      // 2. Clean product name (remove "(1 Peti • 12 Trays • 360 Eggs)")
      const cleanName = String(prodName || '')
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .trim()
        .toLowerCase();

      if (cleanName) {
        const exact = catalogItems.find(c => c.name && c.name.trim().toLowerCase() === cleanName);
        if (exact) {
          const img = (exact.images && exact.images.length > 0 && exact.images[0]) || exact.image;
          if (img) return getImageUrl(img);
        }

        const partial = catalogItems.find(c => {
          if (!c.name) return false;
          const cn = c.name.trim().toLowerCase();
          return cleanName.includes(cn) || cn.includes(cleanName);
        });
        if (partial) {
          const img = (partial.images && partial.images.length > 0 && partial.images[0]) || partial.image;
          if (img) return getImageUrl(img);
        }
      }
    }

    if (directImage) return getImageUrl(directImage);
    return '/egg2.png';
  };

  // ─── Universal Sold Item Extractor ───
  const allSoldItems = useMemo(() => {
    const list = (unifiedSalesList && unifiedSalesList.length > 0 ? unifiedSalesList : shopSalesList) || [];
    const extracted = [];

    list.forEach((sale, saleIdx) => {
      const saleDateRaw = sale.saleDate || sale.date || sale.createdAt || sale.created_at || sale.timestamp || sale.invoiceDate;
      const inv = sale.invoiceNumber || sale.serialNumber || `INV-${saleIdx + 1}`;
      const cust = sale.customerName || 'Walk-in Customer';
      const phone = sale.customerPhone || '';
      const payment = sale.paymentMethod || 'CASH';

      let saleItems = Array.isArray(sale.items) ? sale.items : [];
      if (typeof sale.items === 'string' && sale.items.trim()) {
        try { saleItems = JSON.parse(sale.items); } catch(e) { saleItems = []; }
      }

      if (saleItems && saleItems.length > 0) {
        saleItems.forEach((itm, itmIdx) => {
          const prodName = itm.name || itm.title || itm.productName || sale.productName || 'Egg Stock';
          const cat = itm.category || sale.category || 'Eggs';
          const qty = Number(itm.quantity || itm.qty || 1);
          const unitType = String(itm.unitType || itm.unit || 'peti').toLowerCase();

          let petis = 0;
          let eggs = 0;
          if (unitType === 'peti' || unitType === 'petis') {
            petis = qty;
            eggs = Number(itm.totalEggs || (qty * 360));
          } else if (unitType === 'egg' || unitType === 'eggs' || unitType === 'piece') {
            eggs = qty;
            petis = Number((qty / 360).toFixed(2));
          } else {
            petis = Number(itm.petis || (qty / 360).toFixed(2));
            eggs = Number(itm.totalEggs || qty);
          }

          const price = Number(itm.price || itm.unitPrice || itm.rate || 0);
          const total = Number(itm.total || itm.totalAmount || (price * qty) || 0);
          const resolvedImg = resolveProductImage(
            itm.rawProductName || prodName,
            itm.productId || sale.productId,
            itm.image || sale.productImage
          );

          extracted.push({
            id: `${sale._id || saleIdx}-${itmIdx}`,
            saleId: sale._id,
            invoiceNumber: inv,
            customerName: cust,
            customerPhone: phone,
            paymentMethod: payment,
            dateRaw: saleDateRaw,
            productName: prodName,
            category: cat,
            image: resolvedImg,
            quantity: qty,
            unitType: unitType,
            petis: petis,
            eggs: eggs,
            unitPrice: price,
            totalAmount: total,
            costPrice: Number(itm.costPrice || 0)
          });
        });
      } else {
        // Direct sale record without items array
        const prodName = sale.productName || sale.itemName || sale.title || 'Eggs Stock';
        const cat = sale.category || 'Eggs';
        const petis = Number(sale.petisBought || (Number(sale.eggsBought || 0) / 360).toFixed(2) || 0);
        const eggs = Number(sale.eggsBought || (petis * 360) || 0);
        const total = Number(sale.totalAmount || 0);
        const price = petis > 0 ? (total / petis) : (eggs > 0 ? (total / eggs) : total);
        const resolvedImg = resolveProductImage(
          prodName,
          sale.productId,
          sale.productImage || sale.image
        );

        extracted.push({
          id: `${sale._id || saleIdx}-0`,
          saleId: sale._id,
          invoiceNumber: inv,
          customerName: cust,
          customerPhone: phone,
          paymentMethod: payment,
          dateRaw: saleDateRaw,
          productName: prodName,
          category: cat,
          image: resolvedImg,
          quantity: petis > 0 ? petis : (eggs > 0 ? eggs : 1),
          unitType: petis > 0 ? 'peti' : 'egg',
          petis: petis,
          eggs: eggs,
          unitPrice: price,
          totalAmount: total,
          costPrice: 0
        });
      }
    });

    return extracted;
  }, [unifiedSalesList, shopSalesList]);

  // ─── Timeframe & Date Filter Matcher ───
  const filteredSoldItems = useMemo(() => {
    return allSoldItems.filter(item => {
      const d = parseRecordDate(item.dateRaw);
      if (!d) return false;

      // 1. Timeframe Filter
      if (timeframe === 'TODAY') {
        const itemDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const isClientToday = d.toDateString() === now.toDateString() || itemDateStr === todayLocalStr;
        const dUtc = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
        const nowUtc = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
        if (!isClientToday && dUtc !== nowUtc) return false;
      } else if (timeframe === 'YESTERDAY') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
        const itemDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        if (itemDateStr !== yStr && d.toDateString() !== yesterday.toDateString()) return false;
      } else if (timeframe === 'WEEK') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (d < sevenDaysAgo) return false;
      } else if (timeframe === 'MONTH') {
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      } else if (timeframe === 'CUSTOM') {
        if (customStartDate) {
          const startD = new Date(`${customStartDate}T00:00:00`);
          if (d < startD) return false;
        }
        if (customEndDate) {
          const endD = new Date(`${customEndDate}T23:59:59`);
          if (d > endD) return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inProd = item.productName.toLowerCase().includes(q);
        const inCat = item.category.toLowerCase().includes(q);
        const inInv = item.invoiceNumber.toLowerCase().includes(q);
        const inCust = item.customerName.toLowerCase().includes(q);
        if (!inProd && !inCat && !inInv && !inCust) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'AMOUNT_HIGH') {
        return b.totalAmount - a.totalAmount;
      }
      if (sortBy === 'QTY_HIGH') {
        return (b.petis || b.quantity) - (a.petis || a.quantity);
      }
      // Default: NEWEST
      const da = parseRecordDate(a.dateRaw)?.getTime() || 0;
      const db = parseRecordDate(b.dateRaw)?.getTime() || 0;
      return db - da;
    });
  }, [allSoldItems, timeframe, customStartDate, customEndDate, selectedCategory, searchQuery, sortBy, todayLocalStr, now]);

  // ─── Available Categories List ───
  const availableCategories = useMemo(() => {
    const set = new Set();
    allSoldItems.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [allSoldItems]);

  // ─── Aggregated Metrics ───
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalPetis = 0;
    let totalEggs = 0;
    let totalItemsCount = filteredSoldItems.length;

    filteredSoldItems.forEach(i => {
      totalRevenue += i.totalAmount;
      totalPetis += Number(i.petis || 0);
      totalEggs += Number(i.eggs || 0);
    });

    return {
      totalRevenue,
      totalPetis: Number(totalPetis.toFixed(2)),
      totalEggs,
      totalItemsCount
    };
  }, [filteredSoldItems]);

  // ─── Product-wise Grouped Summary ───
  const productWiseSummary = useMemo(() => {
    const groups = {};

    filteredSoldItems.forEach(i => {
      const key = `${i.productName}__${i.category}`;
      if (!groups[key]) {
        groups[key] = {
          productName: i.productName,
          category: i.category,
          image: i.image || '/egg2.png',
          totalPetis: 0,
          totalEggs: 0,
          totalRevenue: 0,
          salesCount: 0,
          prices: []
        };
      }
      if ((!groups[key].image || groups[key].image === '/egg2.png') && (i.image && i.image !== '/egg2.png')) {
        groups[key].image = i.image;
      }
      groups[key].totalPetis += Number(i.petis || 0);
      groups[key].totalEggs += Number(i.eggs || 0);
      groups[key].totalRevenue += Number(i.totalAmount || 0);
      groups[key].salesCount += 1;
      if (i.unitPrice > 0) groups[key].prices.push(i.unitPrice);
    });

    return Object.values(groups).map(g => {
      const avgPrice = g.prices.length > 0 ? (g.prices.reduce((a, b) => a + b, 0) / g.prices.length) : (g.totalPetis > 0 ? g.totalRevenue / g.totalPetis : 0);
      return {
        ...g,
        totalPetis: Number(g.totalPetis.toFixed(2)),
        avgPrice: Math.round(avgPrice)
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredSoldItems]);

  // ─── Category-wise Grouped Summary ───
  const categoryWiseSummary = useMemo(() => {
    const groups = {};

    filteredSoldItems.forEach(i => {
      const cat = i.category || 'Eggs';
      if (!groups[cat]) {
        groups[cat] = {
          name: cat,
          totalRevenue: 0,
          totalPetis: 0,
          totalEggs: 0,
          count: 0
        };
      }
      groups[cat].totalRevenue += i.totalAmount;
      groups[cat].totalPetis += Number(i.petis || 0);
      groups[cat].totalEggs += Number(i.eggs || 0);
      groups[cat].count += 1;
    });

    return Object.values(groups).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredSoldItems]);

  // ─── Cumulative Preserved Metrics (Total records kept until deleted by shop admin) ───
  const cumulativePreservedMetrics = useMemo(() => {
    let totalRevenue = 0;
    let totalPetis = 0;
    let totalEggs = 0;
    let totalCount = allSoldItems.length;

    allSoldItems.forEach(i => {
      totalRevenue += Number(i.totalAmount || 0);
      totalPetis += Number(i.petis || 0);
      totalEggs += Number(i.eggs || 0);
    });

    return {
      totalRevenue,
      totalPetis: Number(totalPetis.toFixed(2)),
      totalEggs,
      totalCount
    };
  }, [allSoldItems]);

  // ─── Permanent Delete Handler for Individual Sold Records ───
  const handleDeleteItem = async (item) => {
    if (!item?.saleId) {
      alert('Sale record ID not found');
      return;
    }

    if (onDeleteSale) {
      setDeletingSaleId(item.saleId);
      try {
        await onDeleteSale(item.saleId);
      } finally {
        setDeletingSaleId(null);
      }
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete this sold product record (${item.productName} - ${item.invoiceNumber})? This cannot be undone.`)) {
      return;
    }

    setDeletingSaleId(item.saleId);
    try {
      const token = localStorage.getItem('nexflow_token') || sessionStorage.getItem('nexflow_token');
      const res = await fetch(`/api/sales/${item.saleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-user-role': 'shop_admin'
        }
      });
      if (res.ok) {
        if (onRefresh) await onRefresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Failed to delete sale record');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting sale record');
    } finally {
      setDeletingSaleId(null);
    }
  };

  // ─── Trigger Refresh ───
  const handleTriggerRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // ─── Print Sold Stock Report ───
  const handlePrintReport = () => {
    const printWin = window.open('', '_blank', 'width=1100,height=800');
    if (!printWin) {
      alert('Please allow popups to print.');
      return;
    }

    const fmtNum = (n) => Number(n || 0).toLocaleString('en-PK');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sold Stock History - ${shopName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 4mm 6mm 4mm 6mm;
            }
            @media print {
              html, body {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                zoom: 82% !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
              color: #0f172a;
              background: #fff;
              font-size: 8px;
              line-height: 1.2;
              margin: 0;
              padding: 0;
            }
            .header-banner {
              text-align: center;
              padding-bottom: 3px;
              border-bottom: 2px double #334155;
              margin-bottom: 4px;
            }
            .org-title {
              font-size: 15px;
              font-weight: 900;
              text-transform: uppercase;
              margin: 0;
            }
            .branch-title {
              font-size: 9.5px;
              font-weight: 800;
              color: #475569;
              margin: 1px 0;
            }
            .doc-tag {
              display: inline-block;
              background: #0f172a;
              color: #fff;
              font-size: 7.5px;
              font-weight: 800;
              padding: 1.5px 8px;
              border-radius: 2px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .meta-bar {
              display: flex;
              justify-content: space-between;
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 2.5px 6px;
              border-radius: 3px;
              margin-bottom: 4px;
              font-size: 7.5px;
              font-weight: 700;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 4px;
              margin-bottom: 5px;
            }
            .kpi-box {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              padding: 3px 5px;
              text-align: center;
            }
            .kpi-lbl {
              font-size: 7px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
            }
            .kpi-val {
              font-size: 11px;
              font-weight: 900;
              color: #047857;
              margin-top: 1px;
            }
            .section-title {
              font-size: 8px;
              font-weight: 900;
              text-transform: uppercase;
              color: #0f172a;
              background: #e2e8f0;
              border-left: 3px solid #0f172a;
              border-top: 1px solid #cbd5e1;
              border-right: 1px solid #cbd5e1;
              border-bottom: 1px solid #cbd5e1;
              padding: 2.5px 5px;
              margin-top: 4px;
              margin-bottom: 0;
              display: flex;
              justify-content: space-between;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 0px;
              font-size: 7px;
              border: 1px solid #94a3b8;
            }
            th {
              background: #f1f5f9;
              color: #1e293b;
              font-weight: 800;
              text-transform: uppercase;
              font-size: 6.5px;
              padding: 2px 3px;
              border: 1px solid #94a3b8;
              text-align: left;
            }
            td {
              padding: 1.5px 3px;
              border: 1px solid #94a3b8;
              vertical-align: middle;
            }
            tr:nth-child(even) td {
              background: #f8fafc;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .footer-note {
              margin-top: 6px;
              text-align: center;
              font-size: 6.5px;
              color: #64748b;
              border-top: 1px solid #e2e8f0;
              padding-top: 2px;
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <h1 class="org-title">Yousafzai Agri Foods &amp; Traders</h1>
            <div class="branch-title">${shopName} • ${shopAddress}</div>
            <div class="doc-tag">TOTAL SOLD STOCK &amp; PRODUCT OUTFLOW STATEMENT</div>
          </div>

          <div class="meta-bar">
            <span><strong>TIMEFRAME:</strong> ${timeframe}</span>
            <span><strong>PRINTED AT:</strong> ${now.toLocaleString('en-PK')}</span>
            <span><strong>BRANCH CONTACT:</strong> ${shopPhone}</span>
            <span><strong>TOTAL RECORDS:</strong> ${filteredSoldItems.length}</span>
          </div>

          <div class="kpi-grid">
            <div class="kpi-box">
              <div class="kpi-lbl">Total Sold Revenue</div>
              <div class="kpi-val">${currency} ${fmtNum(metrics.totalRevenue)}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-lbl">Total Petis Sold</div>
              <div class="kpi-val" style="color:#0f172a;">${fmtNum(metrics.totalPetis)} Petis</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-lbl">Total Eggs Sold</div>
              <div class="kpi-val" style="color:#0f172a;">${fmtNum(metrics.totalEggs)} Eggs</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-lbl">Unique Products Sold</div>
              <div class="kpi-val" style="color:#2563eb;">${productWiseSummary.length} Products</div>
            </div>
          </div>

          <!-- Product-Wise Summary Table -->
          <div class="section-title">
            <span>Product-Wise Sold Summary (${productWiseSummary.length} Products)</span>
            <span>Total Value: ${currency} ${fmtNum(metrics.totalRevenue)}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:20px;">#</th>
                <th>Product Name</th>
                <th style="width:65px;">Category</th>
                <th class="text-right" style="width:55px;">Petis Sold</th>
                <th class="text-right" style="width:55px;">Eggs Sold</th>
                <th class="text-right" style="width:60px;">Avg Rate</th>
                <th class="text-right" style="width:75px;">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${productWiseSummary.map((p, idx) => `
                <tr>
                  <td class="text-center font-bold">${idx + 1}</td>
                  <td class="font-bold">
                    <div style="display:flex; align-items:center; gap:5px;">
                      <img src="${p.image || '/egg2.png'}" style="width:15px; height:15px; border-radius:3px; object-fit:cover; border:1px solid #cbd5e1; flex-shrink:0;" onerror="this.onerror=null; this.src='/egg2.png';" />
                      <span>${p.productName}</span>
                    </div>
                  </td>
                  <td>${p.category}</td>
                  <td class="text-right font-bold">${fmtNum(p.totalPetis)} P</td>
                  <td class="text-right">${fmtNum(p.totalEggs)} Eggs</td>
                  <td class="text-right">${currency} ${fmtNum(p.avgPrice)}</td>
                  <td class="text-right font-black" style="color:#047857;">${currency} ${fmtNum(p.totalRevenue)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Detailed Itemized Table -->
          <div class="section-title" style="margin-top:6px;">
            <span>Detailed Sold Stock Outflow Log (${filteredSoldItems.length} Sales Lines)</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:20px;">#</th>
                <th style="width:65px;">Invoice #</th>
                <th style="width:75px;">Date &amp; Time</th>
                <th>Product Name</th>
                <th style="width:55px;">Category</th>
                <th>Customer</th>
                <th class="text-right" style="width:60px;">Quantity</th>
                <th class="text-right" style="width:55px;">Unit Price</th>
                <th class="text-right" style="width:65px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSoldItems.map((item, idx) => {
                const dt = formatRecordDateTime(item.dateRaw);
                return `
                  <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td class="font-bold">${item.invoiceNumber}</td>
                    <td style="white-space:nowrap;">${dt.date} ${dt.time}</td>
                    <td class="font-bold">
                      <div style="display:flex; align-items:center; gap:5px;">
                        <img src="${item.image || '/egg2.png'}" style="width:15px; height:15px; border-radius:3px; object-fit:cover; border:1px solid #cbd5e1; flex-shrink:0;" onerror="this.onerror=null; this.src='/egg2.png';" />
                        <span>${item.productName}</span>
                      </div>
                    </td>
                    <td>${item.category}</td>
                    <td>${item.customerName}</td>
                    <td class="text-right font-bold">${item.petis > 0 ? `${item.petis} P` : `${item.quantity} ${item.unitType}`}</td>
                    <td class="text-right">${item.unitPrice > 0 ? `${currency} ${fmtNum(item.unitPrice)}` : '—'}</td>
                    <td class="text-right font-black" style="color:#047857;">${currency} ${fmtNum(item.totalAmount)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer-note">
            Official Sold Product History Statement • Generated by Yousafzai Egg Traders Management Suite
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // ─── Export CSV ───
  const handleExportCSV = () => {
    let csv = `SOLD PRODUCT HISTORY STATEMENT - ${now.toISOString().split('T')[0]}\n`;
    csv += `Branch,${shopName}\n`;
    csv += `Timeframe,${timeframe}\n`;
    csv += `Total Sold Revenue,${metrics.totalRevenue}\n`;
    csv += `Total Petis Sold,${metrics.totalPetis}\n`;
    csv += `Total Eggs Sold,${metrics.totalEggs}\n\n`;

    csv += `#,Invoice Number,Date & Time,Product Name,Category,Customer,Quantity,Unit Type,Petis,Eggs,Unit Price,Total Amount,Payment Mode\n`;
    filteredSoldItems.forEach((i, idx) => {
      const dt = formatRecordDateTime(i.dateRaw);
      const prod = i.productName.replace(/,/g, ' ');
      const cat = i.category.replace(/,/g, ' ');
      const cust = i.customerName.replace(/,/g, ' ');
      csv += `${idx + 1},${i.invoiceNumber},"${dt.full}",${prod},${cat},${cust},${i.quantity},${i.unitType},${i.petis},${i.eggs},${i.unitPrice},${i.totalAmount},${i.paymentMethod}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Sold_Products_History_${shopName.replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── WhatsApp Share ───
  const handleWhatsAppShare = () => {
    const fmtNum = (n) => Number(n || 0).toLocaleString('en-PK');
    let msg = `📦 *SOLD PRODUCTS & STOCK HISTORY*\n`;
    msg += `🏢 *${shopName}*\n`;
    msg += `📅 *Timeframe:* ${timeframe} (${now.toLocaleDateString('en-PK')})\n`;
    msg += `══════════════════════\n\n`;
    msg += `💰 *Total Sold Revenue:* ${currency} ${fmtNum(metrics.totalRevenue)}\n`;
    msg += `🥚 *Total Eggs Sold:* ${fmtNum(metrics.totalEggs)} Eggs (${metrics.totalPetis} Petis)\n`;
    msg += `📋 *Total Sold Lines:* ${metrics.totalItemsCount}\n\n`;

    msg += `📊 *PRODUCT BREAKDOWN:*\n`;
    productWiseSummary.forEach((p, idx) => {
      msg += `• *${p.productName}* [${p.category}]: ${p.totalPetis} Petis (${fmtNum(p.totalEggs)} Eggs) | Avg Rate: ${currency} ${fmtNum(p.avgPrice)} | Total: *${currency} ${fmtNum(p.totalRevenue)}*\n`;
    });

    msg += `\n══════════════════════\n`;
    msg += `_Generated by Yousafzai Egg Traders Management Suite_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── 1. TOP HEADER & ACTION BAR ─── */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 flex items-center justify-center text-zinc-950 shadow-md shrink-0">
            <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                ● Live Sold Inventory
              </span>
              <span className="text-xs font-black text-black">{shopName}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-black uppercase tracking-tight mt-0.5">
              Sale Product History &amp; Stock Outflow
            </h1>
            <p className="text-xs text-black font-bold">
              Complete history of sold egg stock, product categories, prices, quantities and realized sales
            </p>
          </div>
        </div>

        {/* Action Buttons - 3D Styled */}
        <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto justify-start xl:justify-end">
          <button
            type="button"
            onClick={handlePrintReport}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border-t-2 border-t-emerald-300/50 border-x border-emerald-600 border-b-4 border-b-emerald-950 shadow-[0_4px_12px_rgba(5,150,105,0.35)] active:translate-y-1 active:border-b-2 hover:shadow-lg transition-all cursor-pointer"
            title="Print Sold Products Report"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="px-3.5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-t-2 border-t-green-300/50 border-x border-green-600 border-b-4 border-b-green-950 shadow-[0_4px_12px_rgba(22,163,74,0.35)] active:translate-y-1 active:border-b-2 hover:shadow-lg transition-all cursor-pointer"
            title="Share Sold Products on WhatsApp"
          >
            <Send className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-gradient-to-b from-white to-slate-100 hover:bg-slate-50 text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-t-2 border-t-white border-x border-slate-300 border-b-4 border-b-slate-400 shadow-[0_4px_10px_rgba(0,0,0,0.12)] active:translate-y-1 active:border-b-2 hover:shadow-md transition-all cursor-pointer"
            title="Export CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-gradient-to-b from-white to-slate-100 hover:bg-slate-50 text-slate-900 rounded-xl border-t-2 border-t-white border-x border-slate-300 border-b-4 border-b-slate-400 shadow-[0_4px_10px_rgba(0,0,0,0.12)] active:translate-y-1 active:border-b-2 hover:shadow-md transition-all cursor-pointer"
            title="Refresh Sold Products Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── CUMULATIVE PRESERVED RECORD BANNER (PURE 3D GRAY THEME - NO BLACK / NO DARK) ─── */}
      <div className="bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 rounded-3xl p-5 border-t-2 border-t-white border-x-2 border-x-slate-300 border-b-4 border-b-slate-400 shadow-[0_8px_20px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle 3D glossy highlight sweep */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl"></div>

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="p-3 bg-gradient-to-b from-white to-slate-100 text-slate-800 rounded-2xl border-t border-t-white border-x border-slate-300 border-b-2 border-b-slate-400 shrink-0 shadow-md">
            <Package className="w-6 h-6 stroke-[2.5] text-slate-800" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black tracking-wide text-black uppercase">
                Cumulative Preserved Sold Stock Record
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-900 text-white shadow-xs">
                ● Persistent Until Deleted
              </span>
            </div>
            <p className="text-xs text-black font-bold mt-0.5">
              Continuous live history of all sold products and egg stock, persistently preserved until deleted by Shop Admin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap bg-gradient-to-b from-white to-slate-50 px-4 py-2.5 rounded-2xl border-t border-t-white border-x border-slate-300 border-b-2 border-b-slate-400 w-full xl:w-auto justify-between sm:justify-start shadow-sm relative z-10">
          <div className="text-center">
            <div className="text-[10px] uppercase font-black text-black">Total Petis Sold</div>
            <div className="text-sm sm:text-base font-black text-black">{cumulativePreservedMetrics.totalPetis} P</div>
          </div>
          <div className="w-px h-8 bg-slate-300 hidden sm:block"></div>
          <div className="text-center">
            <div className="text-[10px] uppercase font-black text-black">Total Eggs Sold</div>
            <div className="text-sm sm:text-base font-black text-black">{cumulativePreservedMetrics.totalEggs.toLocaleString('en-PK')} Eggs</div>
          </div>
          <div className="w-px h-8 bg-slate-300 hidden sm:block"></div>
          <div className="text-center">
            <div className="text-[10px] uppercase font-black text-black">Total Sold Records</div>
            <div className="text-sm sm:text-base font-black text-black">{cumulativePreservedMetrics.totalCount} Bills</div>
          </div>
          <div className="w-px h-8 bg-slate-300 hidden sm:block"></div>
          <div className="text-center">
            <div className="text-[10px] uppercase font-black text-black">Total Value (Rupees)</div>
            <div className="text-sm sm:text-base font-black text-black">{currency} {cumulativePreservedMetrics.totalRevenue.toLocaleString('en-PK')}</div>
          </div>
        </div>
      </div>

      {/* ─── 2. AGGREGATED METRICS CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white border-2 border-emerald-400 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-800">
              Total Sold Revenue
            </span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </span>
          </div>
          <div className="text-xl sm:text-3xl font-black text-slate-900 mt-2">
            {currency} {metrics.totalRevenue.toLocaleString('en-PK')}
          </div>
          <div className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center justify-between">
            <span>{metrics.totalItemsCount} Total Sales Lines</span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-300 font-black">Gross Sales</span>
          </div>
        </div>

        {/* Metric 2: Total Petis Sold */}
        <div className="bg-white border-2 border-amber-400 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-800">
              Total Petis Sold
            </span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Package className="w-4 h-4 stroke-[2.5]" />
            </span>
          </div>
          <div className="text-xl sm:text-3xl font-black text-slate-900 mt-2">
            {metrics.totalPetis.toLocaleString('en-PK')} <span className="text-sm font-black text-slate-500">Petis</span>
          </div>
          <div className="text-[11px] font-bold text-amber-700 mt-1 flex items-center justify-between">
            <span>Stock Outflow</span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-50 border border-amber-300 font-black">360 Eggs / P</span>
          </div>
        </div>

        {/* Metric 3: Total Eggs Sold */}
        <div className="bg-white border-2 border-yellow-400 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-900">
              Total Eggs Sold
            </span>
            <span className="p-2 rounded-xl bg-yellow-100 text-amber-900">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
            </span>
          </div>
          <div className="text-xl sm:text-3xl font-black text-slate-900 mt-2">
            {metrics.totalEggs.toLocaleString('en-PK')} <span className="text-sm font-black text-slate-500">Eggs</span>
          </div>
          <div className="text-[11px] font-bold text-amber-700 mt-1 flex items-center justify-between">
            <span>Cumulative Individual Count</span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-yellow-50 border border-yellow-300 font-black">All Types</span>
          </div>
        </div>

        {/* Metric 4: Unique Products Sold */}
        <div className="bg-white border-2 border-slate-300 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-700">
              Active Products Sold
            </span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Layers className="w-4 h-4 stroke-[2.5]" />
            </span>
          </div>
          <div className="text-xl sm:text-3xl font-black text-slate-900 mt-2">
            {productWiseSummary.length} <span className="text-sm font-black text-slate-500">Products</span>
          </div>
          <div className="text-[11px] font-bold text-slate-600 mt-1 flex items-center justify-between">
            <span>Across {categoryWiseSummary.length} Categories</span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-black">Catalog Mix</span>
          </div>
        </div>
      </div>

      {/* ─── 3. FILTER, TIMEFRAME & SEARCH CONTROLS ─── */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Timeframe Quick Buttons */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-300 gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setTimeframe('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                timeframe === 'ALL'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              ⭐ All Active Records (Until Deleted)
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('TODAY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                timeframe === 'TODAY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              📅 Today
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('YESTERDAY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                timeframe === 'YESTERDAY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('WEEK')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                timeframe === 'WEEK'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('MONTH')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                timeframe === 'MONTH'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('CUSTOM')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                timeframe === 'CUSTOM'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Custom Dates
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-500 uppercase flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border-2 border-slate-300 text-slate-800 text-xs font-black rounded-xl px-3 py-2 cursor-pointer shadow-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="NEWEST">Most Recent (Newest First)</option>
              <option value="AMOUNT_HIGH">Highest Revenue Amount</option>
              <option value="QTY_HIGH">Highest Quantity Sold</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Bar (Visible when CUSTOM is selected) */}
        {timeframe === 'CUSTOM' && (
          <div className="bg-emerald-50/50 border-2 border-emerald-300 rounded-2xl p-3 flex flex-wrap items-center gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Select Custom Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-600">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white border-2 border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-600">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white border-2 border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                className="text-xs font-black text-rose-700 hover:text-rose-900 cursor-pointer ml-auto"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}

        {/* Search & Category Pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product name, category, invoice, or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-300 text-slate-900 text-xs font-bold rounded-2xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-slate-800 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black text-slate-500 uppercase flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              All Categories
            </button>
            {availableCategories.map((cat, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 4. CATEGORY BREAKDOWN SUMMARY STRIPS ─── */}
      {categoryWiseSummary.length > 0 && (
        <div className="bg-slate-100 border-2 border-slate-300 rounded-3xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Sold Stock Category Distribution
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {categoryWiseSummary.map((cat, idx) => (
              <div key={idx} className="bg-white border border-slate-300 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {cat.name}
                  </span>
                  <div className="text-xs font-black text-slate-900 mt-1.5">
                    {cat.totalPetis} Petis ({cat.totalEggs.toLocaleString('en-PK')} Eggs)
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold">
                    {cat.count} Sales Entries
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-500 uppercase">Revenue</div>
                  <div className="text-sm font-black text-emerald-700">
                    {currency} {cat.totalRevenue.toLocaleString('en-PK')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 5. PRODUCT-WISE CONSOLIDATED PERFORMANCE TABLE ─── */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b-2 border-slate-200">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-black uppercase text-gray-900">
              Product-Wise Sold Summary &amp; Pricing ({productWiseSummary.length} Products)
            </h3>
          </div>
          <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border-2 border-emerald-300 shadow-xs">
            Total Revenue: {currency} {metrics.totalRevenue.toLocaleString('en-PK')}
          </span>
        </div>

        {productWiseSummary.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-300 bg-slate-50/60 rounded-2xl text-slate-400 font-bold text-xs uppercase tracking-wider">
            No products found matching the selected timeframe and filter.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border-2 border-slate-300 shadow-xs bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-[10px] font-black text-slate-700 uppercase tracking-wider border-b-2 border-slate-300">
                <tr>
                  <th className="p-3 text-center border border-slate-300">#</th>
                  <th className="p-3 border border-slate-300">Product Name</th>
                  <th className="p-3 text-center border border-slate-300">Category</th>
                  <th className="p-3 text-center border border-slate-300">Total Sales Entries</th>
                  <th className="p-3 text-right border border-slate-300">Quantity (Petis)</th>
                  <th className="p-3 text-right border border-slate-300">Quantity (Eggs)</th>
                  <th className="p-3 text-right border border-slate-300">Avg Selling Rate</th>
                  <th className="p-3 text-right border border-slate-300">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {productWiseSummary.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-center border border-slate-300 text-gray-400 font-bold">{idx + 1}</td>
                    <td className="p-3 border border-slate-300 font-black text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl border-2 border-slate-300 overflow-hidden bg-slate-100 shrink-0 shadow-xs flex items-center justify-center p-0.5 group/pimg relative">
                          <img
                            src={p.image || '/egg2.png'}
                            alt={p.productName}
                            onError={(e) => { e.target.onerror = null; e.target.src = '/egg2.png'; }}
                            className="w-full h-full object-cover rounded-lg group-hover/pimg:scale-110 transition-transform duration-200"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-xs sm:text-sm">{p.productName}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{p.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center border border-slate-300">
                      <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3 text-center border border-slate-300 font-bold text-slate-600">
                      {p.salesCount} Bills
                    </td>
                    <td className="p-3 border border-slate-300 text-right font-black text-amber-900">
                      {p.totalPetis} P
                    </td>
                    <td className="p-3 border border-slate-300 text-right font-bold text-slate-700">
                      {p.totalEggs.toLocaleString('en-PK')} Eggs
                    </td>
                    <td className="p-3 border border-slate-300 text-right font-bold text-blue-700">
                      {currency} {p.avgPrice.toLocaleString('en-PK')}
                    </td>
                    <td className="p-3 border border-slate-300 text-right font-black text-emerald-800 text-sm">
                      {currency} {p.totalRevenue.toLocaleString('en-PK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── 6. ITEMIZED SOLD STOCK LOG TABLE (EVERY TRANSACTION ITEM) ─── */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b-2 border-slate-200">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-black uppercase text-gray-900">
              Detailed Sold Stock Outflow Log ({filteredSoldItems.length} Sales Lines)
            </h3>
          </div>
          <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-xl border border-slate-300 shadow-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{timeframe === 'ALL' ? 'Showing all active records until deleted by Shop Admin' : `Showing records for ${timeframe}`}</span>
          </span>
        </div>

        {filteredSoldItems.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-300 bg-slate-50/60 rounded-2xl text-slate-400 font-bold text-xs uppercase tracking-wider">
            No sales records found matching the active filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border-2 border-slate-300 shadow-xs bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-[10px] font-black text-slate-700 uppercase tracking-wider border-b-2 border-slate-300">
                <tr>
                  <th className="p-3 text-center border border-slate-300">#</th>
                  <th className="p-3 border border-slate-300">Invoice #</th>
                  <th className="p-3 border border-slate-300">Date &amp; Time</th>
                  <th className="p-3 border border-slate-300">Product Name</th>
                  <th className="p-3 text-center border border-slate-300">Category</th>
                  <th className="p-3 border border-slate-300">Customer Name &amp; Contact</th>
                  <th className="p-3 text-right border border-slate-300">Quantity Sold</th>
                  <th className="p-3 text-right border border-slate-300">Unit Price / Rate</th>
                  <th className="p-3 text-right border border-slate-300">Total Amount</th>
                  <th className="p-3 text-center border border-slate-300">Payment Channel</th>
                  <th className="p-3 text-center border border-slate-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSoldItems.map((item, idx) => {
                  const dt = formatRecordDateTime(item.dateRaw);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center border border-slate-300 text-gray-400 font-bold">{idx + 1}</td>
                      <td className="p-3 border border-slate-300 font-black text-gray-900">{item.invoiceNumber}</td>
                      <td className="p-3 border border-slate-300 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">{dt.date}</div>
                        <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{dt.time}</div>
                      </td>
                      <td className="p-3 border border-slate-300">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl border-2 border-slate-300 overflow-hidden bg-slate-100 shrink-0 shadow-2xs flex items-center justify-center p-0.5 group/timg relative">
                            <img
                              src={item.image || '/egg2.png'}
                              alt={item.productName}
                              onError={(e) => { e.target.onerror = null; e.target.src = '/egg2.png'; }}
                              className="w-full h-full object-cover rounded-lg group-hover/timg:scale-110 transition-transform duration-200"
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-black text-slate-900 text-xs leading-snug">{item.productName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center border border-slate-300">
                        <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3 border border-slate-300">
                        <div className="font-bold text-slate-900 text-xs flex flex-col">
                          <span className="font-black text-slate-900">{item.customerName}</span>
                          {item.customerPhone && (
                            <span className="text-[10.5px] font-semibold text-slate-500 mt-0.5">
                              📞 {item.customerPhone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 border border-slate-300 text-right">
                        <div className="font-black text-amber-900 text-xs">
                          {item.petis > 0 ? `${item.petis} Petis` : `${item.quantity} ${item.unitType}`}
                        </div>
                        {item.eggs > 0 && (
                          <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                            ({item.eggs.toLocaleString('en-PK')} Eggs)
                          </div>
                        )}
                      </td>
                      <td className="p-3 border border-slate-300 text-right font-bold text-blue-700">
                        {item.unitPrice > 0 ? `${currency} ${item.unitPrice.toLocaleString('en-PK')}` : '—'}
                      </td>
                      <td className="p-3 border border-slate-300 text-right font-black text-emerald-800 text-sm">
                        {currency} {item.totalAmount.toLocaleString('en-PK')}
                      </td>
                      <td className="p-3 text-center border border-slate-300">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shadow-2xs ${
                          item.paymentMethod === 'CASH'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : item.paymentMethod === 'BANK' || item.paymentMethod === 'ONLINE'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {item.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-center border border-slate-300 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          disabled={deletingSaleId === item.saleId}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border-2 border-rose-200 hover:border-rose-600 rounded-xl font-black text-xs transition-all shadow-xs active:scale-95 cursor-pointer inline-flex items-center gap-1.5 group/del disabled:opacity-50"
                          title="Permanently Delete this sold record from database"
                        >
                          <Trash2 className="w-3.5 h-3.5 group-hover/del:scale-110 transition-transform" />
                          <span className="text-[11px] font-black">
                            {deletingSaleId === item.saleId ? 'Deleting...' : 'Delete'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Grand Summary Bar */}
        <div className="bg-slate-100 border-2 border-slate-300 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-700 uppercase text-[10.5px] font-black flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Filtered Outflow Summary:
            </span>
            <span className="bg-white text-emerald-800 border border-slate-300 px-3 py-1 rounded-xl shadow-xs font-black">
              📦 Petis: {metrics.totalPetis} P
            </span>
            <span className="bg-white text-amber-800 border border-slate-300 px-3 py-1 rounded-xl shadow-xs font-black">
              🥚 Eggs: {metrics.totalEggs.toLocaleString('en-PK')} Eggs
            </span>
            <span className="bg-white text-slate-800 border border-slate-300 px-3 py-1 rounded-xl shadow-xs font-black">
              📑 Bills Count: {filteredSoldItems.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-[11px] font-black uppercase">Total Sold Revenue:</span>
            <span className="bg-slate-900 text-white text-sm font-black px-4 py-1.5 rounded-xl shadow-xs">
              {currency} {metrics.totalRevenue.toLocaleString('en-PK')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

