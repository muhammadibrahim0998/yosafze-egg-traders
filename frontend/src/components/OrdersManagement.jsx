import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Eye, Trash2, CheckCircle2, Clock, X, RefreshCw,
  Truck, Home, XCircle, CreditCard, MapPin, Phone, User as UserIcon
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useProducts } from '../contexts/ProductContext';
import { getShopOrders, updateOrderStatus, deleteOrder } from '../services/api';

const PAYMENT_BADGE = {
  PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  PAID: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  FAILED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

const ORDER_BADGE = {
  PROCESSING: 'bg-[#1E293B] text-blue-400 border-blue-500/20',
  SHIPPED: 'bg-[#1E293B] text-indigo-400 border-indigo-500/20',
  DELIVERED: 'bg-[#1E293B] text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-[#1E293B] text-rose-400 border-rose-500/20',
};

const fmt = (n) => `Rs. ${(n || 0).toLocaleString('en-PK')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

export function OrdersManagement() {
  const { user, isSuperAdmin } = useUser();
  const { fetchData } = useProducts() || {};
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null); // order currently being updated
  const [viewOrder, setViewOrder] = useState(null); // full order view modal
  const [deleteTarget, setDeleteTarget] = useState(null); // delete confirmation
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (paymentFilter !== 'ALL') params.paymentStatus = paymentFilter;
      if (statusFilter !== 'ALL') params.orderStatus = statusFilter;
      const data = await getShopOrders(params);
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [paymentFilter, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleTogglePayment = async (order) => {
    const next = order.paymentStatus === 'PAID' ? 'PENDING' : 'PAID';
    setBusyId(order._id);
    try {
      const data = await updateOrderStatus(order._id, { paymentStatus: next });
      setOrders(prev => prev.map(o => o._id === order._id ? data.order : o));
      if (fetchData) fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payment status');
    } finally {
      setBusyId(null);
    }
  };

  const handleOrderStatusChange = async (order, orderStatus) => {
    setBusyId(order._id);
    try {
      const data = await updateOrderStatus(order._id, { orderStatus });
      setOrders(prev => prev.map(o => o._id === order._id ? data.order : o));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget._id);
    try {
      await deleteOrder(deleteTarget._id);
      setOrders(prev => prev.filter(o => o._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete order');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-[var(--color-surface-card)] rounded-xl border border-[var(--color-border-subtle)] shadow-sm p-6 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-[var(--color-border-subtle)]">
        <div className="space-y-1.5">
          <h3 className="text-xl font-black text-[var(--color-text-primary)] tracking-tighter flex items-center gap-3 uppercase">
            Customer Orders
            <span className="text-[9px] font-black bg-green-600/10 text-[var(--color-primary)] px-2.5 py-0.5 rounded-full border border-green-600/20 uppercase tracking-widest">
              {orders.length} Orders
            </span>
          </h3>
          <div className="text-[9px] text-[var(--color-text-muted)] font-black uppercase tracking-[0.3em]">
            Review payments & manage delivery status
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
          >
            <option value="ALL">All Payments</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
          >
            <option value="ALL">All Delivery</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs font-bold text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[var(--color-surface-base)] rounded-[2rem] border-2 border-dashed border-[var(--color-border-subtle)] text-center space-y-4">
          <Package className="w-12 h-12 text-zinc-300" />
          <p className="text-lg font-black text-[var(--color-text-primary)] uppercase tracking-tighter">No Orders Yet</p>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Customer orders will show up here</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border-subtle)]">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-zinc-50/50 border-b border-zinc-100">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Order</th>
                <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Customer</th>
                <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total</th>
                <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Payment</th>
                <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Delivery</th>
                <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date</th>
                <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-xs font-black text-[var(--color-text-primary)]">#{order._id.slice(-6).toUpperCase()}</div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">{order.paymentMethod}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-bold text-[var(--color-text-primary)]">{order.customerId?.fullName || order.shippingDetails?.fullName || '—'}</div>
                    <div className="text-[9px] text-zinc-400">{order.customerId?.phone || order.shippingDetails?.phone || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-black text-green-600 font-mono">{fmt(order.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${PAYMENT_BADGE[order.paymentStatus] || ''}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.orderStatus}
                      disabled={busyId === order._id}
                      onChange={(e) => handleOrderStatusChange(order, e.target.value)}
                      className={`px-2 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer ${ORDER_BADGE[order.orderStatus] || ''}`}
                    >
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase whitespace-nowrap">{fmtDate(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setViewOrder(order)}
                        title="View Full Order"
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTogglePayment(order)}
                        disabled={busyId === order._id}
                        title={order.paymentStatus === 'PAID' ? 'Mark as Pending' : 'Mark as Paid'}
                        className={`p-2 rounded-lg transition-all disabled:opacity-40 ${order.paymentStatus === 'PAID'
                            ? 'text-amber-500 hover:bg-amber-50'
                            : 'text-emerald-500 hover:bg-emerald-50'
                          }`}
                      >
                        {order.paymentStatus === 'PAID' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(order)}
                        title="Delete Order"
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Full Order View Modal */}
      {viewOrder && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setViewOrder(null); }}
        >
          <div className="w-full max-w-lg bg-[var(--color-surface-card)] rounded-2xl shadow-2xl border border-[var(--color-border-subtle)] overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-6 py-4 sticky top-0 bg-[var(--color-surface-card)]">
              <h3 className="font-black text-[var(--color-text-primary)] uppercase tracking-tight">
                Order #{viewOrder._id.slice(-6).toUpperCase()}
              </h3>
              <button onClick={() => setViewOrder(null)} className="p-1.5 hover:bg-zinc-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${PAYMENT_BADGE[viewOrder.paymentStatus] || ''}`}>
                  <CreditCard className="w-3 h-3 inline mr-1" />{viewOrder.paymentStatus}
                </span>
                <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${ORDER_BADGE[viewOrder.orderStatus] || ''}`}>
                  <Truck className="w-3 h-3 inline mr-1" />{viewOrder.orderStatus}
                </span>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Customer</p>
                <div className="flex items-center gap-2 text-zinc-700"><UserIcon className="w-3.5 h-3.5" /> {viewOrder.customerId?.fullName || viewOrder.shippingDetails?.fullName}</div>
                <div className="flex items-center gap-2 text-zinc-700"><Phone className="w-3.5 h-3.5" /> {viewOrder.shippingDetails?.phone}</div>
                <div className="flex items-center gap-2 text-zinc-700"><MapPin className="w-3.5 h-3.5" /> {viewOrder.shippingDetails?.address}, {viewOrder.shippingDetails?.city}</div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Items</p>
                {viewOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-[var(--color-surface-base)] rounded-lg border border-[var(--color-border-subtle)]">
                    <span className="text-xs font-bold text-zinc-700">{it.name} × {it.quantity}</span>
                    <span className="text-xs font-black text-green-600">{fmt(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Total</span>
                <span className="text-lg font-black text-green-600">{fmt(viewOrder.totalAmount)}</span>
              </div>

              {viewOrder.transactionId && (
                <div className="text-xs text-zinc-500">Transaction Ref: <span className="font-mono font-bold text-zinc-700">{viewOrder.transactionId}</span></div>
              )}

              {viewOrder.paymentProof && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Payment Proof</p>
                  <img src={viewOrder.paymentProof} alt="Payment proof" className="w-full max-h-64 object-contain rounded-lg border border-[var(--color-border-subtle)]" />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { handleTogglePayment(viewOrder); setViewOrder(null); }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
                >
                  {viewOrder.paymentStatus === 'PAID' ? 'Mark Pending' : 'Confirm Payment Received'}
                </button>
                <button
                  onClick={() => setViewOrder(null)}
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-black text-[10px] uppercase tracking-widest"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div className="w-full max-w-sm bg-[var(--color-surface-card)] rounded-2xl shadow-2xl border border-[var(--color-border-subtle)] p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-rose-500/10 rounded-full flex items-center justify-center">
              <XCircle className="w-7 h-7 text-rose-500" />
            </div>
            <p className="font-black text-[var(--color-text-primary)] uppercase tracking-tight">Delete this order?</p>
            <p className="text-xs text-zinc-500">Order #{deleteTarget._id.slice(-6).toUpperCase()} will be permanently removed. This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-black text-[10px] uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={busyId === deleteTarget._id}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
              >
                {busyId === deleteTarget._id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}