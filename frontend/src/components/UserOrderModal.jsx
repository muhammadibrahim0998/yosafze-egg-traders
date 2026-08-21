// UserOrderModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useCustomerAuth } from '../contexts/CustomerAuthContext.jsx';

// ---------- Helpers ----------
const PAYMENT_STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  PAID: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  FAILED: 'bg-rose-100 text-rose-800 border-rose-200',
};

const ORDER_STATUS_COLORS = {
  PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
  SHIPPED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
};

const getBadgeClass = (map, value) =>
  map[value] || 'bg-slate-100 text-slate-800 border-slate-200';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatCurrency = (amount) => 'Rs. ' + (amount || 0).toLocaleString('en-PK');

const getProductSummary = (items) => {
  if (!items || items.length === 0) return '—';
  return items.map((p) => `${p.name} (${p.quantity})`).join(', ');
};

// ---------- Main Component ----------
export default function UserOrderModal({ setOrderOpen }) {
  const { getMyOrders } = useCustomerAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getMyOrders]);

  const openModal = () => {
    setIsOpen(true);
    fetchOrders();
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedOrder(null);
    document.body.style.overflow = '';
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) closeModal();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const renderModal = () => {
    if (!isOpen) return null;

    let tableRows = null;
    if (!loading && !error && orders.length > 0) {
      tableRows = orders.map((order) => (
        <tr
          key={order._id}
          className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer"
          onClick={() => setSelectedOrder(order)}
        >
          <td className="px-4 py-3 text-sm font-mono font-medium text-slate-700 whitespace-nowrap">
            #{order._id.slice(-6).toUpperCase()}
          </td>
          <td
            className="px-4 py-3 text-sm text-slate-600 max-w-[180px] truncate"
            title={getProductSummary(order.items)}
          >
            {getProductSummary(order.items)}
          </td>
          <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
            {formatCurrency(order.totalAmount)}
          </td>
          <td className="px-4 py-3">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getBadgeClass(PAYMENT_STATUS_COLORS, order.paymentStatus)}`}>
              {order.paymentStatus}
            </span>
          </td>
          <td className="px-4 py-3">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getBadgeClass(ORDER_STATUS_COLORS, order.orderStatus)}`}>
              {order.orderStatus}
            </span>
          </td>
          <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
            {formatDate(order.createdAt)}
          </td>
        </tr>
      ));
    }

    return (
      <div
        className="fixed inset-0 z-[999] overflow-y-auto modal-backdrop"
        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div className="fixed inset-0 bg-black/40 transition-opacity"></div>

        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          <div className="modal-enter relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl shadow-black/20 border border-slate-200/60">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">My Orders</h2>
                  <p className="text-xs text-slate-400">
                    {orders.length} order{orders.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close modal"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
                  <p className="mt-4 text-sm text-slate-500">Loading your orders…</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl">⚠️</span>
                  <p className="mt-3 text-sm text-rose-600">{error}</p>
                  <button
                    onClick={fetchOrders}
                    className="mt-4 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100 transition"
                  >
                    Try again
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-5xl">📭</span>
                  <p className="mt-4 text-sm font-medium text-slate-700">No orders yet</p>
                  <p className="text-xs text-slate-400">Your checked‑out orders will appear here.</p>
                </div>
              ) : (
                <div className="order-table-wrap overflow-x-auto rounded-xl border border-slate-200/80">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                      <tr>
                        <th className="px-4 py-3 font-medium">Order ID</th>
                        <th className="px-4 py-3 font-medium">Products</th>
                        <th className="px-4 py-3 font-medium">Total</th>
                        <th className="px-4 py-3 font-medium">Payment</th>
                        <th className="px-4 py-3 font-medium">Delivery</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>{tableRows}</tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200/80 px-5 py-3 sm:px-6 flex justify-end">
              <span className="text-xs text-slate-400">
                Showing {orders.length} order{orders.length !== 1 ? 's' : ''} • Click a row for details
              </span>
            </div>
          </div>
        </div>

        {/* Single Order Detail Overlay */}
        {selectedOrder && (
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrder(null); }}
          >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h3 className="font-semibold text-slate-800">
                  Order #{selectedOrder._id.slice(-6).toUpperCase()}
                </h3>
                <button onClick={() => setSelectedOrder(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-5 py-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status</span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${getBadgeClass(PAYMENT_STATUS_COLORS, selectedOrder.paymentStatus)}`}>{selectedOrder.paymentStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Status</span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${getBadgeClass(ORDER_STATUS_COLORS, selectedOrder.orderStatus)}`}>{selectedOrder.orderStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-medium text-slate-800">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-500 mb-1">Items</p>
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>{it.name} × {it.quantity}</span>
                      <span>{formatCurrency(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between font-semibold text-slate-800">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
                {selectedOrder.shippingDetails && (
                  <div className="pt-2 border-t border-slate-100 text-slate-600">
                    <p>{selectedOrder.shippingDetails.fullName} • {selectedOrder.shippingDetails.phone}</p>
                    <p>{selectedOrder.shippingDetails.address}, {selectedOrder.shippingDetails.city}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="max-w-md w-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
        <button onClick={() => setOrderOpen(false)}
          className="rounded-lg p-1.5 float-end text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close modal"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="mb-4 flex justify-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-3xl">
            🛒
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Your Orders</h2>
        <p className="mt-1 text-sm text-slate-500">View all your checked‑out orders</p>
        <button
          onClick={openModal}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-indigo-300"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Order
        </button>
        <p className="mt-4 text-xs text-slate-400">Click to open order modal</p>
      </div>

      {renderModal()}
    </>
  );
}