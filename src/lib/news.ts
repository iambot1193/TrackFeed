import { prisma } from "@/lib/prisma";

/**
 * DEFINIÇÃO DE TIPOS (TS)
 */
export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  category?: string;
  language?: string; // Novo campo para rastrear o idioma
}

export interface FetchNewsOptions {
  languages: string[];
  sortBy?: "publishedAt" | "relevancy" | "popularity";
  categories?: string[];
  query?: string;
  page?: number;
}

const NEWS_API_KEY = process.env.NEWS_API_KEY || "";
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "";
const NEWS_BASE_URL = "https://newsapi.org/v2";
const GNEWS_BASE_URL = "https://gnews.io/api/v4";

const FRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000;
const MIN_ARTICLES_PER_CAT = 1;

/**
 * Garante que as categorias existam no Banco de Dados.
 */
async function ensureCategories() {
  const count = await prisma.category.count();
  if (count > 0) return await prisma.category.findMany();

  const initialCategories = [
    { slug: "technology", label: "Tecnologia", keywords: ["apple", "google", "samsung", "microsoft", "intel", "amd", "smartphone", "gadget", "windows", "linux", "iphone", "android", "software", "hardware", "celular", "computador", "tech"] },
    { slug: "ai", label: "IA", keywords: ["ia", "ai", "chatgpt", "openai", "claude", "gemini", "machine learning", "deep learning", "algoritmo", "bot", "copilot", "inteligência artificial", "neural"] },
    { slug: "movies", label: "Cinema", keywords: ["marvel", "oscar", "netflix", "disney", "warner", "trailer", "estreia", "diretor", "actor", "actress", "ator", "atriz", "cinema", "filme", "hollywood", "streaming"] },
    { slug: "games", label: "Games", keywords: ["playstation", "xbox", "nintendo", "steam", "rpg", "ubisoft", "epic games", "gta", "fortnite", "console", "gamer", "jogos", "esports", "cyberpunk"] },
    { slug: "business", label: "Negócios", keywords: ["mercado", "ações", "ibovespa", "nasdaq", "economia", "investimento", "banco", "startup", "lucro", "ceo", "bovespa", "dividendos", "negócios", "finance", "economy"] },
    { slug: "sports", label: "Esportes", keywords: ["futebol", "neymar", "messi", "nba", "flamengo", "palmeiras", "corinthians", "formula 1", "olimpíadas", "gol", "campeonato", "soccer", "basketball", "tennis"] },
    { slug: "science", label: "Ciência", keywords: ["nasa", "espaço", "planeta", "descoberta", "estudo", "pesquisa", "cientista", "genética", "universo", "telescópio", "biologia", "química", "física"] },
    { slug: "programming", label: "Programação", keywords: ["python", "javascript", "react", "node", "github", "código", "developer", "programador", "java", "typescript", "fullstack", "backend", "frontend", "programming"] },
    { slug: "health", label: "Saúde", keywords: ["saúde", "medicina", "vacina", "dieta", "exercício", "hospital", "vírus", "nutrição", "médico", "wellness", "fitness", "cancer", "doença"] },
    { slug: "crypto", label: "Cripto", keywords: ["bitcoin", "ethereum", "blockchain", "nft", "crypto", "cripto", "binance", "criptomoeda", "wallet", "mining", "dogecoin"] },
    { slug: "fashion", label: "Moda", keywords: ["moda", "estilo", "desfile", "vogue", "look", "grife", "fashion", "luxury", "passarela", "tendência"] }
  ];

  await prisma.category.createMany({ data: initialCategories });
  return await prisma.category.findMany();
}

const categoryTranslations: Record<string, string> = {
  technology: "tecnologia", sports: "esportes", business: "negócios",
  entertainment: "entretenimento", science: "ciência", health: "saúde",
  general: "geral", programming: "programação", ai: "inteligência artificial",
  design: "design", games: "jogos", crypto: "cripto", movies: "filmes",
  music: "música", fashion: "moda"
};

