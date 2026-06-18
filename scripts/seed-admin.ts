import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const emailArg = args.find((arg) => arg.startsWith('--email='));
  const passwordArg = args.find((arg) => arg.startsWith('--password='));

  const email = emailArg ? emailArg.split('=')[1] : process.env.ADMIN_EMAIL;
  const password = passwordArg ? passwordArg.split('=')[1] : process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Lỗi: Vui lòng cấu hình ADMIN_EMAIL và ADMIN_PASSWORD trong file .env hoặc truyền tham số --email=... --password=...');
    process.exit(1);
  }

  console.log(`Seeding admin account...`);
  console.log(`Email: ${email}`);

  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`User already exists. Promoting to ADMIN role...`);
    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        password: passwordArg ? hashedPassword : existingUser.password,
      },
    });
    console.log(`Successfully updated user: ${updated.name} (${updated.email}) to ADMIN role.`);
  } else {
    console.log(`Creating new ADMIN user...`);
    const created = await prisma.user.create({
      data: {
        name: 'MyELTS Admin',
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`Successfully created ADMIN user: ${created.name} (${created.email}).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
