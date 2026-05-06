// @ts-check
import { PrismaClient } from "@prisma/client";
import pkg from 'bcryptjs';
const { hash } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("✅ Admin user already exists");
  } else {
    const hashedPassword = await hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: "Admin",
        role: "admin",
      },
    });

    console.log(`✅ Created admin user: ${admin.email}`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log("⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!");
  }

  const churchCount = await prisma.church.count();
  
  if (churchCount === 0) {
    console.log("\n📍 Creating sample churches...");
    
    const sampleChurches = [
      { name: "First Baptist Church", location: "Lagos, Nigeria", code: "ABC123" },
      { name: "Grace Community Church", location: "Abuja, Nigeria", code: "DEF456" },
      { name: "Hope Fellowship", location: "Ibadan, Nigeria", code: "GHI789" },
    ];

    for (const church of sampleChurches) {
      await prisma.church.create({ data: church });
      console.log(`  ✅ ${church.name} (${church.code})`);
    }
  } else {
    console.log(`\n✅ ${churchCount} churches already exist`);
  }

  console.log("\n🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
