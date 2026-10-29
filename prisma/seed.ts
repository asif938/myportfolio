import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BCRYPT_COST = 12;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set to run the seed script.`);
  }
  return value;
}

async function main() {
  const username = requireEnv("ADMIN_USERNAME");
  const password = requireEnv("ADMIN_PASSWORD");
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
  }

  // Create the admin only if it does not exist yet. Existing users are never modified here;
  // use `npm run admin:password` to rotate a password.
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`Admin user "${username}" already exists; leaving it unchanged.`);
  } else {
    await prisma.user.create({
      data: { username, password: await bcrypt.hash(password, BCRYPT_COST) },
    });
    console.log(`Created admin user "${username}".`);
  }

  // Ensure there's at least one profile record
  const profileCount = await prisma.profile.count();
  if (profileCount === 0) {
    await prisma.profile.create({
      data: {
        name: "Your Name",
        designation: "Frontend Developer",
        aboutMe: "Write your story here.",
      },
    });
    console.log("Created a placeholder profile.");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
