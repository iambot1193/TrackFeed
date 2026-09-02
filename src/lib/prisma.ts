import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Prisma 7 removeu o engine embutido: a conexão passa por um driver adapter.
// O adapter fica do lado direito do `||` para o HMR do dev não abrir um pool
// novo a cada reload enquanto reusa o client já cacheado no global.
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL as string) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
