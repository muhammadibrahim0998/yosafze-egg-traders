import {
  ShoppingBag, ShoppingCart, Eye, Edit2, Trash2
} from 'lucide-react';
import { useProducts } from '../contexts/ProductContext';
import { useUser } from '../contexts/UserContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function ProductCard({ product, onEdit, onDelete, onView }) {
  const { addToCart } = useProducts();
  const { isShopAdmin, isSuperAdmin } = useUser();
  const navigate = useNavigate();

  const handleView = (e) => {
    e.stopPropagation();
    if (onView) onView(product);
    else navigate(`/product/${product._id}`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(product);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={handleView}
      className="group w-full bg-[#1E293B] border border-slate-700/60 hover:border-emerald-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer select-none"
    >
      {/* Aspect Square Image Container */}
      <div className="relative aspect-square w-full bg-slate-900 overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-slate-700" />
          </div>
        )}

        {/* Category Badge - Top Left */}
        <div className="absolute top-3 left-3 bg-[#111827]/90 px-3 py-1 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest border border-slate-700/80 backdrop-blur-md">
          {product.category || 'Egg'}
        </div>
      </div>

      {/* Item Info & Actions */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-2 text-left">
          <h3 className="font-black text-white text-sm leading-snug line-clamp-1 uppercase tracking-tight group-hover:text-emerald-300 transition-colors">
            {product.name}
          </h3>
          
          {/* Explicit Unit Pricing Breakdown (Peti, Tray, Egg) */}
          {(() => {
            const price = Number(product.price) || 0;
            const unit = product.unitType || 'peti';
            const petiRate = product.pricePerPeti || (unit === 'peti' ? price : unit === 'tray' ? price * 12 : price * 360);
            const trayRate = product.pricePerTray || (unit === 'tray' ? price : unit === 'peti' ? price / 12 : price * 30);
            const eggRate = product.pricePerEgg || (unit === 'egg' ? price : unit === 'tray' ? price / 30 : price / 360);

            return (
              <div className="grid grid-cols-3 gap-1 p-2 bg-slate-900/90 rounded-xl border border-slate-700/80 text-[10px] font-black">
                <div className="text-center border-r border-slate-700/60 pr-1">
                  <span className="text-[7px] text-amber-400 font-bold uppercase block">Peti (Box)</span>
                  <span className="text-white text-[11px]">Rs.{Math.round(petiRate).toLocaleString()}</span>
                </div>
                <div className="text-center border-r border-slate-700/60 px-1">
                  <span className="text-[7px] text-teal-400 font-bold uppercase block">Tray</span>
                  <span className="text-white text-[11px]">Rs.{Math.round(trayRate).toLocaleString()}</span>
                </div>
                <div className="text-center pl-1">
                  <span className="text-[7px] text-emerald-400 font-bold uppercase block">Single Egg</span>
                  <span className="text-white text-[11px]">Rs.{eggRate < 100 ? eggRate.toFixed(1) : Math.round(eggRate)}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-1.5 w-full pt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (product.stock > 0) addToCart(product);
            }}
            className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md border-t border-emerald-400/30 border-b-2 border-emerald-950 active:translate-y-[1px] transition-all cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{isShopAdmin() || isSuperAdmin() ? '+ ADD TO BILL' : '+ Add to Cart'}</span>
          </button>

          <div className="grid grid-cols-3 gap-1.5 w-full">
            <button
              onClick={handleView}
              className="py-1.5 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 border border-slate-600/60 shadow-md active:translate-y-[1px] transition-all cursor-pointer"
              title="View Details"
            >
              <Eye className="w-3 h-3 text-emerald-400" />
              <span>View</span>
            </button>

            <button
              onClick={handleEdit}
              className="py-1.5 px-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-md border-t border-blue-400/30 border-b-2 border-indigo-900 active:translate-y-[1px] transition-all cursor-pointer"
              title="Edit Product"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit</span>
            </button>

            <button
              onClick={handleDelete}
              className="py-1.5 px-1 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-md border-t border-rose-400/30 border-b-2 border-rose-950 active:translate-y-[1px] transition-all cursor-pointer"
              title="Delete Product"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}