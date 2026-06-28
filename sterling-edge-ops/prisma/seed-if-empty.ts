/**
 * Called during Vercel build (and optionally Docker entrypoint).
 * Seeds the database only when it contains no users.
 * Safe to run on every deployment — idempotent.
 */
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function run() {
  const count = await prisma.user.count();
  if (count === 0) {
    console.log("Empty database detected — running seed...");
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
  } else {
    console.log(`Database already has ${count} users — skipping seed.`);
  }
}

run()
  .catch((e) => { console.error("Seed check failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
