import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// API Key authentication middleware
const authenticateApiKey = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid API key' });
  }

  const token = authHeader.split(' ')[1];
  const apiKey = await prisma.apiKey.findUnique({
    where: { key: token },
    include: { customer: true }
  });

  if (!apiKey || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
    return res.status(401).json({ error: 'Invalid or expired API key' });
  }

  req.apiCustomer = apiKey.customer;
  next();
};

// Create a new invoice via API (e.g. from an external ERP like SAP)
router.post('/invoices', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { invoiceNumber, dueDate, totalAmount, status } = req.body;
    const customerId = req.apiCustomer?.id || req.body.customerId;

    if (!customerId || !invoiceNumber || !dueDate || !totalAmount) {
       return res.status(400).json({ error: 'Missing required fields' });
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        invoiceDate: new Date(),
        dueDate: new Date(dueDate),
        subtotal: totalAmount,
        fuelSurcharge: 0,
        customsAmount: 0,
        brokerageAmount: 0,
        handlingAmount: 0,
        additionalCharges: 0,
        tax: 0,
        totalAmount,
        outstandingAmount: totalAmount,
        status: status || 'PENDING'
      }
    });

    res.status(201).json({ message: 'Invoice imported successfully', invoice });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to import invoice: ' + error.message });
  }
});

export default router;
