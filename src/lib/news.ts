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
  pageSize?: number;
}

const NEWS_API_KEY = process.env.NEWS_API_KEY || "";
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "";
const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const NEWS_BASE_URL = "https://newsapi.org/v2";
const GNEWS_BASE_URL = "https://gnews.io/api/v4";
const GUARDIAN_BASE_URL = "https://content.guardianapis.com";

const FRESH_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 HORAS
const MIN_ARTICLES_PER_CAT = 1;

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
  
  // 1. Limpeza de Categorias: Deleta categorias que não deveriam mais existir
  await prisma.category.deleteMany({
    where: { slug: { notIn: slugs } }
  });

  // 2. Limpeza de Dados Órfãos: Reseta notícias com tags deletadas para 'general'
  await prisma.cachedArticle.updateMany({
    where: { 
      category: { notIn: [...slugs, "general", "Geral"] } 
    },
    data: { category: "general" }
  });

  // 3. Garante que as novas categorias existam
  for (const cat of initialCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat
    });
  }

  return await prisma.category.findMany();
}

const categoryTranslations: Record<string, string> = {
  technology: "tecnologia OR tech OR apple OR google OR microsoft OR samsung OR smartphone OR inovação OR hardware",
  sports: "esportes OR futebol OR nba OR f1 OR olimpíadas OR campeonato OR " + '"champions league"',
  science: "ciência OR nasa OR espaço OR pesquisa OR descoberta OR universo OR " + '"estudo científico"',
  health: "saúde OR medicina OR vacina OR bem-estar OR " + '"mental health"' + " OR dieta OR hospital",
  general: "notícias OR geral OR atualidades",
  games: "games OR videogame OR playstation OR xbox OR nintendo OR " + '"e-sports"',
  crypto: "cripto OR bitcoin OR ethereum OR blockchain OR nft OR " + '"web3"',
  movies: "filmes OR cinema OR " + '"movie trailer"' + " OR oscar OR marvel OR disney",
  music: "música OR show OR álbum OR concerto OR clipe OR festival OR spotify OR cantor OR banda OR tour",
  business: "negócios OR economia OR mercado OR ações OR startup OR investimento OR finanças OR pib"
};

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
          language: lang
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

/**
 * MOTOR DE CLASSIFICAÇÃO SEM IA (Scoring Engine + Source Mapping)
 */
function identifyCategory(title: string, description: string, availableCats: any[], sourceName?: string): string {
  const text = (title + " " + (description || "")).toLowerCase();
  const scores: Record<string, number> = {};

  availableCats.forEach(cat => scores[cat.slug] = 0);

  // 1. BÔNUS POR FONTE (Source Mapping)
  if (sourceName) {
    const foundSource = Object.entries(sourceCategoryMap).find(([key]) => 
      sourceName.toLowerCase().includes(key.toLowerCase())
    );
    if (foundSource) {
      const mappedSlug = foundSource[1];
      if (scores[mappedSlug] !== undefined) scores[mappedSlug] += 50;
    }
  }

  // 2. PONTUAÇÃO POR PALAVRAS-CHAVE
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
    if (score > maxScore) {
      maxScore = score;
      bestCat = slug;
    }
  }

  return maxScore >= 4 ? bestCat : "general";
}

/**
 * Classificação por Inteligência Artificial (Google Gemini em Lote)
 */
