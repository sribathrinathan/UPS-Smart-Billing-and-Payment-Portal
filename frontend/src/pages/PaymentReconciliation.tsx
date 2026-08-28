import React, { useEffect, useState } from 'react';
import api from '../api';
import { ArrowLeft, CheckCircle, XCircle, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PaymentReconciliation() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    api.get('/reconciliation/pending').then(res => setSuggestions(res.data));
  }, []);

  const handleApprove = async (s: any) => {
    try {
      await api.post('/reconciliation/approve', {
        invoiceId: s.suggestedInvoice.id,
        paymentAmount: s.paymentAmount,
        paymentRef: s.paymentRef
      });
      setSuggestions(suggestions.filter(x => x.paymentId !== s.paymentId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-ups-brown hover:text-ups-gold mb-6 transition-colors">
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-ups-brown mb-8 flex items-center gap-3">
          <BrainCircuit className="text-ups-gold" size={32} />
          AI Payment Reconciliation
        </h1>

        <div className="space-y-6">
          {suggestions.length === 0 ? <p className="text-gray-500">No pending payments to reconcile.</p> : suggestions.map((s, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Unmatched Payment Received</h3>
                  <p className="text-3xl font-black text-gray-900 mt-1">${s.paymentAmount.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mt-1">Ref: {s.paymentRef}</p>
                </div>
                <div className="text-right bg-green-50 p-3 rounded-lg border border-green-100">
                  <p className="text-xs font-bold text-green-800 uppercase">AI Match Confidence</p>
                  <p className="text-2xl font-black text-green-600">{s.confidence}%</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                <p className="text-sm font-bold text-ups-brown mb-2">Suggested Invoice Target:</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{s.suggestedInvoice.customer.companyName}</p>
                    <p className="text-sm text-gray-600">Invoice: {s.suggestedInvoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Current Outstanding</p>
                    <p className="font-bold text-red-600">${s.suggestedInvoice.outstandingAmount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-700 italic"><span className="font-bold not-italic text-ups-gold">AI Reasoning: </span>{s.reason}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => handleApprove(s)}
                  className="flex-1 py-3 bg-ups-gold text-ups-brown font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-[#e5a300] transition-colors"
                >
                  <CheckCircle size={20} /> Approve Match
                </button>
                <button className="flex-1 py-3 border border-gray-300 text-gray-700 font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                  <XCircle size={20} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
