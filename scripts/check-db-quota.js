const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const status = await prisma.apiStatus.findUnique({ where: { id: "singleton" } });
  console.log("\n=== API QUOTA STATUS IN DATABASE ===");
  if (!status) {
    console.log("Nenhum registro de apiStatus encontrado no banco (usando padrão 100/100).");
  } else {
    console.log(`NewsAPI Quota Restante: ${status.newsApiQuota}`);
    console.log(`GNews Quota Restante: ${status.gnewsQuota}`);
    console.log(`Última Atualização: ${status.lastUpdated}`);
  }
  console.log("=====================================\n");
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Erro ao verificar cota no banco:", err);
  process.exit(1);
});
