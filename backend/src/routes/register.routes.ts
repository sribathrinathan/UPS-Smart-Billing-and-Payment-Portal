import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^[a-zA-Z0-9]{1,8}$/;

router.post('/', async (req, res) => {
  const { name, companyName, email, password, role } = req.body;

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!password || !PASSWORD_REGEX.test(password)) {
    return res.status(400).json({ error: 'Password must be alphanumeric and maximum 8 characters' });
  }
  if (!name || (!companyName && role === 'CUSTOMER')) {
    return res.status(400).json({ error: 'Name and Company Name are required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    let customer = null;

    if (role === 'FINANCE') {
      user = await prisma.user.create({
        data: { name, email, passwordHash, role: 'FINANCE' }
      });
    } else {
      const customerCode = `CUST-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      customer = await prisma.customer.create({
        data: {
          customerCode,
          companyName,
          contactName: name,
          email,
          phone: 'Not provided',
          billingAddress: 'Not provided',
          country: 'USA',
          billingHealthScore: 100
        }
      });
      user = await prisma.user.create({
        data: { name, email, passwordHash, role: 'CUSTOMER', customerId: customer.id }
      });
    }

    if (customer) {
      import('../utils/seedInvoices').then(({ generatePresentationInvoices }) => {
        generatePresentationInvoices(customer!.id).catch(err => console.error("Failed to seed invoices", err));
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, customerId: user.customerId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        customer,
        customerId: user.customerId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

export default router;
