import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config(); // Load .env file

async function createSuperAdmin() {
  const prisma = new PrismaClient();

  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const name = process.env.SUPER_ADMIN_NAME;

    if (!email || !password || !name) {
      throw new Error('Super admin credentials not found in .env');
    }

    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: UserRole.SUPER_ADMIN },
    });

    if (existingSuperAdmin) {
      console.log('Super admin already exists');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: UserRole.SUPER_ADMIN,
        department: process.env.DEPARTMENT_CODE || 'CSE',
        isOAuthUser: false,
        googleId: null,
      },
    });

    console.log('Super admin created successfully:', {
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      role: superAdmin.role,
    });
  } catch (error) {
    console.error('Failed to create super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
