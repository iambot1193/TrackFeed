import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { fetchNewsWithFilters, getApiStatus, NewsArticle } from "@/lib/news";
import DashboardClient from "./DashboardClient";
import { getUserFavorites } from "./actions";
import { getSessionUserId } from "@/lib/session";

export const dynamic = 'force-dynamic';

/**
 * COMPONENTE DE SERVIDOR: DashboardPage
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // getSessionUserId consulta o banco (versão da sessão), então uma queda de DB aqui
  // precisa cair no mesmo tratamento gracioso das queries abaixo, e não num 500.
  let userId: string | null;
  try {
    userId = await getSessionUserId();
  } catch (dbError) {
    console.error(">>> ERRO DE CONEXÃO AO BANCO NA SESSÃO:", dbError);
    redirect("/?error=db_connection");
  }

  if (!userId) redirect("/");

  let user, favorites, history;
  try {
    [user, favorites, history] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { preferences: true }
      }),
      getUserFavorites(),
      prisma.history.findMany({
        where: { userId },
        orderBy: { viewedAt: 'desc' },
        take: 50
      })
    ]);
  } catch (dbError) {
    console.error(">>> ERRO DE CONEXÃO AO BANCO NO DASHBOARD:", dbError);
    redirect("/?error=db_connection");
  }

  if (!user) redirect("/");

  // LIMPEZA DE CATEGORIA OBSOLETA (Migration silenciosa)
  const hasProgramming = user.preferences.some(p => p.categoryName.toLowerCase() === 'programming');
  if (hasProgramming) {
    await prisma.preference.deleteMany({
      where: { userId, categoryName: { equals: 'programming', mode: 'insensitive' } }
    });
    // Recarrega o usuário para refletir a mudança
    return redirect("/dashboard");
  }

  // REGRA DE OURO: Se não tem interesses, não entra na Dashboard!
  if (user.preferences.length === 0) redirect("/interests");

  const params = await searchParams;
  const tab = (params.tab as string) || 'home';
  const query = (params.q as string) || "";
  const page = parseInt(params.page as string) || 1;
  const langParam = (params.lang as string) || "pt";
  const languages = langParam.split(",");
  const sort = (params.sort as "publishedAt" | "relevancy" | "popularity") || "publishedAt";
  const catParam = params.categories as string;
  const selectedCategories = catParam ? catParam.split(",") : user.preferences.map(p => p.categoryName);

  let news: NewsArticle[] = [];
  let historyStats: any = null;

  if (tab === 'favs') {
    const favCached = await prisma.cachedArticle.findMany({
      where: { url: { in: favorites.map(f => f.url) } }
    });
    const favCachedByUrl = new Map(favCached.map(c => [c.url, c]));
    const favsWithDetails = favorites.map((f) => {
      const cached = favCachedByUrl.get(f.url);
      return {
        title: f.title,
        description: f.description || "",
        url: f.url,
        urlToImage: f.imageUrl || "",
        publishedAt: f.publishedAt?.toISOString() || f.savedAt.toISOString(),
        source: { name: f.source || "Fonte" },
        category: cached?.category || "general",
        language: cached?.language || "pt"
      } as NewsArticle;
    });

    const stats = {
      totalRead: favsWithDetails.length,
      categories: {} as Record<string, number>
    };

    for (const article of favsWithDetails) {
      const cat = article.category || "general";
      stats.categories[cat] = (stats.categories[cat] || 0) + 1;
    }

    const langFiltered = favsWithDetails.filter(article => languages.includes(article.language || "pt"));

    if (catParam) {
      const cats = catParam.split(",");
      if (cats.includes('general')) {
        news = langFiltered;
      } else {
        news = langFiltered.filter(article => cats.includes(article.category || "general"));
      }
    } else {
      news = langFiltered;
    }

    historyStats = stats;

  } else if (tab === 'history') {
    const pageSize = 50;
    const historyEntries = await prisma.history.findMany({
      where: { userId: user.id },
      orderBy: { viewedAt: 'desc' },
      take: pageSize
    });

    const stats = {
      totalRead: historyEntries.length,
      totalClicks: historyEntries.reduce((sum, h) => sum + h.clickCount, 0),
      categories: {} as Record<string, number>
    };

    const historyCached = await prisma.cachedArticle.findMany({
      where: { url: { in: historyEntries.map(h => h.url) } }
    });
    const historyCachedByUrl = new Map(historyCached.map(c => [c.url, c]));

    const uniqueHistoryUrls = new Set<string>();
    const historyWithDetails = [];

    for (const h of historyEntries) {
      const cached = historyCachedByUrl.get(h.url);
      const cat = cached?.category || "general";
      stats.categories[cat] = (stats.categories[cat] || 0) + 1;

      if (!uniqueHistoryUrls.has(h.url)) {
        uniqueHistoryUrls.add(h.url);
        historyWithDetails.push({
          title: h.title,
          description: h.viewedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
          url: h.url,
          urlToImage: h.imageUrl || cached?.imageUrl || "",
          publishedAt: h.viewedAt.toISOString(),
          source: { name: cached?.source || "Radar" },
          category: cat,
          language: cached?.language || "pt"
        } as NewsArticle);
      }
    }

    const langFiltered = historyWithDetails.filter(article => languages.includes(article.language || "pt"));

    if (catParam) {
      const cats = catParam.split(",");
      if (cats.includes('general')) {
        news = langFiltered;
      } else {
        news = langFiltered.filter(article => cats.includes(article.category || "general"));
      }
    } else {
      news = langFiltered;
    }
    historyStats = stats;

  } else if (tab === 'explore') {
    const rawNews = await fetchNewsWithFilters({
      languages, sortBy: "popularity",
      categories: catParam ? selectedCategories : ["general", "technology", "science", "business", "games"],
      query: query || "", page
    });
    const excludeUrls = new Set([
      ...favorites.map((f: any) => f.url),
      ...history.map((h: any) => h.url)
    ]);
    news = rawNews.filter(article => !excludeUrls.has(article.url));
  } else if (tab === 'profile') {
    news = [];
  } else {
    news = await fetchNewsWithFilters({
      languages, sortBy: sort, categories: selectedCategories, query, page
    });
  }

  const apiStatus = await getApiStatus();

  return (
    <DashboardClient
      initialNews={news}
      historyStats={historyStats}
      user={{
        name: user.name || "Usuário",
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        isVerified: !!user.emailVerified,
        interests: user.preferences.map(p => p.categoryName)
      }}
      currentFilters={{
        languages, sort, categories: selectedCategories, query, page, tab
      }}
      favoriteUrls={favorites.map(f => f.url)}
      apiStatus={{
        newsApiRemaining: apiStatus.newsApiQuota,
        newsApiQuota: apiStatus.newsApiQuota,
        gnewsQuota: apiStatus.gnewsQuota,
        lastUpdated: apiStatus.lastUpdated.toISOString()
      }}
    />
  );
}
