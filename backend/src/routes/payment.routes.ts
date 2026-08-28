import { Router } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// The user mentioned they want to use Stripe.
// For dev/mock without real keys, we can just return a fake clientSecret if Stripe fails
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' }); // use latest version or stable

router.post('/create-payment-intent', async (req, res) => {
  const { invoiceId, amount } = req.body; // amount in dollars

  try {
    // If not a real stripe key, just mock the success immediately for hackathon purposes
    if (STRIPE_SECRET_KEY === 'sk_test_mock') {
      return res.json({ clientSecret: 'mock_secret_key', mock: true });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: 'usd',
      metadata: { invoiceId },
    });

    res.json({ clientSecret: paymentIntent.client_secret, mock: false });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

router.post('/confirm', async (req, res) => {
  const { invoiceId, amount, paymentMethodId } = req.body;

  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Update invoice
    const newPaidAmount = invoice.paidAmount + amount;
    const newOutstanding = invoice.totalAmount - newPaidAmount;
    const newStatus = newOutstanding <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstanding > 0 ? newOutstanding : 0,
        status: newStatus,
      }
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        customerId: invoice.customerId,
        amount,
        paymentMethod: paymentMethodId || 'CARD',
        status: 'SUCCESS',
        paidAt: new Date(),
        transactionReference: `TXN-SIM-${Date.now()}`
      }
    });

    res.json({ success: true, invoice: updatedInvoice, payment });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

export default router;
