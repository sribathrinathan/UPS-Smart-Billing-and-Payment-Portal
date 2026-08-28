import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const newPassword = 'SecureUpsPassword2026!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update finance user
  await prisma.user.updateMany({
    where: { email: 'finance@ups.com' },
    data: { passwordHash: hashedPassword }
  });

  // Update customer user
  await prisma.user.updateMany({
    where: { email: 'abc@example.com' },
    data: { passwordHash: hashedPassword }
  });

  console.log(`Successfully updated passwords to: ${newPassword}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
