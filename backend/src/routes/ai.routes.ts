import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';
import Groq from 'groq-sdk';

const router = Router();
const prisma = new PrismaClient();

// Groq LLaMA 3 AI Chatbot
router.post('/chat', async (req, res) => {
  const { message, customerId, role } = req.body;
  
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your-groq-api-key') {
    return res.json({ reply: 'Please add your Groq API Key to the backend .env file to enable the smart AI.' });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const model = process.env.GROQ_CHAT_MODEL || 'llama-3.1-8b-instant';

    let contextData = '';
    
    if (role === 'CUSTOMER') {
      const invoices = await prisma.invoice.findMany({ where: { customerId } });
      const outstanding = invoices.filter(i => i.status !== 'PAID');
      contextData = `
      You are an AI Billing Assistant for a Customer. 
      Customer Invoices Summary: They have ${outstanding.length} outstanding invoices. 
      Details of outstanding invoices: ${JSON.stringify(outstanding.map(i => ({ number: i.invoiceNumber, amount: i.outstandingAmount, status: i.status, dueDate: i.dueDate })))}.
      `;
    } else if (role === 'FINANCE') {
      const invoices = await prisma.invoice.findMany({ where: { status: { not: 'PAID' } }, include: { customer: true } });
      const highRisk = await prisma.paymentRiskPrediction.findMany({ where: { riskLevel: 'HIGH' }, include: { invoice: { include: { customer: true } } }});
      contextData = `
      You are an AI Finance Copilot for a Logistics Company (UPS).
      System Status: There are ${invoices.length} total outstanding invoices across all customers.
      High Risk Alerts: There are ${highRisk.length} high-risk invoices likely to default. 
      High Risk Details: ${JSON.stringify(highRisk.map(r => ({ customer: r.invoice.customer.companyName, amount: r.invoice.outstandingAmount, riskScore: r.riskScore })))}.
      `;
    }

    const systemPrompt = `
    ${contextData}
    Respond concisely, professionally, and directly answer their question using the context provided. Do not use markdown styling like asterisks for bolding, just plain text.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      model: model,
    });

    const text = chatCompletion.choices[0]?.message?.content || "I couldn't process that.";

    res.json({ reply: text });
  } catch (error: any) {
    console.error('Groq Error:', error.message);
    res.status(500).json({ error: `Groq AI Error: ${error.message}` });
  }
});

// Dynamic Payment Plan Generator
router.post('/payment-plan', async (req, res) => {
  const { invoiceId } = req.body;
  
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.outstandingAmount <= 0) return res.status(400).json({ error: 'Invalid invoice' });

    // Mock plan: Split into 3 installments (Today, +15 days, +30 days)
    const installmentAmount = (invoice.outstandingAmount / 3).toFixed(2);
    const today = new Date();
    
    const plan = {
      totalOutstanding: invoice.outstandingAmount,
      installments: [
        { date: today.toISOString(), amount: parseFloat(installmentAmount) },
        { date: addDays(today, 15).toISOString(), amount: parseFloat(installmentAmount) },
        { date: addDays(today, 30).toISOString(), amount: invoice.outstandingAmount - (parseFloat(installmentAmount) * 2) }
      ]
    };

    res.json({ plan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate payment plan' });
  }
});

// AI Collection Communication
router.post('/collection-email', async (req, res) => {
  const { invoiceId } = req.body;
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { customer: true } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    let email = `Hi ${invoice.customer.contactName},\n\nThis is a reminder regarding your invoice ${invoice.invoiceNumber}.`;
    
    if (invoice.status === 'OVERDUE') {
      email = `URGENT: Hi ${invoice.customer.contactName},\n\nOur records indicate that invoice ${invoice.invoiceNumber} is overdue. The outstanding balance is $${invoice.outstandingAmount.toFixed(2)}. Please arrange payment immediately to avoid service interruption.\n\nThank you,\nUPS Collections`;
    } else {
      email = `Hi ${invoice.customer.contactName},\n\nThis is a friendly reminder that invoice ${invoice.invoiceNumber} for $${invoice.outstandingAmount.toFixed(2)} is due on ${new Date(invoice.dueDate).toLocaleDateString()}.\n\nThank you,\nUPS Billing`;
    }

    res.json({ emailText: email });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

export default router;
