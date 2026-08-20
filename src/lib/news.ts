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

interface CategoryRow {
  slug: string;
  label: string;
  keywords: string[];
}

/** Formato bruto do artigo antes da normalização — cada provedor devolve um shape diferente. */
interface RawArticle {
  title?: string;
  description?: string | null;
  url?: string;
  urlToImage?: string;
  image?: string;
  webTitle?: string;
  webUrl?: string;
  webPublicationDate?: string;
  publishedAt?: string;
  source?: { name?: string };
  fields?: { thumbnail?: string; trailText?: string };
}

const NEWS_API_KEY = process.env.NEWS_API_KEY || "";
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "";
const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const NEWS_BASE_URL = "https://newsapi.org/v2";
const GNEWS_BASE_URL = "https://gnews.io/api/v4";
const GUARDIAN_BASE_URL = "https://content.guardianapis.com";

let cachedCategories: CategoryRow[] | null = null;

async function ensureCategories() {
  if (cachedCategories) return cachedCategories;

  try {
    const existing = await prisma.category.findMany();
    if (existing.length >= 9) {
      cachedCategories = existing;
      return existing;
    }
  } catch (err) {
    console.error("[ensureCategories] Erro rápido ao ler categorias:", err);
  }

  const initialCategories = [
    { 
      slug: "technology", 
      label: "Tecnologia", 
      keywords: [
        "apple", "google", "samsung", "microsoft", "intel", "amd", "nvidia", "smartphone", "gadget", 
        "windows", "linux", "iphone", "android", "software", "hardware", "celular", "computador", 
        "tech", "tecnologia", "inteligência artificial", "ia", "chatgpt", "gemini", "copilot", 
        "processador", "notebook", "whatsapp", "aplicativo", "app", "desenvolvimento", "programação", 
        "tecnoblog", "canaltech", "olhar digital", "tudocelular", "adrenaline", "techtudo", "cybersegurança", 
        "hacker", "robótica", "ciência de dados"
      ] 
    },
    { 
      slug: "movies", 
      label: "Cinema", 
      keywords: [
        "marvel", "oscar", "netflix", "disney", "warner", "trailer", "estreia", "diretor", "actor", 
        "actress", "ator", "atriz", "cinema", "filme", "filmes", "hollywood", "streaming", "série", 
        "séries", "hbo max", "prime video", "globoplay", "roteiro", "lançamento", "pipoca", "adorocinema", 
        "omelete", "cinepop", "pipoca moderna"
      ] 
    },
    { 
      slug: "games", 
      label: "Games", 
      keywords: [
        "playstation", "xbox", "nintendo", "steam", "rpg", "ubisoft", "epic games", "gta", "fortnite", 
        "console", "gamer", "gamers", "jogos", "jogo", "esports", "e-sports", "cyberpunk", "videogame", 
        "jogabilidade", "cs:go", "valorant", "league of legends", "lol", "minecraft", "retrogame", "voxel", 
        "meuplaystation", "the enemy"
      ] 
    },
    { 
      slug: "sports", 
      label: "Esportes", 
      keywords: [
        "futebol", "neymar", "messi", "nba", "flamengo", "palmeiras", "corinthians", "formula 1", 
        "olimpíadas", "gol", "campeonato", "soccer", "basketball", "tennis", "esporte", "esportes", 
        "brasileirão", "copa do brasil", "libertadores", "champions league", "basquete", "vôlei", "tênis", 
        "fórmula 1", "f1", "estádio", "ge.globo", "globo esporte", "uol esporte", "lance!", "fifa", 
        "atletismo", "mma", "ufc"
      ] 
    },
    { 
      slug: "science", 
      label: "Ciência", 
      keywords: [
        "nasa", "espaço", "planeta", "descoberta", "estudo", "pesquisa", "cientista", "cientistas", 
        "genética", "universo", "telescópio", "biologia", "química", "física", "astronomia", "satélite", 
        "asteroide", "arqueologia", "científico", "galileu", "superinteressante"
      ] 
    },
    { 
      slug: "health", 
      label: "Saúde", 
      keywords: [
        "saúde", "medicina", "vacina", "dieta", "exercício", "hospital", "vírus", "nutrição", 
        "médico", "wellness", "fitness", "cancer", "doença", "doenças", "remédio", "tratamento", 
        "imunização", "bem-estar", "saúde mental", "terapia", "cardiologia", "epidemia"
      ] 
    },
    { 
      slug: "crypto", 
      label: "Cripto", 
      keywords: [
        "bitcoin", "ethereum", "blockchain", "nft", "crypto", "cripto", "binance", "criptomoeda", 
        "criptomoedas", "wallet", "mining", "dogecoin", "btc", "eth", "solana", "carteira digital", 
        "token", "halving", "mineração", "defi", "portal do bitcoin", "criptofácil"
      ] 
    },
    { 
      slug: "music", 
      label: "Música", 
      keywords: [
        "música", "músicas", "show", "shows", "álbum", "cantor", "cantora", "banda", "spotify", 
        "concerto", "clipe", "tour", "músico", "rock", "pop", "rap", "jazz", "hip-hop", "streaming", 
        "vocalist", "billboard", "grammy", "single", "track", "canção", "melodia", "instrumento", 
        "violão", "piano", "rádio", "mp3", "vinyl", "turnê", "compositor", "letra", "vocal", 
        "batida", "ritmo", "soundcloud", "deezer", "apple music", "tidal", "mpb", "samba", 
        "sertanejo", "funk", "trap", "reggae", "heavy metal", "indie", "eletrônica", "dj", 
        "remix", "lollapalooza", "rock in rio", "pagode", "samba"
      ] 
    },
    { 
      slug: "business", 
      label: "Negócios", 
      keywords: [
        "negócios", "economia", "mercado", "ações", "empresa", "empresas", "startup", "startups", 
        "investimento", "investimentos", "dólar", "pib", "finanças", "business", "economy", "market", 
        "stock", "company", "finance", "ibovespa", "bolsa de valores", "inflação", "juros", "selic", 
        "imposto", "receita federal", "faturamento", "exame", "infomoney", "valor econômico"
      ] 
    }
  ];

  try {
    const slugs = initialCategories.map(c => c.slug);
    await prisma.category.deleteMany({ where: { slug: { notIn: slugs } } });
    await prisma.cachedArticle.updateMany({
      where: { category: { notIn: [...slugs, "general", "Geral"] } },
      data: { category: "general" }
    });
    for (const cat of initialCategories) {
      await prisma.category.upsert({ where: { slug: cat.slug }, update: cat, create: cat });
    }
    const finalCategories = await prisma.category.findMany();
    cachedCategories = finalCategories;
    return finalCategories;
  } catch (err) {
    console.error("[ensureCategories] Erro no setup pesado:", err);
    return [];
  }
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
  } catch (error) {
    console.error("[ensureCategories] Erro no setup pesado:", error);
  }
}

