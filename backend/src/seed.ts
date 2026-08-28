import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Phase 2 seed...');

  // Clean DB first to avoid duplicates
  await prisma.paymentRiskPrediction.deleteMany();
  await prisma.billingAnomaly.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceShipment.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customer.deleteMany();

  // 1. Create a Customer
  const customer1 = await prisma.customer.create({
    data: {
      customerCode: 'CUST-001',
      companyName: 'ABC Logistics',
      contactName: 'Alice Smith',
      email: 'alice@abclogistics.com',
      phone: '123-456-7890',
      billingAddress: '123 Freight Way, New York, NY',
      country: 'USA',
      billingHealthScore: 65, // Dropped due to recent overdue invoices
    },
  });

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);
  
  await prisma.user.create({
    data: { name: 'Alice Smith', email: 'alice@abclogistics.com', passwordHash, role: 'CUSTOMER', customerId: customer1.id },
  });

  await prisma.user.create({
    data: { name: 'Finance Admin', email: 'finance@ups.com', passwordHash, role: 'FINANCE' },
  });

  // 3. Generate 10 Invoices with corresponding Shipments to cover all scenarios
  const today = new Date();
  const invoicesData = [
    // 1. Paid in Full (Recent)
    { status: 'PAID', pastDays: 5, total: 1200, paid: 1200 },
    // 2. Paid in Full (Older)
    { status: 'PAID', pastDays: 20, total: 850, paid: 850 },
    // 3. Pending (Due in 5 days) - Normal
    { status: 'PENDING', pastDays: 25, dueOffset: 5, total: 2400, paid: 0 },
    // 4. Pending (Due tomorrow) - Anomalous Customs Charge
    { status: 'PENDING', pastDays: 29, dueOffset: 1, total: 4500, paid: 0, hasAnomaly: true },
    // 5. Overdue (By 3 days) - High Risk
    { status: 'OVERDUE', pastDays: 33, dueOffset: -3, total: 8900, paid: 0, hasRisk: true, riskScore: 82 },
    // 6. Overdue (By 15 days) - Severe Risk
    { status: 'OVERDUE', pastDays: 45, dueOffset: -15, total: 12500, paid: 0, hasRisk: true, riskScore: 95 },
    // 7. Partially Paid
    { status: 'PARTIALLY_PAID', pastDays: 10, dueOffset: 20, total: 5000, paid: 2000 },
    // 8. Processing (Waiting for Reconciliation match)
    { status: 'PROCESSING', pastDays: 2, dueOffset: 28, total: 1750, paid: 0, requiresMatch: true },
    // 9. Pending (Large Outstanding Balance - Target for Payment Plan)
    { status: 'PENDING', pastDays: 15, dueOffset: 15, total: 18000, paid: 0 },
    // 10. Overdue (By 5 days)
    { status: 'OVERDUE', pastDays: 35, dueOffset: -5, total: 3200, paid: 0, hasRisk: true, riskScore: 65 },
  ];

  for (let i = 0; i < invoicesData.length; i++) {
    const data = invoicesData[i];
    
    // Create Shipment
    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber: `1Z99999999999999${10 + i}`,
        customerId: customer1.id,
        origin: i % 2 === 0 ? 'Chennai' : 'Mumbai',
        destination: i % 2 === 0 ? 'New York' : 'London',
        shipmentDate: subDays(today, data.pastDays + 5),
        deliveryDate: subDays(today, data.pastDays),
        serviceType: i % 2 === 0 ? 'UPS Worldwide Express' : 'UPS Standard',
        weight: 10 + (i * 2.5),
        shipmentStatus: 'DELIVERED',
        actualCost: data.total - 100, // Fake calculation
      }
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-2026-0${i + 1}0`,
        customerId: customer1.id,
        invoiceDate: subDays(today, data.pastDays),
        dueDate: data.dueOffset ? addDays(today, data.dueOffset) : addDays(today, 30),
        subtotal: data.total - 150,
        fuelSurcharge: 100,
        customsAmount: 50,
        brokerageAmount: 0,
        handlingAmount: 0,
        additionalCharges: 0,
        tax: 0,
        totalAmount: data.total,
        paidAmount: data.paid,
        outstandingAmount: data.total - data.paid,
        status: data.status,
      }
    });

    await prisma.invoiceShipment.create({
      data: { invoiceId: invoice.id, shipmentId: shipment.id }
    });

    // Add Risk
    if (data.hasRisk) {
      await prisma.paymentRiskPrediction.create({
        data: {
          invoiceId: invoice.id,
          riskScore: data.riskScore || 75,
          riskLevel: data.riskScore! > 80 ? 'HIGH' : 'MEDIUM',
          factorsJson: JSON.stringify(['Multiple previous late payments', 'High invoice value', `${Math.abs(data.dueOffset || 0)} days overdue`]),
          modelVersion: 'v2',
        }
      });
    }

    // Add Anomaly
    if (data.hasAnomaly) {
      await prisma.billingAnomaly.create({
        data: {
          invoiceId: invoice.id,
          shipmentId: shipment.id,
          anomalyType: 'Unexpected Customs Charge',
          expectedValue: 50,
          actualValue: 800,
          deviation: 750,
          severity: 'HIGH',
          explanation: 'Customs charge is drastically higher than historical average for this route.',
          status: 'PENDING'
        }
      });
    }

    // Add Payments for Paid/Partially Paid
    if (data.paid > 0) {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          customerId: customer1.id,
          amount: data.paid,
          paymentMethod: 'CARD',
          status: 'SUCCESS',
          paidAt: new Date(),
          transactionReference: `TXN-SIM-PAID-${i}`
        }
      });
    }

    // Add dummy payment record waiting for reconciliation
    if (data.requiresMatch) {
       // We'll handle this in the reconciliation endpoint dummy data later, or create an unlinked payment here if schema supported it.
       // The spec says matching engine matches a received payment to an invoice.
       // Since `payment` model has `invoice_id` as required, we can't create unlinked payments easily.
       // We will just leave it PROCESSING and handle it in the UI/endpoint mock.
    }
  }

  console.log('Phase 2 Seed completed successfully! 10 robust records created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
