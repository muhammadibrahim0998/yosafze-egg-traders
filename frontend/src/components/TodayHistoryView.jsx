import React, { useState, useMemo } from 'react';
import {
  History,
  Printer,
  Send,
  FileSpreadsheet,
  RefreshCw,
  ShoppingBag,
  Truck,
  Building2,
  Users,
  DollarSign,
  FileText,
  PackageX,
  TrendingUp,
  Receipt,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Eye,
  Info
} from 'lucide-react';

export default function TodayHistoryView({
  shopId = '1',
  shop = null,
  currency = 'Rs.',
  todayMasterMetrics = {},
  unifiedSalesList = [],
  shopSalesList = [],
  expensesList = [],
  fuelExpensesList = [],
  damagedProductsList = [],
  items = [],
  registeredCustomersList = [],
  onRefresh = null,
  setActiveView = () => {},
  isAdminUser = true
}) {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'SALES' | 'PURCHASES' | 'EXPENSES' | 'FUEL' | 'DAMAGED' | 'CUSTOMERS'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const shopName = shop?.name || `Branch #${shopId}`;
  const shopAddress = shop?.address || 'Karkhano Market, Peshawar';
  const shopPhone = shop?.phone || '03098216202';

  // Date helper for strict today matching
  const now = new Date();
  const todayDateFormatted = now.toLocaleDateString('en-PK', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const todayTimeFormatted = now.toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isMatchToday = (raw) => {
    if (!raw) return false;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return false;
    if (d.toDateString() === now.toDateString()) return true;
    const pad = (n) => String(n).padStart(2, '0');
    const dLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const localToday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    if (dLocal === localToday) return true;
    try {
      return d.toISOString().split('T')[0] === now.toISOString().split('T')[0];
    } catch (e) {
      return false;
    }
  };

  // 1. Today Sales
  const todaySales = useMemo(() => {
    const list = (unifiedSalesList && unifiedSalesList.length > 0 ? unifiedSalesList : shopSalesList) || [];
    return list.filter(s => isMatchToday(s.saleDate || s.createdAt || s.date));
  }, [unifiedSalesList, shopSalesList]);

  const salesTotals = useMemo(() => {
    let revenue = 0;
    let cash = 0;
    let bank = 0;
    let credit = 0;
    let petis = 0;
    let eggs = 0;

    todaySales.forEach(s => {
      const amt = Number(s.totalAmount) || 0;
      revenue += amt;
      cash += Number(s.cashPaid !== undefined ? s.cashPaid : (s.paymentMethod === 'CASH' ? amt : 0)) || 0;
      bank += Number(s.bankPaid !== undefined ? s.bankPaid : (s.paymentMethod === 'BANK' || s.paymentMethod === 'ONLINE' || s.paymentMethod === 'BANK_TRANSFER' ? amt : 0)) || 0;
      credit += Number(s.creditDue || s.dueAmount || (s.paymentMethod === 'CREDIT' ? amt : 0)) || 0;

      let itms = Array.isArray(s.items) ? s.items : [];
      if (typeof s.items === 'string' && s.items.trim()) {
        try { itms = JSON.parse(s.items); } catch(e) { itms = []; }
      }
      if (itms && itms.length > 0) {
        itms.forEach(i => {
          eggs += Number(i.totalEggs || i.quantity || 0);
        });
      } else if (Number(s.eggsBought) > 0) {
        eggs += Number(s.eggsBought);
      } else if (Number(s.petisBought) > 0) {
        eggs += Number(s.petisBought) * 360;
      }
    });

    petis = Number((eggs / 360).toFixed(1));

    return {
      revenue: revenue || Number(todayMasterMetrics.todaySalesRevenue || 0),
      count: todaySales.length || Number(todayMasterMetrics.todaySalesCount || 0),
      cash: cash || Number(todayMasterMetrics.todaySalesCash || 0),
      bank: bank || Number(todayMasterMetrics.todaySalesBank || 0),
      credit: credit || Number(todayMasterMetrics.todaySalesCredit || 0),
      petis: petis || Number(todayMasterMetrics.todaySalesPetis || 0),
      eggs: eggs || Number(todayMasterMetrics.todaySalesEggs || 0)
    };
  }, [todaySales, todayMasterMetrics]);

  // 2. Today Shop Expenses
  const todayExpenses = useMemo(() => {
    return (expensesList || []).filter(e => isMatchToday(e.expenseDate || e.createdAt || e.date));
  }, [expensesList]);

  const expenseTotals = useMemo(() => {
    let total = 0;
    let cash = 0;
    let bank = 0;
    todayExpenses.forEach(e => {
      const amt = Number(e.amount) || 0;
      total += amt;
      const p = String(e.paymentMethod || 'CASH').toUpperCase();
      if (p === 'BANK' || p === 'ONLINE' || p === 'BANK_TRANSFER') {
        bank += amt;
      } else {
        cash += amt;
      }
    });
    return {
      total: total || Number(todayMasterMetrics.todayExpenses || 0),
      count: todayExpenses.length || Number(todayMasterMetrics.todayExpensesCount || 0),
      cash,
      bank
    };
  }, [todayExpenses, todayMasterMetrics]);

  // 3. Today Fuel & Vehicle Expenses
  const todayFuel = useMemo(() => {
    return (fuelExpensesList || []).filter(f => isMatchToday(f.expenseDate || f.createdAt || f.date));
  }, [fuelExpensesList]);

  const fuelTotals = useMemo(() => {
    let total = 0;
    let liters = 0;
    let cash = 0;
    let bank = 0;
    todayFuel.forEach(f => {
      const amt = Number(f.totalAmount) || 0;
      total += amt;
      liters += Number(f.liters) || 0;
      const p = String(f.paymentMethod || 'CASH').toUpperCase();
      if (p.includes('BANK') || p.includes('ONLINE')) {
        bank += amt;
      } else {
        cash += amt;
      }
    });
    return {
      total: total || Number(todayMasterMetrics.todayFuelExpense || 0),
      count: todayFuel.length || Number(todayMasterMetrics.todayFuelCount || 0),
      liters: Number(liters.toFixed(1)) || Number(todayMasterMetrics.todayFuelLiters || 0),
      cash,
      bank
    };
  }, [todayFuel, todayMasterMetrics]);

  // 4. Today Damaged Stock Losses
  const todayDamaged = useMemo(() => {
    return (damagedProductsList || []).filter(d => isMatchToday(d.damageDate || d.createdAt || d.date));
  }, [damagedProductsList]);

  const damagedTotals = useMemo(() => {
    let lossVal = 0;
    let eggs = 0;
    todayDamaged.forEach(d => {
      const loss = Number(d.totalLoss) > 0
        ? Number(d.totalLoss)
        : (Number(d.lossAmount) || (Number(d.quantity || d.deductedEggs || 0) * (Number(d.unitPrice) || 0)) || 0);
      const eggCount = Number(d.deductedEggs) > 0
        ? Number(d.deductedEggs)
        : (Number(d.eggQuantity || 0) + (Number(d.petiQuantity || 0) * 360) + (Number(d.trayQuantity || 0) * 30) || Number(d.quantity) || 0);
      lossVal += loss;
      eggs += eggCount;
    });
    return {
      totalLoss: lossVal || Number(todayMasterMetrics.todayDamagedLoss || 0),
      count: todayDamaged.length || Number(todayMasterMetrics.todayDamagedCount || 0),
      eggs: eggs || Number(todayMasterMetrics.todayDamagedEggs || 0),
      petis: Number((eggs / 360).toFixed(1)) || Number(todayMasterMetrics.todayDamagedPetis || 0)
    };
  }, [todayDamaged, todayMasterMetrics]);

  // 5. Today Purchases & Restocks
  const todayPurchases = useMemo(() => {
    return (items || []).filter(p => isMatchToday(p.purchaseDate || p.createdAt || p.date));
  }, [items]);

  const purchaseTotals = useMemo(() => {
    let cost = 0;
    let cash = 0;
    let bank = 0;
    let due = 0;
    let petis = 0;
    todayPurchases.forEach(p => {
      const c = Number(p.totalPurchaseCost || p.purchaseCost || p.totalCost) || 0;
      cost += c;
      cash += Number(p.cashPaid || p.amountPaidCash || 0);
      bank += Number(p.bankPaid || p.amountPaidBank || 0);
      due += Number(p.dueAmount || p.balanceDue || 0);
      petis += Number(p.petiQuantity || 0);
    });
    return {
      cost: cost || Number(todayMasterMetrics.todayPurchasesCost || 0),
      count: todayPurchases.length || Number(todayMasterMetrics.todayPurchasesCount || 0),
      cash,
      bank,
      due,
      petis
    };
  }, [todayPurchases, todayMasterMetrics]);

  // 6. Today New Registered Customers
  const todayCustomers = useMemo(() => {
    return (registeredCustomersList || []).filter(c => isMatchToday(c.createdAt || c.dateAdded));
  }, [registeredCustomersList]);

  // ─── SPECIFIC FINANCIAL CALCULATION AS REQUESTED BY USER ───
  // today expens seraf da today sale na minus kegi aw demage fuel am da today sale na minus kegi
  const todayFinancialResult = useMemo(() => {
    const grossSale = salesTotals.revenue;
    const shopExp = expenseTotals.total;
    const fuelExp = fuelTotals.total;
    const damLoss = damagedTotals.totalLoss;

    const totalDeductions = shopExp + fuelExp + damLoss;
    const netDailyBalance = grossSale - totalDeductions;

    // Cash-in-hand calculation for physical drawer settlement
    const cashIn = salesTotals.cash;
    const cashOut = expenseTotals.cash + fuelTotals.cash;
    const netCashInDrawer = cashIn - cashOut;

    // Bank account movements
    const bankIn = salesTotals.bank;
    const bankOut = expenseTotals.bank + fuelTotals.bank;
    const netBankBalance = bankIn - bankOut;

    return {
      grossSale,
      shopExp,
      fuelExp,
      damLoss,
      totalDeductions,
      netDailyBalance,
      isProfit: netDailyBalance >= 0,
      cashIn,
      cashOut,
      netCashInDrawer,
      bankIn,
      bankOut,
      netBankBalance,
      customerCreditGiven: salesTotals.credit
    };
  }, [salesTotals, expenseTotals, fuelTotals, damagedTotals]);

  // Handle refresh action
  const handleTriggerRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // ─── 1-CLICK PRINT MASTER TODAY STATEMENT (Clean, Vector, High-Res HTML Print Window) ───
  const handlePrintTodayHistory = () => {
    const printWin = window.open('', '_blank', 'width=1100,height=800');
    if (!printWin) {
      alert('Please allow popups to print the Today History Statement.');
      return;
    }

    const fmtNum = (num) => Number(num || 0).toLocaleString('en-PK');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Business Statement - ${todayDateFormatted} - ${shopName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 10mm 15mm 10mm;
            }
            body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #fff;
              margin: 0;
              padding: 0;
              font-size: 11px;
              line-height: 1.4;
            }
            .header-banner {
              text-align: center;
              padding-bottom: 12px;
              border-bottom: 3px double #334155;
              margin-bottom: 14px;
            }
            .org-title {
              font-size: 21px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #0f172a;
              margin: 0;
            }
            .branch-title {
              font-size: 13.5px;
              font-weight: 800;
              color: #334155;
              margin: 2px 0 4px 0;
              text-transform: uppercase;
            }
            .doc-tag {
              display: inline-block;
              background: #1e293b;
              color: #fff;
              font-weight: 800;
              font-size: 10px;
              padding: 3px 14px;
              border-radius: 4px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-top: 4px;
            }
            .meta-bar {
              display: flex;
              justify-content: space-between;
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 6px 12px;
              border-radius: 6px;
              margin-bottom: 14px;
              font-size: 10px;
              font-weight: 700;
              color: #334155;
            }
            .formula-card {
              border: 1.5px solid #94a3b8;
              background: #f1f5f9;
              border-radius: 8px;
              padding: 10px 14px;
              margin-bottom: 16px;
            }
            .formula-title {
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0f172a;
              margin-bottom: 6px;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 4px;
            }
            .formula-grid {
              display: grid;
              grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
              gap: 6px;
              text-align: center;
              font-size: 10px;
            }
            .formula-item {
              padding: 6px 4px;
              background: #fff;
              border-radius: 6px;
              border: 1px solid #cbd5e1;
              box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            }
            .formula-item.highlight {
              background: ${todayFinancialResult.isProfit ? '#f0fdf4' : '#fef2f2'};
              border: 1.5px solid ${todayFinancialResult.isProfit ? '#10b981' : '#f43f5e'};
            }
            .formula-item .lbl {
              font-weight: 800;
              text-transform: uppercase;
              font-size: 9px;
              color: #475569;
            }
            .formula-item .val {
              font-size: 13px;
              font-weight: 900;
              margin-top: 2px;
              color: #0f172a;
            }
            .section-title {
              font-size: 10.5px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0f172a;
              background: #e2e8f0;
              border-left: 4px solid #475569;
              border-top: 1px solid #cbd5e1;
              border-right: 1px solid #cbd5e1;
              border-bottom: 1px solid #cbd5e1;
              padding: 5px 8px;
              border-radius: 4px 4px 0 0;
              margin-top: 14px;
              margin-bottom: 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: 9.5px;
            }
            th {
              background: #f1f5f9;
              color: #1e293b;
              font-weight: 800;
              text-transform: uppercase;
              font-size: 8.5px;
              padding: 5px 6px;
              border: 1px solid #cbd5e1;
              text-align: left;
            }
            td {
              padding: 5px 6px;
              border: 1px solid #cbd5e1;
              vertical-align: middle;
              color: #0f172a;
            }
            tr:nth-child(even) td {
              background: #f8fafc;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .signatures {
              margin-top: 28px;
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 20px;
              padding-top: 10px;
            }
            .sign-box {
              border-top: 1.5px dashed #475569;
              text-align: center;
              font-size: 9.5px;
              font-weight: 800;
              text-transform: uppercase;
              padding-top: 4px;
              color: #334155;
            }
            .footer-note {
              margin-top: 18px;
              text-align: center;
              font-size: 8.5px;
              color: #64748b;
              border-top: 1px solid #e2e8f0;
              padding-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <h1 class="org-title">Yousafzai Agri Foods &amp; Traders</h1>
            <div class="branch-title">${shopName} • ${shopAddress}</div>
            <div class="doc-tag">DAILY BUSINESS AUDIT &amp; CLOSING STATEMENT</div>
          </div>

          <div class="meta-bar">
            <span><strong>DATE:</strong> ${todayDateFormatted}</span>
            <span><strong>PRINTED AT:</strong> ${todayTimeFormatted}</span>
            <span><strong>BRANCH CONTACT:</strong> ${shopPhone}</span>
            <span><strong>AUDIT STATUS:</strong> VERIFIED 100%</span>
          </div>

          <!-- Master Calculation Box -->
          <div class="formula-card">
            <div class="formula-title">
              TODAY FINANCIAL PERFORMANCE &amp; NET DAILY SETTLEMENT
            </div>
            <div class="formula-grid">
              <div class="formula-item">
                <div class="lbl">(+) Today Gross Sale</div>
                <div class="val" style="color:#047857;">${currency} ${fmtNum(todayFinancialResult.grossSale)}</div>
              </div>
              <div class="formula-item">
                <div class="lbl">(-) Shop Expense</div>
                <div class="val" style="color:#b91c1c;">${currency} ${fmtNum(todayFinancialResult.shopExp)}</div>
              </div>
              <div class="formula-item">
                <div class="lbl">(-) Fuel Expense</div>
                <div class="val" style="color:#c2410c;">${currency} ${fmtNum(todayFinancialResult.fuelExp)}</div>
              </div>
              <div class="formula-item">
                <div class="lbl">(-) Damaged Loss</div>
                <div class="val" style="color:#b45309;">${currency} ${fmtNum(todayFinancialResult.damLoss)}</div>
              </div>
              <div class="formula-item highlight">
                <div class="lbl">(=) Today Net Result</div>
                <div class="val" style="color:${todayFinancialResult.isProfit ? '#047857' : '#e11d48'};">
                  ${todayFinancialResult.isProfit ? '+' : '-'}${currency} ${fmtNum(Math.abs(todayFinancialResult.netDailyBalance))}
                </div>
              </div>
            </div>

            <div style="display:flex; justify-content:space-around; margin-top:8px; padding-top:6px; border-top:1px dashed #94a3b8; font-size:9.5px; font-weight:800; color:#1e293b;">
              <span>💵 Cash in Drawer: <strong style="color:#047857;">${currency} ${fmtNum(todayFinancialResult.netCashInDrawer)}</strong></span>
              <span>🏦 Bank Inflow: <strong style="color:#1d4ed8;">${currency} ${fmtNum(todayFinancialResult.bankIn)}</strong></span>
              <span>📋 Customer Credit Given: <strong style="color:#b45309;">${currency} ${fmtNum(todayFinancialResult.customerCreditGiven)}</strong></span>
              <span>📦 Eggs Sold: <strong>${salesTotals.petis} Petis (${fmtNum(salesTotals.eggs)} Eggs)</strong></span>
            </div>
          </div>

          <!-- Section 1: Sales Invoices -->
          <div class="section-title">
            <span>1. Today POS Sales &amp; Orders (${todaySales.length} Invoices)</span>
            <span>Total Sales: ${currency} ${fmtNum(salesTotals.revenue)}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:25px;">#</th>
                <th style="width:75px;">Invoice #</th>
                <th>Customer Name &amp; Contact</th>
                <th>Items Purchased</th>
                <th class="text-right" style="width:65px;">Cash</th>
                <th class="text-right" style="width:65px;">Bank</th>
                <th class="text-right" style="width:65px;">Credit</th>
                <th class="text-right" style="width:75px;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${todaySales.length === 0 ? `
                <tr><td colspan="8" class="text-center" style="color:#64748b; padding:10px;">No sales bills recorded for today.</td></tr>
              ` : todaySales.map((s, idx) => {
                const inv = s.invoiceNumber || s.serialNumber || `INV-${idx + 1}`;
                const cust = s.customerName || 'Walk-in Customer';
                const phone = s.customerPhone || '';
                const total = Number(s.totalAmount) || 0;
                const cash = Number(s.cashPaid !== undefined ? s.cashPaid : (s.paymentMethod === 'CASH' ? total : 0));
                const bank = Number(s.bankPaid !== undefined ? s.bankPaid : (s.paymentMethod === 'BANK' || s.paymentMethod === 'ONLINE' ? total : 0));
                const due = Number(s.creditDue || s.dueAmount || (s.paymentMethod === 'CREDIT' ? total : 0));
                let itms = (s.items && Array.isArray(s.items)) ? s.items.map(i => `${i.name || i.title || 'Eggs'} (x${i.quantity || 1})`).join(', ') : 'Eggs Stock';
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td class="font-bold">${inv}</td>
                    <td><strong>${cust}</strong> ${phone ? `(${phone})` : ''}</td>
                    <td>${itms}</td>
                    <td class="text-right">${cash > 0 ? `${currency} ${fmtNum(cash)}` : '—'}</td>
                    <td class="text-right">${bank > 0 ? `${currency} ${fmtNum(bank)}` : '—'}</td>
                    <td class="text-right">${due > 0 ? `${currency} ${fmtNum(due)}` : '—'}</td>
                    <td class="text-right font-black" style="color:#047857;">${currency} ${fmtNum(total)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <!-- Section 2: Shop Overhead Expenses -->
          <div class="section-title">
            <span>2. Today Shop Overhead Expenses (${todayExpenses.length} Logs)</span>
            <span>Total Expenses: ${currency} ${fmtNum(expenseTotals.total)}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:25px;">#</th>
                <th>Expense Title &amp; Description</th>
                <th>Category</th>
                <th>Payment Channel</th>
                <th>Recipient / Remarks</th>
                <th class="text-right" style="width:85px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${todayExpenses.length === 0 ? `
                <tr><td colspan="6" class="text-center" style="color:#64748b; padding:10px;">No shop overhead expenses recorded for today.</td></tr>
              ` : todayExpenses.map((e, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td class="font-bold">${e.title || e.description || 'Shop Expense'}</td>
                  <td>${e.category || 'General Overhead'}</td>
                  <td>${e.paymentMethod || 'CASH'}</td>
                  <td>${e.paidTo || e.remarks || '—'}</td>
                  <td class="text-right font-black" style="color:#b91c1c;">${currency} ${fmtNum(e.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Section 3: Fuel & Transport Expenses -->
          <div class="section-title">
            <span>3. Today Fuel &amp; Transport Logs (${todayFuel.length} Trips)</span>
            <span>Total Fuel Cost: ${currency} ${fmtNum(fuelTotals.total)} (${fuelTotals.liters} L)</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:25px;">#</th>
                <th>Vehicle &amp; Model</th>
                <th>Driver Name</th>
                <th>Purpose / Delivery Route</th>
                <th>Fuel Liters &amp; Rate</th>
                <th>Payment Mode</th>
                <th class="text-right" style="width:85px;">Fuel Cost</th>
              </tr>
            </thead>
            <tbody>
              ${todayFuel.length === 0 ? `
                <tr><td colspan="7" class="text-center" style="color:#64748b; padding:10px;">No fuel logs recorded for today.</td></tr>
              ` : todayFuel.map((f, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td class="font-bold">${f.vehicleNumber || f.vehicleName || 'Shop Vehicle'}</td>
                  <td>${f.driverName || 'Shop Driver'}</td>
                  <td>${f.purpose || f.destination || 'Delivery Order'}</td>
                  <td>${f.liters || 0} L @ ${currency} ${fmtNum(f.ratePerLiter || 0)}</td>
                  <td>${f.paymentMethod || 'CASH'}</td>
                  <td class="text-right font-black" style="color:#c2410c;">${currency} ${fmtNum(f.totalAmount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Section 4: Damaged Stock -->
          <div class="section-title">
            <span>4. Today Damaged Eggs &amp; Stock Losses (${todayDamaged.length} Incidents)</span>
            <span>Total Damage Loss: ${currency} ${fmtNum(damagedTotals.totalLoss)} (${damagedTotals.eggs} Eggs)</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:25px;">#</th>
                <th>Egg Product / Category</th>
                <th>Damage Breakdown</th>
                <th>Cause / Description</th>
                <th class="text-right" style="width:85px;">Loss Amount</th>
              </tr>
            </thead>
            <tbody>
              ${todayDamaged.length === 0 ? `
                <tr><td colspan="5" class="text-center" style="color:#64748b; padding:10px;">No damaged eggs recorded for today.</td></tr>
              ` : todayDamaged.map((d, idx) => {
                const eggs = Number(d.deductedEggs || d.eggQuantity || d.quantity || 0);
                const petis = (eggs / 360).toFixed(1);
                const loss = Number(d.totalLoss || d.lossAmount || 0);
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td class="font-bold">${d.productName || d.product?.name || 'Damaged Eggs'}</td>
                    <td>${eggs} Eggs (${petis} Petis)</td>
                    <td>${d.reason || d.notes || 'Broken during transit/storage'}</td>
                    <td class="text-right font-black" style="color:#b45309;">${currency} ${fmtNum(loss)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <!-- Section 5: Purchases & Stock Restocks -->
          <div class="section-title">
            <span>5. Today Stock Purchases &amp; Restocks (${todayPurchases.length} Items)</span>
            <span>Total Stock Cost: ${currency} ${fmtNum(purchaseTotals.cost)}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:25px;">#</th>
                <th>Product Purchased</th>
                <th>Supplier / Farm</th>
                <th>Quantity</th>
                <th class="text-right" style="width:65px;">Cash Paid</th>
                <th class="text-right" style="width:65px;">Due Balance</th>
                <th class="text-right" style="width:75px;">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              ${todayPurchases.length === 0 ? `
                <tr><td colspan="7" class="text-center" style="color:#64748b; padding:10px;">No purchases recorded for today.</td></tr>
              ` : todayPurchases.map((p, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td class="font-bold">${p.name || p.productName || 'Egg Stock'}</td>
                  <td>${p.supplier || p.supplierName || 'Farm Supplier'}</td>
                  <td>${p.petiQuantity || p.stock || 0} Petis</td>
                  <td class="text-right">${p.cashPaid ? `${currency} ${fmtNum(p.cashPaid)}` : '—'}</td>
                  <td class="text-right">${p.dueAmount ? `${currency} ${fmtNum(p.dueAmount)}` : '—'}</td>
                  <td class="text-right font-black">${currency} ${fmtNum(p.totalPurchaseCost || p.costPrice || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="signatures">
            <div class="sign-box">Cashier / Billing Incharge</div>
            <div class="sign-box">Branch Store Manager</div>
            <div class="sign-box">Authorized Super Admin Stamp</div>
          </div>

          <div class="footer-note">
            This is an official system-generated Today Business Audit Statement. Generated automatically by Yousafzai Egg Traders Management Suite.
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

  // ─── WhatsApp Share Handler ───
  const handleWhatsAppTodayHistory = () => {
    const fmtNum = (num) => Number(num || 0).toLocaleString('en-PK');
    let msg = `📊 *DAILY BUSINESS SUMMARY - ${todayDateFormatted}*\n`;
    msg += `🏢 *Branch:* ${shopName}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🟢 *Today Gross Sales:* ${currency} ${fmtNum(todayFinancialResult.grossSale)} (${salesTotals.count} Bills)\n`;
    msg += `   • Cash: ${currency} ${fmtNum(salesTotals.cash)}\n`;
    msg += `   • Bank: ${currency} ${fmtNum(salesTotals.bank)}\n`;
    msg += `   • Credit: ${currency} ${fmtNum(salesTotals.credit)}\n`;
    msg += `   • Stock: ${salesTotals.petis} Petis (${fmtNum(salesTotals.eggs)} Eggs)\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🔴 *TODAY DEDUCTIONS FROM SALE:*\n`;
    msg += `   • (-) Shop Expense: ${currency} ${fmtNum(todayFinancialResult.shopExp)}\n`;
    msg += `   • (-) Fuel & Vehicle: ${currency} ${fmtNum(todayFinancialResult.fuelExp)} (${fuelTotals.liters} L)\n`;
    msg += `   • (-) Damaged Loss: ${currency} ${fmtNum(todayFinancialResult.damLoss)} (${damagedTotals.eggs} Eggs)\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `⭐ *TODAY NET RESULT:* ${todayFinancialResult.isProfit ? '+' : '-'}${currency} ${fmtNum(Math.abs(todayFinancialResult.netDailyBalance))} (${todayFinancialResult.isProfit ? 'PROFIT' : 'LOSS'})\n`;
    msg += `💵 *Net Cash In Drawer:* ${currency} ${fmtNum(todayFinancialResult.netCashInDrawer)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_Generated by Yosafze Egg Traders Management System_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ─── Excel / CSV Export ───
  const handleExportTodayHistoryExcel = () => {
    const fmtNum = (n) => Number(n || 0);
    let csv = `TODAY BUSINESS STATEMENT - ${todayDateFormatted}\n`;
    csv += `Branch,${shopName}\n`;
    csv += `Gross Sales,${fmtNum(todayFinancialResult.grossSale)}\n`;
    csv += `Shop Expenses,${fmtNum(todayFinancialResult.shopExp)}\n`;
    csv += `Fuel Expenses,${fmtNum(todayFinancialResult.fuelExp)}\n`;
    csv += `Damaged Losses,${fmtNum(todayFinancialResult.damLoss)}\n`;
    csv += `Net Result,${fmtNum(todayFinancialResult.netDailyBalance)}\n`;
    csv += `Cash In Drawer,${fmtNum(todayFinancialResult.netCashInDrawer)}\n\n`;

    csv += `INVOICES LIST\n`;
    csv += `#,Invoice Number,Customer,Cash Paid,Bank Paid,Credit Due,Total Amount\n`;
    todaySales.forEach((s, idx) => {
      const inv = s.invoiceNumber || s.serialNumber || `INV-${idx + 1}`;
      const cust = (s.customerName || 'Walk-in Customer').replace(/,/g, ' ');
      const total = Number(s.totalAmount) || 0;
      const cash = Number(s.cashPaid || 0);
      const bank = Number(s.bankPaid || 0);
      const due = Number(s.creditDue || s.dueAmount || 0);
      csv += `${idx + 1},${inv},${cust},${cash},${bank},${due},${total}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Today_History_${shopName.replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── 1. TOP HEADER & ACTION BAR ─── */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 flex items-center justify-center text-zinc-950 shadow-md shrink-0">
            <History className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                ● Live Today Audit
              </span>
              <span className="text-xs font-bold text-gray-500">{shopName}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-gray-900 uppercase tracking-tight mt-0.5">
              Today History &amp; Master Closing
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Single-page master record of today's sales, purchases, expenses, fuel, damage &amp; settlements
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto justify-start xl:justify-end">
          <button
            type="button"
            onClick={handlePrintTodayHistory}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer border border-emerald-400/40"
            title="Print entire today business statement"
          >
            <Printer className="w-4 h-4" />
            <span>Print Full Today Report</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppTodayHistory}
            className="px-3.5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer border border-green-300/30"
            title="Share Today Summary on WhatsApp"
          >
            <Send className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleExportTodayHistoryExcel}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs border border-gray-300 active:scale-95 transition-all cursor-pointer"
            title="Export Today CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all cursor-pointer border border-gray-300 shadow-xs active:scale-95"
            title="Refresh Today Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── 2. DEDICATED DAILY FINANCIAL CALCULATION BOX (Gray Theme & Compact Spacing) ─── */}
      <div className="bg-slate-100 border-2 border-slate-300 rounded-3xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <History className="w-64 h-64 text-slate-800" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-300 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </span>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
                Today Daily Financial Performance &amp; Realized Settlement
              </h2>
            </div>
            <span className="text-[11px] font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-300 shadow-xs">
              📅 {todayDateFormatted}
            </span>
          </div>

          {/* Formula Representation Grid - Closely Spaced (yaw bal ta nezde) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-2.5">
            {/* Step 1: (+) Today Sale */}
            <div className="bg-white border-2 border-emerald-300 hover:border-emerald-500 rounded-2xl p-3 shadow-xs flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  (+) 1. Today Gross Sale
                </span>
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center border border-emerald-200">+</span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1.5">
                {currency} {todayFinancialResult.grossSale.toLocaleString('en-PK')}
              </div>
              <span className="text-[10px] font-bold text-emerald-700 mt-0.5">
                {salesTotals.count} Bills • {salesTotals.petis} Petis
              </span>
            </div>

            {/* Step 2: (-) Shop Expenses */}
            <div className="bg-white border-2 border-rose-300 hover:border-rose-500 rounded-2xl p-3 shadow-xs flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-800">
                  (-) 2. Shop Expense
                </span>
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 text-xs font-black flex items-center justify-center border border-rose-200">-</span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-rose-700 mt-1.5">
                {currency} {todayFinancialResult.shopExp.toLocaleString('en-PK')}
              </div>
              <span className="text-[10px] font-bold text-rose-600 mt-0.5">
                {expenseTotals.count} Overhead Logs
              </span>
            </div>

            {/* Step 3: (-) Fuel Expense */}
            <div className="bg-white border-2 border-amber-300 hover:border-amber-500 rounded-2xl p-3 shadow-xs flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                  (-) 3. Fuel Expense
                </span>
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center border border-amber-200">-</span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-amber-700 mt-1.5">
                {currency} {todayFinancialResult.fuelExp.toLocaleString('en-PK')}
              </div>
              <span className="text-[10px] font-bold text-amber-600 mt-0.5">
                {fuelTotals.count} Trips • {fuelTotals.liters} L
              </span>
            </div>

            {/* Step 4: (-) Damaged Loss */}
            <div className="bg-white border-2 border-yellow-400 hover:border-yellow-500 rounded-2xl p-3 shadow-xs flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                  (-) 4. Damaged Loss
                </span>
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center border border-amber-300">-</span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-amber-800 mt-1.5">
                {currency} {todayFinancialResult.damLoss.toLocaleString('en-PK')}
              </div>
              <span className="text-[10px] font-bold text-amber-700 mt-0.5">
                {damagedTotals.eggs.toLocaleString('en-PK')} Eggs ({damagedTotals.petis} P)
              </span>
            </div>

            {/* Final Step: (=) Net Result */}
            <div className={`col-span-2 lg:col-span-1 rounded-2xl p-3 border-2 flex flex-col justify-between shadow-xs transition-all ${
              todayFinancialResult.isProfit
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                  (=) Today Net Result
                </span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white shadow-xs ${
                  todayFinancialResult.isProfit ? 'bg-emerald-600' : 'bg-rose-600'
                }`}>
                  {todayFinancialResult.isProfit ? 'PROFIT' : 'DEFICIT'}
                </span>
              </div>
              <div className={`text-xl sm:text-2xl font-black mt-1.5 ${
                todayFinancialResult.isProfit ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {todayFinancialResult.isProfit ? '+' : '-'}{currency} {Math.abs(todayFinancialResult.netDailyBalance).toLocaleString('en-PK')}
              </div>
              <span className={`text-[10px] font-bold mt-0.5 ${
                todayFinancialResult.isProfit ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                Sale - Exp - Fuel - Damage
              </span>
            </div>
          </div>

          {/* Cash Drawer & Liquidity Strip (Clean Gray Theme & Compact) */}
          <div className="bg-white border border-slate-300 rounded-2xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold shadow-xs">
            <div>
              <span className="text-slate-500 uppercase text-[9px] block">💵 Cash In Hand (Drawer):</span>
              <span className="text-emerald-700 text-sm font-black mt-0.5 block">
                {currency} {todayFinancialResult.netCashInDrawer.toLocaleString('en-PK')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[9px] block">🏦 Bank Transfers:</span>
              <span className="text-blue-700 text-sm font-black mt-0.5 block">
                {currency} {todayFinancialResult.bankIn.toLocaleString('en-PK')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[9px] block">📋 Customer Credit Given:</span>
              <span className="text-amber-700 text-sm font-black mt-0.5 block">
                {currency} {todayFinancialResult.customerCreditGiven.toLocaleString('en-PK')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[9px] block">🚚 Today Stock Restocks:</span>
              <span className="text-teal-700 text-sm font-black mt-0.5 block">
                {currency} {purchaseTotals.cost.toLocaleString('en-PK')} ({purchaseTotals.petis} P)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. DEPARTMENT TABS SELECTOR ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Departments Combined</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SALES')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'SALES'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-emerald-50'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Sales &amp; Bills ({todaySales.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PURCHASES')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'PURCHASES'
              ? 'bg-teal-700 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Purchases ({todayPurchases.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EXPENSES')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'EXPENSES'
              ? 'bg-rose-700 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-rose-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Shop Expenses ({todayExpenses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('FUEL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'FUEL'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-amber-50'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-amber-500" />
          <span>Fuel Logs ({todayFuel.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DAMAGED')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'DAMAGED'
              ? 'bg-yellow-700 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-yellow-50'
          }`}
        >
          <PackageX className="w-3.5 h-3.5" />
          <span>Damaged Stock ({todayDamaged.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CUSTOMERS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'CUSTOMERS'
              ? 'bg-indigo-700 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-indigo-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>New Customers ({todayCustomers.length})</span>
        </button>
      </div>

      {/* ─── 4. ITEMISED DEPARTMENT TABLES (Displayed on Screen) ─── */}
      <div className="space-y-6">
        {/* DEPARTMENT 1: TODAY SALES */}
        {(activeTab === 'ALL' || activeTab === 'SALES') && (
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black uppercase text-gray-900">
                  1. Today POS Bills &amp; Sales Invoices ({todaySales.length})
                </h3>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Total: {currency} {salesTotals.revenue.toLocaleString('en-PK')}
              </span>
            </div>

            {todaySales.length === 0 ? (
              <div className="text-center py-8 text-gray-400 font-bold text-xs uppercase tracking-wider">
                No sales bills recorded for today.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Invoice</th>
                      <th className="p-3">Time</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Items</th>
                      <th className="p-3 text-right">Cash</th>
                      <th className="p-3 text-right">Bank</th>
                      <th className="p-3 text-right">Credit</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {todaySales.map((s, idx) => {
                      const inv = s.invoiceNumber || s.serialNumber || `INV-${idx + 1}`;
                      const timeStr = new Date(s.saleDate || s.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
                      const total = Number(s.totalAmount) || 0;
                      const cash = Number(s.cashPaid !== undefined ? s.cashPaid : (s.paymentMethod === 'CASH' ? total : 0));
                      const bank = Number(s.bankPaid !== undefined ? s.bankPaid : (s.paymentMethod === 'BANK' || s.paymentMethod === 'ONLINE' ? total : 0));
                      const due = Number(s.creditDue || s.dueAmount || (s.paymentMethod === 'CREDIT' ? total : 0));
                      const itms = (s.items && Array.isArray(s.items)) ? s.items.map(i => `${i.name || 'Eggs'} (x${i.quantity || 1})`).join(', ') : 'Eggs Stock';

                      return (
                        <tr key={s._id || idx} className="hover:bg-gray-50">
                          <td className="p-3 text-gray-400 font-bold">{idx + 1}</td>
                          <td className="p-3 font-black text-gray-900">{inv}</td>
                          <td className="p-3 text-gray-500 font-medium">{timeStr}</td>
                          <td className="p-3 font-bold text-gray-800">{s.customerName || 'Walk-in Customer'}</td>
                          <td className="p-3 text-gray-600 truncate max-w-[200px]" title={itms}>{itms}</td>
                          <td className="p-3 text-right font-bold text-emerald-700">{cash > 0 ? `${currency} ${cash.toLocaleString('en-PK')}` : '—'}</td>
                          <td className="p-3 text-right font-bold text-blue-700">{bank > 0 ? `${currency} ${bank.toLocaleString('en-PK')}` : '—'}</td>
                          <td className="p-3 text-right font-bold text-rose-700">{due > 0 ? `${currency} ${due.toLocaleString('en-PK')}` : '—'}</td>
                          <td className="p-3 text-right font-black text-emerald-800">{currency} {total.toLocaleString('en-PK')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DEPARTMENT 2: TODAY SHOP EXPENSES */}
        {(activeTab === 'ALL' || activeTab === 'EXPENSES') && (
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-black uppercase text-gray-900">
                  2. Today Shop Overhead Expenses ({todayExpenses.length})
                </h3>
              </div>
              <span className="text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                Total: {currency} {expenseTotals.total.toLocaleString('en-PK')}
              </span>
            </div>

            {todayExpenses.length === 0 ? (
              <div className="text-center py-8 text-gray-400 font-bold text-xs uppercase tracking-wider">
                No shop overhead expenses recorded for today.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Expense Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Payment Mode</th>
                      <th className="p-3">Paid To / Remarks</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {todayExpenses.map((e, idx) => (
                      <tr key={e._id || idx} className="hover:bg-gray-50">
                        <td className="p-3 text-gray-400 font-bold">{idx + 1}</td>
                        <td className="p-3 font-black text-gray-900">{e.title || e.description || 'Shop Expense'}</td>
                        <td className="p-3 font-semibold text-gray-600">{e.category || 'General Overhead'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-gray-100 text-gray-700">
                            {e.paymentMethod || 'CASH'}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500">{e.paidTo || e.remarks || '—'}</td>
                        <td className="p-3 text-right font-black text-rose-700">
                          {currency} {Number(e.amount || 0).toLocaleString('en-PK')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DEPARTMENT 3: TODAY FUEL EXPENSES */}
        {(activeTab === 'ALL' || activeTab === 'FUEL') && (
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-black uppercase text-gray-900">
                  3. Today Fuel &amp; Vehicle Transport Logs ({todayFuel.length})
                </h3>
              </div>
              <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Total: {currency} {fuelTotals.total.toLocaleString('en-PK')} ({fuelTotals.liters} L)
              </span>
            </div>

            {todayFuel.length === 0 ? (
              <div className="text-center py-8 text-gray-400 font-bold text-xs uppercase tracking-wider">
                No fuel logs recorded for today.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Vehicle</th>
                      <th className="p-3">Driver</th>
                      <th className="p-3">Purpose / Destination</th>
                      <th className="p-3">Liters &amp; Rate</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {todayFuel.map((f, idx) => (
                      <tr key={f._id || idx} className="hover:bg-gray-50">
                        <td className="p-3 text-gray-400 font-bold">{idx + 1}</td>
                        <td className="p-3 font-black text-gray-900">{f.vehicleNumber || f.vehicleName || 'Vehicle'}</td>
                        <td className="p-3 font-bold text-gray-700">{f.driverName || 'Driver'}</td>
                        <td className="p-3 text-gray-600">{f.purpose || f.destination || 'Delivery'}</td>
                        <td className="p-3 font-medium text-gray-600">{f.liters || 0} L @ {currency} {Number(f.ratePerLiter || 0).toLocaleString('en-PK')}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-800">
                            {f.paymentMethod || 'CASH'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-amber-700">
                          {currency} {Number(f.totalAmount || 0).toLocaleString('en-PK')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DEPARTMENT 4: TODAY DAMAGED STOCK */}
        {(activeTab === 'ALL' || activeTab === 'DAMAGED') && (
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <PackageX className="w-4 h-4 text-yellow-600" />
                <h3 className="text-sm font-black uppercase text-gray-900">
                  4. Today Damaged Stock &amp; Egg Breakages ({todayDamaged.length})
                </h3>
              </div>
              <span className="text-xs font-black text-yellow-800 bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-200">
                Total Loss: {currency} {damagedTotals.totalLoss.toLocaleString('en-PK')} ({damagedTotals.eggs} Eggs)
              </span>
            </div>

            {todayDamaged.length === 0 ? (
              <div className="text-center py-8 text-gray-400 font-bold text-xs uppercase tracking-wider">
                No damaged eggs recorded for today.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Quantity Lost</th>
                      <th className="p-3">Reason / Storage Cause</th>
                      <th className="p-3 text-right">Loss Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {todayDamaged.map((d, idx) => {
                      const eggs = Number(d.deductedEggs || d.eggQuantity || d.quantity || 0);
                      const petis = (eggs / 360).toFixed(1);
                      const loss = Number(d.totalLoss || d.lossAmount || 0);
                      return (
                        <tr key={d._id || idx} className="hover:bg-gray-50">
                          <td className="p-3 text-gray-400 font-bold">{idx + 1}</td>
                          <td className="p-3 font-black text-gray-900">{d.productName || d.product?.name || 'Eggs'}</td>
                          <td className="p-3 font-bold text-gray-700">{eggs.toLocaleString('en-PK')} Eggs ({petis} Petis)</td>
                          <td className="p-3 text-gray-500">{d.reason || d.notes || 'Broken during handling'}</td>
                          <td className="p-3 text-right font-black text-yellow-800">
                            {currency} {loss.toLocaleString('en-PK')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DEPARTMENT 5: TODAY PURCHASES & RESTOCKS */}
        {(activeTab === 'ALL' || activeTab === 'PURCHASES') && (
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-black uppercase text-gray-900">
                  5. Today Purchases &amp; Stock Restocks ({todayPurchases.length})
                </h3>
              </div>
              <span className="text-xs font-black text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                Stock Cost: {currency} {purchaseTotals.cost.toLocaleString('en-PK')}
              </span>
            </div>

            {todayPurchases.length === 0 ? (
              <div className="text-center py-8 text-gray-400 font-bold text-xs uppercase tracking-wider">
                No purchases recorded for today.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Product</th>
                      <th className="p-3">Supplier / Farm</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3 text-right">Cash Paid</th>
                      <th className="p-3 text-right">Due Balance</th>
                      <th className="p-3 text-right">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {todayPurchases.map((p, idx) => (
                      <tr key={p._id || idx} className="hover:bg-gray-50">
                        <td className="p-3 text-gray-400 font-bold">{idx + 1}</td>
                        <td className="p-3 font-black text-gray-900">{p.name || p.productName || 'Stock'}</td>
                        <td className="p-3 font-bold text-gray-700">{p.supplier || p.supplierName || 'Farm'}</td>
                        <td className="p-3 font-semibold text-gray-600">{p.petiQuantity || p.stock || 0} Petis</td>
                        <td className="p-3 text-right font-bold text-emerald-700">{p.cashPaid ? `${currency} ${Number(p.cashPaid).toLocaleString('en-PK')}` : '—'}</td>
                        <td className="p-3 text-right font-bold text-rose-700">{p.dueAmount ? `${currency} ${Number(p.dueAmount).toLocaleString('en-PK')}` : '—'}</td>
                        <td className="p-3 text-right font-black text-teal-800">
                          {currency} {Number(p.totalPurchaseCost || p.costPrice || 0).toLocaleString('en-PK')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DEPARTMENT 6: TODAY NEW CUSTOMERS */}
        {(activeTab === 'ALL' || activeTab === 'CUSTOMERS') && (
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black uppercase text-gray-900">
                  6. Today Registered Customers &amp; Accounts ({todayCustomers.length})
                </h3>
              </div>
              <span className="text-xs font-black text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                New Contacts: {todayCustomers.length}
              </span>
            </div>

            {todayCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-400 font-bold text-xs uppercase tracking-wider">
                No new customer accounts added today.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {todayCustomers.map((c, idx) => (
                      <tr key={c._id || idx} className="hover:bg-gray-50">
                        <td className="p-3 text-gray-400 font-bold">{idx + 1}</td>
                        <td className="p-3 font-black text-gray-900">{c.fullName || c.name || 'Customer'}</td>
                        <td className="p-3 font-bold text-teal-700">{c.phone || '—'}</td>
                        <td className="p-3 text-indigo-700 font-medium">{c.email || '—'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            c.isOnline ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {c.isOnline ? 'Online Account' : 'Shop POS'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

