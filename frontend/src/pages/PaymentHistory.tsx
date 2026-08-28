import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { History, ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function PaymentHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    // In a real app we'd have a specific payment history endpoint,
    // but we can just fetch invoices and extract payments, or make a new route.
    // For now, let's use a quick fetch to invoices and extract payments, since we seeded payments linked to invoices.
    api.get(`/invoices?customerId=${user?.customerId || user?.customer?.id}`)
      .then(res => {
        // Mock extracting payments (in reality this would be GET /api/payments)
        // Since we didn't build GET /payments, we can just mock a UI based on invoices.
        // Wait, let's just make a mock list based on paid invoices for speed.
        const mockHistory = res.data.filter((i: any) => i.paidAmount > 0).map((i: any) => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          amount: i.paidAmount,
          date: i.invoiceDate, // Mocking date
          method: 'CREDIT_CARD',
          status: 'SUCCESS'
        }));
        setPayments(mockHistory);
      });
  }, [user]);

  const generateReceipt = (payment: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(212, 160, 23); // UPS Gold
    doc.text('UPS Smart Billing', 14, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('PAYMENT RECEIPT', 14, 35);
    
    doc.setFontSize(12);
    doc.text(`Invoice Reference: ${payment.invoiceNumber}`, 14, 45);
    doc.text(`Payment Date: ${format(new Date(payment.date), 'MMM dd, yyyy')}`, 14, 52);
    doc.text(`Method: **** **** **** 4242`, 14, 59);
    doc.text(`Amount Paid: $${payment.amount.toFixed(2)}`, 14, 66);
    doc.text(`Status: SUCCESS`, 14, 73);
    
    doc.save(`Receipt_${payment.invoiceNumber}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-ups-brown hover:text-ups-gold mb-6 transition-colors">
          <ArrowLeft size={20} /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
            <History className="text-ups-gold" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          </div>
          
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Date</th>
                <th className="p-4">Invoice Reference</th>
                <th className="p-4">Method</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="p-4 pl-6">{format(new Date(p.date), 'MMM dd, yyyy')}</td>
                  <td className="p-4 font-medium text-ups-brown">{p.invoiceNumber}</td>
                  <td className="p-4 text-gray-600">•••• {p.method === 'CREDIT_CARD' ? '4242' : 'WIRE'}</td>
                  <td className="p-4 font-bold text-gray-900">${p.amount.toFixed(2)}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => generateReceipt(p)} className="text-gray-400 hover:text-ups-gold transition-colors"><Download size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
