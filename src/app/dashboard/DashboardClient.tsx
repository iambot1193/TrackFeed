'use client'

import { useState, useEffect, useRef, useTransition } from "react";
import {
  X, AlertCircle, Loader2, SearchX, Globe, Filter,
  BookmarkIcon, ArrowRight, ShieldCheck, User, LogOut,
  Settings, Camera, BarChart2, Plus, Zap, CheckCircle2, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { NewsArticle } from "@/lib/news";
import { BackgroundEffects } from "./BackgroundEffects";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { FilterPopover } from "./FilterPopover";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import {
  toggleFavorite, addToHistory, updateUserProfile, logout,
  updateUserPreferences, deleteAccountAction, getApiStatusAction,
  summarizeNewsAction, resendVerificationEmailAction, verifyEmailInDashboardAction
} from "./actions";

const ALL_POSSIBLE_CATEGORIES = [
  { slug: 'general', label: 'Geral' },
  { slug: 'technology', label: 'Tecnologia' },
  { slug: 'business', label: 'Negócios' },
  { slug: 'health', label: 'Saúde' },
  { slug: 'science', label: 'Ciência' },
  { slug: 'sports', label: 'Esportes' },
  { slug: 'games', label: 'Games' },
  { slug: 'crypto', label: 'Cripto' },
  { slug: 'movies', label: 'Cinema' },
  { slug: 'music', label: 'Música' }
];

const tagColors: any = {
  general: 'bg-zinc-500',
  technology: 'bg-cyan-500',
  business: 'bg-emerald-500',
  health: 'bg-red-500',
  science: 'bg-purple-500',
  sports: 'bg-orange-500',
  games: 'bg-green-500',
  crypto: 'bg-yellow-500',
  movies: 'bg-rose-500',
  music: 'bg-indigo-500'
};

export default function DashboardClient({
  initialNews,
  user,
  interestCount,
  currentFilters,
  availableCategories,
  favoriteUrls,
  apiStatus,
  historyStats
}: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(currentFilters.tab || 'home');
  const [newsList, setNewsList] = useState<NewsArticle[]>(initialNews);
  const [favorites, setFavorites] = useState<string[]>(favoriteUrls || []);
  const [history, setHistory] = useState<string[]>(user.history || []);
  const [localSearch, setLocalSearch] = useState(currentFilters.q || '');
  const [localCategories, setLocalCategories] = useState<string[]>(
    typeof currentFilters.categories === 'string'
      ? currentFilters.categories.split(',')
      : Array.isArray(currentFilters.categories) ? currentFilters.categories : []
  );
  const [localLangs, setLocalLangs] = useState<string[]>(
    typeof currentFilters.lang === 'string'
      ? currentFilters.lang.split(',')
      : Array.isArray(currentFilters.lang) ? currentFilters.lang : ['pt']
  );
  const [isPending, startTransition] = useTransition();
  const [scrolled, setScrolled] = useState(false);
  const [visibleRows, setVisibleRows] = useState(3);
  const [showMainPopover, setShowMainPopover] = useState(false);
  const [showHeaderPopover, setShowHeaderPopover] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [gridColumns, setGridColumns] = useState<3 | 4>(3);
  const visibleCount = visibleRows * gridColumns;

  // Profile state
  const [profileName, setProfileName] = useState(user.name);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(user.avatarUrl || "");
  const [profileCategories, setProfileCategories] = useState<string[]>(user.interests || []);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Verify modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResendingInModal, setIsResendingInModal] = useState(false);
  const [modalNotify, setModalNotify] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [userIsVerifiedState, setUserIsVerifiedState] = useState(user.isVerified);

  // Modal password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");

  // Modal email states
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // Premium toast notification state
  const [showHistoryStats, setShowHistoryStats] = useState(false);
  const [savedPreviousCategories, setSavedPreviousCategories] = useState<string[]>([]);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: "",
    type: "info"
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // AI Smart Digest states
  const [activeSummary, setActiveSummary] = useState<{ title: string; summary: string } | null>(null);
  const [loadingSummaryUrl, setLoadingSummaryUrl] = useState<string | null>(null);

  const handleSummarize = async (article: NewsArticle) => {
    if (loadingSummaryUrl) return;
    setLoadingSummaryUrl(article.url);
    try {
      const res = await summarizeNewsAction(article.title, article.description || "");
      if (res.error) {
        showToast(res.error, "error");
      } else if (res.summary) {
        setActiveSummary({ title: article.title, summary: res.summary });
      }
    } catch (err) {
      showToast("Falha ao gerar resumo com IA.", "error");
    } finally {
      setLoadingSummaryUrl(null);
    }
  };

  const [dismissedAlert, setDismissedAlert] = useState(false);

  const mainPopoverRef = useRef<HTMLDivElement>(null);
  const headerPopoverRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const handleClickOutside = (event: MouseEvent) => {
      if (mainPopoverRef.current && !mainPopoverRef.current.contains(event.target as Node)) setShowMainPopover(false);
      if (headerPopoverRef.current && !headerPopoverRef.current.contains(event.target as Node)) setShowHeaderPopover(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const lastTabRef = useRef(currentFilters.tab);

  // SINCRONIZAÇÃO CRÍTICA: Atualiza a lista quando os dados do servidor mudam
  useEffect(() => {
    const tabChanged = lastTabRef.current !== currentFilters.tab;
    lastTabRef.current = currentFilters.tab;

    if (currentFilters.page === 1 || tabChanged) {
      setNewsList(initialNews);
      setVisibleRows(3);
    } else {
      setNewsList(prev => {
        const seen = new Set();
        const combined = [...prev, ...initialNews];
        return combined.filter(item => {
          if (seen.has(item.url)) return false;
          seen.add(item.url);
          return true;
        });
      });
    }
  }, [initialNews, currentFilters.tab, currentFilters.page]);

  const updateFilters = (key: string, value: any) => {
    const params = new URLSearchParams(searchParams.toString());

    if (key === 'categories') {
      const current = localCategories;
      let updated: string[] = [];

      if (value === 'general') {
        if (current.includes('general')) {
          // Desativando 'general' -> Restaura o estado anterior das categorias
          updated = savedPreviousCategories.length > 0 ? savedPreviousCategories : [];
          setSavedPreviousCategories([]);
        } else {
          // Ativando 'general' -> Salva a seleção atual (apenas se a memória estiver vazia) e ativa APENAS 'general'
          if (savedPreviousCategories.length === 0) {
            setSavedPreviousCategories(current.filter(c => c !== 'general'));
          }
          updated = ['general'];
        }
      } else {
        // Alternando outra categoria individual
        // Se 'general' estava ativo, removemos ele
        const filteredCurrent = current.filter(c => c !== 'general');
        updated = filteredCurrent.includes(value)
          ? filteredCurrent.filter(c => c !== value)
          : [...filteredCurrent, value];

        // Se TODAS as categorias específicas forem ativadas, colapsa para 'general'
        const allSpecificSlugs = ['technology', 'business', 'health', 'science', 'sports', 'games', 'crypto', 'movies', 'music'];
        const hasAllGlobal = allSpecificSlugs.every(slug => updated.includes(slug));

        if (hasAllGlobal) {
          // Quando consolidado automaticamente, salvamos os filtros anteriores (sem a última selecionada) para que ao desativar o Geral volte a eles!
          setSavedPreviousCategories(filteredCurrent);
          updated = ['general'];
        }
      }

      if (updated.length === 0) {
        updated = ['general'];
        setSavedPreviousCategories([]);
      }

      if (updated.length > 0 && !updated.includes('general')) params.set('categories', updated.join(','));
      else params.delete('categories');
      setLocalCategories(updated);
    } else if (key === 'lang') {
      const current = localLangs;
      const updated = current.includes(value)
        ? (current.length > 1 ? current.filter(l => l !== value) : [value]) // Não permite ficar vazio, mantém o atual
        : [...current, value];

      params.set('lang', updated.join(','));
      setLocalLangs(updated);
    } else if (key === 'tab') {
      setActiveTab(value);
      params.set('tab', value);
    } else if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    if (key !== 'page') params.set('page', '1');
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`, { scroll: false });
    });
  };

  const handleLoadMore = () => {
    const nextRows = visibleRows + 3;
    const nextVisibleCount = nextRows * gridColumns;
    if (nextVisibleCount <= newsList.length) {
      setVisibleRows(nextRows);
    } else {
      setVisibleRows(nextRows);
      updateFilters('page', currentFilters.page + 1);
    }
  };

  const handleFavorite = async (article: NewsArticle) => {
    const updated = favorites.includes(article.url) ? favorites.filter(url => url !== article.url) : [...favorites, article.url];
    setFavorites(updated);

    if (activeTab === 'explore') {
      setNewsList(prev => prev.filter(item => item.url !== article.url));
    }

    await toggleFavorite({
      title: article.title,
      url: article.url,
      urlToImage: article.urlToImage,
      sourceName: article.source.name,
      publishedAt: article.publishedAt
    });
    // Força atualização dos dados do servidor
    router.refresh();
  };

  const handleArticleClick = async (article: NewsArticle) => {
    if (!history.includes(article.url)) {
      setHistory([...history, article.url]);
      await addToHistory({
        title: article.title,
        url: article.url,
        imageUrl: article.urlToImage
      });
      // Sincroniza com o servidor imediatamente
      router.refresh();
    }

    window.open(article.url, '_blank');
  };

  const handleSavePersonalData = async () => {
    if (!profileName.trim()) {
      showToast("Seu nome não pode estar vazio.", "error");
      return;
    }
    setIsSavingProfile(true);
    const res = await updateUserProfile({
      name: profileName,
      avatarUrl: profileAvatarUrl
    });
    setIsSavingProfile(false);
    if (res?.error) {
      showToast(res.error, "error");
    } else {
      showToast("Dados pessoais atualizados com sucesso!", "success");
      router.refresh();
    }
  };

  const handleSaveInterests = async () => {
    setIsSavingProfile(true);
    const res = await updateUserProfile({
      interests: profileCategories
    });
    setIsSavingProfile(false);
    if (res?.error) {
      showToast(res.error, "error");
    } else {
      showToast("Seus interesses foram atualizados com sucesso!", "success");
      router.refresh();
    }
  };

  const handleOpenVerifyModal = async (e: React.MouseEvent) => {
    e.preventDefault();
    setVerifyCode("");
    setVerifyError("");
    setVerifySuccess(false);
    setShowVerifyModal(true);
    setIsResendingInModal(true);
    
    // Automatically trigger initial PIN email when opening the modal!
    const result = await resendVerificationEmailAction();
    setIsResendingInModal(false);
    if (result.error) {
      setVerifyError(result.error);
    } else {
      setModalNotify({ type: 'success', message: "Código enviado! Verifique sua caixa de entrada." });
      setTimeout(() => setModalNotify(null), 4000);
    }
  };

  const handleVerifyModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.length < 6) {
      setVerifyError("Digite os 6 dígitos do código.");
      return;
    }
    setVerifyError("");
    setIsVerifying(true);
    
    const result = await verifyEmailInDashboardAction(verifyCode);
    setIsVerifying(false);
    
    if (result.error) {
      setVerifyError(result.error);
    } else {
      setVerifySuccess(true);
      setUserIsVerifiedState(true);
      setModalNotify({ type: 'success', message: "E-mail verificado com sucesso!" });
      setTimeout(() => {
        setShowVerifyModal(false);
        setVerifySuccess(false);
        setVerifyCode("");
      }, 3000);
    }
  };

  const handleResendInModal = async () => {
    setVerifyError("");
    setIsResendingInModal(true);
    const result = await resendVerificationEmailAction();
    setIsResendingInModal(false);
    
    if (result.error) {
      setVerifyError(result.error);
    } else {
      setModalNotify({ type: 'success', message: "Novo código enviado com sucesso!" });
      setTimeout(() => setModalNotify(null), 4000);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast("Por favor, preencha todos os campos de senha.", "error");
      return;
    }

    const passwordSchema = z.string()
      .min(6, "A nova senha deve ter no mínimo 6 caracteres")
      .max(50, "A nova senha é muito longa");

    const result = passwordSchema.safeParse(newPassword);
    if (!result.success) {
      showToast(result.error.errors[0].message, "error");
      return;
    }

    setIsSavingProfile(true);
    const res = await updateUserProfile({
      password: newPassword,
      currentPassword: currentPassword
    });
    setIsSavingProfile(false);

    if (res?.error) {
      showToast(res.error, "error");
    } else {
      showToast("Senha alterada com sucesso!", "success");
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !currentPassword) {
      showToast("Por favor, preencha o novo e-mail e sua senha atual para confirmar.", "error");
      return;
    }

    const emailSchema = z.string().email("Por favor, digite um e-mail válido.");
    const result = emailSchema.safeParse(newEmail);
    if (!result.success) {
      showToast(result.error.errors[0].message, "error");
      return;
    }

    setIsSavingProfile(true);
    const res = await updateUserProfile({
      email: newEmail,
      currentPassword: currentPassword
    });
    setIsSavingProfile(false);

    if (res?.error) {
      showToast(res.error, "error");
    } else {
      showToast("E-mail atualizado com sucesso!", "success");
      setIsChangingEmail(false);
      setNewEmail("");
      setCurrentPassword("");
      router.refresh();
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmPassword) {
      showToast("Por favor, digite sua senha para confirmar a exclusão da conta.", "error");
      return;
    }

    const confirm = window.confirm("ATENÇÃO TOTAL: Esta ação excluirá permanentemente o seu perfil, favoritos e histórico do TrackFeed de forma irreversível. Tem certeza de que deseja prosseguir?");
    if (!confirm) return;

    setIsSavingProfile(true);
    const res = await deleteAccountAction(deleteConfirmPassword);
    setIsSavingProfile(false);

    if (res?.error) {
      showToast(res.error, "error");
    } else {
      showToast("Sua conta foi excluída com sucesso. Sentiremos sua falta!", "success");
      logout();
    }
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#020202]' : 'bg-[#f8fafc]'} font-sans selection:bg-cyan-500/30 transition-colors duration-700 overflow-x-hidden relative`}>
      <BackgroundEffects />

      <Sidebar
        activeTab={activeTab}
        updateFilters={updateFilters}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        logout={logout}
        lastUpdated={apiStatus?.lastUpdated}
      />

      <Header
        scrolled={scrolled}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        localSearch={localSearch}
        setLocalSearch={setLocalSearch}
        updateFilters={updateFilters}
        showTagPopover={showHeaderPopover}
        setShowTagPopover={(val: boolean) => {
          setShowHeaderPopover(val);
          if (val) setShowMainPopover(false);
        }}
        popoverRef={headerPopoverRef}
        ALL_POSSIBLE_CATEGORIES={ALL_POSSIBLE_CATEGORIES}
        localCategories={localCategories}
        localLangs={localLangs}
        user={user}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        userMenuRef={userMenuRef}
        setIsChangingPassword={setIsChangingPassword}
        logout={logout}
      />

      <main className="lg:pl-72 pt-22 pb-16 px-6 lg:px-8 relative z-10">
        {activeTab === 'profile' ? (
          <ProfileSection
            user={user}
            profileName={profileName}
            setProfileName={setProfileName}
            profileAvatarUrl={profileAvatarUrl}
            setProfileAvatarUrl={setProfileAvatarUrl}
            profileCategories={profileCategories}
            setProfileCategories={setProfileCategories}
            handleSavePersonalData={handleSavePersonalData}
            handleSaveInterests={handleSaveInterests}
            isSavingProfile={isSavingProfile}
            logout={logout}
            setIsChangingPassword={setIsChangingPassword}
            setIsDeletingAccount={setIsDeletingAccount}
            setIsChangingEmail={setIsChangingEmail}
            ALL_POSSIBLE_CATEGORIES={ALL_POSSIBLE_CATEGORIES}
            userIsVerifiedState={userIsVerifiedState}
            handleOpenVerifyModal={handleOpenVerifyModal}
          />
        ) : (
          <div className="max-w-6xl mx-auto space-y-10">
            <header className="flex items-end justify-between mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-cyan-500 font-black text-xs uppercase tracking-[0.3em]">
                  <div className="w-8 h-[1px] bg-cyan-500" />
                  {activeTab === 'home' ? 'Seu Feed Pessoal' : activeTab === 'explore' ? 'Tendências Mundiais' : activeTab === 'history' ? 'Sua Jornada de Leitura' : 'Seus Favoritos'}
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                  {activeTab === 'home' ? 'Meu Feed' : activeTab === 'explore' ? 'Descobrir' : activeTab === 'history' ? 'Histórico' : 'Favoritos'}
                  <span className="text-cyan-500">.</span>
                </h1>
              </div>

              <div className="flex items-center gap-3 pb-1">
                {/* Botão Premium de Alternar Grid (3 vs 4 Colunas) */}
                <button
                  onClick={() => setGridColumns(prev => prev === 3 ? 4 : 3)}
                  title={gridColumns === 3 ? "Mudar para visualização compacta (4 colunas)" : "Mudar para visualização padrão (3 colunas)"}
                  className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all shadow-xl active:scale-95 group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="z-10 transition-transform duration-300 group-hover:scale-110 flex items-center justify-center">
                    {gridColumns === 3 ? (
                      <svg width="30" height="30" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-500">
                        <rect x="1.5" y="1.5" width="4" height="4" rx="1.2" fill="currentColor" />
                        <rect x="8" y="1.5" width="4" height="4" rx="1.2" fill="currentColor" />
                        <rect x="14.5" y="1.5" width="4" height="4" rx="1.2" fill="currentColor" />
                        <rect x="1.5" y="8" width="4" height="4" rx="1.2" fill="currentColor" />
                        <rect x="8" y="8" width="4" height="4" rx="1.2" fill="currentColor" />
                        <rect x="14.5" y="8" width="4" height="4" rx="1.2" fill="currentColor" />
                        <rect x="1.5" y="14.5" width="4" height="4" rx="1.2" fill="currentColor" />
                        <rect x="8" y="14.5" width="4" height="4" rx="1.2" fill="currentColor" />
                        <rect x="14.5" y="14.5" width="4" height="4" rx="1.2" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg width="32" height="24" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-400">
                        <rect x="1.5" y="2" width="3.5" height="3.5" rx="1" fill="currentColor" />
                        <rect x="6.5" y="2" width="3.5" height="3.5" rx="1" fill="currentColor" />
                        <rect x="11.5" y="2" width="3.5" height="3.5" rx="1" fill="currentColor" />
                        <rect x="16.5" y="2" width="3.5" height="3.5" rx="1" fill="currentColor" />
                        <rect x="1.5" y="9.5" width="3.5" height="3.5" rx="1" fill="currentColor" />
                        <rect x="6.5" y="9.5" width="3.5" height="3.5" rx="1" fill="currentColor" />
                        <rect x="11.5" y="9.5" width="3.5" height="3.5" rx="1" fill="currentColor" />
                        <rect x="16.5" y="9.5" width="3.5" height="3.5" rx="1" fill="currentColor" />
                      </svg>
                    )}
                  </div>
                </button>

                <div className="relative" ref={mainPopoverRef}>
                  <button
                    onClick={() => {
                      const next = !showMainPopover;
                      setShowMainPopover(next);
                      if (next) setShowHeaderPopover(false);
                    }}
                    className={`h-12 px-6 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl ${showMainPopover ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                      }`}
                  >
                    <Filter size={16} className={showMainPopover ? 'text-white' : 'text-cyan-500'} />
                    Linguagem & Filtros
                  </button>
                  {showMainPopover && (
                    <FilterPopover
                      categories={ALL_POSSIBLE_CATEGORIES}
                      selected={localCategories}
                      onUpdate={(cat: any) => updateFilters('categories', cat)}
                      selectedLang={localLangs}
                      onUpdateLang={(lang: any) => updateFilters('lang', lang)}
                    />
                  )}
                </div>
              </div>
            </header>

            {/* AVISO DE COTAS ESTOURADAS (Luxury Cyber-Glass Red Warning) */}
            {!dismissedAlert && (apiStatus?.newsApiRemaining <= 0 && apiStatus?.gnewsQuota <= 0) && (
              <div className="relative overflow-hidden p-6 rounded-[2rem] border border-red-500/30 bg-gradient-to-r from-red-950/20 to-purple-950/15 backdrop-blur-3xl animate-in fade-in slide-in-from-top-6 duration-500 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_50px_rgba(239,68,68,0.1)]">
                {/* Nebula Aura Backdrops */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-4 text-left">
                  <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0 shadow-lg animate-pulse">
                    <AlertCircle size={22} className="text-red-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider italic">Cotas de API Estouradas</h4>
                    <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                      O limite de buscas gratuitas diárias das APIs em Português foi atingido. Ative o idioma <span className="text-red-400 font-bold">Inglês</span> no botão <span className="text-red-400 font-bold">"Linguagem & Filtros"</span> para utilizar o sistema de busca secundário (The Guardian API) e continuar navegando normalmente!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button 
                    onClick={() => setDismissedAlert(true)}
                    className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500 hover:border-red-400 hover:text-white text-white/60 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {(() => {
              const userInterests = ALL_POSSIBLE_CATEGORIES.filter((cat: any) => 
                profileCategories.includes(cat.slug)
              );
              const categoriesToRender = userInterests.length > 0 ? userInterests : ALL_POSSIBLE_CATEGORIES;
              return (
                <div className="flex items-center gap-3 overflow-x-auto pt-4 pb-6 mt-2 mb-4 scrollbar-none">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2 pr-3 border-r border-white/10 shrink-0">
                    <Settings size={12} className="text-cyan-500 animate-pulse" />
                    Filtro Rápido
                  </span>
                  <div className="flex items-center gap-3">
                    {categoriesToRender.map((cat: any) => {
                      const isSelected = localCategories.includes(cat.slug);
                      return (
                        <button
                          key={cat.slug}
                          onClick={() => updateFilters('categories', cat.slug)}
                          className={`h-9 px-4 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all duration-300 shrink-0 border cursor-pointer ${
                            isSelected 
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]' 
                              : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {(activeTab === 'history' || activeTab === 'favs') && historyStats && (
              <div className="space-y-0">
                <div className="flex flex-col items-start ml-0">
                  <button
                    onClick={() => setShowHistoryStats(!showHistoryStats)}
                    className={`h-9 px-4 flex items-center gap-3 text-[9px] font-black uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
                      showHistoryStats 
                        ? 'bg-[#0c0814] border-white/10 text-purple-400 rounded-t-[1.2rem] rounded-b-none border-b-0 relative z-20 translate-y-[1px]' 
                        : 'bg-white/5 border-white/10 text-white rounded-2xl hover:bg-white/10'
                    }`}
                  >
                    <BarChart2 size={12} className={showHistoryStats ? 'text-purple-400 animate-pulse' : 'text-cyan-500'} />
                    {showHistoryStats 
                      ? (activeTab === 'history' ? 'Ocultar Estatísticas de Leitura' : 'Ocultar Estatísticas de Favoritos')
                      : (activeTab === 'history' ? 'Ver Estatísticas de Leitura' : 'Ver Estatísticas de Favoritos')}
                  </button>
                </div>

                {showHistoryStats && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
                    <HistoryStats stats={historyStats} isFavs={activeTab === 'favs'} />
                  </div>
                )}
              </div>
            )}

            {/* CONTAINER COM BLINDAGEM DE LENTIDÃO E FEEDBACK DE CARREGAMENTO */}
            <div className="relative min-h-[400px]">
              {isPending && (
                <div className="absolute inset-0 z-50 bg-[#020202]/60 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center gap-6 transition-all duration-300 animate-in fade-in">
                  <div className="relative flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full border-t-2 border-r-2 border-cyan-500 animate-spin" />
                    <div className="absolute h-10 w-10 rounded-full border-b-2 border-l-2 border-purple-500 animate-spin-reverse" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400 animate-pulse italic drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    Sincronizando Radar...
                  </span>
                </div>
              )}

              {newsList.length > 0 ? (
                <>
                  {/* EXPLORE HERO BANNER: Notícia Grande Destaque no topo da aba Descobrir */}
                  {activeTab === 'explore' && newsList[0] && (
                    <div 
                      onClick={() => handleArticleClick(newsList[0])}
                      className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6 lg:p-8 flex flex-col lg:flex-row gap-8 shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:border-cyan-500/50 hover:shadow-[0_40px_100px_rgba(6,182,212,0.15)] cursor-pointer mb-10 overflow-hidden relative ${isPending ? 'opacity-30 blur-[2px]' : ''}`}
                    >
                      {/* Cinematic effects */}
                      <div className="absolute inset-0 bg-grid-dots opacity-[0.1] mix-blend-overlay pointer-events-none" />
                      <div className="absolute top-[-50%] right-[-20%] w-[50vw] h-[50vw] bg-cyan-500/[0.04] rounded-full blur-[100px] pointer-events-none group-hover:bg-cyan-500/[0.07] transition-colors" />
                      <div className="absolute bottom-[-50%] left-[-20%] w-[50vw] h-[50vw] bg-purple-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
                      
                      {/* Image container */}
                      <div className="w-full lg:w-1/2 aspect-[16/10] lg:aspect-auto rounded-2xl overflow-hidden relative border border-white/5 bg-zinc-950 shrink-0 min-h-[220px] lg:min-h-[300px]">
                        <img 
                          src={newsList[0].urlToImage || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800"} 
                          alt={newsList[0].title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                        <div className="absolute top-4 left-4 h-7 px-3.5 rounded-lg bg-cyan-500 text-black font-black uppercase text-[8px] tracking-[0.2em] flex items-center justify-center shadow-lg">
                          🔥 Destaque Principal
                        </div>
                      </div>

                      {/* Text content */}
                      <div className="flex flex-col justify-between py-2 space-y-6 flex-1">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="h-6 px-3 rounded-lg bg-white/5 border border-white/10 text-white/60 font-black uppercase text-[8px] tracking-[0.15em] flex items-center">
                              {newsList[0].source.name}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                              {newsList[0].publishedAt ? new Date(newsList[0].publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
                            </span>
                          </div>

                          <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase italic leading-tight group-hover:text-cyan-400 transition-colors">
                            {newsList[0].title}
                          </h2>

                          <p className="text-xs md:text-sm text-zinc-400 font-medium leading-relaxed line-clamp-3 lg:line-clamp-4">
                            {newsList[0].description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2 text-cyan-400/80 font-black uppercase text-[9px] tracking-widest group-hover:text-cyan-400 transition-all">
                            <span>Abrir Matéria Completa</span>
                            <ArrowRight size={14} className="transition-transform group-hover:translate-x-2 duration-300" />
                          </div>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFavorite(newsList[0]);
                            }}
                            className={`h-10 w-10 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                              favorites.includes(newsList[0].url)
                                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <BookmarkIcon size={14} fill={favorites.includes(newsList[0].url) ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`grid grid-cols-1 md:grid-cols-2 ${gridColumns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-6 transition-all duration-500 ${isPending ? 'opacity-30 blur-[2px]' : ''}`}>
                    {newsList.slice(activeTab === 'explore' ? 1 : 0, (activeTab === 'home' || activeTab === 'explore') ? (activeTab === 'explore' ? visibleCount + 1 : visibleCount) : 999999).map((article, idx) => (
                      <PremiumNewsCard
                        key={article.url}
                        article={article}
                        isFavorite={favorites.includes(article.url)}
                        onFavorite={() => handleFavorite(article)}
                        onClick={() => handleArticleClick(article)}
                        gridColumns={gridColumns}
                      />
                    ))}
                  </div>

                  {/* BOTÃO CARREGAR MAIS (Apenas nas abas que suportam paginação) */}
                  {(activeTab === 'home' || activeTab === 'explore') && (
                    <div className="mt-20 flex flex-col items-center justify-center pb-20 gap-4">
                      {isPending ? (
                        <div className="flex flex-col items-center gap-3 animate-pulse">
                          <Loader2 className="animate-spin text-cyan-500" size={32} />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/80">Buscando notícias no radar...</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleLoadMore}
                          className="group relative h-24 w-24 rounded-[2.5rem] bg-white/[0.03] border border-white/10 flex items-center justify-center transition-all hover:scale-110 hover:bg-cyan-500 hover:border-cyan-400 active:scale-95 shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer"
                        >
                          <Plus size={32} className="text-white group-hover:rotate-90 transition-transform duration-500" />
                          <div className="absolute inset-0 rounded-[inherit] bg-cyan-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : isPending ? (
                <NewsSkeletonGrid gridColumns={gridColumns} />
              ) : (
                <EmptyState title="Nenhuma notícia encontrada" description="Tente ajustar seus filtros ou pesquisar por outro termo." />
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL REDEFINIR ACESSO / SENHA */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md p-10 rounded-[3rem] bg-zinc-950 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white uppercase tracking-wider italic">Redefinir Senha</h3>
              <button
                onClick={() => { setIsChangingPassword(false); setCurrentPassword(""); setNewPassword(""); }}
                className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white/60 font-black text-[10px] uppercase">Senha Atual</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-black/40 border-white/10 text-white h-14 rounded-2xl focus:border-cyan-500/50"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 font-black text-[10px] uppercase">Nova Senha</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-black/40 border-white/10 text-white h-14 rounded-2xl focus:border-cyan-500/50"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              {newPassword.length > 0 && (
                <div className="p-3 text-[9px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-xl animate-pulse italic flex items-center gap-2">
                  <ShieldCheck size={14} className="text-cyan-400" />
                  💡 CLIQUE EM "CONFIRMAR" ABAIXO PARA REDEFINIR E SALVAR SUA NOVA SENHA!
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => { setIsChangingPassword(false); setCurrentPassword(""); setNewPassword(""); }}
                className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white font-black uppercase rounded-2xl border border-white/5 transition-all"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdatePassword}
                disabled={isSavingProfile}
                className="flex-1 h-14 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase rounded-2xl shadow-xl transition-all"
              >
                {isSavingProfile ? <Loader2 className="animate-spin h-5 w-5" /> : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTERAR EMAIL */}
      {isChangingEmail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md p-10 rounded-[3rem] bg-zinc-950 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white uppercase tracking-wider italic">Alterar E-mail</h3>
              <button
                onClick={() => { setIsChangingEmail(false); setNewEmail(""); setCurrentPassword(""); }}
                className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white/60 font-black text-[10px] uppercase">Novo E-mail</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="bg-black/40 border-white/10 text-white h-14 rounded-2xl focus:border-cyan-500/50"
                  placeholder="novo.email@exemplo.com"
                />
              </div>
              {newEmail.length > 0 && (
                <div className="p-3 text-[9px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-xl animate-pulse italic flex items-center gap-2">
                  <ShieldCheck size={14} className="text-cyan-400" />
                  💡 CLIQUE EM "CONFIRMAR" ABAIXO PARA ALTERAR E SALVAR SEU NOVO E-MAIL!
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-white/60 font-black text-[10px] uppercase">Senha Atual</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-black/40 border-white/10 text-white h-14 rounded-2xl focus:border-cyan-500/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => { setIsChangingEmail(false); setNewEmail(""); setCurrentPassword(""); }}
                className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white font-black uppercase rounded-2xl border border-white/5 transition-all"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateEmail}
                disabled={isSavingProfile}
                className="flex-1 h-14 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase rounded-2xl shadow-xl transition-all"
              >
                {isSavingProfile ? <Loader2 className="animate-spin h-5 w-5" /> : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR CONTA */}
      {isDeletingAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md p-10 rounded-[3rem] bg-zinc-950 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-red-500 uppercase tracking-wider italic">Excluir Conta</h3>
              <button
                onClick={() => { setIsDeletingAccount(false); setDeleteConfirmPassword(""); }}
                className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold leading-relaxed space-y-2">
              <p>⚠️ ATENÇÃO: Esta ação é definitiva e removerá permanentemente:</p>
              <ul className="list-disc list-inside space-y-1 text-red-300/80 pl-2">
                <li>Seu perfil e dados pessoais</li>
                <li>Seu feed e histórico de leitura</li>
                <li>Todas as notícias salvas nos favoritos</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 font-black text-[10px] uppercase">Confirme sua Senha</Label>
              <Input
                type="password"
                value={deleteConfirmPassword}
                onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                className="bg-black/40 border-white/10 text-white h-14 rounded-2xl focus:border-red-500/50"
                placeholder="Digite sua senha de acesso"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => { setIsDeletingAccount(false); setDeleteConfirmPassword(""); }}
                className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white font-black uppercase rounded-2xl border border-white/5 transition-all"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={isSavingProfile}
                className="flex-1 h-14 bg-red-600 hover:bg-red-500 text-white font-black uppercase rounded-2xl shadow-xl shadow-red-600/25 transition-all"
              >
                {isSavingProfile ? <Loader2 className="animate-spin h-5 w-5" /> : "Excluir Conta"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL VERIFIQUE SEU EMAIL */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
          
          {/* LOCAL MODAL TOAST NOTIFICATION */}
          {modalNotify && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-[2rem] border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl flex items-center gap-4 animate-in slide-in-from-top-8 duration-500">
              <CheckCircle2 size={20} className="animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">{modalNotify.message}</span>
            </div>
          )}

          <div className="w-full max-w-md p-10 rounded-[3rem] bg-zinc-950 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative space-y-8 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => { setShowVerifyModal(false); setVerifyCode(""); setVerifyError(""); }}
              className="absolute top-6 right-6 h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            {verifySuccess ? (
              <div className="text-center animate-in zoom-in-95 duration-500 py-6">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 animate-pulse">
                    <CheckCircle2 size={40} className="animate-in slide-in-from-bottom-2 duration-700" />
                  </div>
                </div>
                <h3 className="text-2xl font-black tracking-tighter uppercase italic bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-4">
                  Verificação Feita com Sucesso
                </h3>
                <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest leading-relaxed">
                  Seu e-mail foi confirmado! <br/>
                  <span className="text-emerald-400/80 animate-pulse">Retornando ao perfil...</span>
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 text-center select-none pt-4">
                  <div className="flex justify-center mb-2">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(147,51,234,0.3)]">
                      <Mail size={24} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase italic bg-gradient-to-br from-white via-zinc-100 to-purple-400/50 bg-clip-text text-transparent">Verifique seu E-mail</h3>
                  <p className="text-zinc-200 font-black uppercase text-[10px] tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
                    Enviamos um código de 6 dígitos para o endereço: <br/>
                    <span className="text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full mt-2 inline-block border border-purple-500/20">Dono do Site / Desenvolvedor</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyModalSubmit} className="space-y-6">
                  {verifyError && (
                    <div className="flex items-center gap-2 p-3 text-xs font-black uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in">
                      <AlertCircle size={14} />
                      {verifyError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <input 
                        type="text" 
                        value={verifyCode} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setVerifyCode(val);
                        }}
                        placeholder="0 0 0 0 0 0"
                        className="w-full h-16 text-center text-3xl font-black tracking-[0.5em] bg-black/40 border border-zinc-800/50 text-white focus:border-purple-500/50 rounded-2xl transition-all shadow-inner placeholder:text-zinc-800 focus:outline-none" 
                        required
                        autoFocus
                      />
                    </div>
                    <p className="text-[10px] text-center text-zinc-300 uppercase tracking-widest font-black italic">Digite o código de confirmação</p>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isVerifying || verifyCode.length < 6}
                    className="w-full h-14 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:brightness-110 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_20px_40px_rgba(147,51,234,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 select-none rounded-2xl cursor-pointer"
                  >
                    {isVerifying ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle2 className="mr-2" size={16} />}
                    {isVerifying ? "Verificando..." : "Confirmar E-mail"}
                  </Button>
                </form>

                <div className="text-center pt-2">
                  <button 
                    type="button"
                    onClick={handleResendInModal}
                    disabled={isResendingInModal}
                    className="text-purple-500 hover:text-purple-400 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer bg-transparent border-none"
                  >
                    {isResendingInModal ? "Reenviando..." : "Não recebeu? Reenviar e-mail"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* PREMIUM GLASS TOAST NOTIFICATION */}
      <div 
        className={`fixed bottom-8 right-8 z-[200] flex items-center gap-4 px-6 py-4 rounded-2xl bg-zinc-950/95 border backdrop-blur-xl shadow-2xl transition-all duration-500 transform ${
          toast.show 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-4 opacity-0 scale-95 pointer-events-none'
        } ${
          toast.type === 'success' 
            ? 'border-emerald-500/30 shadow-emerald-500/10' 
            : toast.type === 'error' 
              ? 'border-red-500/30 shadow-red-500/10' 
              : 'border-cyan-500/30 shadow-cyan-500/10'
        }`}
      >
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center border ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : toast.type === 'error' 
              ? 'bg-red-500/10 border-red-500/20 text-red-400' 
              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
        }`}>
          {toast.type === 'success' ? (
            <ShieldCheck size={18} />
          ) : toast.type === 'error' ? (
            <AlertCircle size={18} />
          ) : (
            <Globe size={18} />
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs font-black text-white uppercase tracking-wider">{toast.type === 'success' ? 'Sucesso' : toast.type === 'error' ? 'Erro' : 'Notificação'}</p>
          <p className="text-[11px] text-white/60 font-semibold mt-0.5">{toast.message}</p>
        </div>
        <button 
          onClick={() => setToast(prev => ({ ...prev, show: false }))}
          className="text-white/40 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// Sub-componentes auxiliares (Temporários aqui para garantir funcionamento)

function PremiumNewsCard({ article, isFavorite, onFavorite, onClick, gridColumns }: any) {
  const category = article.category || "general";
  const colorClass = tagColors[category] || "bg-zinc-700";

  return (
    <div className="group relative border border-white/5 bg-white/5 backdrop-blur-2xl rounded-[1.5rem] transition-all duration-700 flex flex-col h-full hover:border-white/20 hover:-translate-y-3 overflow-hidden cursor-pointer" onClick={onClick}>
      <div className={`relative aspect-[16/9] ${gridColumns === 4 ? 'm-2 rounded-[0.9rem]' : 'm-2.5 rounded-[1rem]'} overflow-hidden`}>
        <img src={article.urlToImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute top-3 right-3">
          <div className={`${colorClass} px-3 py-1.5 rounded-md text-[7.5px] font-black uppercase text-white shadow-xl`}>{category}</div>
        </div>
      </div>
      <div className={`flex flex-col flex-1 ${gridColumns === 4 ? 'p-4 gap-2.5' : 'p-5 gap-3.5'}`}>
        <div className="text-[9px] text-white/50 font-bold uppercase tracking-wider flex items-center gap-3">
          <span className="text-cyan-400">{article.source.name}</span>
          <span>{new Date(article.publishedAt).toLocaleDateString('pt-BR')}</span>
        </div>
        <h3 className={`font-black text-white line-clamp-2 leading-snug ${gridColumns === 4 ? 'text-xs md:text-sm' : 'text-sm md:text-base'}`}>{article.title}</h3>
        <p className={`leading-relaxed line-clamp-2 ${gridColumns === 4 ? 'text-[10px] text-white/30' : 'text-[11px] text-white/40'}`}>{article.description}</p>
        <div className="mt-auto pt-4 flex items-center justify-between">
          <button className={`font-black uppercase text-cyan-500 flex items-center gap-1.5 ${gridColumns === 4 ? 'text-[8px]' : 'text-[9px]'}`}>Ver Mais <ArrowRight size={12} /></button>
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite(); }}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-500 border ${isFavorite ? "bg-purple-500/20 border-purple-500/50 text-purple-400 shadow-xl scale-110" : "bg-white/5 border-white/10 text-zinc-600 hover:text-white"}`}
          >
            <BookmarkIcon size={14} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
}



function ProfileSection({
  user,
  profileName,
  setProfileName,
  profileAvatarUrl,
  setProfileAvatarUrl,
  profileCategories,
  setProfileCategories,
  handleSavePersonalData,
  handleSaveInterests,
  isSavingProfile,
  logout,
  setIsChangingPassword,
  setIsDeletingAccount,
  setIsChangingEmail,
  ALL_POSSIBLE_CATEGORIES,
  userIsVerifiedState,
  handleOpenVerifyModal
}: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem é muito grande! Selecione um arquivo de no máximo 2MB para garantir a velocidade do sistema.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setProfileAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-white/5 border border-white/5 backdrop-blur-2xl relative overflow-hidden group">
        <div
          onClick={handleAvatarClick}
          className="h-24 w-24 rounded-[2rem] bg-zinc-900 flex items-center justify-center overflow-hidden border border-cyan-500/20 shadow-2xl cursor-pointer relative group/avatar transition-all duration-500 hover:border-cyan-500 hover:scale-105"
        >
          {profileAvatarUrl ? (
            <img src={profileAvatarUrl} className="w-full h-full object-cover transition-opacity group-hover/avatar:opacity-40" onError={(e: any) => e.target.style.display = 'none'} />
          ) : (
            <span className="text-white text-2xl font-black group-hover/avatar:opacity-40">{user.name.substring(0, 2)}</span>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
            <Camera size={20} className="text-cyan-400" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-black text-white tracking-tighter">{user.name}</h2>
          {userIsVerifiedState ? (
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-1.5">
              <ShieldCheck size={12} className="text-emerald-400" /> 
              E-mail Verificado
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-400 text-[10px] font-black uppercase tracking-widest mt-1.5 flex-wrap">
              <AlertCircle size={12} className="text-rose-400 animate-pulse" /> 
              E-mail não verificado
              <button 
                onClick={handleOpenVerifyModal}
                className="ml-2 px-2.5 py-1 rounded-lg bg-cyan-500 text-black font-black uppercase text-[8px] tracking-wider flex items-center justify-center hover:bg-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-95 cursor-pointer border-none"
              >
                Verificar Agora
              </button>
            </div>
          )}
        </div>
        <div>
          <Button onClick={logout} className="bg-white/5 hover:bg-white/10 text-white h-12 w-12 rounded-xl transition-all border border-white/5 shadow-lg flex items-center justify-center"><LogOut size={20} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* CARD DADOS PESSOAIS */}
        <div className="p-5 md:p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-widest italic mb-2">Dados Pessoais</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-white/60 font-black text-[9px] uppercase tracking-wider">Seu Nome</Label>
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="bg-black/40 border-white/10 text-white h-10 rounded-xl focus:border-cyan-500/50 text-sm"
                  placeholder="Seu nome"
                />
              </div>
              {(profileName !== user.name || profileAvatarUrl !== (user.avatarUrl || "")) && (
                <div className="p-3 text-[9px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-xl animate-pulse italic flex items-center gap-2">
                  <ShieldCheck size={14} className="text-cyan-400" />
                  💡 VOCÊ ALTEROU SEUS DADOS! CLIQUE EM "SALVAR ALTERAÇÕES" ABAIXO PARA APLICAR.
                </div>
              )}
              <div className="pt-2 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => setIsChangingEmail(true)}
                  className="w-full h-9 bg-white/5 hover:bg-white/10 text-white font-black uppercase rounded-xl border border-white/5 transition-all text-[10px] tracking-wider"
                >
                  Alterar E-mail
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full h-9 bg-white/5 hover:bg-white/10 text-white font-black uppercase rounded-xl border border-white/5 transition-all text-[10px] tracking-wider"
                >
                  Alterar Senha
                </Button>
              </div>
            </div>
          </div>
          <Button onClick={handleSavePersonalData} disabled={isSavingProfile} className="w-full h-10 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase rounded-xl shadow-xl transition-all text-xs tracking-widest mt-4">Salvar Alterações</Button>
        </div>

        {/* CARD INTERESSES */}
        <div className="p-5 md:p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-widest italic mb-4">Interesses</h3>
            <div className="flex flex-wrap gap-2 items-start content-start">
              {ALL_POSSIBLE_CATEGORIES.map((cat: any) => (
                <button
                  key={cat.slug}
                  onClick={() => setProfileCategories((p: any) => p.includes(cat.slug) ? p.filter((c: any) => c !== cat.slug) : [...p, cat.slug])}
                  className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${profileCategories.includes(cat.slug) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-xl' : 'bg-white/5 border-white/5 text-zinc-600 hover:text-white'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSaveInterests} disabled={isSavingProfile} className="w-full h-10 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase rounded-xl shadow-xl shadow-purple-600/10 transition-all text-xs tracking-widest mt-4">Atualizar Interesses</Button>
        </div>
      </div>

      {/* CARD ZONA DE PERIGO (LARGURA TOTAL) */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-red-500/5 border border-red-500/10 hover:border-red-500/20 transition-all space-y-6 flex flex-col">
        <h3 className="text-lg font-black text-red-500 uppercase tracking-widest italic flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500" />
          Deletar Conta
        </h3>
        <p className="text-[11px] text-white/40 font-bold leading-relaxed">ATENÇÃO TOTAL: Esta ação excluirá permanentemente o seu perfil, favoritos e histórico do TrackFeed de forma irreversível.</p>
        <div className="pt-2">
          <Button onClick={() => setIsDeletingAccount(true)} className="w-full h-12 bg-red-950/20 hover:bg-red-600 text-red-500 hover:text-white font-black uppercase rounded-2xl border border-red-500/20 transition-all shadow-xl shadow-red-950/30">Excluir Conta Permanentemente</Button>
        </div>
      </div>
    </section>
  );
}

function NewsSkeletonGrid({ gridColumns }: { gridColumns: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${gridColumns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-8 animate-in fade-in duration-500`}>
      {[...Array(6)].map((_, i) => (
        <div 
          key={i} 
          className="h-[480px] rounded-[2.5rem] bg-white/5 border border-white/5 p-8 flex flex-col justify-between animate-pulse"
        >
          <div className="space-y-6">
            {/* Imagem Placeholder */}
            <div className="h-48 w-full bg-white/5 rounded-[2rem]" />
            
            {/* Linha Categoria / Data */}
            <div className="flex gap-4">
              <div className="h-4 w-16 bg-white/5 rounded-full" />
              <div className="h-4 w-24 bg-white/5 rounded-full" />
            </div>

            {/* Linha Título */}
            <div className="space-y-3">
              <div className="h-6 w-full bg-white/5 rounded-xl" />
              <div className="h-6 w-5/6 bg-white/5 rounded-xl" />
            </div>
          </div>

          {/* Linha Botão de Ação */}
          <div className="flex justify-between items-center pt-6">
            <div className="h-5 w-20 bg-white/5 rounded-full" />
            <div className="h-8 w-8 bg-white/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryStats({ stats, isFavs }: any) {
  const categories = Object.entries(stats.categories).sort((a: any, b: any) => b[1] - a[1]);
  const total = stats.totalRead;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10 animate-in fade-in slide-in-from-top-8 duration-1000">
      <div className="lg:col-span-2 p-5 md:p-6 rounded-tr-[2rem] rounded-bl-[2rem] rounded-br-[2rem] rounded-tl-none bg-white/5 border border-white/10 backdrop-blur-3xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white uppercase tracking-widest italic">Distribuição por Tópico</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {categories.map(([cat, count]: any) => (
            <div key={cat} className="space-y-1">
              <div className="flex justify-between text-[9px] font-black uppercase">
                <span className="text-white/60">{cat}</span>
                <span className="text-cyan-400">{Math.round((count / total) * 100)}%</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${tagColors[cat] || 'bg-zinc-500'} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(6,182,212,0.5)]`}
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] bg-gradient-to-br from-cyan-600/10 to-purple-600/5 border border-cyan-500/10 backdrop-blur-3xl p-5 md:p-6 flex flex-col justify-center items-center text-center space-y-1 shadow-2xl h-full">
        <div className="text-5xl font-black text-white tracking-tighter">{stats.totalClicks}</div>
        <div className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em]">Total de Interações</div>
      </div>
    </div>
  );
}

function EmptyState({ title, description }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in zoom-in duration-700">
      <SearchX size={64} className="text-zinc-800 mb-8" />
      <h3 className="text-3xl font-black uppercase text-zinc-500 tracking-tighter">{title}</h3>
      <p className="text-zinc-600 font-bold mt-2">{description}</p>
    </div>
  );
}
