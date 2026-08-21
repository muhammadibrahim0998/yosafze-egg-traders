import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProducts } from '../contexts/ProductContext';
import { useUser } from '../contexts/UserContext';
import {
  LayoutDashboard,
  Store,
  AlertTriangle,
  XCircle,
  Settings,
  Users,
  LogOut,
  HelpCircle,
  Moon,
  Sun,
  Menu,
  UserCircle2,
  // Category Icons
  ShoppingBasket,
  Shirt,
  Home,
  Watch,
  Smartphone,
  Layers,
  Footprints,
  Building2,
  Package,
  Search
} from 'lucide-react';
import { useTheme } from 'next-themes';
import companyLogo from '../logo1.jpeg';

export function Sidebar({ isMobileOpen, onCloseMobile, isCollapsed, onToggleSidebar }) {
  const { categories } = useProducts();
  const { user, isSuperAdmin, isShopAdmin, logout } = useUser();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  // Default theme handles hydration, ensure window is defined
  const currentTheme = theme === 'system' && typeof window !== 'undefined'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  const isActive = (path) => location.pathname === path;

  const handleLinkClick = () => {
    if (window.innerWidth < 768 && onCloseMobile) {
      onCloseMobile();
    }
  };

  // Helper to get category-specific icon
  const getCategoryIcon = (category) => {
    const cat = category.toLowerCase();
    if (cat.includes('grocery')) return ShoppingBasket;
    if (cat.includes('apparel') || cat.includes('cloth')) return Shirt;
    if (cat.includes('home') || cat.includes('decor')) return Home;
    if (cat.includes('accessories')) return Watch;
    if (cat.includes('electronic') || cat.includes('tech')) return Smartphone;
    if (cat.includes('footwear') || cat.includes('shoe')) return Footprints;
    if (cat.includes('package') || cat.includes('acc')) return Package;
    return Layers;
  };

  const NavItem = ({ to, icon: Icon, label, alert = false, onClick }) => {
    const active = isActive(to);

    return (
      <Link
        to={to}
        onClick={(e) => {
          handleLinkClick();
          if (onClick) onClick(e);
        }}
        className={`flex items-center group px-3 py-3 mx-4 rounded-2xl text-[13px] font-bold transition-all duration-300 ease-out ${active
          ? "bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-[0_8px_15px_rgba(0,0,0,0.3)] active:translate-y-[2px] active:border-b-0"
          : "text-white/60 hover:text-white hover:bg-[#1B3817] border-t border-t-transparent hover:border-t-white/20 border-b-4 border-b-transparent hover:border-b-[#12290D] hover:shadow-[0_8px_15px_rgba(0,0,0,0.3)] hover:scale-105 active:translate-y-[2px] active:border-b-0"
          } ${isCollapsed ? 'justify-center mx-auto w-12 h-12 px-0' : 'gap-4'}`}
        title={isCollapsed ? label : undefined}
      >
        <div className="relative flex items-center justify-center">
          <Icon className={`w-5 h-5 transition-all duration-300 ${active ? "text-white" : "text-white/60 group-hover:text-white group-hover:scale-110"}`} />
          {alert && (
            <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#111827] ${alert === 'low' ? 'bg-amber-400' : 'bg-red-500'}`}></div>
          )}
        </div>
        <span className={`flex-1 whitespace-nowrap tracking-wide ${isCollapsed ? 'hidden' : ''}`}>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`absolute md:relative top-0 h-full flex flex-col bg-gradient-to-b from-[#2D5A27] via-[#24491F] to-[#1B3817] text-white backdrop-blur-xl transition-[transform,width] duration-300 ease-[cubic-bezier(0.4,0,0,2,1)] transform-gpu will-change-transform border-r border-white/10 z-[100] md:z-20 overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.3)] ${isCollapsed ? 'w-16' : 'w-56'
          } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >

        {/* Company Logo & Brand */}
        {!isCollapsed && (
          <Link to={(isSuperAdmin() || isShopAdmin()) ? '/' : '/shop'} className="mx-4 mb-3 mt-2 rounded-2xl flex items-center justify-center gap-2 px-3 py-2.5 bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/20 transition-all cursor-pointer">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shrink-0 border border-white/30 shadow p-0.5">
              <img src={companyLogo} alt="Yousafzai Agri Foods" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-black text-yellow-300 uppercase tracking-tight leading-none truncate">
                {user?.role === 'super_admin'
                  ? 'SUPER ADMIN'
                  : (user?.fullName || 'SHOP ADMIN').toUpperCase()}
              </span>
              <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest leading-tight mt-0.5">EGGS TRADERS</span>
            </div>
          </Link>
        )}
        {isCollapsed && (
          <Link to={(isSuperAdmin() || isShopAdmin()) ? '/' : '/shop'} className="mx-auto mb-3 mt-2 w-10 h-10 rounded-xl overflow-hidden bg-white border border-white/30 shadow block hover:scale-105 transition-transform cursor-pointer">
            <img src={companyLogo} alt="Attock Shop" className="w-full h-full object-contain" />
          </Link>
        )}

        {/* User Profile */}
        <div className={`mx-4 mb-6 rounded-2xl flex items-center ${isCollapsed ? 'justify-center mx-auto w-12 h-12' : 'px-4 py-3 gap-4'} transition-all duration-300 border border-white/10 bg-white/5 backdrop-blur-sm shadow-inner`}>
          <div className="relative">
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#111827] rounded-full shadow-sm"></div>
            <UserCircle2 className="w-8 h-8 text-green-300" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
              <span className="text-xs font-bold text-white truncate leading-tight" title={user?.fullName || user?.username || 'User'}>
                {user?.fullName || user?.username || 'System User'}
              </span>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider mt-0.5 truncate">
                {user?.role?.replace('_', ' ') || "Staff"}
              </span>
            </div>
          )}
        </div>


        {/* Navigation Main Block */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-2">

          <div className="mb-6">
            <div className="space-y-1">
              {/* Everyone but pure cashier sees Dashboard */}
              {(isShopAdmin() || isSuperAdmin()) && (
                <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              )}

              {/* Cashiers only need POS/Store. Admins see everything */}
              {!isSuperAdmin() && (
                <NavItem to="/store" icon={Store} label="All Products" />
              )}

              {/* Only Shop Admin & Super Admin can manage teams */}
              {isShopAdmin() && (
                <NavItem to="/team" icon={Users} label="Team Management" />
              )}
            </div>
          </div>

          {/* Categories Section (Only if filtering makes sense, mapped logically to "Order History/Sales" from img) */}
          {!isSuperAdmin() && categories.filter(c => c !== "All").length > 0 && (
            <div className="mb-6">
              {!isCollapsed && (
                <p className="px-8 text-[11px] font-bold text-white/30 mb-4 tracking-wider uppercase">Categories</p>
              )}
              <div className="space-y-1">
                {categories.filter(c => c !== "All").map(cat => {
                  const active = isActive(`/store/category/${cat}`);
                  return (
                    <Link
                      key={cat}
                      to={`/store/category/${cat}`}
                      onClick={handleLinkClick}
                      className={`flex items-center group px-3 py-2.5 mx-4 rounded-xl text-[13px] font-bold transition-all duration-300 ease-out ${active
                        ? "bg-[#1B3817] text-white border-t border-t-white/20 border-b-4 border-b-[#12290D] shadow-[0_8px_15px_rgba(0,0,0,0.3)] active:translate-y-[2px] active:border-b-0"
                        : "text-white/60 hover:text-white hover:bg-[#1B3817] border-t border-t-transparent hover:border-t-white/20 border-b-4 border-b-transparent hover:border-b-[#12290D] hover:shadow-[0_8px_15px_rgba(0,0,0,0.3)] hover:scale-105 active:translate-y-[2px] active:border-b-0"
                        } ${isCollapsed ? 'justify-center mx-auto w-10 h-10 px-0' : 'gap-4'}`}
                      title={isCollapsed ? cat : undefined}
                    >
                      <div className="relative flex items-center justify-center w-5 h-5">
                        {(() => {
                          const CategoryIcon = getCategoryIcon(cat);
                          return <CategoryIcon className={`w-4 h-4 transition-all duration-300 ${active ? "text-white" : "text-white/60 group-hover:text-white group-hover:scale-110"}`} />;
                        })()}
                      </div>
                      {!isCollapsed && <span className="capitalize whitespace-nowrap tracking-wide">{cat}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Health / Notifications like in image */}
          {!isSuperAdmin() && (
            <div className="mb-6">
              {!isCollapsed && (
                <p className="px-8 text-[11px] font-bold text-white/30 mb-4 tracking-wider uppercase">Notifications</p>
              )}
              <div className="space-y-1">
                <NavItem to="/store/status/low" icon={AlertTriangle} label="Low Stock" alert="low" />
                <NavItem to="/store/status/out" icon={XCircle} label="Out of Stock" alert="high" />
              </div>
            </div>
          )}

          {/* Settings / Footer Area - now part of the scroll flow */}
          <div className="pb-6 pt-4 border-t border-white/10 mt-4">
            {!isCollapsed && (
              <p className="px-8 text-[11px] font-bold text-white/30 mb-4 tracking-wider uppercase">Settings</p>
            )}

            <div className="space-y-1">
              <NavItem to="/help" icon={HelpCircle} label="Help" />
              {(isShopAdmin() || isSuperAdmin()) && (
                <NavItem to="/settings" icon={Settings} label="Settings" />
              )}
              <NavItem to="#" icon={LogOut} label="Logout" onClick={logout} />
            </div>

          </div>
        </div>
      </aside>
    </>
  );
}
