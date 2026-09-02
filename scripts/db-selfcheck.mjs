/**
 * Self-check do driver adapter do Prisma 7 (node scripts/db-selfcheck.mjs).
 * Exige um DATABASE_URL apontando para um Postgres descartável.
 *
 * Desde o Prisma 7 não existe mais engine embutido: a conexão passa por um
 * driver adapter (@prisma/adapter-pg). `next build` só prova que o client
 * compila — quem prova que ele fala com o banco é este script.
 */
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não definida — aponte para um banco descartável antes de rodar.");
  process.exit(1);
}

// Mesma montagem de src/lib/prisma.ts.
const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) });

const email = `selfcheck-${Date.now()}@trackfeed.test`;

try {
  // Write + read de volta: prova que o adapter conecta e serializa tipos.
  const user = await prisma.user.create({
    data: { email, passwordHash: "hash-de-teste", name: "Selfcheck" },
  });
  const encontrado = await prisma.user.findUnique({ where: { email } });
  assert.equal(encontrado?.id, user.id, "usuário criado deve ser lido de volta");
  assert.ok(encontrado?.createdAt instanceof Date, "DateTime deve chegar como Date");
  console.log("ok  create + findUnique");

  await prisma.preference.create({ data: { userId: user.id, categoryName: "technology" } });
  const comPreferencias = await prisma.user.findUnique({
    where: { id: user.id },
    include: { preferences: true },
  });
  assert.equal(comPreferencias?.preferences.length, 1, "relação deve vir no include");
  console.log("ok  relação + include");

  // Transação interativa: o que driver adapters mais costumam quebrar.
  const versao = await prisma.$transaction(async (tx) => {
    const atualizado = await tx.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } },
    });
    return atualizado.sessionVersion;
  });
  assert.equal(versao, 1, "transação interativa deve commitar o increment");
  console.log("ok  $transaction");

  await assert.rejects(
    prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { name: "não-deve-persistir" } });
      throw new Error("rollback proposital");
    }),
    "transação deve propagar o erro"
  );
  const depoisDoRollback = await prisma.user.findUnique({ where: { id: user.id } });
  assert.equal(depoisDoRollback?.name, "Selfcheck", "rollback deve descartar a escrita");
  console.log("ok  rollback");

  // onDelete: Cascade é declarado no schema — confirma que chega no banco.
  await prisma.user.delete({ where: { id: user.id } });
  const orfas = await prisma.preference.count({ where: { userId: user.id } });
  assert.equal(orfas, 0, "cascade deve limpar as preferences do usuário");
  console.log("ok  cascade delete");

  console.log("\nadapter pg: todos os checks passaram");
} finally {
  await prisma.$disconnect();
}
