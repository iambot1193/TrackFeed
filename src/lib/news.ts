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
  language?: string;
}

export interface FetchNewsOptions {
  languages: string[];
  sortBy?: "publishedAt" | "relevancy" | "popularity";
  categories?: string[];
  query?: string;
  page?: number;
  pageSize?: number;
}

const NEWS_API_KEY = process.env.NEWS_API_KEY || "";
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "";
const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const NEWS_BASE_URL = "https://newsapi.org/v2";
const GNEWS_BASE_URL = "https://gnews.io/api/v4";
const GUARDIAN_BASE_URL = "https://content.guardianapis.com";

async function ensureCategories() {
  const initialCategories = [
    { slug: "technology", label: "Tecnologia", keywords: ["apple", "google", "samsung", "microsoft", "intel", "amd", "smartphone", "gadget", "windows", "linux", "iphone", "android", "software", "hardware", "celular", "computador", "tech"] },
    { slug: "movies", label: "Cinema", keywords: ["marvel", "oscar", "netflix", "disney", "warner", "trailer", "estreia", "diretor", "actor", "actress", "ator", "atriz", "cinema", "filme", "hollywood", "streaming"] },
    { slug: "games", label: "Games", keywords: ["playstation", "xbox", "nintendo", "steam", "rpg", "ubisoft", "epic games", "gta", "fortnite", "console", "gamer", "jogos", "esports", "cyberpunk"] },
    { slug: "sports", label: "Esportes", keywords: ["futebol", "neymar", "messi", "nba", "flamengo", "palmeiras", "corinthians", "formula 1", "olimpíadas", "gol", "campeonato", "soccer", "basketball", "tennis"] },
    { slug: "science", label: "Ciência", keywords: ["nasa", "espaço", "planeta", "descoberta", "estudo", "pesquisa", "cientista", "genética", "universo", "telescópio", "biologia", "química", "física"] },
    { slug: "health", label: "Saúde", keywords: ["saúde", "medicina", "vacina", "dieta", "exercício", "hospital", "vírus", "nutrição", "médico", "wellness", "fitness", "cancer", "doença"] },
    { slug: "crypto", label: "Cripto", keywords: ["bitcoin", "ethereum", "blockchain", "nft", "crypto", "cripto", "binance", "criptomoeda", "wallet", "mining", "dogecoin"] },
    { slug: "music", label: "Música", keywords: ["música", "show", "álbum", "cantor", "banda", "spotify", "concerto", "clipe", "tour", "músico", "rock", "pop", "rap", "jazz", "hip-hop", "streaming", "vocalist", "billboard", "grammy", "single", "track", "canção", "melodia", "instrumento", "violão", "piano", "rádio", "mp3", "vinyl", "turnê", "compositor", "letra", "vocal", "batida", "ritmo", "soundcloud", "deezer", "apple music", "tidal", "mpb", "samba", "sertanejo", "funk", "trap", "reggae", "heavy metal", "indie", "eletrônica", "dj", "remix"] },
    { slug: "business", label: "Negócios", keywords: ["negócios", "economia", "mercado", "ações", "empresa", "startup", "investimento", "dólar", "pib", "finanças", "business", "economy", "market", "stock", "company", "startup", "investment", "finance"] }
  ];

  const slugs = initialCategories.map(c => c.slug);
  await prisma.category.deleteMany({ where: { slug: { notIn: slugs } } });
  await prisma.cachedArticle.updateMany({
    where: { category: { notIn: [...slugs, "general", "Geral"] } },
    data: { category: "general" }
  });
  for (const cat of initialCategories) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: cat, create: cat });
  }
  return await prisma.category.findMany();
}

