import bcrypt from "bcrypt";
import prisma from "../src/db.js";

async function main() {
  const email = "chhayaSuperAdmin@yammy.com";
  const password = "Herald@54321";

  const existing = await prisma.users.findUnique({ where: { user_email: email } });
  if (existing) {
    console.log("SuperAdmin already exists, skipping.");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.users.create({
    data: {
      user_name: "Super Admin",
      user_email: email,
      user_password: hashedPassword,
      user_role: "SuperAdmin",
      is_active: true,
      first_login: false,
    },
  });

  console.log("SuperAdmin created:", email);
}

main().catch(console.error).finally(() => prisma.$disconnect());