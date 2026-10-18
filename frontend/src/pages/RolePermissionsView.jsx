import React, { useState, useEffect, useMemo } from 'react';
import { 
    ShieldCheck, ShieldAlert, Lock, Unlock, CheckSquare, Square, 
    Building2, Store, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
    Edit2, Trash2, Check, ExternalLink, Sparkles, LayoutDashboard,
    Receipt, FileText, Truck, Users, Fuel, TrendingUp, Settings,
    ChevronDown, ChevronUp, Layers, CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { getShops, updateShopApproval } from '../services/api';
import { useUser } from '../contexts/UserContext';

// Standard Branch Pages and Modules definition
export const BRANCH_PAGES = [
    { key: 'dashboard', label: 'Dashboard & Overview', icon: LayoutDashboard, path: '/', desc: 'Real-time sales, charts & summary' },
    { key: 'store', label: 'All Products (Stock/POS)', icon: Store, path: '/store', desc: 'Stock list, egg pricing & catalog' },
    { key: 'walkin', label: 'Walk-In Billing / New Bill', icon: Receipt, path: '/walkin', desc: 'Generate POS bills & customer invoices' },
    { key: 'sales', label: 'Sales Records & Invoices', icon: FileText, path: '/sales', desc: 'Order receipts & sales invoice history' },
    { key: 'purchases', label: 'Purchases Management', icon: Truck, path: '/purchases', desc: 'Egg intake & supplier purchases' },
    { key: 'vendors', label: 'Vendors (Ledger)', icon: Building2, path: '/vendors', desc: 'Supplier ledger accounts & credit' },
    { key: 'vendorDirectory', label: 'Vendor Profiles', icon: Building2, path: '/vendor-directory', desc: 'Vendor directory & supplier profiles' },
    { key: 'customerPaymentLedger', label: 'Customer Payment Ledger', icon: Users, path: '/customer-payment-ledger', desc: 'Customer dues & payment history' },
    { key: 'vendorPaymentLedger', label: 'Vendor Payment Ledger', icon: Truck, path: '/vendor-payment-ledger', desc: 'Supplier payments & disbursements' },
    { key: 'expenses', label: 'Daily Fuel & Expenses', icon: Fuel, path: '/expenses', desc: 'Branch expenses, fuel & operational costs' },
    { key: 'team', label: 'Team Management', icon: Users, path: '/team', desc: 'Staff, cashiers & user accounts' },
    { key: 'reports', label: 'Profit & Loss Reports', icon: TrendingUp, path: '/reports', desc: 'Financial reports & branch profit analytics' },
    { key: 'settings', label: 'Branch Settings', icon: Settings, path: '/settings', desc: 'Branch profile, phone & print headers' }
];

export const ALL_BRANCH_PAGE_KEYS = BRANCH_PAGES.map(p => p.key);

export function RolePermissionsView() {
    const { isSuperAdmin } = useUser();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const loadShops = async () => {
        setLoading(true);
        try {
            const data = await getShops();
            setShops(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load branches:', err);
            toast.error('Failed to load branch list');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadShops();
    }, []);

    // Helper to get allowed pages for a shop (strictly defaults to empty array [] if not set)
    const getShopAllowedPages = (shop) => {
        if (!shop || !shop.allowedPages) return [];
        if (Array.isArray(shop.allowedPages)) {
            return shop.allowedPages;
        }
        if (typeof shop.allowedPages === 'string') {
            try {
                const parsed = JSON.parse(shop.allowedPages);
                if (Array.isArray(parsed)) return parsed;
            } catch {
                return [];
            }
        }
        return [];
    };

    // Toggle main branch approval via master checkbox
    const handleToggleBranchCheckbox = async (shop, currentlyChecked) => {
        const sId = shop._id || shop.id;
        const newApproved = !currentlyChecked;
        setUpdatingId(sId);

        const currentPages = getShopAllowedPages(shop);
        // When approving, ensure all pages are enabled; when locking, lock all
        const newPages = newApproved 
            ? (currentPages.length > 0 ? currentPages : ALL_BRANCH_PAGE_KEYS)
            : [];

        const payload = {
            isEditApproved: newApproved ? 1 : 0,
            isDeleteApproved: newApproved ? 1 : 0,
            approvalStatus: newApproved ? 'APPROVED' : 'LOCKED',
            approvalNotes: newApproved ? 'Approved by Super Admin via Role Permissions' : 'Locked by Super Admin via Role Permissions',
            allowedPages: newPages
        };

        try {
            await updateShopApproval(sId, payload);
            setShops(prev => prev.map(s => {
                if (String(s._id || s.id) === String(sId)) {
                    return {
                        ...s,
                        ...payload
                    };
                }
                return s;
            }));
            try {
                localStorage.setItem(`nexflow_cached_shop_${sId}`, JSON.stringify({ ...shop, ...payload }));
            } catch {}
            if (newApproved) {
                toast.success(`✅ ${shop.name}: Full Approval Granted`);
            } else {
                toast.error(`🔒 ${shop.name}: Access Locked`);
            }
        } catch (err) {
            console.error('Failed to update branch approval:', err);
            toast.error(err.response?.data?.message || 'Failed to update approval');
        } finally {
            setUpdatingId(null);
        }
    };

    // Toggle granular edit or delete permission
    const handleToggleGranular = async (shop, field) => {
        const sId = shop._id || shop.id;
        const currentValue = Number(shop[field]) !== 0;
        const nextValue = currentValue ? 0 : 1;
        setUpdatingId(`${sId}-${field}`);

        const payload = {
            [field]: nextValue,
            approvalStatus: 'APPROVED'
        };

        try {
            await updateShopApproval(sId, payload);
            setShops(prev => prev.map(s => {
                if (String(s._id || s.id) === String(sId)) {
                    return {
                        ...s,
                        [field]: nextValue,
                        approvalStatus: 'APPROVED'
                    };
                }
                return s;
            }));
            toast.success(`${shop.name}: ${field === 'isEditApproved' ? 'Edit' : 'Delete'} permission updated`);
        } catch (err) {
            toast.error('Failed to update permission');
        } finally {
            setUpdatingId(null);
        }
    };

    // Toggle a single page permission for a specific branch
    const handleTogglePageCheckbox = async (shop, pageKey) => {
        const sId = shop._id || shop.id;
        const currentAllowed = getShopAllowedPages(shop);
        const isCurrentlyAllowed = currentAllowed.includes(pageKey);
        
        const nextAllowed = isCurrentlyAllowed
            ? currentAllowed.filter(k => k !== pageKey)
            : [...currentAllowed, pageKey];

        setUpdatingId(`${sId}-page-${pageKey}`);

        const payload = {
            allowedPages: nextAllowed,
            approvalStatus: nextAllowed.length > 0 ? (shop.approvalStatus === 'LOCKED' ? 'APPROVED' : shop.approvalStatus) : shop.approvalStatus
        };

        try {
            await updateShopApproval(sId, payload);
            setShops(prev => prev.map(s => {
                if (String(s._id || s.id) === String(sId)) {
                    return {
                        ...s,
                        ...payload
                    };
                }
                return s;
            }));
            try {
                localStorage.setItem(`nexflow_cached_shop_${sId}`, JSON.stringify({ ...shop, ...payload }));
            } catch {}
            const targetPage = BRANCH_PAGES.find(p => p.key === pageKey);
            if (!isCurrentlyAllowed) {
                toast.success(`✅ ${shop.name}: "${targetPage?.label}" is now Enabled`);
            } else {
                toast.error(`🔒 ${shop.name}: "${targetPage?.label}" is now Locked`);
            }
        } catch (err) {
            toast.error('Failed to update page permission');
        } finally {
            setUpdatingId(null);
        }
    };

    // Bulk enable / disable all pages for a specific branch
    const handleBulkPagesForBranch = async (shop, shouldAllowAll) => {
        const sId = shop._id || shop.id;
        const nextAllowed = shouldAllowAll ? ALL_BRANCH_PAGE_KEYS : [];
        setUpdatingId(`${sId}-bulk-pages`);

        const payload = {
            allowedPages: nextAllowed,
            approvalStatus: shouldAllowAll ? 'APPROVED' : shop.approvalStatus
        };

        try {
            await updateShopApproval(sId, payload);
            setShops(prev => prev.map(s => {
                if (String(s._id || s.id) === String(sId)) {
                    return {
                        ...s,
                        ...payload
                    };
                }
                return s;
            }));
            try {
                localStorage.setItem(`nexflow_cached_shop_${sId}`, JSON.stringify({ ...shop, ...payload }));
            } catch {}
            if (shouldAllowAll) {
                toast.success(`✅ ${shop.name}: All pages have been Enabled`);
            } else {
                toast.error(`🔒 ${shop.name}: All pages have been Locked`);
            }
        } catch (err) {
            toast.error('Failed to update page permissions');
        } finally {
            setUpdatingId(null);
        }
    };

    // Global Select All / Uncheck All for all branches
    const handleBulkApproval = async (shouldApprove) => {
        setLoading(true);
        try {
            await Promise.all(shops.map(s => {
                const sId = s._id || s.id;
                return updateShopApproval(sId, {
                    isEditApproved: shouldApprove ? 1 : 0,
                    isDeleteApproved: shouldApprove ? 1 : 0,
                    approvalStatus: shouldApprove ? 'APPROVED' : 'LOCKED',
                    approvalNotes: shouldApprove ? 'Bulk Approved by Super Admin' : 'Bulk Locked by Super Admin',
                    allowedPages: shouldApprove ? ALL_BRANCH_PAGE_KEYS : []
                });
            }));
            await loadShops();
            if (shouldApprove) {
                toast.success('All branches and all pages approved successfully!');
            } else {
                toast.error('All branches locked successfully!');
            }
        } catch (err) {
            toast.error('Failed bulk update');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            {/* Header Card (Updated from Black to Clean Gray & White Theme) */}
            <div className="bg-gradient-to-r from-gray-100 via-slate-100 to-gray-200 p-5 sm:p-7 rounded-[2rem] text-gray-900 shadow-md border-2 border-gray-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-white rounded-2xl border-2 border-gray-300 text-emerald-700 shadow-xs shrink-0">
                        <ShieldCheck className="w-9 h-9" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
                                Role &amp; Branch Page Permissions
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Super Admin Authorization Control
                            </span>
                        </div>
                        <p className="text-gray-600 font-bold text-xs mt-1 max-w-2xl leading-relaxed">
                            Control which pages and modules each branch can access. Check a page's checkbox to allow the Shop Admin to work in it. Uncheck to lock the page completely.
                        </p>
                    </div>
                </div>

                {/* Quick Bulk Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => handleBulkApproval(true)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                        <CheckSquare className="w-4 h-4" />
                        <span>Select All (Approve All)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleBulkApproval(false)}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                        <Square className="w-4 h-4" />
                        <span>Uncheck All (Lock All)</span>
                    </button>
                    <button
                        type="button"
                        onClick={loadShops}
                        className="p-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl transition-all cursor-pointer shadow-xs"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Instruction Notice Banner */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4 text-emerald-950 text-xs font-bold shadow-xs flex-wrap">
                <div className="flex items-center gap-2.5">
                    <span className="text-lg">💡</span>
                    <span>
                        <strong>How to use:</strong> Each branch below has its own list of pages. Check the box for any page you want to allow. Unchecked pages will be locked so the branch Shop Admin cannot do anything in them.
                    </span>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 border border-emerald-300">
                    Active Branches: {shops.length}
                </span>
            </div>

            {/* 3 Branches Main Cards with Per-Page Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {shops.map((shop, idx) => {
                    const sId = shop._id || shop.id;
                    const isChecked = shop.approvalStatus !== 'LOCKED' && Number(shop.isEditApproved) !== 0 && Number(shop.isDeleteApproved) !== 0;
                    const isEditAllowed = shop.approvalStatus !== 'LOCKED' && Number(shop.isEditApproved) !== 0;
                    const isDeleteAllowed = shop.approvalStatus !== 'LOCKED' && Number(shop.isDeleteApproved) !== 0;
                    const isUpdating = updatingId === sId;

                    const allowedPages = getShopAllowedPages(shop);
                    const allowedCount = allowedPages.length;
                    const totalPages = BRANCH_PAGES.length;

                    return (
                        <div
                            key={sId || idx}
                            className={`rounded-3xl border-2 transition-all p-5 sm:p-6 space-y-5 bg-white relative shadow-rich flex flex-col justify-between ${
                                isChecked
                                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                    : 'border-zinc-300 hover:border-zinc-400'
                            }`}
                        >
                            {/* Branch Top Identifier */}
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-md shrink-0 ${
                                            isChecked
                                                ? 'bg-gradient-to-br from-emerald-600 to-[#186337]'
                                                : 'bg-zinc-700'
                                        }`}>
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-base sm:text-lg text-zinc-900 uppercase tracking-tight truncate">
                                                {shop.name}
                                            </h3>
                                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider truncate">
                                                Branch #{String(sId)} • {shop.address || 'Global Store'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Open Portal Link */}
                                    <button
                                        type="button"
                                        onClick={() => window.open(`/shop/${sId}`, '_blank')}
                                        className="p-2 bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-700 rounded-xl transition-all cursor-pointer border border-zinc-200 shrink-0"
                                        title="Open Branch Portal"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* ─── MASTER APPROVAL CHECKBOX FOR THIS BRANCH ─── */}
                                <div
                                    onClick={() => !isUpdating && handleToggleBranchCheckbox(shop, isChecked)}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                                        isChecked
                                            ? 'bg-emerald-50/90 border-emerald-400 shadow-sm'
                                            : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Styled Master Checkbox */}
                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black transition-all shrink-0 ${
                                            isChecked
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                                                : 'border-2 border-zinc-400 bg-white'
                                        }`}>
                                            {isChecked && <Check className="w-4 h-4 stroke-[3.5]" />}
                                        </div>

                                        <div>
                                            <div className="font-black text-sm uppercase tracking-wide text-zinc-900 flex items-center gap-1.5">
                                                <span>Master Approval</span>
                                                <span className={`text-[8.5px] font-black uppercase px-2 py-0.2 rounded-full border ${
                                                    isChecked
                                                        ? 'bg-emerald-200 text-emerald-900 border-emerald-300'
                                                        : 'bg-rose-100 text-rose-800 border-rose-300'
                                                }`}>
                                                    {isChecked ? 'Approved ✓' : 'No Approval ✕'}
                                                </span>
                                            </div>
                                            <div className="text-[10px] font-semibold text-zinc-500 mt-0.5">
                                                {isChecked ? 'Checked — Full Access Granted' : 'Unchecked — Locked'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        {isChecked ? (
                                            <span className="text-emerald-700 font-black text-xs uppercase">Active</span>
                                        ) : (
                                            <span className="text-zinc-400 font-bold text-xs uppercase">Locked</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Granular Sub-Checkboxes (Edit & Delete Operations) */}
                            <div className="pt-2 border-t border-zinc-100 space-y-2">
                                <span className="text-[9.5px] font-black uppercase text-zinc-400 tracking-wider block">
                                    Record Operations Permissions:
                                </span>

                                <div className="grid grid-cols-2 gap-2">
                                    {/* Edit Checkbox */}
                                    <div
                                        onClick={() => handleToggleGranular(shop, 'isEditApproved')}
                                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 select-none ${
                                            isEditAllowed
                                                ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                                                : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                                            isEditAllowed ? 'bg-emerald-600 text-white' : 'border border-zinc-400 bg-white'
                                        }`}>
                                            {isEditAllowed && <Check className="w-3 h-3 stroke-[3]" />}
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[10px] font-black uppercase block truncate">Edit Bills</span>
                                            <span className="text-[8px] font-bold text-zinc-400 block">{isEditAllowed ? 'Allowed' : 'Locked'}</span>
                                        </div>
                                    </div>

                                    {/* Delete Checkbox */}
                                    <div
                                        onClick={() => handleToggleGranular(shop, 'isDeleteApproved')}
                                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 select-none ${
                                            isDeleteAllowed
                                                ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                                                : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                                            isDeleteAllowed ? 'bg-emerald-600 text-white' : 'border border-zinc-400 bg-white'
                                        }`}>
                                            {isDeleteAllowed && <Check className="w-3 h-3 stroke-[3]" />}
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[10px] font-black uppercase block truncate">Delete Bills</span>
                                            <span className="text-[8px] font-bold text-zinc-400 block">{isDeleteAllowed ? 'Allowed' : 'Locked'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ─── PER-PAGE CHECKBOXES FOR THIS BRANCH (Gray & White, Snug & Compact) ─── */}
                            <div className="pt-2.5 border-t border-gray-100 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-800 block">
                                            Branch Pages Checkboxes:
                                        </span>
                                        <span className="text-[9px] font-bold text-gray-400 block">
                                            Check to allow, uncheck to lock
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleBulkPagesForBranch(shop, true)}
                                            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[9px] font-black uppercase tracking-wider border border-emerald-200 transition-all cursor-pointer"
                                            title="Allow all pages for this branch"
                                        >
                                            All ✓
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleBulkPagesForBranch(shop, false)}
                                            className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-[9px] font-black uppercase tracking-wider border border-rose-200 transition-all cursor-pointer"
                                            title="Lock all pages for this branch"
                                        >
                                            None ✕
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-200/90 text-[10px] font-bold text-gray-600">
                                    <span>Active Pages Count:</span>
                                    <span className={`px-2 py-0.5 rounded-md font-black text-[9px] uppercase ${
                                        allowedCount === totalPages
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : allowedCount > 0
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-rose-100 text-rose-800'
                                    }`}>
                                        {allowedCount} / {totalPages} Pages Allowed
                                    </span>
                                </div>

                                {/* List of All Branch Pages with Checkboxes - Clean Gray & White Frame, Compact Spacing */}
                                <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-2 max-h-[380px] overflow-y-auto space-y-1 scrollbar-thin">
                                    {BRANCH_PAGES.map((page) => {
                                        const PageIcon = page.icon;
                                        const isPageAllowed = allowedPages.includes(page.key);
                                        const isPageUpdating = updatingId === `${sId}-page-${page.key}`;

                                        return (
                                            <div
                                                key={page.key}
                                                onClick={() => !isPageUpdating && handleTogglePageCheckbox(shop, page.key)}
                                                className={`py-1.5 px-2 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${
                                                    isPageAllowed
                                                        ? 'bg-white hover:bg-emerald-50/30 border-gray-200 hover:border-emerald-400 shadow-2xs'
                                                        : 'bg-gray-100/70 hover:bg-white hover:border-gray-300 border-gray-200/70 opacity-65'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    {/* Page Checkbox (Right next to icon & label) */}
                                                    <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center font-black transition-all shrink-0 ${
                                                        isPageAllowed
                                                            ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-400'
                                                            : 'border-2 border-gray-400 bg-white'
                                                    }`}>
                                                        {isPageAllowed && <Check className="w-3 h-3 stroke-[3.5]" />}
                                                    </div>

                                                    <div className="p-1 bg-gray-100 rounded-md text-gray-600 shrink-0">
                                                        <PageIcon className="w-3 h-3" />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-bold text-[10.5px] text-gray-900 truncate leading-tight">
                                                            {page.label}
                                                        </div>
                                                        <div className="text-[8px] text-gray-400 truncate leading-tight">
                                                            {page.path}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="shrink-0">
                                                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${
                                                        isPageAllowed
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                        {isPageAllowed ? 'Allowed' : 'Locked'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Card Footer Status */}
                            <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-zinc-500 border-t border-zinc-100">
                                <span>Status: {isChecked ? '✅ Active' : '🔒 Restricted'}</span>
                                <button
                                    type="button"
                                    onClick={() => handleToggleBranchCheckbox(shop, isChecked)}
                                    className={`px-3 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        isChecked
                                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                    }`}
                                >
                                    {isChecked ? 'Lock Branch' : 'Approve Branch'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Comprehensive Table of All Branch Approvals & Pages */}
            <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-rich overflow-hidden">
                <div className="p-6 bg-zinc-50/80 border-b border-zinc-200 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="text-lg font-black uppercase text-zinc-900 tracking-tight">
                            Branch Approval Matrix
                        </h2>
                        <p className="text-xs text-zinc-500 font-bold mt-0.5">
                            Real-time permissions and page checkboxes check for all active shop locations
                        </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-xs font-black uppercase bg-zinc-200 text-zinc-800">
                        {shops.length} Registered Branches
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-zinc-100/80 text-[10px] font-black text-zinc-600 uppercase tracking-wider border-b border-zinc-200">
                            <tr>
                                <th className="p-3.5 text-center w-12">#</th>
                                <th className="p-3.5">Branch Name &amp; Location</th>
                                <th className="p-3.5 text-center">Approval Checkbox</th>
                                <th className="p-3.5 text-center">Approval Status</th>
                                <th className="p-3.5 text-center">Edit Permission</th>
                                <th className="p-3.5 text-center">Delete Permission</th>
                                <th className="p-3.5 text-center">Allowed Pages</th>
                                <th className="p-3.5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-xs font-bold text-zinc-800">
                            {shops.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-zinc-400 uppercase font-black">
                                        No branches registered in the network.
                                    </td>
                                </tr>
                            ) : (
                                shops.map((shop, idx) => {
                                    const sId = shop._id || shop.id;
                                    const isChecked = shop.approvalStatus !== 'LOCKED' && Number(shop.isEditApproved) !== 0 && Number(shop.isDeleteApproved) !== 0;
                                    const isEditAllowed = shop.approvalStatus !== 'LOCKED' && Number(shop.isEditApproved) !== 0;
                                    const isDeleteAllowed = shop.approvalStatus !== 'LOCKED' && Number(shop.isDeleteApproved) !== 0;
                                    const allowedPages = getShopAllowedPages(shop);

                                    return (
                                        <tr key={sId || idx} className="hover:bg-zinc-50/80 transition-colors">
                                            <td className="p-3.5 text-center font-black text-zinc-400">{idx + 1}</td>
                                            <td className="p-3.5">
                                                <div className="font-black text-zinc-900 text-sm uppercase">{shop.name}</div>
                                                <div className="text-[10px] text-zinc-400 font-bold">{shop.address || 'Global Store'} {shop.contactNumber && `• ${shop.contactNumber}`}</div>
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleBranchCheckbox(shop, isChecked)}
                                                    className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center font-black transition-all cursor-pointer ${
                                                        isChecked
                                                            ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
                                                            : 'border-2 border-zinc-400 bg-white hover:border-zinc-600'
                                                    }`}
                                                    title={isChecked ? "Click to uncheck (Revoke Approval)" : "Click to check (Grant Approval)"}
                                                >
                                                    {isChecked ? <Check className="w-5 h-5 stroke-[3.5]" /> : null}
                                                </button>
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                    isChecked
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                        : 'bg-rose-50 text-rose-800 border-rose-300'
                                                }`}>
                                                    {isChecked ? '✅ Approved' : '🔒 Locked'}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase ${
                                                    isEditAllowed ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-zinc-100 text-zinc-500'
                                                }`}>
                                                    {isEditAllowed ? 'Allowed' : 'Locked'}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase ${
                                                    isDeleteAllowed ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-zinc-100 text-zinc-500'
                                                }`}>
                                                    {isDeleteAllowed ? 'Allowed' : 'Locked'}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                                                    allowedPages.length === ALL_BRANCH_PAGE_KEYS.length
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                        : allowedPages.length > 0
                                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                        : 'bg-rose-50 text-rose-800 border-rose-200'
                                                }`}>
                                                    {allowedPages.length} / {ALL_BRANCH_PAGE_KEYS.length} Pages
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleBranchCheckbox(shop, isChecked)}
                                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                            isChecked
                                                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                                        }`}
                                                    >
                                                        {isChecked ? 'Uncheck' : 'Check (Approve)'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => window.open(`/shop/${sId}`, '_blank')}
                                                        className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-all cursor-pointer border border-zinc-200"
                                                        title="Open Branch"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