const categoryTranslations: Record<string, string> = {
  technology: "tecnologia OR tech OR apple OR google OR microsoft OR samsung OR smartphone OR inovação OR hardware",
  sports: "esportes OR futebol OR nba OR f1 OR olimpíadas OR campeonato OR \"champions league\"",
  science: "ciência OR nasa OR espaço OR pesquisa OR descoberta OR universo OR \"estudo científico\"",
  health: "saúde OR medicina OR vacina OR bem-estar OR \"mental health\" OR dieta OR hospital",
  general: "notícias OR geral OR atualidades",
  games: "games OR videogame OR playstation OR xbox OR nintendo OR \"e-sports\"",
  crypto: "cripto OR bitcoin OR ethereum OR blockchain OR nft OR \"web3\"",
  movies: "filmes OR cinema OR \"movie trailer\" OR oscar OR marvel OR disney",
  music: "música OR show OR álbum OR concerto OR clipe OR festival OR spotify OR cantor OR banda OR tour",
  business: "negócios OR economia OR mercado OR ações OR startup OR investimento OR finanças OR pib"
};

async function cacheArticles(articles: NewsArticle[], lang: string) {
  try {
    for (const art of articles) {
      if (!art.url || !art.title) continue;
      await prisma.cachedArticle.upsert({
        where: { url: art.url },
        update: { category: art.category !== "Geral" ? art.category : undefined, language: lang },
        create: {
          title: art.title, description: art.description || "", url: art.url, imageUrl: art.urlToImage || "",
          source: art.source.name || "Fonte", category: art.category || "Geral", language: lang,
          publishedAt: art.publishedAt ? new Date(art.publishedAt) : new Date(),
        }
      });
    }
  } catch (error) { }
}

const sourceCategoryMap: Record<string, string> = {
  "TechCrunch": "technology", "The Verge": "technology", "Gizmodo": "technology", "Wired": "technology",
  "ESPN": "sports", "Globo Esporte": "sports", "Marca": "sports", "UOL Esporte": "sports",
  "CoinDesk": "crypto", "CoinTelegraph": "crypto", "Binance": "crypto",
  "IGN": "games", "GameSpot": "games", "PC Gamer": "games", "Polygon": "games", "Eurogamer": "games",
  "Variety": "movies", "The Hollywood Reporter": "movies", "Netflix": "movies",
  "Pitchfork": "music", "Rolling Stone": "music", "Billboard": "music", "Spotify": "music",
  "Nature": "science", "NASA": "science", "Scientific American": "science",
  "Bloomberg": "business", "Forbes": "business", "CNBC": "business", "Exame": "business"
};

function identifyCategory(title: string, description: string, availableCats: any[], sourceName?: string): string {
  const text = (title + " " + (description || "")).toLowerCase();
  const scores: Record<string, number> = {};
  availableCats.forEach(cat => scores[cat.slug] = 0);

  if (sourceName) {
    const foundSource = Object.entries(sourceCategoryMap).find(([key]) => sourceName.toLowerCase().includes(key.toLowerCase()));
    if (foundSource) {
      const mappedSlug = foundSource[1];
      if (scores[mappedSlug] !== undefined) scores[mappedSlug] += 50;
    }
  }

  for (const cat of availableCats) {
    const keywords = cat.keywords || [];
    for (const kw of keywords) {
      if (!kw) continue;
      const normalizedKw = kw.toLowerCase();
      if (text.includes(normalizedKw)) {
        scores[cat.slug] += 1;
        if (title.toLowerCase().includes(normalizedKw)) scores[cat.slug] += 3;
      }
    }
  }

  let bestCat = "general";
  let maxScore = 0;
  for (const [slug, score] of Object.entries(scores)) {
    if (score > maxScore) { maxScore = score; bestCat = slug; }
  }
  return maxScore >= 4 ? bestCat : "general";
}

async function categorizeBatchWithAI(articles: any[], availableCats: any[]): Promise<any[]> {
  const needsAI = articles.filter(a => a.category === "general");
  if (!GEMINI_API_KEY || needsAI.length === 0) return articles;

  const validCategories = availableCats.map(c => c.slug.toLowerCase());
  validCategories.push("general");

  const prompt = `Classifique estas notícias: ${validCategories.join(", ")}. Use "general" se tiver dúvida.
Notícias:
${needsAI.map((a, i) => `[${i}] Título: ${a.title}\nDescrição: ${a.description}`).join("\n\n")}
Retorne APENAS JSON: { "categories": ["cat1", "cat2", ...] }`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: "application/json" } })
    });
    const data = await response.json();
    if (data.error || !data.candidates) return articles;
    const resultText = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(resultText);
    const categoriesArray = parsed.categories || [];
    if (Array.isArray(categoriesArray)) {
       let aiIdx = 0;
       for (let i = 0; i < articles.length; i++) {
          if (articles[i].category === "general" && aiIdx < categoriesArray.length) {
             const returnedCat = String(categoriesArray[aiIdx] || "").toLowerCase();
             if (validCategories.includes(returnedCat)) articles[i].category = returnedCat;
             aiIdx++;
          }
       }
    }
  } catch (e) { }
  return articles; 
}