async function categorizeBatchWithAI(articles: any[], availableCats: any[]): Promise<any[]> {
  if (!GEMINI_API_KEY || articles.length === 0) return articles;

  const validCategories = availableCats.map(c => c.slug.toLowerCase());
  validCategories.push("general");

  const prompt = `
Você é uma IA especialista em curadoria de notícias de alto nível.
Sua missão é classificar as notícias abaixo em UMA destas categorias: ${validCategories.join(", ")}.

1. SEJA RIGOROSO: Se uma notícia tiver apenas uma relação vaga com uma categoria, use "general".
2. CERTEZA ABSOLUTA: Só classifique em categorias específicas se o tema central for inquestionável.
3. TÓPICOS TRANSVERSAIS:
   - Notícias de empresas de tecnologia (Apple, Google, etc) -> "technology".
   - Finanças de Cripto ou economia digital -> "crypto".
   - Saúde mental, bem-estar ou descobertas médicas -> "health".
4. EVITE ERROS: Notícias de culinária, política pura ou eventos genéricos devem ser "general".
5. PRIORIDADE: Se a notícia se encaixar em duas categorias, escolha a que for mais "nicho".

Retorne APENAS um objeto JSON com o seguinte formato:
{
  "categories": ["categoria1", "categoria2", ...]
}
Use exatamente as strings permitidas.

Notícias:
${articles.map((a, i) => `[${i}] Título: ${a.title}\nDescrição: ${a.description}`).join("\n\n")}
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      console.warn(">>> [GEMINI AI] Cota excedida ou Erro. Usando classificação local (Fallback).");
      return articles; 
    }
    if (data.candidates && data.candidates[0]) {
      const resultText = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(resultText);
      const categoriesArray = parsed.categories || [];

      if (Array.isArray(categoriesArray)) {
         const limit = Math.min(articles.length, categoriesArray.length);
         for (let i = 0; i < limit; i++) {
            const returnedCat = String(categoriesArray[i] || "").toLowerCase();
            const isValid = validCategories.includes(returnedCat);
            
            // SMART TAGGING: Se a IA retornar "general", mas o filtro local já tinha achado algo, mantém o local!
            if ((returnedCat === "general" || !isValid) && articles[i].category !== "general") {
               // Mantém a categoria detectada localmente pelo identifyCategory
            } else {
               articles[i].category = isValid ? returnedCat : "general";
            }
         }
         return articles;
      }
    }
  } catch (e: any) {
    console.error(">>> [GEMINI AI] Falha na classificação em lote:", e.message);
  }
  
  return articles; 
}



/**
 * Utilitário de deduplicação por URL e Título
 */
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

/**
 * BUSCA COM FILTRO DE IDIOMA NO CACHE
 */
export async function fetchNewsWithFilters(options: FetchNewsOptions): Promise<NewsArticle[]> {
  try {
    const availableCats = await ensureCategories();
    const { languages, sortBy = "publishedAt", categories = [], query = "", page = 1, pageSize = 30 } = options;
    const lang = languages.length > 0 ? languages[0] : "pt";

    let rawTargets = categories.length > 0 ? categories.map(c => c.toLowerCase()) : ["general"];
    
    // Se "general" estiver presente ou não houver nada, expandimos para TODAS as categorias para o "Combo Geral"
    if (rawTargets.includes("general") || rawTargets.length === 0) {
      rawTargets = ["technology", "science", "sports", "health", "games", "movies", "music", "crypto", "business"];
    }



    const targets = lang === "pt" ? rawTargets.flatMap(t => [t, categoryTranslations[t.toLowerCase()] || t]) : rawTargets;
    
    // Busca combinada: Se houver query, ela DEVE estar dentro dos temas das tags (exceto se for 'general')
    let searchTerm = "";
    if (query) {
      if (rawTargets.length > 0 && !rawTargets.includes('general')) {
        searchTerm = `(${query}) AND (${targets.join(" OR ")})`;
      } else {
        searchTerm = query;
      }
    } else {
      searchTerm = targets.join(" OR ");
    }


    let finalArticles: NewsArticle[] = [];
    let currentPage = page;
    // O sistema agora é incansável: tenta até 10 páginas se houver cota
    const MAX_PAGES = page + 9; 

    const TARGET_SIZE = Math.max(12, pageSize);
    while (finalArticles.length < TARGET_SIZE && currentPage <= MAX_PAGES) {
      const status = await getApiStatus();

      
      // Para se ambas as cotas acabarem
      if (status.newsApiQuota <= 0 && status.gnewsQuota <= 0) {

        break;
      }


      let combinedRawArticles: NewsArticle[] = [];

      // 1. BUSCA PARALELA EM AMBAS AS APIS (Prioridade simultânea)
      const newsApiPromise = (currentPage <= 5 && status.newsApiQuota > 0 && lang === 'pt') 
        ? fetch(`${NEWS_BASE_URL}/everything?q=${encodeURIComponent(searchTerm)}&language=${lang}&sortBy=${sortBy}&page=${currentPage}&pageSize=20&apiKey=${NEWS_API_KEY}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(async data => {
              if (data.status === "ok" && data.articles?.length > 0) {
                await updateApiQuota("newsapi");
                return data.articles
                  .filter((a: any) => a.title && a.urlToImage && !a.title.includes("[Removed]"))
                  .map((art: any) => ({
                    title: art.title, description: art.description || "", url: art.url,
                    urlToImage: art.urlToImage, publishedAt: art.publishedAt,
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
                  title: art.title, description: art.description || "", url: art.url,
                  urlToImage: art.image, publishedAt: art.publishedAt,
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
                  title: art.webTitle, 
                  description: art.fields?.trailText || "", 
                  url: art.webUrl,
                  urlToImage: art.fields?.thumbnail || "", 
                  publishedAt: art.webPublicationDate,
                  source: { name: "The Guardian" }, 
                  category: "general", 
                  language: lang
                }));
              }
              return [];
            }).catch(() => [])
        : Promise.resolve([]);

      const [newsApiArticles, gnewsArticles, guardianArticles] = await Promise.all([newsApiPromise, gnewsPromise, guardianPromise]);
      combinedRawArticles = [...newsApiArticles, ...gnewsArticles, ...guardianArticles];

      if (combinedRawArticles.length === 0 && currentPage > page + 1) break; // Só para se realmente não vier nada após insistência

      // 3. DEDUPLICAÇÃO E PROCESSAMENTO
      const uniqueMap = new Map();
      combinedRawArticles.forEach(art => {
        const key = art.url.trim().toLowerCase();
        if (!uniqueMap.has(key)) uniqueMap.set(key, art);
      });
      let uniqueArticles = Array.from(uniqueMap.values()) as NewsArticle[];

      // Classificação
      uniqueArticles.forEach((art: any) => {
        art.category = identifyCategory(art.title, art.description, availableCats, art.source?.name);
      });
      uniqueArticles = await categorizeBatchWithAI(uniqueArticles, availableCats);

      // Filtro Purista (Apenas o que o usuário quer)
      if (!rawTargets.includes("general")) {
        uniqueArticles = uniqueArticles.filter(a => rawTargets.includes(a.category?.toLowerCase() || ""));
      }

      // Acumula e Deduplica
      finalArticles = dedup([...finalArticles, ...uniqueArticles]);
      
      // Se já temos o volume solicitado (mínimo de 9 para segurança), paramos
      if (finalArticles.length >= Math.max(9, pageSize)) break;
      currentPage++;
    }

    // Salva no Cache e Limpa antigos ocasionalmente
    if (finalArticles.length > 0) {
      // Limpeza de cache só ocorre se encontrarmos muitas notícias novas, para evitar carga excessiva
      if (finalArticles.length > 10) await cleanupOldCache();
      await cacheArticles(finalArticles, lang);
    }

    // --- PASSO 5: REFORÇO FINAL EM CAMADAS (Garantia de 9) ---
    if (finalArticles.length < 9) {

      
      // Camada 1: Busca EXTREMA no histórico do MESMO TEMA (Até 120 dias atrás)
      const fourMonthsAgo = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
      const thematicBackup = await prisma.cachedArticle.findMany({
        where: {
          category: { in: rawTargets },
          language: lang,
          url: { notIn: finalArticles.map(a => a.url) },
          cachedAt: { gte: fourMonthsAgo }
        },
        orderBy: { publishedAt: 'desc' },
        take: 200
      });

      if (thematicBackup.length > 0) {
        finalArticles = [...finalArticles, ...thematicBackup.map(b => ({
          title: b.title, description: b.description || "", url: b.url,
          urlToImage: b.imageUrl || "", publishedAt: b.publishedAt?.toISOString() || b.cachedAt.toISOString(),
          source: { name: b.source || "Arquivo" }, category: b.category, language: b.language
        }))];
      }

      if (finalArticles.length < 9) {

        const emergency = await prisma.cachedArticle.findMany({
          where: {
            language: lang,
            url: { notIn: finalArticles.map(a => a.url) }
          },
          orderBy: { cachedAt: 'desc' },
          take: 20 
        });

        finalArticles = [...finalArticles, ...emergency.map(e => ({
          title: e.title, description: e.description || "", url: e.url,
          urlToImage: e.imageUrl || "", publishedAt: e.publishedAt?.toISOString() || e.cachedAt.toISOString(),
          source: { name: e.source || "TrackFeed" }, category: e.category, language: e.language
        }))];
      }

      finalArticles = dedup(finalArticles);
    }


    // Garantimos que retornamos pelo menos 12 notícias para dar margem ao 'Carregar Mais'
    return finalArticles.slice(0, Math.max(12, pageSize));
  } catch (error) {

    console.error("Erro final no fetchNews:", error);
    return [];
  }
}

