import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../api';
import { ShieldCheck, ArrowLeft, BrainCircuit } from 'lucide-react';
import clsx from 'clsx';

// For hackathon, use a mock key or real test key if available
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx'); 

function CheckoutForm({ invoiceId, amount, onSuccess }: { invoiceId: string, amount: number, onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      // Step 1: Create payment intent on backend
      const { data: intentData } = await api.post('/payments/create-payment-intent', { invoiceId, amount });

      // If backend mock is true, skip stripe confirm
      if (intentData.mock) {
        await api.post('/payments/confirm', { invoiceId, amount, paymentMethodId: 'mock_card' });
        onSuccess();
        return;
      }

      // Step 2: Confirm with Stripe
      const result = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent?.status === 'succeeded') {
        await api.post('/payments/confirm', { invoiceId, amount, paymentMethodId: result.paymentIntent.payment_method });
        onSuccess();
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during payment processing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <CardElement options={{
          style: {
            base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
            invalid: { color: '#9e2146' },
          }
        }}/>
      </div>
      {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
      <button 
        type="submit" 
        disabled={!stripe || loading}
        className="w-full py-3 bg-ups-gold text-ups-brown font-bold rounded-lg shadow hover:bg-[#e5a300] transition-colors disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function PaymentSimulator() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [useAiPlan, setUseAiPlan] = useState(false);
  const [aiPlan, setAiPlan] = useState<any>(null);

  useEffect(() => {
    api.get(`/invoices/${id}`).then(res => {
      setInvoice(res.data);
      // Simulate an AI dynamic plan fetch
      if (res.data.outstandingAmount > 0) {
         setAiPlan({
            total: res.data.outstandingAmount,
            installments: [
              { amount: res.data.outstandingAmount * 0.25, date: 'Today' },
              { amount: res.data.outstandingAmount * 0.50, date: 'In 15 Days (Mid-Month)' },
              { amount: res.data.outstandingAmount * 0.25, date: 'In 30 Days' }
            ],
            reasoning: "Based on your historical cash flow, paying 50% mid-month aligns best with your revenue cycle."
         });
      }
    });
  }, [id]);

  if (!invoice) return <div className="p-8">Loading checkout...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-ups-brown hover:text-ups-gold mb-6 transition-colors">
          <ArrowLeft size={20} /> Back to Invoice
        </button>
        
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-ups-brown rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} className="text-ups-gold" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Secure Payment</h2>
            <p className="text-gray-500 mt-1">Invoice {invoice.invoiceNumber}</p>
          </div>

          <div className="mb-6 flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button onClick={() => setUseAiPlan(false)} className={clsx("flex-1 py-2 text-sm font-bold rounded-md transition-all", !useAiPlan ? "bg-white shadow text-ups-brown" : "text-gray-500 hover:text-gray-700")}>
              Pay in Full
            </button>
            <button onClick={() => setUseAiPlan(true)} className={clsx("flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2", useAiPlan ? "bg-ups-brown text-ups-gold shadow" : "text-gray-500 hover:text-gray-700")}>
              <BrainCircuit size={16} /> AI Payment Plan
            </button>
          </div>

          {!useAiPlan ? (
            <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
              <p className="text-sm font-medium text-gray-500 uppercase">Amount Due Today</p>
              <p className="text-4xl font-black text-ups-brown mt-1">${invoice.outstandingAmount.toFixed(2)}</p>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-center gap-2 text-orange-800 font-bold mb-2">
                <BrainCircuit size={18} /> Personalized Plan Generated
              </div>
              <p className="text-xs text-orange-700 mb-4">{aiPlan?.reasoning}</p>
              <div className="space-y-2">
                {aiPlan?.installments.map((inst: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-orange-100">
                    <span className="text-sm font-medium text-gray-600">{inst.date}</span>
                    <span className="font-bold text-ups-brown">${inst.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-gray-500 uppercase text-center mt-6">Due Today</p>
              <p className="text-3xl font-black text-ups-brown text-center">${aiPlan?.installments[0].amount.toFixed(2)}</p>
            </div>
          )}

          <Elements stripe={stripePromise}>
            <CheckoutForm 
              invoiceId={invoice.id} 
              amount={useAiPlan ? aiPlan?.installments[0].amount : invoice.outstandingAmount} 
              onSuccess={() => navigate('/customer')}
            />
          </Elements>

          <p className="text-xs text-center text-gray-400 mt-6 mt-8 flex items-center justify-center gap-1">
            <ShieldCheck size={12}/> Secured by Stripe. (This is a Sandbox Environment)
          </p>
        </div>
      </div>
    </div>
  );
}
