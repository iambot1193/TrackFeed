import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

async function main() {
  console.log(">>> Iniciando a re-classificação de todas as notícias do Banco de Dados...");
  if (!GEMINI_API_KEY) {
    console.error(">>> GEMINI_API_KEY não encontrada no .env!");
    return;
  }

  const articles = await prisma.cachedArticle.findMany();
  console.log(`>>> Encontrados ${articles.length} artigos no cofre.`);

  const availableCats = await prisma.category.findMany();
  const validCategories = availableCats.map(c => c.slug.toLowerCase());
  validCategories.push("general");

  // Processa em lotes de 20 para não sobrecarregar a IA
  for (let i = 0; i < articles.length; i += 20) {
    const batch = articles.slice(i, i + 20);
    console.log(`>>> Processando Lote ${i / 20 + 1} de ${Math.ceil(articles.length / 20)}...`);

    const prompt = `
Você é uma IA de categorização de notícias.
Vou te passar uma lista de notícias (Título e Descrição).
Você DEVE categorizar CADA UMA em EXATAMENTE UMA destas categorias: ${validCategories.join(", ")}.
Se não se encaixar em nenhuma, use "general".

REGRAS ESTRITAS DE CLASSIFICAÇÃO:
1. "games" refere-se EXCLUSIVAMENTE a videogames (Playstation, Xbox, PC, Nintendo), e-sports, jogos virtuais, de tabuleiro ou cartas.
2. "sports" refere-se EXCLUSIVAMENTE a esportes físicos tradicionais (Futebol, Basquete, Olimpíadas, Fórmula 1, etc). NUNCA classifique futebol ou esportes reais na categoria "games".

Retorne APENAS um array JSON de strings válidas, onde cada string é a categoria exata para a notícia naquele índice. Não retorne markdown, apenas o array JSON puro.

Notícias:
${batch.map((a, idx) => `[${idx}] Título: ${a.title}\nDescrição: ${a.description}`).join("\n\n")}
    `;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0]) {
        const resultText = data.candidates[0].content.parts[0].text;
        const categoriesArray = JSON.parse(resultText);

        if (Array.isArray(categoriesArray) && categoriesArray.length === batch.length) {
          for (let j = 0; j < batch.length; j++) {
            const newCat = validCategories.includes(categoriesArray[j]) ? categoriesArray[j] : "general";
            await prisma.cachedArticle.update({
              where: { id: batch[j].id },
              data: { category: newCat }
            });
          }
          console.log(`>>> Lote ${i / 20 + 1} re-taggeado com sucesso!`);
        } else {
            console.error(">>> Erro de formatação da IA:", categoriesArray);
        }
      }
    } catch (e: any) {
      console.error(`>>> Erro no lote ${i / 20 + 1}:`, e.message);
    }
    
    // Delay de 1.5s entre os lotes
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(">>> Missão Cumprida! Todo o banco está com as tags purificadas.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
