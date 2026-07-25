import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const targetUrl = process.env.RLS_TARGET_URL;
if (!targetUrl) {
  console.error("Set RLS_TARGET_URL to the target database's connection string.");
  process.exit(1);
}

const sql = readFileSync(join(__dirname, "../prisma/rls/001_enable_tenant_rls.sql"), "utf-8");

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: targetUrl! } } });
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log("RLS policies applied.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
