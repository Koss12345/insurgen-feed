import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Prisma's CLI resolves a relative sqlite DATABASE_URL against the schema
// file's directory (prisma/), but the client at runtime resolves it
// against process.cwd() — which differ when Next starts from the project
// root. Point the client at the same file explicitly so `prisma migrate`
// and the running app always agree on which .db file they're using.
const sqliteUrl = process.env.DATABASE_URL?.startsWith("file:")
  ? `file:${path.join(process.cwd(), "prisma", process.env.DATABASE_URL.slice("file:".length))}`
  : process.env.DATABASE_URL;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: sqliteUrl });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
