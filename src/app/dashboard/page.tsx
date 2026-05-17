import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchNewsWithFilters, getApiStatus, NewsArticle } from "@/lib/news";
import DashboardClient from "./DashboardClient";
import { getUserFavorites } from "./actions";

export const dynamic = 'force-dynamic';

/**
 * COMPONENTE DE SERVIDOR: DashboardPage
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) redirect("/");

  let user, favorites, history;
  try {
    [user, favorites, history] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { preferences: true }
      }),
      getUserFavorites(userId),
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
    const favsWithDetails = await Promise.all(favorites.map(async (f) => {
      const cached = await prisma.cachedArticle.findUnique({ where: { url: f.url } });
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
    }));

    const stats = {
      totalRead: favsWithDetails.length,
      totalClicks: favsWithDetails.length,
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
      totalClicks: historyEntries.length,
      categories: {} as Record<string, number>
    };

    const uniqueHistoryUrls = new Set<string>();
    const historyWithDetails = [];

    for (const h of historyEntries) {
      const cached = await prisma.cachedArticle.findUnique({ where: { url: h.url } });
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
    news = await fetchNewsWithFilters({
      languages, sortBy: "popularity",
      categories: catParam ? selectedCategories : ["general", "technology", "science", "business", "ai", "games"],
      query: query || "", page
    });
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
      interestCount={user.preferences.length}
      currentFilters={{
        languages, sort, categories: selectedCategories, query, page, tab
      }}
      availableCategories={user.preferences.map(p => p.categoryName)}
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
