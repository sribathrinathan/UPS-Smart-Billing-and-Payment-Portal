import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { ArrowLeft, Download, CreditCard, BrainCircuit, Box } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<any>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [explaining, setExplaining] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}`)
      .then(res => setInvoice(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleExplain = async () => {
    setExplaining(true);
    try {
      const res = await api.post(`/invoices/${id}/explain`);
      setExplanation(res.data.explanation);
    } catch (err) {
      console.error(err);
    } finally {
      setExplaining(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading || !invoice) return <div className="p-8">Loading invoice details...</div>;

  const generatePDF = () => {
    if (!invoice) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(212, 160, 23); // UPS Gold
    doc.text('UPS Smart Billing', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('123 Freight Way, New York, NY 10001', 14, 28);
    doc.text('Email: billing@ups.com', 14, 33);
    
    // Invoice Info
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`INVOICE: ${invoice.invoiceNumber}`, 130, 20);
    
    doc.setFontSize(10);
    doc.text(`Date: ${format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}`, 130, 28);
    doc.text(`Due Date: ${format(new Date(invoice.dueDate), 'MMM dd, yyyy')}`, 130, 33);
    doc.text(`Status: ${invoice.status}`, 130, 38);

    // Bill To
    doc.setFontSize(12);
    doc.text('BILL TO:', 14, 50);
    doc.setFontSize(10);
    doc.text(invoice.customer.companyName || 'N/A', 14, 56);
    doc.text(invoice.customer.contactName || 'N/A', 14, 61);
    doc.text(invoice.customer.email || 'N/A', 14, 66);
    doc.text(invoice.customer.country || 'N/A', 14, 71);

    // Table
    const tableData = invoice.lineItems?.length > 0 
      ? invoice.lineItems.map((item: any) => [item.description, item.category, item.quantity, `$${item.unitPrice.toFixed(2)}`, `$${item.amount.toFixed(2)}`])
      : [['Freight Charges', 'Shipping', '1', `$${(invoice.subtotal).toFixed(2)}`, `$${(invoice.subtotal).toFixed(2)}`]];

    autoTable(doc, {
      startY: 85,
      head: [['Description', 'Category', 'Qty', 'Unit Price', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [53, 28, 21], textColor: [255, 255, 255] }, // UPS Brown
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY || 85;
    doc.text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, 140, finalY + 10);
    doc.text(`Fuel Surcharge: $${invoice.fuelSurcharge.toFixed(2)}`, 140, finalY + 16);
    doc.text(`Customs: $${invoice.customsAmount.toFixed(2)}`, 140, finalY + 22);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: $${invoice.totalAmount.toFixed(2)}`, 140, finalY + 32);
    doc.text(`Paid: $${invoice.paidAmount.toFixed(2)}`, 140, finalY + 38);
    doc.setTextColor(212, 160, 23); // UPS Gold
    doc.text(`Balance Due: $${invoice.outstandingAmount.toFixed(2)}`, 140, finalY + 44);

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-ups-brown hover:text-ups-gold mb-6 transition-colors">
          <ArrowLeft size={20} /> Back
        </button>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-ups-brown">Invoice {invoice.invoiceNumber}</h1>
              <p className="text-gray-500 mt-1">Due Date: {format(new Date(invoice.dueDate), 'MMMM dd, yyyy')}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Amount Due</p>
              <p className="text-4xl font-black text-gray-900">${invoice.outstandingAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Charge Breakdown</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between"><span className="text-gray-500">Transportation</span> <span>${invoice.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Fuel Surcharge</span> <span>${invoice.fuelSurcharge.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Customs</span> <span>${invoice.customsAmount.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold border-t pt-2 mt-2"><span className="text-gray-900">Total</span> <span>${invoice.totalAmount.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="bg-ups-brown text-white p-6 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
              <div className="relative z-10">
                <h3 className="font-bold text-ups-gold mb-2 flex items-center gap-2"><BrainCircuit size={20} /> AI Billing Intelligence</h3>
                <p className="text-sm text-gray-300 mb-4">Confused by this month's charges? Let our AI assistant explain the billing changes compared to your historical averages.</p>
              </div>
              <button 
                onClick={handleExplain}
                disabled={explaining}
                className="relative z-10 w-full py-2 bg-ups-gold text-ups-brown font-bold rounded hover:bg-yellow-500 transition-colors"
              >
                {explaining ? 'Analyzing...' : 'Explain My Bill'}
              </button>
            </div>
          </div>

          {explanation && (
            <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-white border-l-4 border-ups-gold rounded-r-xl shadow-sm">
              <h4 className="font-bold text-ups-brown flex items-center gap-2 mb-2"><BrainCircuit size={18} /> AI Explanation</h4>
              <p className="text-gray-700 leading-relaxed">{explanation}</p>
            </div>
          )}

          <div className="mb-8">
             <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Box size={20} className="text-gray-400" /> Associated Shipments</h3>
             <div className="space-y-3">
               {invoice.shipments.map((s: any) => (
                 <div key={s.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex justify-between items-center">
                   <div>
                     <p className="font-bold text-gray-900">Tracking: {s.shipment.trackingNumber}</p>
                     <p className="text-sm text-gray-500">{s.shipment.origin} &rarr; {s.shipment.destination}</p>
                   </div>
                   <div className="text-right text-sm font-medium">
                     <p>{s.shipment.serviceType}</p>
                     <p className="text-gray-500">{s.shipment.weight} lbs</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>

          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mb-8">
               <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CreditCard size={20} className="text-green-600" /> Payment Receipts</h3>
               <div className="space-y-3">
                 {invoice.payments.map((p: any) => (
                   <div key={p.id} className="p-4 border border-green-100 rounded-xl bg-green-50/50 flex justify-between items-center">
                     <div>
                       <p className="font-bold text-gray-900">Payment: ${p.amount.toFixed(2)}</p>
                       <p className="text-sm text-gray-500">Method: {p.paymentMethod === 'mock_card' ? 'Visa •••• 4242' : 'Card ending in 4242'}</p>
                     </div>
                     <div className="text-right text-sm font-medium">
                       <p className="text-green-700">{format(new Date(p.paidAt), 'MMM dd, yyyy • hh:mm a')}</p>
                       <p className="text-xs text-gray-500 font-mono mt-1">{p.transactionReference}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={generatePDF} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
              <Download size={20} /> Download PDF
            </button>
            {user?.role === 'CUSTOMER' && invoice.outstandingAmount > 0 && (
              <button 
                onClick={() => navigate(`/pay/${invoice.id}`)}
                className="flex-1 py-3 bg-ups-gold text-ups-brown font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-[#e5a300] transition-colors"
              >
                Pay ${invoice.outstandingAmount.toFixed(2)}
              </button>
            )}
          </div>
          
          {user?.role === 'CUSTOMER' && invoice.outstandingAmount > 10000 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <h4 className="text-blue-900 font-bold mb-2 flex items-center gap-2"><CreditCard size={18}/> Payment Plan Available</h4>
              <p className="text-sm text-blue-800 mb-3">Split this large balance into 3 easy installments.</p>
              <button onClick={() => {
                api.post('/ai/payment-plan', { invoiceId: invoice.id }).then(res => {
                   alert(`Plan Approved: 3 payments of $${res.data.plan.installments[0].amount.toFixed(2)} starting today.`);
                });
              }} className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm">
                View & Accept Plan
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