async function cleanupOldCache() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.cachedArticle.deleteMany({
      where: { cachedAt: { lt: twentyFourHoursAgo } }
    });
  } catch (error) {}
}

async function updateApiQuota(api: "newsapi" | "gnews") {
  try {
    const field = api === "newsapi" ? "newsApiQuota" : "gnewsQuota";
    const current = await getApiStatus();
    const currentValue = current[field] as number;
    
    await prisma.apiStatus.upsert({
      where: { id: "singleton" },
      update: { [field]: Math.max(0, currentValue - 1), lastUpdated: new Date() },
      create: {
        id: "singleton",
        newsApiQuota: api === "newsapi" ? 99 : 100,
        gnewsQuota: api === "gnews" ? 99 : 100,
        lastUpdated: new Date()
      }
    });
  } catch (e) {}
}

export async function getApiStatus() {
  try {
    let status = await prisma.apiStatus.findUnique({ where: { id: "singleton" } });
    
    if (!status) {
      return { newsApiQuota: 100, gnewsQuota: 100, lastUpdated: new Date() };
    }

    const now = new Date();
    const lastUpdate = new Date(status.lastUpdated);
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate >= 24) {
      status = await prisma.apiStatus.update({
        where: { id: "singleton" },
        data: {
          newsApiQuota: 100,
          gnewsQuota: 100,
          lastUpdated: now
        }
      });
    }

    return status;
  } catch (e) {
    return { newsApiQuota: 100, gnewsQuota: 100, lastUpdated: new Date() };
  }
}

/**
 * AI SMART DIGEST: Resumo de notícias via IA
 */
export async function summarizeArticle(title: string, description: string) {
  try {
    const prompt = `Você é um analista de notícias experiente. Resuma a seguinte notícia em exatamente 3 tópicos (bullet points) curtos, impactantes e informativos em Português.
    Título: ${title}
    Descrição: ${description}
    
    Formato: Apenas os 3 tópicos, sem introdução ou conclusão.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, topK: 40, topP: 0.95, maxOutputTokens: 250 }
      })
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Resumo indisponível no momento.";
  } catch (e) {
    return "Erro ao gerar resumo inteligente.";
  }
}
