import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// In-memory store for OTPs (For production, use Redis or a DB table)
const otpStore = new Map<string, { otp: string, data: any, expires: number }>();

// Validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^[a-zA-Z0-9]{1,8}$/;

router.post('/initiate', async (req, res) => {
  const { name, companyName, email, password, role } = req.body;

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!password || !PASSWORD_REGEX.test(password)) {
    return res.status(400).json({ error: 'Password must be alphanumeric and maximum 8 characters' });
  }
  if (!name || (!companyName && role === 'CUSTOMER')) {
    return res.status(400).json({ error: 'Name and Company Name are required for customers' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email, { otp, data: { name, companyName, email, password, role: role || 'CUSTOMER' }, expires });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || '"UPS Smart Billing" <noreply@ups.com>',
      to: email,
      subject: 'UPS Smart Billing - Registration OTP',
      text: `Your OTP for registration is: ${otp}. It will expire in 10 minutes.`
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`[REAL EMAIL SENT TO ${email}] OTP: ${otp}`);
    } else {
      console.log(`[MOCK EMAIL SENT TO ${email}] OTP: ${otp}`);
    }

    res.json({ message: 'OTP sent successfully to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to initiate registration' });
  }
});

router.post('/verify', async (req, res) => {
  const { email, otp } = req.body;

  const stored = otpStore.get(email);
  if (!stored) {
    return res.status(400).json({ error: 'OTP expired or not found. Please register again.' });
  }
  if (Date.now() > stored.expires) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP expired. Please register again.' });
  }
  if (stored.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  try {
    const { name, companyName, password, role } = stored.data;
    
    // Hash password
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

    otpStore.delete(email);

    if (customer) {
      // Automatically generate 10 mock presentation invoices for the new customer!
      import('../utils/seedInvoices').then(({ generatePresentationInvoices }) => {
        generatePresentationInvoices(customer!.id).catch(err => console.error("Failed to seed invoices", err));
      });
    }

    // Generate Token
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
