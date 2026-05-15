'use client'

import { useState, useTransition, useEffect, useRef, useMemo } from "react";
import { 
  Home, Compass, Bookmark, Search, Bell, User, 
  Menu, TrendingUp, Share2, MoreHorizontal,
  Calendar, Globe, Tag, Clock, ChevronDown, Plus, Zap, Check, Loader2, ArrowDownCircle, X, ArrowRight,
  ExternalLink, Filter, Sparkles, Flame, Trash2, LayoutGrid, SearchX, Settings, LogOut, Camera,
  ShieldCheck, Activity, Database, Cpu, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { NewsArticle } from "@/lib/news";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { toggleFavorite, addToHistory, updateUserProfile, logout, resendVerificationEmailAction, updateUserPreferences, deleteAccountAction, getApiStatusAction, summarizeNewsAction } from "./actions";

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
  health: "bg-red-600", general: "bg-amber-500", games: "bg-green-600",
  crypto: "bg-yellow-700", movies: "bg-red-700", music: "bg-indigo-700", business: "bg-emerald-600",
  Busca: "bg-purple-700", Favorito: "bg-amber-600", Lido: "bg-zinc-700", Geral: "bg-zinc-600"
};

const ALL_POSSIBLE_CATEGORIES = [
  "general", "technology", "sports", "science", "health", 
  "games", "crypto", "movies", "music", "business"
];

