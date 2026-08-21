import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import CreatableSelect from 'react-select/creatable';
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "../schemas/productSchema";
import { X, Plus, Upload, Loader2, Trash2, AlertCircle, ShoppingBag, ShieldCheck, Calendar, Link as LinkIcon, Star } from "lucide-react";
import { uploadImages } from "../services/api";
import { toast } from "sonner";

export function ProductModal({ isOpen, onClose, onSave, product, mode, categories = [] }) {
  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "", category: "", stock: 0, minStock: 0, price: 0, costPrice: 0,
      images: [], description: "", mfgDate: "", expiryDate: ""
    }
  });

  const [uploading, setUploading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const fileInputRef = useRef(null);

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (images.length >= 5) return;
    const url = imageUrlInput.trim();
    if (!url.startsWith('http')) return; // Basic validation
    setValue("images", [...images, url]);
    setImageUrlInput("");
    if (images.length === 0) setSelectedImageIndex(0);
  };

  const images = watch("images") || [];
  const currentCategory = watch("category");

  // Sync form with product prop
  useEffect(() => {
    if (isOpen) {
      if (product && mode !== "add") {
        reset({
          name: product.name || "",
          category: product.category || "",
          stock: product.stock || 0,
          minStock: product.minStock || 0,
          price: product.price || 0,
          costPrice: product.costPrice || 0,
          images: product.images || [],
          description: product.description || "",
          mfgDate: product.mfgDate ? new Date(product.mfgDate).toISOString().split('T')[0] : "",
          expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : "",
        });
      } else {
        reset({
          name: "",
          category: product?.category || "",
          stock: 0,
          minStock: 0,
          price: 0,
          costPrice: 0,
          images: [],
          description: "",
          mfgDate: "",
          expiryDate: ""
        });
      }
      setSelectedImageIndex(0);
    }
  }, [product, mode, isOpen, categories, reset]);

  const onSubmit = (data) => {
    const payload = {
      ...data,
      name: data.name?.trim() || product?.name || "",
      category: data.category || currentCategory || product?.category || "",
      images: images && images.length > 0 ? images : (product?.images || []),
      price: parseFloat(data.price) ?? product?.price ?? 0,
      stock: parseFloat(data.stock) ?? product?.stock ?? 0,
      minStock: parseFloat(data.minStock) ?? product?.minStock ?? 0,
      costPrice: parseFloat(data.costPrice) ?? product?.costPrice ?? 0,
      description: data.description ?? "",
      lastUpdated: new Date().toISOString().split("T")[0],
    };

    if (!data.mfgDate) delete payload.mfgDate;
    if (!data.expiryDate) delete payload.expiryDate;

    onSave(payload);
    onClose();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploading(true);
      const newImageUrls = await uploadImages(files);
      setValue("images", [...images, ...newImageUrls].slice(0, 5));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message || "Image upload failed.";
      console.error("[ProductModal] Upload error:", errMsg, error);
      toast.error(`Upload failed: ${errMsg}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      {/* Small Compact Responsive Card Modal */}
      <div className="relative w-full max-w-[400px] bg-[#1E293B] border border-slate-700/80 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden z-10 mx-auto flex flex-col max-h-[88vh] text-white">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 bg-slate-900/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-white italic uppercase">
                {mode === "add" ? "Add Product" : mode === "edit" ? "Edit Product" : "View Product"}
              </h2>
              <p className="text-[9px] font-bold text-emerald-400/90 uppercase tracking-wider">Inventory Management</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white border border-slate-700/60 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700 flex-1">

          {/* Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Product Name *</label>
            <input
              {...register("name")}
              disabled={mode === "view"}
              className={`w-full bg-slate-800/90 border ${errors.name ? 'border-rose-500' : 'border-slate-700'} rounded-xl py-2 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-500`}
              placeholder="e.g., Super Jumbo 79gm"
            />
            {errors.name && <p className="text-rose-400 text-[10px] font-bold pl-1 uppercase mt-0.5">{errors.name.message}</p>}
          </div>

          {/* Category & Price Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Category</label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <CreatableSelect
                    {...field}
                    isClearable
                    isDisabled={mode === 'view'}
                    options={categories.filter(c => c !== "All").map(c => ({ value: c, label: c }))}
                    onChange={(val) => field.onChange(val ? val.value : "")}
                    onCreateOption={(inputValue) => field.onChange(inputValue)}
                    value={field.value ? { label: field.value, value: field.value } : null}
                    placeholder="Category..."
                    classNamePrefix="nexus-select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        backgroundColor: '#1e293b',
                        borderRadius: "0.75rem",
                        minHeight: "36px",
                        fontSize: "11px",
                        borderColor: errors.category ? '#f43f5e' : (state.isFocused ? '#10b981' : '#334155'),
                        fontWeight: 'bold',
                        color: '#fff',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#10b981' }
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: '#0f172a',
                        borderRadius: "0.75rem",
                        fontSize: "11px",
                        border: '1px solid #334155',
                        overflow: 'hidden',
                        zIndex: 50
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? '#065f46' : 'transparent',
                        color: '#fff',
                        fontSize: "11px",
                        cursor: 'pointer'
                      }),
                      singleValue: (base) => ({ ...base, color: '#fff' }),
                      input: (base) => ({ ...base, color: '#fff' }),
                    }}
                  />
                )}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Price (RS) *</label>
              <input
                type="number"
                step="any"
                {...register("price")}
                disabled={mode === "view"}
                className={`w-full bg-slate-800/90 border ${errors.price ? 'border-rose-500' : 'border-slate-700'} rounded-xl py-2 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all`}
              />
              {errors.price && <p className="text-rose-400 text-[10px] font-bold pl-1 uppercase mt-0.5">{errors.price.message}</p>}
            </div>
          </div>

          {/* Stock & Min Stock Grid */}
          <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stock</label>
              <input type="number" step="any" {...register("stock")} disabled={mode === "view"} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-2.5 text-xs font-bold text-white outline-none focus:border-emerald-500 transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min. Alert</label>
              <input type="number" step="any" {...register("minStock")} disabled={mode === "view"} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-2.5 text-xs font-bold text-white outline-none focus:border-emerald-500 transition-all" />
            </div>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-emerald-950/30 rounded-xl border border-emerald-800/40">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Mfg. Date</label>
              <input type="date" {...register("mfgDate")} disabled={mode === "view"} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1 px-2 text-[11px] font-bold text-white outline-none focus:border-emerald-500 transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Expiry Date</label>
              <input type="date" {...register("expiryDate")} disabled={mode === "view"} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1 px-2 text-[11px] font-bold text-white outline-none focus:border-emerald-500 transition-all" />
            </div>
          </div>

          {/* Image Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pl-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gallery ({images.length}/5)</label>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {images.map((img, idx) => (
                <div key={idx} className={`relative shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${selectedImageIndex === idx ? 'border-emerald-500 shadow-md shadow-emerald-500/20' : 'border-slate-700 opacity-60 hover:opacity-100'}`} onClick={() => setSelectedImageIndex(idx)}>
                  <img src={img} className="w-full h-full object-cover" />
                  {mode !== "view" && idx !== 0 && (
                    <button type="button" title="Set as Primary" onClick={(e) => {
                      e.stopPropagation();
                      const newImages = [...images];
                      const [moved] = newImages.splice(idx, 1);
                      newImages.unshift(moved);
                      setValue("images", newImages);
                      setSelectedImageIndex(0);
                    }} className="absolute bottom-0.5 left-0.5 bg-black/70 text-white rounded p-0.5 hover:text-amber-400">
                      <Star className="w-2.5 h-2.5" />
                    </button>
                  )}
                  {mode !== "view" && (
                    <button type="button" title="Delete Image" onClick={(e) => {
                      e.stopPropagation();
                      const newImages = images.filter((_, i) => i !== idx);
                      setValue("images", newImages);
                      if (selectedImageIndex >= newImages.length) setSelectedImageIndex(Math.max(0, newImages.length - 1));
                    }} className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded p-0.5 hover:scale-110">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
              {mode !== "view" && images.length < 5 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-12 h-12 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center bg-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all shrink-0">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </button>
              )}
            </div>

            {mode !== "view" && images.length < 5 && (
              <div className="flex gap-1.5 relative">
                <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  placeholder="Image URL..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl py-1.5 pl-8 pr-2 text-[10px] font-bold text-white outline-none focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={!imageUrlInput.trim()}
                  className="px-2.5 bg-slate-700 hover:bg-slate-600 text-white font-black text-[9px] uppercase tracking-wider rounded-xl border border-slate-600 transition-all disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Description</label>
            <textarea {...register("description")} disabled={mode === "view"} className="w-full bg-slate-800/90 border border-slate-700 rounded-xl py-1.5 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500 transition-all min-h-[45px] resize-none placeholder:text-slate-500" placeholder="Product details..." />
          </div>
        </form>

        {/* Footer */}
        <div className="p-3 border-t border-slate-700/60 bg-slate-900/60 flex gap-2 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all active:scale-95">
            {mode === "view" ? "Close" : "Cancel"}
          </button>
          {mode !== "view" && (
            <button type="button" onClick={handleSubmit(onSubmit, (errs) => console.error('[Form Validation Error]', errs))} className="flex-[1.5] py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-emerald-950 transition-all active:scale-95 border-t border-emerald-400/30">
              {mode === "add" ? "Create Product" : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}