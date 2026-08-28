import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'UPS Smart Billing Backend is running' });
});

import authRoutes from './routes/auth.routes';
import externalRouter from './routes/external.routes';
import invoiceRoutes from './routes/invoice.routes';
import financeRoutes from './routes/finance.routes';
import paymentRoutes from './routes/payment.routes';
import aiRoutes from './routes/ai.routes';
import reconciliationRoutes from './routes/reconciliation.routes';
import registerRoutes from './routes/register.routes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/v1/external', externalRouter);

import { seedDummyCustomers } from './utils/seedInvoices';

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await seedDummyCustomers().catch(err => console.error('Seed Error:', err));
});
