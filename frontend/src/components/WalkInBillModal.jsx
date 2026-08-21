import React from 'react';
import { X, Printer, Share2, Download, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function WalkInBillModal({ bill, shop, onClose, currency = 'RS' }) {
  if (!bill) return null;

  const saleDate = bill.saleDate ? new Date(bill.saleDate).toLocaleString() : new Date().toLocaleString();
  const customerName = bill.customerName || 'Walk-in Customer';
  const customerPhone = bill.customerPhone || '';
  const items = bill.items || [];
  const totalAmount = bill.totalAmount || 0;
  const shopName = shop?.name || 'Attock Shop';
  const shopAddress = shop?.address || '';
  const shopPhone = shop?.phone || '';

  // Generate PDF Invoice
  // Generate PDF Invoice
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();

      // Title & Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(shopName.toUpperCase(), 14, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (shopAddress) doc.text(shopAddress, 14, 26);
      if (shopPhone) doc.text(`Phone: ${shopPhone}`, 14, 31);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL INVOICE / RECEIPT', 140, 20);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice ID: #${(bill._id || Date.now()).toString().slice(-8)}`, 140, 26);
      doc.text(`Date: ${saleDate}`, 140, 31);
      doc.text(`Customer: ${customerName}`, 140, 36);
      if (customerPhone) doc.text(`Phone: ${customerPhone}`, 140, 41);

      doc.setLineWidth(0.5);
      doc.line(14, 46, 196, 46);

      // Items Table
      const tableData = items.map((item, index) => [
        index + 1,
        item.name,
        item.quantity,
        `${currency} ${item.price.toLocaleString()}`,
        `${currency} ${(item.quantity * item.price).toLocaleString()}`
      ]);

      doc.autoTable({
        startY: 50,
        head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Subtotal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [45, 90, 39], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      const finalY = (doc.lastAutoTable?.finalY || 100) + 10;

      // Summary
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL AMOUNT: ${currency} ${totalAmount.toLocaleString()}`, 130, finalY);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Thank you for shopping with us!', 14, finalY + 15);

      // Open PDF preview directly in new tab and trigger download
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      doc.save(`Bill_${customerName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Error generating PDF. Please try browser print.');
    }
  };

  // WhatsApp Share function
  const handleWhatsAppShare = () => {
    let text = `🧾 *INVOICE - ${shopName}*\n`;
    text += `📅 Date: ${saleDate}\n`;
    text += `👤 Customer: ${customerName}\n`;
    if (customerPhone) text += `📞 Phone: ${customerPhone}\n`;
    text += `------------------------------\n`;
    text += `*ITEMS PURCHASED:*\n`;

    items.forEach((item, idx) => {
      text += `${idx + 1}. *${item.name}* x ${item.quantity} = ${currency} ${(item.quantity * item.price).toLocaleString()}\n`;
    });

    text += `------------------------------\n`;
    text += `💵 *TOTAL AMOUNT: ${currency} ${totalAmount.toLocaleString()}*\n\n`;
    text += `Thank you for shopping with us! 🙏`;

    const encodedText = encodeURIComponent(text);
    let cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.slice(1);
    }

    let whatsappUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };

  // Print Receipt
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-white">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#2D5A27] via-[#24491F] to-[#1B3817] flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white">Walk-in Sale Bill</h2>
              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Completed Successfully</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Printable Area */}
        <div className="p-6 overflow-y-auto space-y-5 print:p-0 print:bg-white print:text-black">
          {/* Shop & Customer details */}
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-start border-b border-slate-700/50 pb-3">
              <div>
                <h3 className="font-black text-sm text-white uppercase italic">{shopName}</h3>
                {shopAddress && <p className="text-[11px] text-slate-400 font-medium">{shopAddress}</p>}
                {shopPhone && <p className="text-[11px] text-emerald-400 font-bold">{shopPhone}</p>}
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  PAID IN CASH
                </span>
                <p className="text-[9px] text-slate-400 mt-1">{saleDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Customer Name</span>
                <span className="font-bold text-white uppercase">{customerName}</span>
              </div>
              {customerPhone && (
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">WhatsApp / Phone</span>
                  <span className="font-bold text-emerald-300">{customerPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="border border-slate-700/60 rounded-2xl overflow-hidden bg-slate-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-[10px] font-black text-slate-300 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="p-3 font-bold uppercase">{item.name}</td>
                    <td className="p-3 text-center font-bold text-emerald-400">{item.quantity}</td>
                    <td className="p-3 text-right text-slate-300">{currency} {item.price.toLocaleString()}</td>
                    <td className="p-3 text-right font-black text-white">{currency} {(item.quantity * item.price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 bg-slate-800/60 border-t border-slate-700 flex justify-between items-center">
              <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Grand Total Amount</span>
              <span className="text-xl font-black text-emerald-400">{currency} {totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-700/80 grid grid-cols-3 gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-1.5 py-3 px-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl border border-slate-600 transition-all shadow-md"
          >
            <Download className="w-4 h-4 text-blue-400" /> Save PDF
          </button>
          
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-1.5 py-3 px-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl border border-emerald-500 transition-all shadow-md"
          >
            <Share2 className="w-4 h-4 text-white" /> WhatsApp
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-3 px-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-[11px] uppercase tracking-wider rounded-xl border-t border-emerald-400/30 border-b-2 border-emerald-900 transition-all shadow-lg"
          >
            <Printer className="w-4 h-4" /> Print Bill
          </button>
        </div>

      </div>
    </div>
  );
}