const dedup = (list: any[]) => {
  const uniqueMap = new Map();
  list.forEach(art => {
    const urlKey = art.url.trim().toLowerCase();
    const titleKey = art.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!uniqueMap.has(urlKey) && !uniqueMap.has(titleKey)) {
      uniqueMap.set(urlKey, art);
      uniqueMap.set(titleKey, art);
    }
  });
  return Array.from(new Set(uniqueMap.values())) as NewsArticle[];
};

export async function fetchNewsWithFilters(options: FetchNewsOptions): Promise<NewsArticle[]> {
  try {
    const availableCats = await ensureCategories();
    const { languages, sortBy = "publishedAt", categories = [], query = "", page = 1, pageSize = 30 } = options;
    const lang = languages.length > 0 ? languages[0] : "pt";
    let rawTargets = categories.length > 0 ? categories.map(c => c.toLowerCase()) : ["general"];
    if (rawTargets.includes("general") || rawTargets.length === 0) {
      rawTargets = ["technology", "science", "sports", "health", "games", "movies", "music", "crypto", "business"];
    }
    const targets = lang === "pt" ? rawTargets.flatMap(t => [t, categoryTranslations[t.toLowerCase()] || t]) : rawTargets;
    let searchTerm = query ? (rawTargets.length > 0 && !rawTargets.includes('general') ? `(${query}) AND (${targets.join(" OR ")})` : query) : targets.join(" OR ");

    let finalArticles: NewsArticle[] = [];
    let currentPage = page;
    const MAX_PAGES = page + 9;
    const TARGET_SIZE = page * pageSize;

    while (finalArticles.length < TARGET_SIZE && currentPage <= MAX_PAGES) {
      const status = await getApiStatus();
      if (status.newsApiQuota <= 0 && status.gnewsQuota <= 0 && lang === 'pt') break;

      const newsApiPromise = (currentPage <= 5 && status.newsApiQuota > 0 && lang === 'pt') 
        ? fetch(`${NEWS_BASE_URL}/everything?q=${encodeURIComponent(searchTerm)}&language=${lang}&sortBy=${sortBy}&page=${currentPage}&pageSize=20&apiKey=${NEWS_API_KEY}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(async data => {
              if (data.status === "ok" && data.articles?.length > 0) {
                await updateApiQuota("newsapi");
                return data.articles.filter((a: any) => a.title && a.urlToImage && !a.title.includes("[Removed]")).map((art: any) => ({
                  title: art.title, description: art.description || "", url: art.url, urlToImage: art.urlToImage, publishedAt: art.publishedAt,
                  source: { name: art.source?.name || "Fonte" }, category: "general", language: lang
                }));
              }
              return [];
            }).catch(() => [])
        : Promise.resolve([]);

      const gnewsPromise = (GNEWS_API_KEY && status.gnewsQuota > 0 && lang === 'pt')
        ? fetch(`${GNEWS_BASE_URL}/search?q=${encodeURIComponent(searchTerm.length > 190 ? rawTargets.join(" OR ") : searchTerm)}&lang=${lang}&apikey=${GNEWS_API_KEY}&max=10&page=${currentPage}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(async data => {
              if (data.articles && data.articles.length > 0) {
                await updateApiQuota("gnews");
                return data.articles.map((art: any) => ({
                  title: art.title, description: art.description || "", url: art.url, urlToImage: art.image, publishedAt: art.publishedAt,
                  source: { name: art.source?.name || "GNews" }, category: "general", language: lang
                }));
              }
              return [];
            }).catch(() => [])
        : Promise.resolve([]);

      const guardianPromise = (GUARDIAN_API_KEY && lang === 'en')
        ? fetch(`${GUARDIAN_BASE_URL}/search?q=${encodeURIComponent(searchTerm)}&api-key=${GUARDIAN_API_KEY}&show-fields=thumbnail,trailText&page=${currentPage}&page-size=20`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
              if (data.response?.status === "ok" && data.response.results?.length > 0) {
                return data.response.results.map((art: any) => ({
                  title: art.webTitle, description: art.fields?.trailText || "", url: art.webUrl, urlToImage: art.fields?.thumbnail || "",
                  publishedAt: art.webPublicationDate, source: { name: "The Guardian" }, category: "general", language: lang
                }));
              }
              return [];
            }).catch(() => [])
        : Promise.resolve([]);

      const [naA, gnA, guA] = await Promise.all([newsApiPromise, gnewsPromise, guardianPromise]);
      const combined = [...naA, ...gnA, ...guA];
      if (combined.length === 0 && currentPage > page + 1) break;

      let unique = dedup(combined);
      unique.forEach((art: any) => { art.category = identifyCategory(art.title, art.description, availableCats, art.source?.name); });
      unique = await categorizeBatchWithAI(unique, availableCats);
      if (!rawTargets.includes("general")) {
        unique = unique.filter(a => rawTargets.includes(a.category?.toLowerCase() || ""));
      }
      finalArticles = dedup([...finalArticles, ...unique]);
      if (finalArticles.length >= TARGET_SIZE) break;
      currentPage++;
    }

    if (finalArticles.length > 0) {
      await cacheArticles(finalArticles, lang);
    }

    if (finalArticles.length < 9) {
      const fourMonthsAgo = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
      const thematicBackup = await prisma.cachedArticle.findMany({
        where: { category: { in: rawTargets }, language: lang, url: { notIn: finalArticles.map(a => a.url) }, cachedAt: { gte: fourMonthsAgo } },
        orderBy: { publishedAt: 'desc' }, take: 200
      });
      if (thematicBackup.length > 0) {
        finalArticles = [...finalArticles, ...thematicBackup.map(b => ({
          title: b.title, description: b.description || "", url: b.url, urlToImage: b.imageUrl || "",
          publishedAt: b.publishedAt?.toISOString() || b.cachedAt.toISOString(), source: { name: b.source || "Arquivo" },
          category: b.category, language: b.language
        }))];
      }
      finalArticles = dedup(finalArticles);
    }
    return finalArticles.slice(0, Math.max(12, pageSize));
  } catch (error) { return []; }
}