const sourceCategoryMap: Record<string, string> = {
  // Tecnologia
  "TechCrunch": "technology", "The Verge": "technology", "Gizmodo": "technology", "Wired": "technology",
  "Tecnoblog": "technology", "Canaltech": "technology", "Olhar Digital": "technology",
  "TudoCelular": "technology", "Adrenaline": "technology", "TechTudo": "technology",
  "Hardware.com.br": "technology",

  // Esportes
  "ESPN": "sports", "Globo Esporte": "sports", "GE": "sports", "Marca": "sports", 
  "UOL Esporte": "sports", "Lance!": "sports", "Gazeta Esportiva": "sports",

  // Cripto
  "CoinDesk": "crypto", "CoinTelegraph": "crypto", "Binance": "crypto",
  "Portal do Bitcoin": "crypto", "Livecoins": "crypto", "CriptoFácil": "crypto",

  // Games
  "IGN": "games", "GameSpot": "games", "PC Gamer": "games", "Polygon": "games", 
  "Eurogamer": "games", "MeuPlayStation": "games", "Voxel": "games", 
  "Jovem Nerd": "games", "The Enemy": "games", "Eurogamer.pt": "games", 
  "IGN Brasil": "games", "GameBlast": "games",

  // Cinema
  "Variety": "movies", "The Hollywood Reporter": "movies", "Netflix": "movies",
  "Omelete": "movies", "AdoroCinema": "movies", "Pipoca Moderna": "movies", 
  "CinePOP": "movies", "Cinema com Rapadura": "movies",

  // Música
  "Pitchfork": "music", "Rolling Stone": "music", "Billboard": "music", "Spotify": "music",

  // Ciência
  "Nature": "science", "NASA": "science", "Scientific American": "science",
  "Galileu": "science", "Superinteressante": "science", "Revista Planeta": "science",

  // Saúde
  "Saúde Debate": "health", "Drauzio Varella": "health",

  // Negócios
  "Bloomberg": "business", "Forbes": "business", "CNBC": "business", 
  "Exame": "business", "InfoMoney": "business", "Valor Econômico": "business",
  "G1 Economia": "business", "CNN Brasil Business": "business"
};

