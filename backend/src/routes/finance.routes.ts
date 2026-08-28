import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get finance dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({ 
      include: { customer: true },
      orderBy: { updatedAt: 'desc' }
    });
    
    let totalInvoices = invoices.length;
    let totalValue = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    invoices.forEach(inv => {
      totalValue += inv.totalAmount;
      paidAmount += inv.paidAmount;
      pendingAmount += inv.status === 'PENDING' ? inv.outstandingAmount : 0;
      overdueAmount += inv.status === 'OVERDUE' ? inv.outstandingAmount : 0;
    });

    const anomalies = await prisma.billingAnomaly.findMany({ where: { status: 'PENDING' }, include: { invoice: true } });
    const highRisk = await prisma.paymentRiskPrediction.findMany({ 
      where: { 
        riskLevel: 'HIGH',
        invoice: {
          status: { not: 'PAID' }
        }
      }, 
      include: { invoice: { include: { customer: true } } }
    });

    const today = new Date();
    const cashFlowForecast = Array.from({ length: 14 }).map((_, i) => {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + i);
      
      let expectedCash = 0;
      
      invoices.forEach(inv => {
        if (inv.status === 'PAID') return;
        
        const dueDate = new Date(inv.dueDate);
        const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        if (daysUntilDue === i) {
           expectedCash += inv.outstandingAmount * 0.85; // 85% collection rate on due date
        } else if (inv.status === 'OVERDUE' && i < 3) {
           expectedCash += inv.outstandingAmount * 0.33; // Spread overdue cash recovery across next 3 days
        } else if (daysUntilDue < 0 && i === 5) {
           // Assume late stragglers pay around day 5
           expectedCash += inv.outstandingAmount * 0.1; 
        }
      });

      return {
        date: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        expectedCash: Math.round(expectedCash)
      };
    });

    res.json({
      kpis: {
        totalInvoices,
        totalValue,
        paidAmount,
        pendingAmount,
        overdueAmount,
        collectionRate: totalValue > 0 ? (paidAmount / totalValue) * 100 : 0
      },
      cashFlowForecast,
      anomalies,
      highRisk,
      allInvoices: invoices
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch finance dashboard' });
  }
});

// Mock What-If Simulator
router.post('/what-if', async (req, res) => {
  const { collectionPercentage } = req.body; // e.g., 80 for 80%
  
  if (!collectionPercentage) return res.status(400).json({ error: 'collectionPercentage required' });

  try {
    const invoices = await prisma.invoice.findMany({ where: { status: 'PENDING' } });
    const currentPending = invoices.reduce((sum, inv) => sum + inv.outstandingAmount, 0);
    
    const simulatedCollection = currentPending * (collectionPercentage / 100);
    const simulatedImprovement = simulatedCollection;

    res.json({
      currentExpectedCollection: currentPending,
      simulatedCollection,
      simulatedImprovement,
      message: `Collecting ${collectionPercentage}% of pending invoices would yield $${simulatedCollection.toFixed(2)}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run simulator' });
  }
});

export default router;
