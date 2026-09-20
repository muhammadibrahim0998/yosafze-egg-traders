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
  const watchedPaymentMethod = watch("paymentMethod") || "Cash";
  const isBankMode = String(watchedPaymentMethod).toLowerCase().includes('bank') || String(watchedPaymentMethod).toLowerCase().includes('online');

  // Live Unit & Stock Conversions
  const tPerPetiVal = Number(watchedTraysPerPeti) || 12;
  const ePerTrayVal = Number(watchedEggsPerTray) || 30;
  const eggsPerPeti = tPerPetiVal * ePerTrayVal;

  const totalEggsCalculated = Number(watchedEggQty) > 0 
    ? Number(watchedEggQty) 
    : (Number(watchedPetiQty) > 0 
        ? Math.round(Number(watchedPetiQty) * eggsPerPeti) 
        : (Number(watchedTrayQty) > 0 ? Math.round(Number(watchedTrayQty) * ePerTrayVal) : 0));

  const totalTraysCalculated = totalEggsCalculated > 0 
    ? Number((totalEggsCalculated / ePerTrayVal).toFixed(1)) 
    : 0;

  const totalPetisCalculated = totalEggsCalculated > 0 
    ? Number((totalEggsCalculated / (eggsPerPeti || 360)).toFixed(2)) 
    : 0;

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
        const tPerP = product.traysPerPeti || 12;
        const ePerT = product.eggsPerTray || 30;
        const ePerP = tPerP * ePerT;

        const totalStockEggs = product.stock || (product.petiQuantity ? Math.round(product.petiQuantity * ePerP) : (product.eggQuantity || 0)) || 0;
        const initialPeti = product.petiQuantity !== undefined && product.petiQuantity !== null && product.petiQuantity > 0
          ? product.petiQuantity
          : (totalStockEggs > 0 ? Number((totalStockEggs / ePerP).toFixed(2)) : 0);
        const initialTray = product.trayQuantity !== undefined && product.trayQuantity !== null && product.trayQuantity > 0
          ? product.trayQuantity
          : (initialPeti > 0 ? Number((initialPeti * tPerP).toFixed(1)) : (totalStockEggs > 0 ? Number((totalStockEggs / ePerT).toFixed(1)) : 0));
        const initialEgg = product.eggQuantity !== undefined && product.eggQuantity !== null && product.eggQuantity > 0
          ? product.eggQuantity
          : (totalStockEggs > 0 ? totalStockEggs : (initialPeti > 0 ? Math.round(initialPeti * ePerP) : 0));

        reset({
          name: product.name || "",
          category: product.category || "Eggs",
          unitType: product.unitType || "peti",
          traysPerPeti: tPerP,
          eggsPerTray: ePerT,
          petiQuantity: initialPeti,
          trayQuantity: initialTray,
          eggQuantity: initialEgg,
          stock: totalStockEggs || initialEgg,
          minStock: product.minStock || 0,
          price: product.price || 0,
          costPrice: product.costPrice || 0,
          supplierName: product.supplierName || "",
          supplierPhone: product.supplierPhone || product.supplierContact || "",
          supplierLocation: product.supplierLocation || product.farmLocation || "",
          totalPurchaseCost: product.totalPurchaseCost || 0,
          amountPaidToSupplier: product.amountPaidToSupplier !== undefined ? product.amountPaidToSupplier : (product.totalPurchaseCost || 0),
          cashPaidToSupplier: product.cashPaidToSupplier || 0,
          bankPaidToSupplier: product.bankPaidToSupplier || 0,
          dueAmountToSupplier: product.dueAmountToSupplier || 0,
          paymentMethod: product.paymentMethod || "Cash",
          isOnlinePayment: Boolean(product.isOnlinePayment),
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
    const tQty = parseFloat(data.trayQuantity) || (pQty > 0 ? Number((pQty * tPerPeti).toFixed(1)) : 0);
    const eQty = parseFloat(data.eggQuantity) || (pQty > 0 ? Math.round(pQty * ePerPeti) : (tQty > 0 ? Math.round(tQty * ePerTray) : 0));

    const finalStock = eQty > 0 ? eQty : (pQty > 0 ? Math.round(pQty * ePerPeti) : (parseFloat(data.stock) || 0));

    const costPriceVal = parseFloat(data.costPrice) || 0;
    const salePriceVal = parseFloat(data.price) || 0;
    const effectiveUnitPrice = costPriceVal > 0 ? costPriceVal : salePriceVal;

    let computedBill = calculatedTotalBill;
    if (computedBill <= 0) {
      if (pQty > 0) {
        computedBill = pQty * effectiveUnitPrice;
      } else if (finalStock > 0) {
        computedBill = finalStock * (effectiveUnitPrice / ePerPeti);
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
    const rawMethod = String(data.paymentMethod || "Cash").trim();
    const isOnlineOrBank = rawMethod.toLowerCase().includes('bank') || rawMethod.toLowerCase().includes('online') || data.isOnlinePayment === true;

    let cashPaid = 0;
    let bankPaid = 0;
    if (isOnlineOrBank) {
      bankPaid = paidAmt;
      cashPaid = 0;
    } else {
      cashPaid = paidAmt;
      bankPaid = 0;
    }

    let determinedMethod = "Cash";
    if (isOnlineOrBank) {
      determinedMethod = dueAmt > 0 && paidAmt === 0 
        ? "Credit" 
        : (dueAmt > 0 ? "Partial Bank Transfer" : "Bank Transfer");
    } else {
      determinedMethod = dueAmt > 0 && paidAmt === 0 
        ? "Credit" 
        : (dueAmt > 0 ? "Partial Cash" : "Cash");
    }

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
      cashPaidToSupplier: cashPaid,
      bankPaidToSupplier: bankPaid,
      dueAmountToSupplier: dueAmt,
      paymentMethod: determinedMethod,
      paymentReceipt: data.paymentReceipt || "",
      isOnlinePayment: isOnlineOrBank,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      {/* 2-Column Ultra-Compact Gray Modal - Fits entirely on screen with NO scrolling */}
      <div className="relative w-full max-w-[780px] bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden z-10 mx-auto flex flex-col text-slate-100">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400">
              <Egg className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black tracking-tight text-white uppercase italic leading-none">
                {mode === "add" ? "Add Product & Stock" : mode === "edit" ? "Edit Product" : "View Product"}
              </h2>
              <p className="text-[8.5px] font-bold text-emerald-400 uppercase tracking-wider">Yosafze Egg Traders • Stock Entry</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Body - 2 Columns Layout for Zero Scrolling */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-3 sm:p-3.5 flex-1 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">

            {/* ──── LEFT COLUMN: Product & Stock Info ──── */}
            <div className="space-y-2">

              {/* Compact Inline Picture Bar */}
              <div className="p-1.5 bg-slate-900/90 rounded-xl border border-slate-700 flex items-center gap-2">
                <div className="relative w-12 h-12 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shrink-0 flex items-center justify-center">
                  {images.length > 0 && images[selectedImageIndex] ? (
                    <>
                      <img src={images[selectedImageIndex]} alt="Preview" className="w-full h-full object-cover" />
                      {mode !== "view" && (
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = images.filter((_, i) => i !== selectedImageIndex);
                            setValue("images", newImages);
                            setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
                          }}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600 text-white rounded cursor-pointer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </>
                  ) : (
                    <Camera className="w-5 h-5 text-slate-500" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Picture ({images.length}/5)
                    </span>
                    {mode !== "view" && images.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[8.5px] uppercase rounded-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        {uploading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Upload className="w-2.5 h-2.5" />}
                        <span>Upload</span>
                      </button>
                    )}
                  </div>
                  {mode !== "view" && images.length < 5 && (
                    <div className="flex gap-1">
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
                        placeholder="Or paste image URL..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-md py-0.5 px-2 text-[9.5px] font-bold text-white outline-none focus:border-emerald-500 placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        disabled={!imageUrlInput.trim()}
                        className="px-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-[8.5px] uppercase rounded-md border border-slate-600 disabled:opacity-40 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
              </div>

              {/* Product Name */}
              <div className="space-y-0.5">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Product Name *</label>
                <input
                  {...register("name")}
                  disabled={mode === "view"}
                  className={`w-full bg-slate-900 border ${errors.name ? 'border-rose-500' : 'border-slate-700'} rounded-lg py-1 px-2.5 text-xs font-bold text-white outline-none focus:border-emerald-500 placeholder:text-slate-500`}
                  placeholder="e.g. Super Jumbo Eggs (79g)"
                />
                {errors.name && <p className="text-rose-400 text-[9px] font-bold">{errors.name.message}</p>}
              </div>

              {/* Category & Primary Unit Row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Category</label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => {
                      const defaultCats = [
                        'Super Jumbo', 'Jumbo', 'Stander', 'Step Stander', 'Step Jumbo',
                        'Starter', 'Weak Shell', 'Dusty', 'Floor', 'Sandy',
                        'Double White', 'Double Brown', 'Golden', 'Breeder', 'Special',
                        'loman brown', 'loman black', 'china eggs', 'pak egg', 'A Grade', 'Eggs'
                      ];
                      const mergedCats = Array.from(new Set([...defaultCats, ...(categories || []).filter(c => c !== "All")]));
                      return (
                        <CreatableSelect
                          {...field}
                          isClearable
                          isDisabled={mode === 'view'}
                          options={mergedCats.map(c => ({ value: c, label: c }))}
                          onChange={(val) => field.onChange(val ? val.value : "")}
                          onCreateOption={(inputValue) => field.onChange(inputValue)}
                          value={field.value ? { label: field.value, value: field.value } : null}
                          placeholder="Select..."
                          styles={{
                            control: (base, state) => ({
                              ...base,
                              backgroundColor: '#0f172a',
                              borderRadius: "0.5rem",
                              minHeight: "28px",
                              height: "28px",
                              fontSize: "11px",
                              borderColor: state.isFocused ? '#10b981' : '#334155',
                              fontWeight: 'bold',
                              color: '#fff',
                              boxShadow: 'none'
                            }),
                            menu: (base) => ({
                              ...base,
                              backgroundColor: '#0f172a',
                              borderRadius: "0.5rem",
                              fontSize: "11px",
                              border: '1px solid #334155',
                              zIndex: 50
                            }),
                            option: (base, state) => ({
                              ...base,
                              backgroundColor: state.isFocused ? '#065f46' : 'transparent',
                              color: '#fff',
                              fontSize: "11px"
                            }),
                            singleValue: (base) => ({ ...base, color: '#fff' }),
                            input: (base) => ({ ...base, color: '#fff', margin: 0, padding: 0 }),
                            valueContainer: (base) => ({ ...base, padding: '0 6px' }),
                          }}
                        />
                      );
                    }}
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Primary Unit</label>
                  <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 h-[28px] items-center">
                    {['peti', 'tray', 'egg'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValue('unitType', type)}
                        className={`flex-1 py-0.5 rounded text-[9.5px] font-black uppercase transition-all cursor-pointer ${
                          unitType === type ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing Row */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900/90 rounded-xl border border-slate-700">
                <div className="space-y-0.5">
                  <label className="text-[9.5px] font-black text-emerald-400 uppercase tracking-wider">Sale Price / {unitType.toUpperCase()} (Rs) *</label>
                  <input
                    type="number"
                    step="any"
                    {...register("price")}
                    disabled={mode === "view"}
                    className={`w-full bg-slate-800 border ${errors.price ? 'border-rose-500' : 'border-slate-700'} rounded-lg py-1 px-2 text-xs font-black text-emerald-400 outline-none focus:border-emerald-500`}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9.5px] font-black text-amber-400 uppercase tracking-wider">Cost Price / {unitType.toUpperCase()} (Rs)</label>
                  <input
                    type="number"
                    step="any"
                    {...register("costPrice")}
                    disabled={mode === "view"}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1 px-2 text-xs font-black text-amber-400 outline-none focus:border-emerald-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Egg Stock Quantities Section */}
              <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Box className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider">Stock Quantities</span>
                  </div>
                  <span className="text-[8.5px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">1P = 12T = 360E</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-black text-amber-400 uppercase flex justify-between">
                      <span>Petis</span>
                      <span className="text-[8px] text-amber-300/80">12T</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      {...register("petiQuantity", {
                        onChange: (e) => {
                          const val = e.target.value;
                          if (val === '' || isNaN(Number(val))) {
                            setValue("trayQuantity", '');
                            setValue("eggQuantity", '');
                          } else {
                            const num = parseFloat(val);
                            const tPerP = parseFloat(watch("traysPerPeti")) || 12;
                            const ePerT = parseFloat(watch("eggsPerTray")) || 30;
                            setValue("trayQuantity", Number((num * tPerP).toFixed(1)));
                            setValue("eggQuantity", Math.round(num * tPerP * ePerT));
                          }
                        }
                      })}
                      disabled={mode === "view"}
                      className="w-full bg-slate-800 border border-amber-500/30 rounded-lg py-0.5 px-1.5 text-center text-xs font-black text-white outline-none focus:border-amber-400"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-black text-teal-400 uppercase flex justify-between">
                      <span>Trays</span>
                      <span className="text-[8px] text-teal-300/80">30E</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      {...register("trayQuantity", {
                        onChange: (e) => {
                          const val = e.target.value;
                          if (val === '' || isNaN(Number(val))) {
                            setValue("petiQuantity", '');
                            setValue("eggQuantity", '');
                          } else {
                            const num = parseFloat(val);
                            const tPerP = parseFloat(watch("traysPerPeti")) || 12;
                            const ePerT = parseFloat(watch("eggsPerTray")) || 30;
                            setValue("petiQuantity", Number((num / tPerP).toFixed(2)));
                            setValue("eggQuantity", Math.round(num * ePerT));
                          }
                        }
                      })}
                      disabled={mode === "view"}
                      className="w-full bg-slate-800 border border-teal-500/30 rounded-lg py-0.5 px-1.5 text-center text-xs font-black text-white outline-none focus:border-teal-400"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-black text-emerald-400 uppercase flex justify-between">
                      <span>Single</span>
                      <span className="text-[8px] text-emerald-300/80">Eggs</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      {...register("eggQuantity", {
                        onChange: (e) => {
                          const val = e.target.value;
                          if (val === '' || isNaN(Number(val))) {
                            setValue("petiQuantity", '');
                            setValue("trayQuantity", '');
                          } else {
                            const num = parseFloat(val);
                            const tPerP = parseFloat(watch("traysPerPeti")) || 12;
                            const ePerT = parseFloat(watch("eggsPerTray")) || 30;
                            const ePerP = tPerP * ePerT;
                            setValue("petiQuantity", Number((num / ePerP).toFixed(2)));
                            setValue("trayQuantity", Number((num / ePerT).toFixed(1)));
                          }
                        }
                      })}
                      disabled={mode === "view"}
                      className="w-full bg-slate-800 border border-emerald-500/30 rounded-lg py-0.5 px-1.5 text-center text-xs font-black text-white outline-none focus:border-emerald-400"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="p-1 bg-slate-800 rounded-md border border-slate-700 flex items-center justify-between text-[9.5px] font-black text-emerald-300">
                  <span>Stock:</span>
                  <div className="flex gap-1.5">
                    <span className="text-amber-400">{totalPetisCalculated} Petis</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-teal-400">{totalTraysCalculated} Trays</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400">{totalEggsCalculated.toLocaleString()} Eggs</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ──── RIGHT COLUMN: Supplier & Payment Details ──── */}
            <div className="space-y-2">

              {/* Supplier & Payment Header with Switcher */}
              <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="text-[10px] font-black uppercase text-teal-300 flex items-center gap-1 tracking-wider">
                    <UserCheck className="w-3.5 h-3.5 text-teal-400" /> Supplier &amp; Payment
                  </span>
                  
                  {/* Payment Switcher */}
                  <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setValue("paymentMethod", "Cash");
                        setValue("isOnlinePayment", false);
                      }}
                      disabled={mode === "view"}
                      className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
                        !isBankMode ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Banknote className="w-2.5 h-2.5" /> Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValue("paymentMethod", "Bank Transfer");
                        setValue("isOnlinePayment", true);
                      }}
                      disabled={mode === "view"}
                      className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
                        isBankMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-2.5 h-2.5" /> Bank/Online
                    </button>
                  </div>
                </div>

                {/* Supplier Info 3 Inputs */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-black text-slate-300 uppercase">Supplier Name</label>
                    <input
                      type="text"
                      {...register("supplierName")}
                      disabled={mode === "view"}
                      className="w-full bg-slate-800 border border-slate-700 rounded-md py-1 px-1.5 text-xs font-bold text-white outline-none focus:border-teal-400 placeholder:text-slate-500"
                      placeholder="e.g. Al-Madina"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-black text-teal-400 uppercase">Phone</label>
                    <input
                      type="text"
                      {...register("supplierPhone")}
                      disabled={mode === "view"}
                      className="w-full bg-slate-800 border border-slate-700 rounded-md py-1 px-1.5 text-xs font-bold text-white outline-none focus:border-teal-400 placeholder:text-slate-500"
                      placeholder="0300-1234567"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-black text-amber-400 uppercase">Location</label>
                    <input
                      type="text"
                      {...register("supplierLocation")}
                      disabled={mode === "view"}
                      className="w-full bg-slate-800 border border-slate-700 rounded-md py-1 px-1.5 text-xs font-bold text-white outline-none focus:border-teal-400 placeholder:text-slate-500"
                      placeholder="Multan Farm"
                    />
                  </div>
                </div>

                {/* Paid Amount */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-[9.5px] font-black uppercase ${isBankMode ? 'text-indigo-400' : 'text-emerald-400'}`}>
                      {isBankMode ? '🏦 Bank Paid (Rs.)' : '💵 Cash Paid (Rs.)'}
                    </label>
                    {calculatedTotalBill > 0 && mode !== "view" && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setValue("amountPaidToSupplier", calculatedTotalBill);
                            setHasUserEditedPayment(true);
                          }}
                          className={`px-1.5 py-0.2 rounded text-[8.5px] font-black border cursor-pointer ${
                            isBankMode
                              ? 'bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 border-indigo-500/40'
                              : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          ✓ 100% Paid
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setValue("amountPaidToSupplier", 0);
                            setHasUserEditedPayment(true);
                          }}
                          className="px-1.5 py-0.2 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-300 text-[8.5px] font-black border border-rose-500/40 cursor-pointer"
                        >
                          ⚠️ 100% Credit
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
                    className={`w-full bg-slate-800 border rounded-lg py-1 px-2 text-xs font-black outline-none ${
                      isBankMode ? 'border-indigo-500/40 text-indigo-400' : 'border-emerald-500/40 text-emerald-400'
                    }`}
                    placeholder="Paid amount (0 for credit)"
                  />
                </div>

                {/* Bank / Online Fields if selected */}
                {isBankMode && (
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <input
                      type="text"
                      {...register("paymentReceipt")}
                      disabled={mode === "view"}
                      className="w-full bg-slate-800 border border-indigo-500/30 rounded-md py-0.5 px-2 text-[10px] font-bold text-white outline-none placeholder:text-slate-500"
                      placeholder="Bank (e.g. Meezan)"
                    />
                    <input
                      type="text"
                      {...register("description")}
                      disabled={mode === "view"}
                      className="w-full bg-slate-800 border border-indigo-500/30 rounded-md py-0.5 px-2 text-[10px] font-bold text-white outline-none placeholder:text-slate-500"
                      placeholder="Txn ID"
                    />
                  </div>
                )}

                {/* Bill Summary Banner */}
                <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1.5 rounded-lg border border-slate-700 text-xs">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Total Bill:</span>
                    <span className="font-black text-amber-300 text-[11px]">Rs. {calculatedTotalBill.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col border-l border-slate-700 pl-1">
                    <span className={`text-[8px] font-black uppercase ${isBankMode ? 'text-indigo-400' : 'text-emerald-400'}`}>
                      {isBankMode ? 'Bank Paid:' : 'Cash Paid:'}
                    </span>
                    <span className={`font-black text-[11px] ${isBankMode ? 'text-indigo-400' : 'text-emerald-400'}`}>
                      Rs. {watchedPaidNum.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-slate-700 pl-1">
                    <span className="text-[8px] font-black text-rose-400 uppercase">Credit (Due):</span>
                    <span className={`font-black text-[11px] ${calculatedDue > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      Rs. {calculatedDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Notes / Details */}
              <div className="space-y-0.5">
                <label className="text-[10px] font-black text-slate-300 uppercase">Notes &amp; Details</label>
                <textarea
                  {...register("description")}
                  disabled={mode === "view"}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-xs font-bold text-white outline-none focus:border-emerald-500 resize-none placeholder:text-slate-500"
                  placeholder="Enter product notes..."
                />
              </div>

            </div>

          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="px-4 py-2 border-t border-slate-700 bg-slate-900 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer border border-slate-700"
          >
            {mode === "view" ? "Close" : "Cancel"}
          </button>
          {mode !== "view" && (
            <button
              type="button"
              onClick={handleSubmit(onSubmit, (errs) => console.error('[Form Validation Error]', errs))}
              className="flex-[1.5] py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {mode === "add" ? "Create Product" : "Save Changes"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}