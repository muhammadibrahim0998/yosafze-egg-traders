import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import CreatableSelect from 'react-select/creatable';
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "../schemas/productSchema";
import { X, Upload, Loader2, Star, Box, Egg, UserCheck, ImageIcon, Link as LinkIcon, ShieldCheck, Camera, Plus, Banknote, CreditCard, AlertCircle } from "lucide-react";
import { uploadImages } from "../services/api";
import { toast } from "sonner";

export function ProductModal({ isOpen, onClose, onSave, product, mode, categories = [] }) {
  const { register, handleSubmit, reset, setValue, getValues, watch, control, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "", category: "Eggs", stock: 0, minStock: 0, price: 0, costPrice: 0,
      unitType: "peti", traysPerPeti: 12, eggsPerTray: 30,
      petiQuantity: 0, trayQuantity: 0, eggQuantity: 0,
      supplierName: "", totalPurchaseCost: 0, amountPaidToSupplier: 0, dueAmountToSupplier: 0, paymentMethod: "Cash",
      paymentReceipt: "", images: [], description: "", mfgDate: "", expiryDate: ""
    }
  });

  const [uploading, setUploading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const fileInputRef = useRef(null);

  const images = watch("images") || [];
  const currentCategory = watch("category");
  const unitType = watch("unitType") || "peti";

  const watchedPetiQty = watch("petiQuantity") || 0;
  const watchedTrayQty = watch("trayQuantity") || 0;
  const watchedEggQty = watch("eggQuantity") || 0;
  const watchedTraysPerPeti = watch("traysPerPeti") || 12;
  const watchedEggsPerTray = watch("eggsPerTray") || 30;
  const watchedCostPrice = watch("costPrice") || 0;
  const watchedAmountPaid = watch("amountPaidToSupplier") || 0;

  // Live Unit & Stock Conversions
  const eggsPerPeti = (Number(watchedTraysPerPeti) || 12) * (Number(watchedEggsPerTray) || 30);
  const totalEggsCalculated = (Number(watchedPetiQty) * eggsPerPeti) + 
                              (Number(watchedTrayQty) * (Number(watchedEggsPerTray) || 30)) + 
                              Number(watchedEggQty);
  const totalTraysCalculated = (totalEggsCalculated / (Number(watchedEggsPerTray) || 30)).toFixed(1);
  const totalPetisCalculated = (totalEggsCalculated / (eggsPerPeti || 360)).toFixed(2);

  const watchedPrice = watch("price") || 0;

  // Live Supplier Bill & Due Calculations (uses costPrice or sale price as fallback)
  const unitRate = Number(watchedCostPrice) > 0 ? Number(watchedCostPrice) : Number(watchedPrice);
  const calculatedTotalBill = Number(watchedPetiQty) > 0 
    ? (Number(watchedPetiQty) * unitRate) 
    : (totalEggsCalculated > 0 ? (totalEggsCalculated * (unitRate / (eggsPerPeti || 360))) : 0);

  const [hasUserEditedPayment, setHasUserEditedPayment] = useState(false);

  // Auto-sync amountPaidToSupplier with calculatedTotalBill when bill updates ONLY if user hasn't typed a custom amount
  useEffect(() => {
    if (isOpen && mode !== "view" && !hasUserEditedPayment) {
      if (calculatedTotalBill > 0) {
        setValue("amountPaidToSupplier", calculatedTotalBill);
      }
    }
  }, [calculatedTotalBill, isOpen, mode, setValue, hasUserEditedPayment]);

  const watchedPaidNum = watchedAmountPaid !== undefined && watchedAmountPaid !== '' && !isNaN(Number(watchedAmountPaid)) 
    ? Number(watchedAmountPaid) 
    : 0;
  const calculatedDue = Math.max(0, calculatedTotalBill - watchedPaidNum);

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim() || images.length >= 5) return;
    const url = imageUrlInput.trim();
    if (!url.startsWith('http')) return;
    setValue("images", [...images, url]);
    setImageUrlInput("");
    if (images.length === 0) setSelectedImageIndex(0);
  };

  // Sync form with product prop
  useEffect(() => {
    if (isOpen) {
      setHasUserEditedPayment(mode === "edit" || mode === "view");
      if (product && mode !== "add") {
        reset({
          name: product.name || "",
          category: product.category || "Eggs",
          unitType: product.unitType || "peti",
          traysPerPeti: product.traysPerPeti || 12,
          eggsPerTray: product.eggsPerTray || 30,
          petiQuantity: product.petiQuantity || 0,
          trayQuantity: product.trayQuantity || 0,
          eggQuantity: product.eggQuantity || 0,
          stock: product.stock || 0,
          minStock: product.minStock || 0,
          price: product.price || 0,
          costPrice: product.costPrice || 0,
          supplierName: product.supplierName || "",
          supplierPhone: product.supplierPhone || product.supplierContact || "",
          supplierLocation: product.supplierLocation || product.farmLocation || "",
          totalPurchaseCost: product.totalPurchaseCost || 0,
          amountPaidToSupplier: product.amountPaidToSupplier !== undefined ? product.amountPaidToSupplier : (product.totalPurchaseCost || 0),
          dueAmountToSupplier: product.dueAmountToSupplier || 0,
          paymentMethod: product.paymentMethod || "Cash",
          paymentReceipt: product.paymentReceipt || "",
          images: product.images || [],
          description: product.description || "",
          mfgDate: product.mfgDate ? new Date(product.mfgDate).toISOString().split('T')[0] : "",
          expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : "",
        });
      } else {
        reset({
          name: "",
          category: product?.category || "Eggs",
          unitType: "peti",
          traysPerPeti: 12,
          eggsPerTray: 30,
          petiQuantity: 0,
          trayQuantity: 0,
          eggQuantity: 0,
          stock: 0,
          minStock: 0,
          price: 0,
          costPrice: 0,
          supplierName: "",
          supplierPhone: "",
          supplierLocation: "",
          totalPurchaseCost: 0,
          amountPaidToSupplier: 0,
          dueAmountToSupplier: 0,
          paymentMethod: "Cash",
          paymentReceipt: "",
          images: [],
          description: "",
          mfgDate: "",
          expiryDate: ""
        });
      }
      setSelectedImageIndex(0);
    }
  }, [product, mode, isOpen, reset]);

  const onSubmit = (data) => {
    const tPerPeti = parseFloat(data.traysPerPeti) || 12;
    const ePerTray = parseFloat(data.eggsPerTray) || 30;
    const ePerPeti = tPerPeti * ePerTray;

    const pQty = parseFloat(data.petiQuantity) || 0;
    const tQty = parseFloat(data.trayQuantity) || 0;
    const eQty = parseFloat(data.eggQuantity) || 0;

    const computedTotalEggs = (pQty * ePerPeti) + (tQty * ePerTray) + eQty;
    const finalStock = computedTotalEggs > 0 ? computedTotalEggs : (parseFloat(data.stock) || 0);

    const costPriceVal = parseFloat(data.costPrice) || 0;
    const salePriceVal = parseFloat(data.price) || 0;
    const effectiveUnitPrice = costPriceVal > 0 ? costPriceVal : salePriceVal;

    let computedBill = calculatedTotalBill;
    if (computedBill <= 0) {
      if (pQty > 0) {
        computedBill = pQty * effectiveUnitPrice;
      } else if (computedTotalEggs > 0) {
        computedBill = computedTotalEggs * (effectiveUnitPrice / ePerPeti);
      }
    }

    const totalBill = computedBill > 0 ? computedBill : (parseFloat(data.totalPurchaseCost) || 0);
    
    // Explicit paid & due parsing
    let paidAmt = 0;
    if (data.amountPaidToSupplier !== undefined && data.amountPaidToSupplier !== "" && !isNaN(parseFloat(data.amountPaidToSupplier))) {
      paidAmt = Math.max(0, parseFloat(data.amountPaidToSupplier));
    } else {
      paidAmt = hasUserEditedPayment ? 0 : totalBill;
    }

    const dueAmt = Math.max(0, totalBill - paidAmt);
    const determinedMethod = dueAmt > 0 && paidAmt === 0 
      ? "Credit / Qaraz" 
      : (dueAmt > 0 ? "Partial Cash" : "Cash");

    const payload = {
      ...data,
      name: data.name?.trim() || product?.name || "",
      category: data.category || currentCategory || product?.category || "Eggs",
      unitType: data.unitType || "peti",
      traysPerPeti: tPerPeti,
      eggsPerTray: ePerTray,
      petiQuantity: pQty,
      trayQuantity: tQty,
      eggQuantity: eQty,
      stock: finalStock,
      minStock: parseFloat(data.minStock) ?? product?.minStock ?? 0,
      price: parseFloat(data.price) ?? product?.price ?? 0,
      costPrice: parseFloat(data.costPrice) ?? product?.costPrice ?? 0,
      supplierName: data.supplierName?.trim() || "",
      supplierPhone: data.supplierPhone?.trim() || "",
      supplierLocation: data.supplierLocation?.trim() || "",
      totalPurchaseCost: totalBill,
      amountPaidToSupplier: paidAmt,
      dueAmountToSupplier: dueAmt,
      paymentMethod: determinedMethod,
      paymentReceipt: "",
      isOnlinePayment: false,
      images: images && images.length > 0 ? images : (product?.images || []),
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
      toast.success("Product picture uploaded!");
    } catch (error) {
      toast.error("Image upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sleek Professional Responsive Form Card */}
      <div className="relative w-full max-w-[540px] bg-[#1E293B] border border-slate-700/80 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden z-10 mx-auto flex flex-col max-h-[92vh] text-white">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/60 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
              <Egg className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white uppercase italic">
                {mode === "add" ? "Add Product & Stock" : mode === "edit" ? "Edit Product" : "View Product"}
              </h2>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Yosafze Egg Traders • Stock Entry</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white border border-slate-700/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Increased Text Sizes & Clear Product Picture Box */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-700 flex-1 text-sm">

          {/* COMPACT PRODUCT PICTURE SECTION */}
          <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-emerald-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                Product Picture ({images.length}/5)
              </label>
              {mode !== "view" && images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase rounded-lg tracking-wider flex items-center gap-1 shadow transition-all active:scale-95 cursor-pointer"
                >
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  <span>+ Upload Picture</span>
                </button>
              )}
            </div>

            {/* Compact Picture Display Box */}
            <div className="relative w-full h-20 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center group">
              {images.length > 0 && images[selectedImageIndex] ? (
                <>
                  <img
                    src={images[selectedImageIndex]}
                    alt="Product Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {mode !== "view" && (
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = images.filter((_, i) => i !== selectedImageIndex);
                        setValue("images", newImages);
                        setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
                      }}
                      className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg shadow transition-all cursor-pointer"
                      title="Remove Picture"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <div
                  onClick={() => mode !== "view" && fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 text-slate-400 cursor-pointer hover:text-emerald-300 transition-colors p-2 text-center"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  ) : (
                    <Camera className="w-5 h-5 text-slate-500" />
                  )}
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    {uploading ? "Uploading Picture..." : "+ Click to Upload Product Picture"}
                  </span>
                </div>
              )}
            </div>

            {/* Gallery Thumbnails & URL Option Row */}
            {images.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-8 h-8 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedImageIndex === idx ? 'border-emerald-500 shadow scale-105' : 'border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Image URL Input Option */}
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
                  placeholder="Or paste image URL (http://...)"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg py-1 pl-8 pr-2 text-[10.5px] font-bold text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={!imageUrlInput.trim()}
                  className="px-2.5 bg-slate-700 hover:bg-slate-600 text-white font-black text-[10px] uppercase tracking-wider rounded-lg border border-slate-600 transition-all disabled:opacity-40"
                >
                  Add URL
                </button>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
          </div>

          {/* Section 1: Basic Product Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Product Name *</label>
              <input
                {...register("name")}
                disabled={mode === "view"}
                className={`w-full bg-slate-800 border ${errors.name ? 'border-rose-500' : 'border-slate-700'} rounded-xl py-2 px-3 text-sm font-bold text-white outline-none focus:border-emerald-500 placeholder:text-slate-500`}
                placeholder="e.g. Super Jumbo Eggs (79g)"
              />
              {errors.name && <p className="text-rose-400 text-xs font-bold uppercase">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Category</label>
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
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        backgroundColor: '#1e293b',
                        borderRadius: "0.75rem",
                        minHeight: "38px",
                        fontSize: "12px",
                        borderColor: state.isFocused ? '#10b981' : '#334155',
                        fontWeight: 'bold',
                        color: '#fff',
                        boxShadow: 'none'
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: '#0f172a',
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        border: '1px solid #334155'
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? '#065f46' : 'transparent',
                        color: '#fff',
                        fontSize: "12px"
                      }),
                      singleValue: (base) => ({ ...base, color: '#fff' }),
                      input: (base) => ({ ...base, color: '#fff' }),
                    }}
                  />
                )}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Primary Unit</label>
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                {['peti', 'tray', 'egg'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue('unitType', type)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                      unitType === type ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-2xl border border-slate-700/60">
            <div className="space-y-1">
              <label className="text-xs font-black text-emerald-400 uppercase tracking-wider">Sale Price / {unitType.toUpperCase()} (Rs) *</label>
              <input
                type="number"
                step="any"
                {...register("price")}
                disabled={mode === "view"}
                className={`w-full bg-slate-800 border ${errors.price ? 'border-rose-500' : 'border-slate-700'} rounded-xl py-2 px-3 text-sm font-black text-emerald-400 outline-none focus:border-emerald-500`}
                placeholder="0"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-amber-400 uppercase tracking-wider">Cost Price / {unitType.toUpperCase()} (Rs)</label>
              <input
                type="number"
                step="any"
                {...register("costPrice")}
                disabled={mode === "view"}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-sm font-black text-amber-400 outline-none focus:border-emerald-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Section 3: Egg Stock Inventory Breakdown */}
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase text-emerald-300 tracking-wider">Egg Inventory Quantities</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">1 Peti = 12 Trays = 360 Eggs</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-black text-amber-400 uppercase">Petis (Boxes)</label>
                <input
                  type="number"
                  step="any"
                  {...register("petiQuantity")}
                  disabled={mode === "view"}
                  className="w-full bg-slate-800 border border-amber-500/40 rounded-xl py-1.5 px-2.5 text-center text-sm font-black text-white outline-none focus:border-amber-400"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-teal-400 uppercase">Trays</label>
                <input
                  type="number"
                  step="any"
                  {...register("trayQuantity")}
                  disabled={mode === "view"}
                  className="w-full bg-slate-800 border border-teal-500/40 rounded-xl py-1.5 px-2.5 text-center text-sm font-black text-white outline-none focus:border-teal-400"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-emerald-400 uppercase">Single Eggs</label>
                <input
                  type="number"
                  step="any"
                  {...register("eggQuantity")}
                  disabled={mode === "view"}
                  className="w-full bg-slate-800 border border-emerald-500/40 rounded-xl py-1.5 px-2.5 text-center text-sm font-black text-white outline-none focus:border-emerald-400"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Live Calculated Stock Banner */}
            <div className="p-2 bg-emerald-950/40 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs font-black text-emerald-300">
              <span>Total Calculated Stock:</span>
              <div className="flex gap-2">
                <span className="text-amber-400">{totalPetisCalculated} Petis</span>
                <span className="text-slate-500">•</span>
                <span className="text-teal-400">{totalTraysCalculated} Trays</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400">{totalEggsCalculated.toLocaleString()} Eggs</span>
              </div>
            </div>
          </div>

          {/* Section 4: Supplier Information & Cash Payment */}
          <div className="p-3.5 bg-slate-900/95 rounded-2xl border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-black uppercase text-teal-300 flex items-center gap-2 tracking-wider">
                <UserCheck className="w-4 h-4 text-teal-400" /> Supplier Information
              </span>
              <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                💵 Cash Payment
              </span>
            </div>

            {/* Supplier Info Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-300 uppercase">Supplier / Farm Name</label>
                <input
                  type="text"
                  {...register("supplierName")}
                  disabled={mode === "view"}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-1.5 px-3 text-xs font-bold text-white outline-none focus:border-teal-400 placeholder:text-slate-500"
                  placeholder="e.g. Al-Madina Egg Farm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-teal-400 uppercase">Supplier Phone</label>
                <input
                  type="text"
                  {...register("supplierPhone")}
                  disabled={mode === "view"}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-1.5 px-3 text-xs font-bold text-white outline-none focus:border-teal-400 placeholder:text-slate-500"
                  placeholder="e.g. 0300-1234567"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-amber-400 uppercase">Farm Location</label>
                <input
                  type="text"
                  {...register("supplierLocation")}
                  disabled={mode === "view"}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-1.5 px-3 text-xs font-bold text-white outline-none focus:border-teal-400 placeholder:text-slate-500"
                  placeholder="e.g. Multan Farm"
                />
              </div>
            </div>

            {/* Cash Paid to Supplier with Quick Option Buttons */}
            <div className="space-y-2 pt-0.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-emerald-400 uppercase">Cash Paid to Supplier (Rs.)</label>
                {calculatedTotalBill > 0 && mode !== "view" && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setValue("amountPaidToSupplier", calculatedTotalBill);
                        setHasUserEditedPayment(true);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-[10px] font-black border border-emerald-500/40 cursor-pointer"
                    >
                      ✓ 100% Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValue("amountPaidToSupplier", 0);
                        setHasUserEditedPayment(true);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-300 text-[10px] font-black border border-rose-500/40 cursor-pointer"
                    >
                      ⚠️ 100% Qaraz
                    </button>
                  </div>
                )}
              </div>
              <input
                type="number"
                step="any"
                {...register("amountPaidToSupplier", {
                  onChange: () => setHasUserEditedPayment(true)
                })}
                disabled={mode === "view"}
                className="w-full bg-slate-800 border border-emerald-500/40 rounded-xl py-2 px-3 text-emerald-400 text-sm font-black outline-none focus:border-emerald-400"
                placeholder="Enter paid amount (0 if all qaraz)"
              />
            </div>

            {/* Bill Summary Banner */}
            <div className="grid grid-cols-3 gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700 text-xs">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase">Total Bill:</span>
                <span className="font-black text-amber-300 text-xs sm:text-sm">Rs. {calculatedTotalBill.toLocaleString()}</span>
              </div>
              <div className="flex flex-col border-l border-slate-700 pl-2">
                <span className="text-[9px] font-black text-emerald-400 uppercase">Cash Paid:</span>
                <span className="font-black text-emerald-400 text-xs sm:text-sm">Rs. {watchedPaidNum.toLocaleString()}</span>
              </div>
              <div className="flex flex-col border-l border-slate-700 pl-2">
                <span className="text-[9px] font-black text-rose-400 uppercase">Qaraz (Due):</span>
                <span className={`font-black text-xs sm:text-sm ${calculatedDue > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  Rs. {calculatedDue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Description */}
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-300 uppercase">Product Description &amp; Notes</label>
            <textarea
              {...register("description")}
              disabled={mode === "view"}
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500 resize-none placeholder:text-slate-500"
              placeholder="Enter product notes or details..."
            />
          </div>

        </form>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-700/60 bg-slate-900/80 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
          >
            {mode === "view" ? "Close" : "Cancel"}
          </button>
          {mode !== "view" && (
            <button
              type="button"
              onClick={handleSubmit(onSubmit, (errs) => console.error('[Form Validation Error]', errs))}
              className="flex-[1.5] py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950 transition-all active:scale-95 border-t border-emerald-400/30"
            >
              {mode === "add" ? "Create Product" : "Save Changes"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}