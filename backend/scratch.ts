import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function fix() {
  const hash = await bcrypt.hash('dummy', 10);
  await prisma.user.updateMany({
    where: { email: 'abc@example.com' },
    data: { passwordHash: hash }
  });
  console.log('Fixed password for abc@example.com!');
}

fix().catch(console.error).finally(() => prisma.$disconnect());
