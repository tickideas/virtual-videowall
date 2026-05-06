// @ts-check
import { PrismaClient } from "@prisma/client";
import pkg from 'bcryptjs';
const { hash } = pkg;

const prisma = new PrismaClient();

async function createAdmin(email, password) {
  try {
    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log("Admin user already exists. Updating password...");
      const hashedPassword = await hash(password, 10);
      
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      
      console.log(`✅ Updated password for admin: ${email}`);
    } else {
      // Create new admin
      const hashedPassword = await hash(password, 10);
      
      const admin = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: "Admin",
          role: "admin",
        },
      });
      
      console.log(`✅ Created admin user: ${admin.email}`);
    }
    
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log("⚠️  STORE THESE CREDENTIALS SECURELY!");
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log("Usage: node scripts/create-admin.mjs <email> <password>");
  console.log("Example: node scripts/create-admin.mjs admin@example.com mypassword123");
  process.exit(1);
}

createAdmin(args[0], args[1]);
