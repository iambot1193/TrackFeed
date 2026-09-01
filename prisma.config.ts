import { defineConfig } from "prisma/config";

// Prisma 7: a URL de conexão saiu do schema. CLI/Migrate leem daqui;
// o PrismaClient em runtime continua lendo DATABASE_URL do ambiente.
// process.env direto (não o helper env()) para não estourar quando a var
// está ausente — `prisma generate` no CI roda sem banco.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