async function updateApiQuota(api: "newsapi" | "gnews") {
  try {
    const field = api === "newsapi" ? "newsApiQuota" : "gnewsQuota";
    const current = await getApiStatus();
    await prisma.apiStatus.upsert({
      where: { id: "singleton" },
      update: { [field]: Math.max(0, current[field] - 1), lastUpdated: new Date() },
      create: { id: "singleton", newsApiQuota: 100, gnewsQuota: 100, lastUpdated: new Date() }
    });
  } catch (e) {}
}

export async function getApiStatus() {
  try {
    let status = await prisma.apiStatus.findUnique({ where: { id: "singleton" } });
    if (!status) return { newsApiQuota: 100, gnewsQuota: 100, lastUpdated: new Date() };
    const now = new Date();
    if ((now.getTime() - new Date(status.lastUpdated).getTime()) / (1000 * 60 * 60) >= 24) {
      status = await prisma.apiStatus.update({ where: { id: "singleton" }, data: { newsApiQuota: 100, gnewsQuota: 100, lastUpdated: now } });
    }
    return status;
  } catch (e) { return { newsApiQuota: 100, gnewsQuota: 100, lastUpdated: new Date() }; }
}

export async function summarizeArticle(title: string, description: string) {
  try {
    const prompt = `Resuma em 3 tópicos curtos: Título: ${title} Descrição: ${description}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 250 } })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Resumo indisponível.";
  } catch (e) { return "Erro no resumo."; }
}
