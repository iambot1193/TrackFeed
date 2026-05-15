import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchNewsWithFilters, getApiStatus } from "@/lib/news";
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

  const [user, favorites, history] = await Promise.all([
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

  let news = [];
  
  if (tab === 'favs') {
    const pageSize = 30;
    // RECUPERAÇÃO DE CATEGORIA E IDIOMA ORIGINAIS:
    const favsWithDetails = await Promise.all(favorites.map(async (f) => {
      const cached = await prisma.cachedArticle.findUnique({ where: { url: f.url } });
      return {
        title: f.title,
        description: f.description || "",
        url: f.url,
        urlToImage: f.imageUrl || "",
        publishedAt: f.publishedAt?.toISOString() || f.savedAt.toISOString(),
        source: { name: f.source || "Fonte" },
        category: cached?.category || "general", // Preserva a categoria original
        language: cached?.language || "pt"
      };
    }));

    let allFavs = favsWithDetails;

    // FILTRO DE BUSCA (Texto) - Apenas se o usuário digitar algo
    if (query) {
      allFavs = allFavs.filter(f => f.title.toLowerCase().includes(query.toLowerCase()));
    }

    // FILTRO DE CATEGORIAS (Opcional) - Persistente na troca de abas
    if (catParam) {
      allFavs = allFavs.filter(f => selectedCategories.includes(f.category.toLowerCase()));
    }

    // SEM PAGINAÇÃO PARA FAVORITOS: MOSTRA TUDO DE UMA VEZ
    news = allFavs;

  } else if (tab === 'history') {
    const pageSize = 50;
    
    // RECUPERAÇÃO DE DETALHES ORIGINAIS:
    const historyWithDetails = await Promise.all(history.map(async (h) => {
      const cached = await prisma.cachedArticle.findUnique({ where: { url: h.url } });
      return {
        title: h.title,
        description: "Lido em " + h.viewedAt.toLocaleDateString('pt-BR'),
        url: h.url,
        urlToImage: h.imageUrl || cached?.imageUrl || "",
        publishedAt: h.viewedAt.toISOString(),
        source: { name: "Histórico" },
        category: cached?.category || "general", // Preserva a categoria original
        language: cached?.language || "pt"
      };
    }));

    let filteredHistory = historyWithDetails;

    if (query) {
      filteredHistory = filteredHistory.filter(h => h.title.toLowerCase().includes(query.toLowerCase()));
    }

    // FILTRO DE CATEGORIAS (Opcional) - Persistente na troca de abas
    if (catParam) {
      filteredHistory = filteredHistory.filter(h => selectedCategories.includes(h.category.toLowerCase()));
    }

    // MOSTRA TODO O HISTÓRICO (Até o limite de 50 do DB)
    news = filteredHistory;


  } else if (tab === 'explore') {
    news = await fetchNewsWithFilters({
      languages, sortBy: "popularity",
      categories: catParam ? selectedCategories : ["general", "technology", "science", "business", "ai", "games"],
      query: query || "", page
    });
  } else if (tab === 'profile') {
    // ECONOMIA DE COTA E PERFORMANCE: Se está no perfil, não carrega notícias
    news = [];
  } else {
    news = await fetchNewsWithFilters({
      languages, sortBy: sort, categories: selectedCategories, query, page
    });
  }

  // AGORA BUSCAMOS O STATUS DA COTA (APÓS O FETCH ACIMA ATUALIZAR O DB)
  const apiStatus = await getApiStatus();

  return (
    <DashboardClient 
      initialNews={news} 
      user={{
        name: user.name || "Usuário",
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        isVerified: !!user.emailVerified
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
