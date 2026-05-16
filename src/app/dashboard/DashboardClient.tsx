'use client'

import { useState, useTransition, useEffect, useRef } from "react";
import {
  Search, Menu, X, Check, AlertCircle, Bookmark as BookmarkIcon,
  ArrowRight, Filter, ChevronDown, User, Settings, LogOut, Loader2, Key, Trash2, ShieldCheck,
  Plus, Home, Compass, Bookmark, TrendingUp, Clock, Sparkles, Flame, SearchX, Camera,
  Activity, Cpu, Languages, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { NewsArticle } from "@/lib/news";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { toggleFavorite, addToHistory, updateUserProfile, logout, updateUserPreferences, deleteAccountAction, getApiStatusAction, summarizeNewsAction } from "./actions";

interface DashboardClientProps {
  initialNews: NewsArticle[];
  user: {
    name: string;
    email: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  interestCount: number;
  currentFilters: {
    languages: string[];
    sort: string;
    categories: string[];
    query: string;
    page: number;
    tab: string;
  };
  availableCategories: string[];
  favoriteUrls: string[];
  apiStatus: {
    newsApiRemaining: number;
    newsApiQuota: number;
    gnewsQuota: number;
    lastUpdated: string;
  };
}

const tagColors: Record<string, string> = {
  technology: "bg-blue-600", sports: "bg-orange-600", science: "bg-purple-600",
  health: "bg-red-600", general: "bg-zinc-700", games: "bg-green-600",
  crypto: "bg-yellow-700", movies: "bg-red-700", music: "bg-indigo-700", business: "bg-emerald-600",
  Busca: "bg-purple-700", Favorito: "bg-amber-600", Lido: "bg-zinc-700", Geral: "bg-zinc-600"
};

const ALL_POSSIBLE_CATEGORIES = [
  { slug: "general", label: "Geral" },
  { slug: "technology", label: "Tecnologia" },
  { slug: "sports", label: "Esportes" },
  { slug: "science", label: "Ciência" },
  { slug: "health", label: "Saúde" },
  { slug: "games", label: "Games" },
  { slug: "crypto", label: "Cripto" },
  { slug: "movies", label: "Cinema" },
  { slug: "music", label: "Música" },
  { slug: "business", label: "Negócios" }
];

export default function DashboardClient({
  initialNews,
  user,
  currentFilters,
  availableCategories,
  favoriteUrls,
  apiStatus
}: DashboardClientProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(currentFilters.tab || 'home');
  const [dismissedAlert, setDismissedAlert] = useState(false);
  const [immersiveArticle, setImmersiveArticle] = useState<NewsArticle | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<{ top: string, left: string, delay: string, opacity: number }[]>([]);

  useEffect(() => {
    setMounted(true);
    const newParticles = [...Array(40)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      opacity: Math.random() * 0.5
    }));
    setParticles(newParticles);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isWarm = mounted && theme === 'light';
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showTagPopover, setShowTagPopover] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [profileName, setProfileName] = useState(user.name);
  const [profileAvatar, setProfileAvatar] = useState(user.avatarUrl);
  const [profilePassword, setProfilePassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileCategories, setProfileCategories] = useState<string[]>(availableCategories);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [localApiStatus, setLocalApiStatus] = useState(apiStatus);
  const [currentPassword, setCurrentPassword] = useState("");
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 150);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab as any);
  }, [searchParams]);

  const [localSearch, setLocalSearch] = useState(currentFilters.query);
  const [newsList, setNewsList] = useState<NewsArticle[]>(initialNews);
  const [favState, setFavState] = useState<string[]>(favoriteUrls);

  const lastSyncTime = mounted ? new Date(localApiStatus.lastUpdated).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) : "--:--";

  const [localCategories, setLocalCategories] = useState<string[]>(currentFilters.categories);
  const [localLangs, setLocalLangs] = useState<string[]>(currentFilters.languages);
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalCategories(currentFilters.categories);
    setLocalLangs(currentFilters.languages);
  }, [currentFilters.categories, currentFilters.languages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowTagPopover(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const refreshQuota = async () => {
      const newStatus = await getApiStatusAction();
      setLocalApiStatus(newStatus);
    };
    refreshQuota();
  }, [activeTab]);

  useEffect(() => {
    if (!initialNews) return;

    if (currentFilters.page === 1) {
      setNewsList(initialNews);
    } else {
      setNewsList(prev => {
        const existingUrls = new Set(prev.map(a => a.url));
        const newArticles = initialNews.filter(a => !existingUrls.has(a.url));
        if (newArticles.length === 0) return prev;
        return [...prev, ...newArticles];
      });
    }
  }, [initialNews, currentFilters.page, currentFilters.tab]);

  useEffect(() => { setFavState(favoriteUrls); }, [favoriteUrls]);

  const updateFilters = (key: string, value: any) => {
    // Feedback instantâneo local (Otimista)
    if (key === 'categories') {
      if (value === 'general') {
        setLocalCategories(['general']);
      } else {
        setLocalCategories(prev => {
          if (prev.includes('general')) return [value];
          return prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value];
        });
      }
    }
    if (key === 'lang') {
      setLocalLangs(prev => prev.includes(value) ? prev.filter(l => l !== value) : [...prev, value]);
    }

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (key === 'categories' || key === 'lang') {
        let newVals: string[] = [];
        const currentVals = params.get(key)?.split(',').filter(Boolean) || [];

        if (key === 'categories' && value === 'general') {
          // Se clicar em Geral, limpa as outras categorias
          newVals = ['general'];
        } else if (key === 'categories' && currentVals.includes('general')) {
          // Se clicar em outra categoria e 'general' estiver ativo, remove 'general' e adiciona a nova
          newVals = [value];
        } else {
          // Lógica de toggle normal para os outros casos
          newVals = currentVals.includes(value)
            ? currentVals.filter(v => v !== value)
            : [...currentVals, value];
        }

        if (newVals.length > 0) params.set(key, newVals.join(','));
        else params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, value.toString());
      }

      if (key !== 'page') params.set('page', '1');
      router.push(`/dashboard?${params.toString()}`, { scroll: false });
      if (key !== 'categories' && key !== 'lang') setShowTagPopover(false);
      // Atualiza o status da API para refletir o novo horário de sincronização
      getApiStatusAction().then(status => {
        if (status) setLocalApiStatus(status);
      });
    });
  };

  const displayedNews = newsList.filter(article => !brokenUrls.has(article.url));

  const handleFavoriteClick = async (article: NewsArticle) => {
    // Feedback instantâneo local (Otimista)
    const isAdding = !favState.includes(article.url);
    setFavState(prev => isAdding ? [...prev, article.url] : prev.filter(u => u !== article.url));
    showNotify(isAdding ? "Adicionado aos favoritos" : "Removido dos favoritos");

    const res = await toggleFavorite({
      title: article.title,
      url: article.url,
      urlToImage: article.urlToImage || "",
      sourceName: article.source.name,
      publishedAt: article.publishedAt
    });

    if (res.error) {
      showNotify(res.error, "error");
      // Reverte se der erro
      setFavState(prev => isAdding ? prev.filter(u => u !== article.url) : [...prev, article.url]);
    }
  };

  const handleNewsClick = (article: NewsArticle) => {
    addToHistory({ title: article.title, url: article.url, imageUrl: article.urlToImage || "" });
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    const res = await updateUserProfile({
      name: profileName,
      avatarUrl: profileAvatar,
      password: isChangingPassword ? profilePassword : undefined,
      currentPassword: isChangingPassword ? currentPassword : undefined
    });
    setIsSavingProfile(false);
    if (res.success) {
      showNotify(isChangingPassword ? "Senha alterada com sucesso!" : "Perfil atualizado!");
      setIsChangingPassword(false);
      setProfilePassword("");
      setCurrentPassword("");
    } else {
      showNotify(res.error || "Erro ao salvar.", "error");
    }
  };

  const deepSearchMsg = (searchParams.get('q') && newsList.length < 5) ? "Refinando busca com IA..." : "";

  return (
    <div className={`min-h-screen ${isWarm ? 'bg-[#120804]' : 'bg-[#050505]'} text-foreground font-sans transition-colors duration-1000 selection:bg-cyan-500/30`}>
      <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none z-[100]" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute inset-0 bg-grid-dots opacity-[0.2] mix-blend-overlay transition-opacity duration-1000`} />
        <div className="absolute inset-0 transition-transform duration-75 ease-out" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}>
          {isWarm ? (
            <>
              <div className="absolute -top-[10%] -left-[10%] w-[70vw] h-[70vw] bg-orange-600/[0.12] blur-[180px] rounded-full animate-float-orb mix-blend-plus-lighter" />
              <div className="absolute bottom-[-5%] right-[-5%] w-[60vw] h-[60vw] bg-yellow-500/[0.08] blur-[150px] rounded-full animate-slow-pulse mix-blend-plus-lighter" />
            </>
          ) : (
            <>
              <div className="absolute -top-[20%] -left-[10%] w-[90vw] h-[90vw] bg-purple-900/[0.12] blur-[220px] rounded-full animate-float-orb mix-blend-screen" />
              <div className="absolute bottom-[-10%] right-[-5%] w-[70vw] h-[70vw] bg-blue-600/[0.07] blur-[180px] rounded-full animate-slow-pulse mix-blend-plus-lighter" />
              <div className="absolute top-[25%] left-[15%] w-[55vw] h-[55vw] bg-cyan-500/[0.05] blur-[160px] rounded-full animate-slow-float mix-blend-plus-lighter" />
              <div className="absolute inset-0 opacity-[0.4] mix-blend-screen overflow-hidden">
                {particles.map((p, i) => (
                  <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: p.top, left: p.left, animationDelay: p.delay, opacity: p.opacity }} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {notification && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[1000] px-8 py-4 rounded-[2rem] border backdrop-blur-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-8 duration-500 ${notification.type === 'success' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
          {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-black uppercase tracking-widest">{notification.message}</span>
        </div>
      )}

      {/* TOPBAR */}
      <header className="fixed top-0 left-0 lg:left-80 right-0 z-[500] glass-topbar backdrop-blur-[50px] bg-black/10 h-24 flex items-center px-8 lg:px-12 border-b border-white/[0.03]">
        <div className="flex-1 flex items-center gap-6">
          <div className="lg:hidden p-3 hover:bg-white/5 rounded-2xl text-white cursor-pointer transition-all" onClick={() => setSidebarOpen(!isSidebarOpen)}>
            <Menu size={24} />
          </div>
          <div className="relative group w-full max-w-xl flex items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-400 transition-colors" size={20} />
              <Input
                placeholder="Pesquisar notícias no radar..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && updateFilters('q', localSearch)}
                className="w-full h-14 bg-white/[0.15] border-white/40 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:bg-white/[0.25] focus-visible:border-white rounded-2xl pl-16 pr-6 text-base font-black text-white placeholder:text-zinc-300 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1),0_10px_50px_rgba(0,0,0,0.8)] hover:bg-white/[0.2] hover:border-white/60"
              />
            </div>
            <div className="w-[120px] flex-shrink-0">
              {scrolled && (
                <div className="relative animate-in fade-in slide-in-from-right-4 duration-300" ref={popoverRef}>
                  <button onClick={() => setShowTagPopover(!showTagPopover)} className="h-14 w-full px-4 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center gap-3 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/20 transition-all shadow-xl">
                    <Filter size={16} className="text-cyan-500" /> Filtros
                  </button>
                  {showTagPopover && (
                    <FilterPopover
                      categories={ALL_POSSIBLE_CATEGORIES}
                      selected={localCategories}
                      onUpdate={(cat) => updateFilters('categories', cat)}
                      selectedLang={localLangs}
                      onUpdateLang={(lang) => updateFilters('lang', lang)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <ThemeToggle />
          <div className="relative" ref={userMenuRef}>
            <div
              className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-[1px] cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-xl"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="h-full w-full bg-[#0a0a0a] rounded-[inherit] overflow-hidden flex items-center justify-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-black text-xs uppercase tracking-tighter">{user.name.substring(0, 2)}</span>
                )}
              </div>
            </div>

            {showUserMenu && (
              <div className="absolute right-0 top-16 w-64 bg-[#0a0a0a] border border-white/10 rounded-3xl p-4 shadow-2xl z-[1000] animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-white/5 mb-2">
                  <p className="text-xs font-black text-white uppercase truncate">{user.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                </div>
                <button onClick={() => { updateFilters('tab', 'profile'); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest">
                  <User size={16} /> Perfil
                </button>
                <button onClick={() => { setIsChangingPassword(true); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest">
                  <Settings size={16} /> Trocar Senha
                </button>
                <div className="h-[1px] bg-white/5 my-2" />
                <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500/70 hover:bg-red-500/10 hover:text-red-500 transition-all text-[11px] font-black uppercase tracking-widest">
                  <LogOut size={16} /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* SIDEBAR */}
      <aside className={`fixed left-0 top-0 bottom-0 z-[600] w-80 bg-[#050505]/20 backdrop-blur-[50px] border-r border-white/[0.03] transition-transform duration-700 ease-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 h-full flex flex-col">
          <div className="flex items-center gap-4 mb-16 px-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-black text-white shadow-2xl">TF</div>
            <h1 className="text-2xl font-black italic tracking-tighter text-white">TrackFeed</h1>
          </div>
          <nav className="space-y-4 flex-1 overflow-y-auto scrollbar-hide">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 px-6 mb-6">Navegação</div>
            <NavIconItem icon={Home} label="Home" active={activeTab === 'home'} onClick={() => updateFilters('tab', 'home')} isWarm={isWarm} />
            <NavIconItem icon={Compass} label="Descobrir" active={activeTab === 'explore'} onClick={() => updateFilters('tab', 'explore')} isWarm={isWarm} />
            <NavIconItem icon={BookmarkIcon} label="Favoritos" active={activeTab === 'favs'} onClick={() => updateFilters('tab', 'favs')} isWarm={isWarm} />
            <NavIconItem icon={Clock} label="Histórico" active={activeTab === 'history'} onClick={() => updateFilters('tab', 'history')} isWarm={isWarm} />
            <div className="pt-12 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 px-6 mb-6">Configurações</div>
            <NavIconItem icon={User} label="Perfil" active={activeTab === 'profile'} onClick={() => updateFilters('tab', 'profile')} isWarm={isWarm} />
            
            {/* STATUS DE SINCRONIZAÇÃO MINIMALISTA */}
            <div className="mt-8 px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Sincronizado</span>
               </div>
               <span className="text-[10px] text-cyan-500/80 font-bold">{lastSyncTime}</span>
            </div>
          </nav>
        </div>
      </aside>

      <main className={`transition-all duration-700 pt-24 min-h-screen lg:pl-80`}>
        <div className="max-w-[1600px] mx-auto p-8 lg:p-12">
          {activeTab === 'profile' ? (
            <ProfileSection
              user={user} profileName={profileName} setProfileName={setProfileName}
              profileAvatar={profileAvatar} profileCategories={profileCategories}
              setProfileCategories={setProfileCategories} handleSaveProfile={handleSaveProfile}
              isSavingProfile={isSavingProfile} logout={logout}
              localApiStatus={localApiStatus} lastSyncTime={lastSyncTime}
              isChangingPassword={isChangingPassword} setIsChangingPassword={setIsChangingPassword}
              currentPassword={currentPassword} setCurrentPassword={setCurrentPassword}
              profilePassword={profilePassword} setProfilePassword={setProfilePassword}
              deletePassword={deletePassword} setDeletePassword={setDeletePassword}
              setIsDeletingAccount={setIsDeletingAccount}
            />
          ) : (
            <section className="space-y-12 animate-in fade-in duration-1000">
              {localApiStatus.newsApiRemaining <= 0 && !dismissedAlert && (
                <QuotaAlert onDismiss={() => setDismissedAlert(true)} />
              )}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                <h2 className="text-6xl font-black tracking-tighter text-white leading-none capitalize">
                  {activeTab === 'home' ? 'Meu Feed' : activeTab === 'explore' ? 'Descobrir' : activeTab === 'favs' ? 'Favoritos' : 'Histórico'}
                </h2>
                {!scrolled && (
                  <div className="flex flex-wrap gap-4">
                    <div className="relative" ref={popoverRef}>
                      <button 
                        onClick={() => setShowTagPopover(!showTagPopover)} 
                        className="group relative h-14 px-8 rounded-full bg-white/5 border border-white/10 flex items-center gap-4 transition-all duration-500 hover:scale-105 hover:bg-cyan-500/20 hover:border-cyan-500/50 shadow-2xl overflow-hidden"
                      >
                        <Filter size={18} className="text-cyan-500 group-hover:rotate-12 transition-transform duration-500" />
                        <span className="text-white text-xs font-black uppercase tracking-[0.2em]">Idioma & Filtros</span>
                        <div className="absolute inset-0 bg-cyan-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </button>
                      
                      {showTagPopover && (
                        <FilterPopover 
                          categories={ALL_POSSIBLE_CATEGORIES} 
                          selected={localCategories} 
                          onUpdate={(cat) => updateFilters('categories', cat)}
                          selectedLang={localLangs}
                          onUpdateLang={(lang) => updateFilters('lang', lang)}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {displayedNews.length === 0 ? (
                <EmptyState title="Opa! Nada por aqui..." description="Tente mudar os filtros ou categorias." isSearching={deepSearchMsg !== ""} />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                    {activeTab === 'explore' && displayedNews.length > 0 && (
                      <div className="col-span-full mb-4 cursor-pointer" onClick={() => handleNewsClick(displayedNews[0])}>
                        <HeroArticle
                          article={displayedNews[0]}
                          isFavorite={favState.includes(displayedNews[0].url)}
                          onFavorite={() => handleFavoriteClick(displayedNews[0])}
                          onImmersive={() => handleNewsClick(displayedNews[0])}
                        />
                      </div>
                    )}
                    {(activeTab === 'explore' ? displayedNews.slice(1) : displayedNews).map((article, idx) => (
                      <PremiumNewsCard
                        key={article.url + idx} article={article} idx={idx}
                        isFavorite={favState.includes(article.url)}
                        onFavorite={() => handleFavoriteClick(article)}
                        onClick={() => handleNewsClick(article)}
                        onImageError={(url: string) => setBrokenUrls(prev => new Set(prev).add(url))}
                      />
                    ))}
                  </div>

                  {/* BOTÃO CARREGAR MAIS */}
                  <div className="mt-20 flex justify-center pb-20">
                    <button
                      onClick={() => updateFilters('page', currentFilters.page + 1)}
                      className="group relative h-24 w-24 rounded-[2.5rem] bg-white/[0.03] border border-white/10 flex items-center justify-center transition-all hover:scale-110 hover:bg-cyan-500 hover:border-cyan-400 active:scale-95 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    >
                      <Plus size={32} className="text-white group-hover:rotate-90 transition-transform duration-500" />
                      <div className="absolute inset-0 rounded-[inherit] bg-cyan-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </main>

      {immersiveArticle && <ImmersiveReader article={immersiveArticle} onClose={() => setImmersiveArticle(null)} />}

      {/* MODAL TROCAR SENHA */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 space-y-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500"><Key size={24} /></div>
              <button onClick={() => setIsChangingPassword(false)} className="text-zinc-600 hover:text-white transition-all"><X size={24} /></button>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Trocar Senha</h3>
              <p className="text-zinc-500 text-sm font-bold mt-2">Mantenha sua conta protegida com uma senha forte.</p>
            </div>
            <div className="space-y-4">
              <Input type="password" placeholder="Senha Atual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-14 bg-white/5 border-white/5 rounded-2xl text-white" />
              <Input type="password" placeholder="Nova Senha" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} className="h-14 bg-white/5 border-white/5 rounded-2xl text-white" />
            </div>
            <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full h-14 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all">
              {isSavingProfile ? <Loader2 className="animate-spin" /> : "Confirmar Troca"}
            </Button>
          </div>
        </div>
      )}

      {/* MODAL DELETAR CONTA */}
      {isDeletingAccount && (
        <div className="fixed inset-0 z-[2000] bg-red-950/20 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-red-500/20 rounded-[2.5rem] p-10 space-y-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500"><Trash2 size={24} /></div>
              <button onClick={() => setIsDeletingAccount(false)} className="text-zinc-600 hover:text-white transition-all"><X size={24} /></button>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Deletar Conta</h3>
              <p className="text-red-500/70 text-sm font-bold mt-2">Esta ação é permanente e irreversível.</p>
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-zinc-500">Confirme sua senha para prosseguir</Label>
              <Input type="password" placeholder="Sua senha atual" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="h-14 bg-white/5 border-white/5 rounded-2xl text-white" />
            </div>
            <Button
              onClick={async () => {
                const res = await deleteAccountAction(deletePassword);
                if (!res.success) showNotify(res.error || "Erro", "error");
              }}
              className="w-full h-14 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_10px_20px_rgba(220,38,38,0.3)]"
            >
              Sim, Deletar Tudo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// COMPONENTES AUXILIARES
function NavIconItem({ icon: Icon, label, active, onClick, isWarm }: any) {
  return (
    <div onClick={onClick} className={`flex items-center gap-5 px-6 py-5 rounded-3xl cursor-pointer transition-all duration-700 relative group ${active ? "bg-cyan-500/10 text-cyan-400" : "text-zinc-600 hover:text-zinc-300"}`}>
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="hidden lg:block font-black text-[13px] uppercase tracking-[0.25em]">{label}</span>
      {active && <div className="absolute left-0 w-2 h-8 bg-cyan-500 rounded-r-full shadow-2xl" />}
    </div>
  );
}

function PremiumNewsCard({ article, isFavorite, onFavorite, idx, onClick, onImageError }: any) {
  const category = article.category || "Geral";
  const colorClass = tagColors[category] || "bg-zinc-700";

  if (!article.urlToImage) return null;

  return (
    <div className="group relative border border-white/5 bg-white/5 backdrop-blur-2xl rounded-[3rem] transition-all duration-700 flex flex-col h-full hover:border-white/20 hover:-translate-y-3 overflow-hidden" onClick={onClick}>
      <div className="relative aspect-[16/9] m-3 rounded-[2rem] overflow-hidden">
        <img
          src={article.urlToImage}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={() => onImageError(article.url)}
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <div className={`${colorClass} px-4 py-2 rounded-lg text-[8px] font-black uppercase text-white`}>{category}</div>
        </div>
      </div>
      <div className="p-7 flex flex-col flex-1 gap-4">
        <div className="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-3">
          <span className="text-cyan-400">{article.source.name}</span>
          <span>{new Date(article.publishedAt).toLocaleDateString('pt-BR')}</span>
        </div>
        <h3 className="text-[1.1rem] font-black text-white line-clamp-2">{article.title}</h3>
        <p className="text-[13px] text-white leading-relaxed line-clamp-2">{article.description}</p>
        <div className="mt-auto pt-6 flex items-center justify-between">
          <button onClick={onClick} className="text-[10px] font-black uppercase text-cyan-500 flex items-center gap-2">Ver Notícia <ArrowRight size={14} /></button>
          <button 
            onClick={(e) => { e.stopPropagation(); onFavorite(); }} 
            className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-500 border ${
              isFavorite 
                ? "bg-purple-500/20 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-110" 
                : "bg-white/5 border-white/10 text-zinc-600 hover:text-white hover:bg-white/10 hover:scale-110"
            }`}
          >
            <BookmarkIcon size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroArticle({ article, isFavorite, onFavorite, onImmersive }: any) {
  return (
    <div className="relative w-full h-[450px] rounded-[3rem] overflow-hidden group cursor-pointer border border-white/5" onClick={() => onImmersive(article)}>
      {article.urlToImage && <img src={article.urlToImage} className="w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 p-12 w-full max-w-4xl space-y-6 text-white">
        <div className="px-5 py-2.5 bg-cyan-600 inline-block rounded-xl text-[10px] font-black uppercase">Destaque</div>
        <h2 className="text-5xl font-black tracking-tighter leading-none">{article.title}</h2>
        <p className="text-white/80 text-lg line-clamp-2">{article.description}</p>
        <div className="flex items-center gap-6">
          <Button className="bg-white text-black rounded-2xl h-14 px-8 font-black uppercase">Modo Imersivo</Button>
          <button 
            onClick={(e) => { e.stopPropagation(); onFavorite(); }} 
            className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-500 border backdrop-blur-xl ${
              isFavorite 
                ? "bg-purple-500/20 border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-110" 
                : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-110"
            }`}
          >
            <BookmarkIcon size={24} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ImmersiveReader({ article, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex flex-col items-center p-20 overflow-y-auto">
      <button onClick={onClose} className="fixed top-8 right-8 text-white h-12 w-12 bg-white/10 rounded-full flex items-center justify-center"><X size={24} /></button>
      <div className="w-full max-w-4xl space-y-12 text-white">
        <div className="text-center space-y-4">
          <div className="text-cyan-500 font-black uppercase tracking-widest">{article.source.name}</div>
          <h1 className="text-6xl font-black tracking-tighter">{article.title}</h1>
        </div>
        <img src={article.urlToImage} className="w-full rounded-[3rem] shadow-2xl" />
        <p className="text-2xl font-medium italic text-center">"{article.description}"</p>
        <Button onClick={() => window.open(article.url, '_blank')} className="w-full h-16 bg-cyan-600 text-white font-black uppercase rounded-2xl">Ler no site original</Button>
      </div>
    </div>
  );
}

function ProfileSection({
  user, profileName, setProfileName, profileAvatar, profileCategories,
  setProfileCategories, handleSaveProfile, isSavingProfile, logout,
  localApiStatus, lastSyncTime, setIsChangingPassword, setIsDeletingAccount
}: any) {
  return (
    <section className="max-w-4xl mx-auto py-12 space-y-12">
      <div className="flex items-center gap-8 p-12 rounded-[3.5rem] bg-white/5 border border-white/5 backdrop-blur-2xl">
        <div className="h-32 w-32 rounded-[2.5rem] bg-zinc-900 flex items-center justify-center overflow-hidden border-2 border-cyan-500/20">
          {profileAvatar ? <img src={profileAvatar} className="w-full h-full object-cover" /> : <span className="text-white text-3xl font-black">{user.name.substring(0, 1)}</span>}
        </div>
        <div className="flex-1">
          <h2 className="text-4xl font-black text-white">{user.name}</h2>
          {user.emailVerified && (
            <div className="flex items-center gap-3 text-white text-sm font-bold uppercase"><ShieldCheck size={16} className="text-cyan-500" /> Conta Verificada</div>
          )}
        </div>
        <Button onClick={logout} className="bg-red-500/20 text-red-400 h-14 w-14 rounded-2xl"><LogOut size={20} /></Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-10 rounded-[3rem] bg-white/5 border border-white/5 space-y-8 flex flex-col">
          <h3 className="text-xl font-black text-white uppercase tracking-widest">Dados Pessoais</h3>
          <div className="space-y-4 flex-1">
            <Label className="text-white font-black text-[10px] uppercase">Nome</Label>
            <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="bg-black/40 text-white" />
          </div>

          <div className="pt-8 flex flex-col gap-4">
            <Button onClick={() => setIsChangingPassword(true)} className="w-full h-14 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest rounded-2xl border border-white/5 transition-all">Redefinir Acesso</Button>
            <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full h-14 bg-cyan-600 text-white font-black uppercase tracking-widest rounded-2xl">Salvar Alterações</Button>
          </div>
        </div>
        <div className="p-10 rounded-[3rem] bg-white/5 border border-white/5 space-y-8 flex flex-col">
          <h3 className="text-xl font-black text-white uppercase tracking-widest">Categorias</h3>
          <div className="flex flex-wrap gap-2 flex-1">
            {ALL_POSSIBLE_CATEGORIES.map(cat => (
              <button 
                key={cat.slug} 
                onClick={() => setProfileCategories((p: any) => p.includes(cat.slug) ? p.filter((c: any) => c !== cat.slug) : [...p, cat.slug])} 
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${profileCategories.includes(cat.slug) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 text-zinc-600'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <Button onClick={() => updateUserPreferences(profileCategories)} className="w-full h-14 bg-purple-600/20 text-purple-400 font-black uppercase tracking-widest rounded-2xl">Atualizar Interesses</Button>
        </div>

        <div className="col-span-full p-10 rounded-[3rem] bg-red-500/5 border border-red-500/20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-red-500 uppercase tracking-widest">Zona Crítica</h3>
            <p className="text-zinc-500 text-sm font-bold">Deseja remover sua conta permanentemente?</p>
          </div>
          <Button onClick={() => setIsDeletingAccount(true)} className="h-14 px-12 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 font-black uppercase tracking-widest rounded-2xl transition-all">Deletar Conta</Button>
        </div>
      </div>
    </section>
  );
}

function QuotaAlert({ onDismiss }: any) {
  return (
    <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/20 flex items-center gap-8 relative">
      <button onClick={onDismiss} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-all"><X size={16} /></button>
      <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]"><AlertCircle size={32} /></div>
      <div>
        <h4 className="text-lg font-black uppercase text-white tracking-widest italic">MODO ARQUIVO</h4>
        <p className="text-zinc-500 text-sm font-bold">Limite de busca atingido. Mude o idioma para buscar novos resultados ou veja as notícias que já foram pesquisadas.</p>
      </div>
    </div>
  );
}

function FilterPopover({ categories, selected, onUpdate, selectedLang, onUpdateLang }: any) {
  return (
    <div className="absolute right-0 top-16 w-80 bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl z-[100] space-y-8">
      <div className="space-y-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Globe size={12} /> Idioma do Feed</div>
        <div className="flex gap-2">
          <button onClick={() => onUpdateLang('pt')} className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase border transition-all ${selectedLang.includes('pt') ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-white/5 border-white/5 text-zinc-500'}`}>Português</button>
          <button onClick={() => onUpdateLang('en')} className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase border transition-all ${selectedLang.includes('en') ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-white/5 border-white/5 text-zinc-500'}`}>English</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Filter size={12} /> Categorias Ativas</div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat: any) => (
            <button 
              key={cat.slug} 
              onClick={() => onUpdate(cat.slug)} 
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${selected.includes(cat.slug) ? 'bg-cyan-500 text-white shadow-[0_5px_15px_rgba(6,182,212,0.3)]' : 'bg-white/5 text-zinc-500 hover:text-white'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description, isSearching }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      {isSearching ? <Loader2 size={40} className="animate-spin text-purple-500 mb-8" /> : <SearchX size={40} className="text-zinc-700 mb-8" />}
      <h3 className="text-2xl font-black uppercase text-zinc-400">{isSearching ? "Buscando..." : title}</h3>
      <p className="text-zinc-600 text-sm font-bold">{description}</p>
    </div>
  );
}

function SkeletonGrid({ isExplore }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="aspect-[16/9] bg-zinc-900 rounded-[3rem] animate-pulse" />
      ))}
    </div>
  );
}
