import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get unmatched payments and suggest invoices
router.get('/pending', async (req, res) => {
  try {
    // We mock a received raw payment event that needs matching
    const mockUnmatchedPayments = [
      { id: 'RAW-PAY-1', amount: 1750, reference: 'TXN-WIRE-0992', date: new Date() }
    ];

    // Find the processing invoice we seeded
    const processingInvoice = await prisma.invoice.findFirst({
      where: { status: 'PROCESSING' },
      include: { customer: true }
    });

    let suggestions = [];
    if (processingInvoice) {
      suggestions.push({
        paymentId: 'RAW-PAY-1',
        paymentAmount: 1750,
        paymentRef: 'TXN-WIRE-0992',
        suggestedInvoice: processingInvoice,
        confidence: 96,
        reason: 'Exact amount match and customer name similarity in wire transfer memo.'
      });
    }

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reconciliation data' });
  }
});

// Approve a match
router.post('/approve', async (req, res) => {
  const { invoiceId, paymentAmount, paymentRef } = req.body;
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Mark invoice as PAID
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: invoice.paidAmount + paymentAmount,
        outstandingAmount: Math.max(0, invoice.outstandingAmount - paymentAmount),
        status: invoice.outstandingAmount - paymentAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID'
      }
    });

    // Create the formal payment record
    await prisma.payment.create({
      data: {
        invoiceId,
        customerId: invoice.customerId,
        amount: paymentAmount,
        paymentMethod: 'WIRE_TRANSFER',
        status: 'SUCCESS',
        paidAt: new Date(),
        transactionReference: paymentRef
      }
    });

    res.json({ success: true, message: 'Payment successfully reconciled.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reconcile payment' });
  }
});

export default router;