const MOCK_NEWS: NewsArticle[] = [
  {
    title: "O Futuro da IA: Como os modelos generativos estão mudando o código",
    description: "Uma análise profunda sobre como ferramentas de IA estão acelerando o desenvolvimento.",
    url: "https://example.com/ai-future",
    urlToImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
    publishedAt: new Date().toISOString(),
    source: { name: "TrackFeed AI" },
    category: "AI",
    language: "pt"
  }
];

/**
 * PERSISTÊNCIA COM IDIOMA
 */
async function cacheArticles(articles: NewsArticle[], lang: string) {
  try {
    for (const art of articles) {
      if (!art.url || !art.title) continue;
      await prisma.cachedArticle.upsert({
        where: { url: art.url },
        update: {
          category: art.category !== "Geral" ? art.category : undefined,
          language: lang // Atualiza o idioma se necessário
        },
        create: {
          title: art.title,
          description: art.description || "",
          url: art.url,
          imageUrl: art.urlToImage || "",
          source: art.source.name || "Fonte",
          category: art.category || "Geral",
          language: lang,
          publishedAt: art.publishedAt ? new Date(art.publishedAt) : new Date(),
        }
      });
    }
  } catch (error) { }
}

/**
 * Identificação de Categoria Baseada no Banco de Dados
 */
function identifyCategory(title: string, description: string, availableCats: any[]): string {
  const text = `${title} ${description}`.toLowerCase();
  for (const cat of availableCats) {
    for (const kw of cat.keywords) {
      if (text.includes(kw.toLowerCase())) return cat.slug.toLowerCase();
    }
  }
  return "general";
}

/**
 * BUSCA COM FILTRO DE IDIOMA NO CACHE
 */
export async function fetchNewsWithFilters(options: FetchNewsOptions): Promise<NewsArticle[]> {
  try {
    // 0. SETUP
    const availableCats = await ensureCategories();

    const { languages, sortBy = "publishedAt", categories = [], query = "", page = 1 } = options;
    const lang = languages.length > 0 ? languages[0] : "pt";

    // Normaliza para minúsculo para bater com o banco de dados
    const normalizedCategories = categories.length > 0 ? categories.map(c => c.toLowerCase()) : ["general", "technology", "science", "business", "ai", "games"];
    const rawTargets = normalizedCategories;

    // 1. CACHE LOCAL
    if (page === 1 && !query) {
      const threshold = new Date(Date.now() - FRESH_THRESHOLD_MS);
      const local = await prisma.cachedArticle.findMany({
        where: {
          category: { in: rawTargets },
          language: lang,
          cachedAt: { gte: threshold }
        },
        orderBy: { publishedAt: 'desc' },
        take: 30
      });

      if (local.length >= MIN_ARTICLES_PER_CAT) {
        return local.map(c => ({
          title: c.title, description: c.description || "", url: c.url,
          urlToImage: c.imageUrl || "", publishedAt: c.publishedAt?.toISOString() || c.cachedAt.toISOString(),
          source: { name: c.source || "Fonte" }, category: c.category, language: c.language
        }));
      }
    }

    const targets = lang === "pt" ? rawTargets.flatMap(t => [t, categoryTranslations[t.toLowerCase()] || t]) : rawTargets;
    const searchTerm = query || targets.join(" OR ");

    // 2. NEWSAPI
    try {
      const url = query
        ? `${NEWS_BASE_URL}/everything?q=${encodeURIComponent(query)}&language=${lang}&sortBy=${sortBy}&page=${page}&pageSize=20&apiKey=${NEWS_API_KEY}`
        : `${NEWS_BASE_URL}/everything?q=${encodeURIComponent(targets.join(" OR "))}&language=${lang}&sortBy=${sortBy}&page=${page}&pageSize=40&apiKey=${NEWS_API_KEY}`;

      const response = await fetch(url, { next: { revalidate: 60 } });
      const data = await response.json();

      if (data.status === "ok" && data.articles?.length > 0) {
        await updateApiQuota("newsapi"); // <--- Registra o consumo
        const processed = data.articles.filter((a: any) => a.urlToImage && !a.title.includes("[Removed]")).map((art: any) => ({
          ...art,
          category: identifyCategory(art.title, art.description || "", availableCats),
          language: lang
        }));
        await cleanupOldCache(); // <--- Só limpa agora que deu certo
        await cacheArticles(processed, lang);
        return processed;
      }
    } catch (e) { }

    // 3. GNEWS Failover
    if (GNEWS_API_KEY) {
      try {
        const url = `${GNEWS_BASE_URL}/search?q=${encodeURIComponent(searchTerm)}&lang=${lang}&apikey=${GNEWS_API_KEY}&max=10`;
        const response = await fetch(url, { next: { revalidate: 3600 } });
        const data = await response.json();
        if (data.articles) {
          await updateApiQuota("gnews"); // <--- Registra o consumo
          const gprocessed = data.articles.map((art: any) => ({
            title: art.title, description: art.description, url: art.url,
            urlToImage: art.image, publishedAt: art.publishedAt,
            source: { name: art.source.name },
            category: identifyCategory(art.title, art.description || "", availableCats),
            language: lang
          }));
          await cleanupOldCache(); // <--- Só limpa agora que deu certo
          await cacheArticles(gprocessed, lang);
          return gprocessed;
        }
      } catch (e) { }
    }

    // 4. BANCO OFFLINE (Tenta no idioma, se não der, pega qualquer uma)
    let anyLocal = await prisma.cachedArticle.findMany({
      where: { category: { in: rawTargets }, language: lang },
      orderBy: { publishedAt: 'desc' },
      take: 40
    });

    if (anyLocal.length === 0) {
      anyLocal = await prisma.cachedArticle.findMany({
        where: { category: { in: rawTargets } },
        orderBy: { publishedAt: 'desc' },
        take: 40
      });
    }

    if (anyLocal.length > 0) {
      return anyLocal.map(c => ({
        title: c.title, description: c.description || "", url: c.url, urlToImage: c.imageUrl || "",
        publishedAt: c.publishedAt?.toISOString() || c.cachedAt.toISOString(),
        source: { name: c.source || "Fonte" },
        category: c.category || "general"
      }));
    }

    return MOCK_NEWS;
  } catch (error) {
    return MOCK_NEWS;
  }
}

