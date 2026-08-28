import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all invoices for a customer (requires auth middleware in reality)
router.get('/', async (req, res) => {
  const customerId = req.query.customerId as string;
  if (!customerId) return res.status(400).json({ error: 'customerId required' });

  try {
    const invoices = await prisma.invoice.findMany({
      where: { customerId },
      include: {
        shipments: {
          include: { shipment: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        shipments: {
          include: { shipment: true }
        },
        billingAnomalies: true,
        payments: true
      }
    });
    
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Mock Explain My Bill API
router.post('/:id/explain', async (req, res) => {
  // In a real app, this would call an LLM. Here we use deterministic mock logic.
  const { id } = req.params;
  const invoice = await prisma.invoice.findUnique({ where: { id }});
  
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  
  const explanation = `Your bill of $${invoice.totalAmount} is largely driven by base transportation ($${invoice.subtotal}) and customs ($${invoice.customsAmount}). Compared to your historical average, this invoice is higher due to an unexpected customs surcharge detected in one of the shipments.`;

  res.json({ explanation });
});

export default router;
