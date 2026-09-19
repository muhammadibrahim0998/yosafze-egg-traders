import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../schemas/authSchema';
import { useUser } from '../../contexts/UserContext';
import {
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  ShoppingBag,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import companyLogo from '../../image/logo.png';

// 5 Crystal Clear Full HD Farm Egg Basket & Egg Trading Background Images
const EGG_BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1516467508483-a7212febe31a?q=85&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1569288052389-dac9b01c9c05?q=85&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?q=85&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506976785307-8732e854ad03?q=85&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?q=85&w=1920&auto=format&fit=crop'
];

export function LoginView() {
  const { login } = useUser();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentEggIndex, setCurrentEggIndex] = useState(0);

  // Auto rotate egg background every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentEggIndex((prev) => (prev + 1) % EGG_BACKGROUND_IMAGES.length);
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' }
  });

  const onSubmit = async (data) => {
    setError('');
    try {
      await login(data.username, data.password);
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto bg-slate-950 select-none z-50">
      
      {/* ─── FULL CLEAR BACKGROUND EGG PICTURES SLIDESHOW (Z-0) ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {EGG_BACKGROUND_IMAGES.map((imgUrl, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              idx === currentEggIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            } transition-transform duration-[3000ms]`}
            style={{
              backgroundImage: `url("${imgUrl}")`
            }}
          />
        ))}

        {/* Soft dark vignette so eggs are super clear & crisp while text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/75" />
      </div>

      {/* ─── CENTERED COMPACT CLEAN FLOATING LOGIN CARD (Z-10) ─── */}
      <div className="relative z-10 w-full max-w-[390px] animate-in fade-in zoom-in-95 duration-500 my-auto py-2">
        
        {/* Top Logo & Branding Floating Badge */}
        <div className="text-center mb-2.5">
          <div className="inline-flex p-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl mb-1.5 hover:scale-105 transition-transform duration-300 border border-white/50">
            <img
              src={companyLogo}
              alt="Yousafzai Egg Traders"
              className="h-9 sm:h-10 w-auto object-contain drop-shadow-sm"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-black/70 backdrop-blur-md border border-white/20 rounded-full text-emerald-300 text-[9px] font-black uppercase tracking-widest shadow-lg">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Yosafzai Egg Traders • Portal
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="w-full bg-white/95 backdrop-blur-xl rounded-[1.75rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-5 sm:p-6 relative border border-white/60 flex flex-col text-slate-900">
          
          {/* Top Emerald Header Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-b-full shadow-sm" />

          <div className="mb-3.5 text-center">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
              Admin Login
            </h2>
            <p className="text-slate-500 text-[11px] font-semibold mt-1">
              Sign in to your branch session
            </p>
          </div>

          {/* Error Message */}
          {(error || Object.keys(errors).length > 0) && (
            <div className="p-2.5 mb-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-0.5 text-rose-700 text-[11px] font-bold animate-in fade-in">
              {error && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {Object.values(errors).map((err, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 w-full">
            
            {/* Email / Username Input */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">
                Email / Username
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  {...register('username')}
                  type="text"
                  placeholder="Username or Email"
                  className={`w-full bg-slate-50 border ${
                    errors.username ? 'border-rose-400' : 'border-slate-300'
                  } focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-2.5 pl-10 pr-3.5 text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-sm`}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full bg-slate-50 border ${
                    errors.password ? 'border-rose-400' : 'border-slate-300'
                  } focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 rounded-xl py-2.5 pl-10 pr-10 text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-md shadow-emerald-600/30 hover:shadow-emerald-600/40 active:scale-[0.98] transition-all disabled:opacity-50 mt-1 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{isSubmitting ? 'Starting Session...' : 'Start Session'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Customer Portal Button */}
          <div className="mt-3.5 pt-3 border-t border-slate-200/80 text-center space-y-1.5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Are you a Customer?
            </p>
            <Link
              to="/shop"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Register & Shop</span>
            </Link>
          </div>

          {/* Bottom Security Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-center gap-1 text-slate-400 text-[8.5px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Nexus Engine v2.0 • Secure Portal</span>
          </div>
        </div>

        {/* ─── 5 Slide Dots Indicator ─── */}
        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {EGG_BACKGROUND_IMAGES.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => setCurrentEggIndex(dotIdx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                dotIdx === currentEggIndex
                  ? 'w-6 bg-emerald-400 shadow-md shadow-emerald-400/50'
                  : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
              title={`Egg Picture #${dotIdx + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}