/**
 * Limpa notícias do cache global que tenham mais de 24 horas.
 * Isso mantém o banco leve e apenas com conteúdo fresco.
 */
async function cleanupOldCache() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deleted = await prisma.cachedArticle.deleteMany({
      where: {
        cachedAt: { lt: twentyFourHoursAgo }
      }
    });
    if (deleted.count > 0) {
      console.log(`>>> [CACHE] Limpeza concluída: ${deleted.count} notícias antigas removidas.`);
    }
  } catch (error) {
    console.error(">>> [CACHE] Erro na limpeza:", error);
  }
}

/**
 * Atualiza o status das cotas no banco de dados.
 */
async function updateApiQuota(api: "newsapi" | "gnews") {
  try {
    const field = api === "newsapi" ? "newsApiQuota" : "gnewsQuota";
    await prisma.apiStatus.upsert({
      where: { id: "singleton" },
      update: { [field]: { decrement: 1 }, lastUpdated: new Date() },
      create: {
        id: "singleton",
        newsApiQuota: api === "newsapi" ? 99 : 100,
        gnewsQuota: api === "gnews" ? 9 : 10,
        lastUpdated: new Date()
      }
    });
  } catch (e) {
    console.error(">>> [QUOTA ERROR]:", e);
  }
}

/**
 * Recupera o status atual das cotas
 */
export async function getApiStatus() {
  try {
    const status = await prisma.apiStatus.findUnique({ where: { id: "singleton" } });
    return status || { newsApiQuota: 100, gnewsQuota: 10, lastUpdated: new Date() };
  } catch (e) {
    return { newsApiQuota: 100, gnewsQuota: 10, lastUpdated: new Date() };
  }
}