function identifyCategory(title: string, description: string, availableCats: CategoryRow[], sourceName?: string): string {
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

async function categorizeBatchWithAI(articles: NewsArticle[], availableCats: CategoryRow[]): Promise<NewsArticle[]> {
  const needsAI = articles.filter(a => a.category === "general");
  if (!GEMINI_API_KEY || needsAI.length === 0) return articles;

  const validCategories = availableCats.map(c => c.slug.toLowerCase());
  validCategories.push("general");

  const prompt = `Classifique estas notícias nas categorias válidas: ${validCategories.join(", ")}. Use "general" se tiver dúvida.
Notícias:
${needsAI.map((a, i) => `[${i}] Título: ${a.title}\nDescrição: ${a.description}`).join("\n\n")}
Retorne APENAS JSON no formato exato: { "categories": ["cat1", "cat2", ...] }`;

  try {
    console.log(`[Gemini AI] Categorizando lote de ${needsAI.length} notícias...`);
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
  } catch (e) {
    console.error("[Gemini AI] Error in categorization:", e);
  }
  return articles; 
}

const dedup = (list: NewsArticle[]) => {
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
    const searchTerm = query ? (rawTargets.length > 0 && !rawTargets.includes('general') ? `(${query}) AND (${targets.join(" OR ")})` : query) : targets.join(" OR ");

    let finalArticles: NewsArticle[] = [];
    let currentPage = page;
    const MAX_PAGES = page + 1; // Máximo de 2 páginas de APIs externas para velocidade incrível!
    const TARGET_SIZE = page * pageSize;

    while (finalArticles.length < TARGET_SIZE && currentPage <= MAX_PAGES) {
      
      const newsApiPromise = (currentPage <= 5 && lang === 'pt') 
        ? fetch(`${NEWS_BASE_URL}/everything?q=${encodeURIComponent(searchTerm)}&language=${lang}&sortBy=${sortBy}&page=${currentPage}&pageSize=20&apiKey=${NEWS_API_KEY}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(async data => {
              console.log(`[NewsAPI] Status: ${data.status} | Total: ${data.totalResults || 0} | Code: ${data.code || 'None'} | Msg: ${data.message || 'None'}`);
              if (data.status === "ok" && data.articles?.length > 0) {
                await updateApiQuota("newsapi");
                return data.articles.filter((a: RawArticle) => a.title && a.urlToImage && !a.title.includes("[Removed]")).map((art: RawArticle) => ({
                  title: art.title, description: art.description || "", url: art.url, urlToImage: art.urlToImage, publishedAt: art.publishedAt,
                  source: { name: art.source?.name || "Fonte" }, category: "general", language: lang
                }));
              }
              return [];
            }).catch((err) => {
              console.error("[NewsAPI] Fetch error:", err);
              return [];
            })
        : Promise.resolve([]);

      const gnewsPromise = (GNEWS_API_KEY && lang === 'pt')
        ? fetch(`${GNEWS_BASE_URL}/search?q=${encodeURIComponent(searchTerm.length > 190 ? rawTargets.join(" OR ") : searchTerm)}&lang=${lang}&apikey=${GNEWS_API_KEY}&max=10&page=${currentPage}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(async data => {
              if (data.errors) {
                console.log("[GNews] Errors:", data.errors);
              } else {
                console.log(`[GNews] Articles count: ${data.articles?.length || 0}`);
              }
              if (data.articles && data.articles.length > 0) {
                await updateApiQuota("gnews");
                return data.articles.map((art: RawArticle) => ({
                  title: art.title, description: art.description || "", url: art.url, urlToImage: art.image, publishedAt: art.publishedAt,
                  source: { name: art.source?.name || "GNews" }, category: "general", language: lang
                }));
              }
              return [];
            }).catch((err) => {
              console.error("[GNews] Fetch error:", err);
              return [];
            })
        : Promise.resolve([]);

      const guardianPromise = (GUARDIAN_API_KEY && lang === 'en')
        ? fetch(`${GUARDIAN_BASE_URL}/search?q=${encodeURIComponent(searchTerm)}&api-key=${GUARDIAN_API_KEY}&show-fields=thumbnail,trailText&page=${currentPage}&page-size=20`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
              if (data.response?.status === "ok" && data.response.results?.length > 0) {
                return data.response.results.map((art: RawArticle) => ({
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
      const isSingleCategory = categories.length === 1 && categories[0].toLowerCase() !== 'general';
      if (isSingleCategory) {
        const selectedCat = categories[0].toLowerCase();
        unique.forEach((art: any) => {
          art.category = selectedCat;
        });
      } else {
        unique.forEach((art: any) => { art.category = identifyCategory(art.title, art.description, availableCats, art.source?.name); });
        unique = await categorizeBatchWithAI(unique, availableCats);
      }

      if (!rawTargets.includes("general")) {
        unique = unique.filter(a => rawTargets.includes(a.category?.toLowerCase() || ""));
      }
      finalArticles = dedup([...finalArticles, ...unique]);
      
      // Save fresh news to cache
      await Promise.all(unique.map(async art => {
        try {
          await prisma.cachedArticle.upsert({
            where: { url: art.url },
            update: {},
            create: {
              title: art.title,
              description: art.description,
              url: art.url,
              imageUrl: art.urlToImage,
              publishedAt: new Date(art.publishedAt),
              source: art.source.name,
              category: art.category || "general",
              language: art.language || lang
            }
          });
        } catch (e) {
          console.error(`[fetchNewsWithFilters] falha ao cachear artigo ${art.url}:`, e);
        }
      }));

      currentPage++;
    }

    if (finalArticles.length > 0) {
      await cacheArticles(finalArticles, lang);
    }

    if (finalArticles.length < 9) {
      const fourMonthsAgo = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
      const searchWords = query.trim().split(/\s+/).filter(Boolean);
      const searchConditions = searchWords.map(word => ({
        OR: [
          { title: { contains: word, mode: 'insensitive' as const } },
          { description: { contains: word, mode: 'insensitive' as const } }
        ]
      }));

      const thematicBackup = await prisma.cachedArticle.findMany({
        where: { 
          category: { in: rawTargets }, 
          language: lang, 
          url: { notIn: finalArticles.map(a => a.url) }, 
          cachedAt: { gte: fourMonthsAgo },
          AND: searchConditions.length > 0 ? searchConditions : undefined
        },
        orderBy: { publishedAt: 'desc' }, 
        take: 200
      });
      if (thematicBackup.length > 0) {
        finalArticles = [...finalArticles, ...thematicBackup.map(b => ({
          title: b.title, description: b.description || "", url: b.url, urlToImage: b.imageUrl || "",
          publishedAt: b.publishedAt?.toISOString() || b.cachedAt.toISOString(), source: { name: `${b.source || "Arquivo"} [BD]` },
          category: b.category, language: b.language
        }))];
      }
      finalArticles = dedup(finalArticles);
    }
    return finalArticles.slice(0, Math.max(12, TARGET_SIZE));
  } catch { return []; }
}

async function updateApiQuota(api: "newsapi" | "gnews") {
  try {
    const field = api === "newsapi" ? "newsApiQuota" : "gnewsQuota";
    // Decrement atômico no banco: evita a corrida de duas requests lendo o mesmo valor
    await prisma.apiStatus.upsert({
      where: { id: "singleton" },
      update: { [field]: { decrement: 1 }, lastUpdated: new Date() },
      create: { id: "singleton", newsApiQuota: 100, gnewsQuota: 100, lastUpdated: new Date() }
    });
  } catch (e) {
    console.error(`[updateApiQuota] falha ao decrementar cota de ${api}:`, e);
  }
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
  } catch { return { newsApiQuota: 100, gnewsQuota: 100, lastUpdated: new Date() }; }
}