export default function DashboardClient({ 
  initialNews, 
  user,
  interestCount,
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

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isWarm = mounted && theme === 'light';
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(currentFilters.query);
  const [showTagPopover, setShowTagPopover] = useState(false);
  const [showStatusPopover, setShowStatusPopover] = useState(false);
  
  const popoverRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  
  const [profileName, setProfileName] = useState(user.name);
  const [profileAvatar, setProfileAvatar] = useState(user.avatarUrl);
  const [profilePassword, setProfilePassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profileCategories, setProfileCategories] = useState<string[]>(availableCategories);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [localApiStatus, setLocalApiStatus] = useState(apiStatus);
  const [currentPassword, setCurrentPassword] = useState("");
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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

  const [visibleCount, setVisibleCount] = useState(6);
  const [localLangs, setLocalLangs] = useState<string[]>(currentFilters.languages);
  const [localCats, setLocalCats] = useState<string[]>(currentFilters.categories);
  const [localSearch, setLocalSearch] = useState(currentFilters.query);

  const [newsList, setNewsList] = useState<NewsArticle[]>(initialNews);
  const [favState, setFavState] = useState<string[]>(favoriteUrls);
  
  const lastSyncTime = new Date(localApiStatus.lastUpdated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    const refreshQuota = async () => {
      const newStatus = await getApiStatusAction();
      setLocalApiStatus(newStatus);
    };
    refreshQuota();
  }, [activeTab]);

  useEffect(() => {
    if (currentFilters.page === 1) {
      setNewsList(initialNews);
    } else {
      setNewsList(prev => {
        const existingUrls = new Set(prev.map(a => a.url));
        const newArticles = initialNews.filter(a => !existingUrls.has(a.url));
        return [...prev, ...newArticles];
      });
    }
  }, [initialNews, currentFilters.page]);

  useEffect(() => { setFavState(favoriteUrls); }, [favoriteUrls]);

  const updateFilters = (key: string, value: any) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, value.toString());
      }
      if (key !== 'page') params.set('page', '1');
      router.push(`/dashboard?${params.toString()}`);
    });
  };

  const handleFavoriteClick = async (article: NewsArticle) => {
    const res = await toggleFavorite({
      title: article.title,
      url: article.url,
      urlToImage: article.urlToImage || "",
      sourceName: article.source.name,
      publishedAt: article.publishedAt
    });

    if (res.error) {
      showNotify(res.error, "error");
    } else {
      showNotify(res.action === "added" ? "Adicionado aos favoritos" : "Removido dos favoritos");
      setFavState(prev => res.action === "added" ? [...prev, article.url] : prev.filter(u => u !== article.url));
    }
  };

  const handleNewsClick = (article: NewsArticle) => {
    addToHistory({ title: article.title, url: article.url, imageUrl: article.urlToImage || "" });
    setImmersiveArticle(article);
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
      showNotify("Perfil atualizado com sucesso!");
      setIsChangingPassword(false);
      setProfilePassword("");
      setCurrentPassword("");
    } else {
      showNotify(res.error || "Erro ao salvar.", "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return showNotify("Senha obrigatória", "error");
    setIsDeleting(true);
    const res = await deleteAccountAction(deletePassword);
    setIsDeleting(false);
    if (res.success) window.location.href = "/";
    else showNotify(res.error || "Erro ao deletar", "error");
  };

  const displayedNews = newsList;
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
                {[...Array(50)].map((_, i) => (
                  <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, opacity: Math.random() }} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {notification && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[1000] px-8 py-4 rounded-[2rem] border backdrop-blur-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-8 duration-500 ${
          notification.type === 'success' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-black uppercase tracking-widest">{notification.message}</span>
        </div>
      )}

      {/* TOPBAR GLASS */}
      <header className="fixed top-0 left-0 right-0 z-[500] glass-topbar backdrop-blur-[20px] h-24 flex items-center px-8 lg:px-12">
        <div className="flex-1 flex items-center gap-6">
          <div className="lg:hidden p-3 hover:bg-white/5 rounded-2xl text-white cursor-pointer transition-all" onClick={() => setSidebarOpen(!isSidebarOpen)}>
            <Menu size={24} />
          </div>
          <div className="relative group max-w-xl w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" size={20} />
            <Input 
              placeholder="Pesquisar notícias no radar..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateFilters('q', localSearch)}
              className="w-full h-14 bg-white/5 border-white/5 focus-visible:ring-cyan-500/30 focus-visible:bg-white/10 rounded-2xl pl-16 pr-6 text-sm font-bold text-white placeholder:text-zinc-600 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end gap-1 px-4 border-r border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">API Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${localApiStatus.newsApiRemaining > 0 ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse'}`} />
              <span className="text-xs font-black text-white">{localApiStatus.newsApiRemaining > 0 ? 'Conectado' : 'Modo Arquivo'}</span>
            </div>
          </div>
          <ThemeToggle />
          <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-[1px] cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-xl" onClick={() => updateFilters('tab', 'profile')}>
            <div className="h-full w-full bg-[#0a0a0a] rounded-[inherit] overflow-hidden">
               <img src={user.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* SIDEBAR */}
      <aside className={`fixed left-0 top-0 bottom-0 z-[600] w-80 bg-[#050505]/40 backdrop-blur-3xl border-r border-white/5 transition-transform duration-700 ease-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 h-full flex flex-col">
          <div className="flex items-center gap-4 mb-16 px-4">
             <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-black text-white shadow-2xl">TF</div>
             <h1 className="text-2xl font-black italic tracking-tighter text-white">TrackFeed</h1>
          </div>

          <nav className="space-y-4 flex-1 overflow-y-auto scrollbar-hide">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 px-6 mb-6">Menu Principal</div>
            <NavIconItem icon={Home} label="Home" active={activeTab === 'home'} onClick={() => updateFilters('tab', 'home')} isWarm={isWarm} />
            <NavIconItem icon={Compass} label="Descobrir" active={activeTab === 'explore'} onClick={() => updateFilters('tab', 'explore')} isWarm={isWarm} />
            <NavIconItem icon={Bookmark} label="Favoritos" active={activeTab === 'favs'} onClick={() => updateFilters('tab', 'favs')} isWarm={isWarm} />
            <NavIconItem icon={Clock} label="Histórico" active={activeTab === 'history'} onClick={() => updateFilters('tab', 'history')} isWarm={isWarm} />
            
            <div className="pt-12 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 px-6 mb-6">Configurações</div>
            <NavIconItem icon={User} label="Perfil" active={activeTab === 'profile'} onClick={() => updateFilters('tab', 'profile')} isWarm={isWarm} />
          </nav>

          <div className="mt-auto p-6 rounded-3xl bg-white/5 border border-white/5">
             <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Cpu size={12} /> Sincronização IA</div>
             <p className="text-[11px] text-zinc-500 leading-relaxed font-bold">Última atualização às {lastSyncTime}</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`transition-all duration-700 pt-24 min-h-screen lg:pl-80`}>
        <div className="max-w-[1600px] mx-auto p-8 lg:p-12">
          {activeTab === 'profile' ? (
            <section className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
               {/* Profile UI stays as it was... */}
               <div className="flex items-center gap-8 p-12 rounded-[3.5rem] bg-white/5 border border-white/5 backdrop-blur-2xl">
                 <div className="relative h-32 w-32 rounded-[2.5rem] overflow-hidden border-2 border-cyan-500/20 shadow-2xl group cursor-pointer">
                    <img src={profileAvatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Camera size={24} className="text-white" /></div>
                 </div>
                 <div className="flex-1 space-y-2">
                    <h2 className="text-4xl font-black tracking-tighter text-white">{user.name}</h2>
                    <div className="flex items-center gap-3 text-secondary text-sm font-bold uppercase tracking-widest">
                       <ShieldCheck size={16} className="text-cyan-500" /> Conta Verificada
                    </div>
                 </div>
                 <Button variant="ghost" onClick={logout} className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-red-500/20 text-red-400 border border-white/5"><LogOut size={20} /></Button>
               </div>
               {/* Simplified Settings Area */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-10 rounded-[3rem] bg-white/5 border border-white/5 space-y-8">
                     <h3 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3"><Settings size={20} className="text-cyan-500" /> Dados Pessoais</h3>
                     <div className="space-y-4">
                        <Label className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-500">Seu Nome</Label>
                        <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="h-14 bg-black/40 border-white/5 rounded-2xl text-white font-bold" />
                     </div>
                     <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full h-14 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl">{isSavingProfile ? "Salvando..." : "Salvar Alterações"}</Button>
                  </div>
                  <div className="p-10 rounded-[3rem] bg-white/5 border border-white/5 space-y-8">
                     <h3 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3"><Cpu size={20} className="text-purple-500" /> IA & Preferências</h3>
                     <div className="flex flex-wrap gap-3">
                        {ALL_POSSIBLE_CATEGORIES.map(cat => (
                          <div key={cat} onClick={() => setProfileCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border ${profileCategories.includes(cat) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/5 text-zinc-600 hover:text-white'}`}>
                            {cat}
                          </div>
                        ))}
                     </div>
                     <Button onClick={async () => { await updateUserPreferences(profileCategories); showNotify("Interesses atualizados!"); }} className="w-full h-14 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 font-black uppercase tracking-widest border border-purple-500/30 rounded-2xl">Atualizar Algoritmo</Button>
                  </div>
               </div>
            </section>
          ) : (
            <>
              {isPending ? (
                <SkeletonGrid isExplore={activeTab === 'explore'} />
              ) : (
                <section className="space-y-12 animate-in fade-in duration-1000">
                  {/* QUOTA WARNING ELEGANT */}
                  {localApiStatus.newsApiRemaining <= 0 && !dismissedAlert && (
                    <div className="relative group p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/20 backdrop-blur-3xl overflow-hidden animate-in zoom-in duration-700">
                       <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => setDismissedAlert(true)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-600 transition-colors"><X size={16} /></button>
                       </div>
                       <div className="flex items-center gap-8">
                          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.2)]"><AlertCircle size={32} /></div>
                          <div className="flex-1 space-y-2">
                             <h4 className="text-lg font-black uppercase tracking-widest text-white">Sincronização Offline</h4>
                             <p className="text-secondary text-sm font-medium leading-relaxed">As cotas da API NewsApi expiraram. Estamos carregando o <strong>Arquivo Local</strong> e as notícias de contingência do GNews para manter seu radar ativo.</p>
                          </div>
                       </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-cyan-500 font-black uppercase tracking-[0.4em] text-[12px] mb-4">
                      <TrendingUp size={16} /> Radar de Notícias
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                      <h2 className="text-6xl font-black tracking-tighter text-white leading-none capitalize">
                        {activeTab === 'home' ? 'Meu Feed' : activeTab === 'explore' ? 'Descobrir' : activeTab === 'favs' ? 'Favoritos' : 'Histórico'}
                      </h2>
                      <div className="flex flex-wrap gap-4">
                        <div className="h-14 px-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 text-zinc-500 text-xs font-black uppercase tracking-widest shadow-inner">
                          <Activity size={16} /> {displayedNews.length} Notícias
                        </div>
                        {activeTab !== 'favs' && activeTab !== 'history' && (
                          <div className="relative" ref={popoverRef}>
                            <button onClick={() => setShowTagPopover(!showTagPopover)} className="h-14 px-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                              <Filter size={16} className="text-cyan-500" /> Filtros
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {displayedNews.length === 0 ? (
                    <EmptyState 
                      title={localApiStatus.newsApiRemaining <= 0 ? "MODO OFFLINE ATIVADO" : "Opa! Nada por aqui..."} 
                      description={localApiStatus.newsApiRemaining <= 0 ? "As cotas de API acabaram. Estamos exibindo apenas o que já está salvo no seu banco de dados." : "Tente mudar as categorias ou o idioma para ver novas notícias."} 
                      onReset={() => updateFilters('lang', 'en')} 
                      isSearching={deepSearchMsg !== ""} 
                      isWarm={isWarm}
                      activeTab={activeTab}
                    />
                  ) : (
                    <div className={activeTab === 'explore' ? "space-y-12" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20"}>
                      {activeTab === 'explore' && displayedNews.length > 0 && (
                        <div className="col-span-full">
                          <HeroArticle 
                            article={displayedNews[0]} 
                            isWarm={isWarm} 
                            isFavorite={favoriteUrls.includes(displayedNews[0].url)}
                            onFavorite={() => handleFavoriteClick(displayedNews[0])}
                            onImmersive={(a) => setImmersiveArticle(a)}
                          />
                        </div>
                      )}

                      {(activeTab === 'explore' ? displayedNews.slice(1) : displayedNews).map((article, idx) => (
                        <PremiumNewsCard 
                          key={article.url + idx} 
                          article={article} 
                          idx={idx} 
                          isWarm={isWarm}
                          activeTab={activeTab}
                          isFavorite={favoriteUrls.includes(article.url)}
                          onFavorite={() => handleFavoriteClick(article)}
                          onClick={() => handleNewsClick(article)}
                          onImmersive={(a) => setImmersiveArticle(a)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </main>

      {immersiveArticle && <ImmersiveReader article={immersiveArticle} onClose={() => setImmersiveArticle(null)} />}
    </div>
  );
}

function EmptyState({ title, description, onReset, isSearching = false, isWarm, activeTab }: { title: string, description: string, onReset?: () => void, isSearching?: boolean, isWarm: boolean, activeTab: string }) {
  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-500">
        <Loader2 size={40} className="animate-spin text-purple-500 mb-8" />
        <h3 className="text-2xl font-black uppercase tracking-widest text-zinc-400 mb-4 italic">Buscando...</h3>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-500">
      <div className="h-24 w-24 rounded-full bg-zinc-900 flex items-center justify-center mb-8 border border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"><SearchX size={40} className="text-zinc-700" /></div>
      <h3 className="text-2xl font-black uppercase tracking-widest text-zinc-400 mb-4 italic">{title}</h3>
      <p className="text-zinc-600 text-sm font-bold max-w-md">{description}</p>
      {onReset && <Button onClick={onReset} className="mt-10 bg-purple-600/10 text-purple-400 border border-purple-500/30 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] transition-all">Mudar Idioma para Expandir</Button>}
    </div>
  );
}

function NavIconItem({ icon: Icon, label, active = false, onClick, isWarm = false }: { icon: any, label: string, active?: boolean, onClick?: () => void, isWarm?: boolean }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-5 px-6 py-5 rounded-3xl cursor-pointer transition-all duration-700 relative group ${
      active 
        ? (isWarm ? "bg-orange-500/15 text-orange-400" : "bg-purple-600/15 text-purple-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]")
        : (isWarm ? "text-orange-100/30 hover:bg-white/5 hover:text-orange-200" : "text-zinc-600 hover:bg-zinc-900/50 hover:text-zinc-300")
    }`}>
      <Icon size={24} strokeWidth={active ? 2.5 : 2} className={`shrink-0 transition-all duration-700 ${active ? "scale-110" : "group-hover:scale-110"}`} />
      <span className={`hidden lg:block font-black text-[13px] uppercase tracking-[0.25em] transition-all duration-700 ${active ? (isWarm ? "text-orange-400" : "text-purple-400") : ""}`}>{label}</span>
      {active && (
        <>
          <div className={`absolute left-0 w-2 h-8 rounded-r-full shadow-2xl animate-in fade-in slide-in-from-left-2 duration-700 ${
            isWarm ? "bg-orange-500 shadow-orange-500/50" : "bg-cyan-500 shadow-cyan-500/50"
          }`} />
          <div className={`absolute inset-0 blur-2xl opacity-20 transition-all duration-700 ${
            isWarm ? "bg-orange-500/40" : "bg-cyan-600/40"
          }`} />
        </>
      )}
    </div>
  );
}

function PremiumNewsCard({ article, isFavorite, onFavorite, onClick, activeTab = 'home', isWarm = false, idx = 0, onImmersive }: { article: NewsArticle, isFavorite: boolean, onFavorite: () => void, onClick: () => void, activeTab?: string, isWarm?: boolean, idx?: number, onImmersive: (a: NewsArticle) => void }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const category = article.category || "Geral";
  const colorClass = tagColors[category] || "bg-zinc-700";
  const isHot = article.title.toLowerCase().includes('vaza') || article.title.toLowerCase().includes('hot') || article.title.toLowerCase().includes('trending');

  const handleSummarize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (summary) { setSummary(null); return; }
    setIsSummarizing(true);
    const res = await summarizeNewsAction(article.title, article.description || "");
    if (res.summary) setSummary(res.summary);
    setIsSummarizing(false);
  };

  const cardStyle = isWarm ? 'bg-[#1a0f0a]/40 border-orange-500/10 rounded-[3rem] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]' :
                   activeTab === 'home' ? 'bg-[#0a0a0a]/30 border-white/5 rounded-[3.5rem] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]' :
                   activeTab === 'explore' ? 'bg-[#02040a]/30 border-white/5 rounded-[3rem] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]' :
                   activeTab === 'favs' ? 'bg-[#0a0805]/30 border-white/5 rounded-[2.5rem] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]' :
                   'bg-[#050806]/30 border-white/5 rounded-[2.5rem] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]';

  return (
    <div className={`group relative border ${cardStyle} backdrop-blur-2xl transition-all duration-700 flex flex-col h-full ${isWarm ? 'hover:border-orange-500/40' : 'hover:border-white/20'} ${isHot ? 'ring-1 ring-red-500/30' : ''} hover:-translate-y-3 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-8 duration-700 overflow-hidden`} style={{ animationDelay: `${(idx % 6) * 100}ms` }}>
      {isHot && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/20 blur-[40px] pointer-events-none" />}
      <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
        <div className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1500ms] ease-in-out" />
      </div>
      <div className={`relative aspect-[16/9] overflow-hidden m-3 rounded-[2rem] bg-zinc-900 shadow-inner group-hover:shadow-2xl transition-all duration-1000 cursor-pointer`} onClick={() => onImmersive(article)}>
        {article.urlToImage && <img src={article.urlToImage} alt={article.title} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button onClick={handleSummarize} title="AI Smart Digest" className="h-9 w-9 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-cyan-500 transition-all active:scale-90">
            {isSummarizing ? <Loader2 size={16} className="animate-spin" /> : "✨"}
          </button>
          <div className={`${colorClass} text-white text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg shadow-xl backdrop-blur-md border border-white/10`}>{category}</div>
        </div>
        {isHot && <div className="absolute bottom-4 right-4 px-3 py-1 bg-red-600 text-white text-[8px] font-black uppercase rounded-lg animate-pulse flex items-center gap-1.5"><Flame size={12} /> Hot Now</div>}
      </div>
      <div className="p-7 flex flex-col flex-1 gap-4">
        <div className="flex items-center gap-3 text-[10px] text-secondary font-bold uppercase tracking-wider">
          <span className={isWarm ? 'text-orange-400' : 'text-cyan-400'}>{article.source.name}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-800" />
          <span>{new Date(article.publishedAt).toLocaleDateString('pt-BR')}</span>
        </div>
        <h3 className="text-[1.1rem] card-title text-white group-hover:text-cyan-400 transition-colors line-clamp-2 cursor-pointer" onClick={() => onImmersive(article)}>
          {article.title}
        </h3>
        {summary ? (
          <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl animate-in zoom-in duration-500">
             <div className="text-[11px] text-cyan-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">✨ Smart Digest</div>
             <p className="text-[12px] text-secondary leading-relaxed whitespace-pre-line italic">{summary}</p>
          </div>
        ) : article.description && (
          <p className="text-[13px] text-secondary leading-relaxed line-clamp-2">
            {article.description}
          </p>
        )}
        <div className="mt-auto pt-6 flex items-center justify-between">
          <button onClick={(e) => { e.stopPropagation(); onImmersive(article); }} className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 hover:text-cyan-400 flex items-center gap-2 group/btn">
            Ver imersão <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onFavorite(); }} className={`transition-all active:scale-75 hover:scale-125 ${isFavorite ? "text-purple-400" : "text-zinc-600 hover:text-purple-500"}`}>
            <Bookmark size={20} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
}

const HeroArticle = ({ article, isWarm, isFavorite, onFavorite, onImmersive }: { 
  article: NewsArticle, isWarm: boolean, isFavorite: boolean, onFavorite: () => void, onImmersive: (a: NewsArticle) => void 
}) => {
  return (
    <div className="relative w-full h-[450px] rounded-[3rem] overflow-hidden group cursor-pointer border border-white/5 hover:border-white/20 transition-all duration-700" onClick={() => onImmersive(article)}>
      {article.urlToImage && <img src={article.urlToImage} alt={article.title} className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-105" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 p-12 w-full max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="px-5 py-2.5 bg-cyan-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl">Destaque</div>
          <span className="text-secondary text-xs font-bold uppercase tracking-widest">{article.source.name}</span>
        </div>
        <h2 className="text-5xl font-black tracking-tighter leading-[0.95] text-white text-glow">{article.title}</h2>
        <p className="text-secondary text-lg font-medium leading-relaxed max-w-2xl line-clamp-2">{article.description}</p>
        <div className="flex items-center gap-6 pt-4">
          <Button className="bg-white text-black hover:bg-cyan-500 hover:text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest transition-all">Modo Imersivo</Button>
          <button onClick={(e) => { e.stopPropagation(); onFavorite(); }} className={`p-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all active:scale-90 ${isFavorite ? "text-purple-400 bg-purple-500/10" : "text-white"}`}>
            <Bookmark size={24} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
}

const ImmersiveReader = ({ article, onClose }: { article: NewsArticle, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500 flex flex-col items-center overflow-y-auto scrollbar-hide p-8 lg:p-20">
      <button onClick={onClose} className="fixed top-8 right-8 z-[1001] h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"><X size={24} /></button>
      <div className="w-full max-w-4xl space-y-12 animate-in slide-in-from-bottom-20 duration-1000">
        <div className="space-y-6 text-center">
           <div className="text-[12px] text-cyan-500 font-black uppercase tracking-[0.4em]">{article.source.name} • {new Date(article.publishedAt).toLocaleDateString('pt-BR')}</div>
           <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-tight text-white drop-shadow-2xl">{article.title}</h1>
        </div>
        <div className="aspect-video w-full rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
           {article.urlToImage && <img src={article.urlToImage} className="w-full h-full object-cover" />}
        </div>
        <div className="space-y-8 max-w-2xl mx-auto">
          <p className="text-2xl text-secondary leading-relaxed font-medium italic">"{article.description}"</p>
          <div className="h-1 w-20 bg-cyan-500/50 rounded-full mx-auto" />
          <p className="text-zinc-400 text-lg leading-relaxed">Conteúdo imersivo gerado pelo TrackFeed AI.</p>
          <Button onClick={() => window.open(article.url, '_blank')} className="w-full h-16 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl">Ler no site original</Button>
        </div>
      </div>
    </div>
  )
}

function SkeletonGrid({ isExplore }: { isExplore: boolean }) {
  const count = isExplore ? 8 : 6;
  return (
    <div className="animate-pulse">
      <div className="h-10 w-64 bg-zinc-900 rounded-2xl mb-4" /><div className="h-4 w-96 bg-zinc-900/50 rounded-xl mb-12" />
      <div className={`grid gap-10 ${isExplore ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="flex flex-col gap-6"><div className="aspect-[16/10] bg-zinc-900 rounded-[2rem]" /><div className="space-y-3"><div className="h-3 w-1/4 bg-zinc-900 rounded-full" /><div className="h-6 w-full bg-zinc-900 rounded-xl" /></div></div>
        ))}
      </div>
    </div>
  );
}
