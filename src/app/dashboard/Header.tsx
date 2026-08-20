'use client'

import { Search, Menu, Filter, User, Settings, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { FilterPopover } from "./FilterPopover";

export function Header({ 
  scrolled, isSidebarOpen, setSidebarOpen, localSearch, setLocalSearch, updateFilters, 
  showTagPopover, setShowTagPopover, popoverRef, ALL_POSSIBLE_CATEGORIES, localCategories, localLangs,
  user, showUserMenu, setShowUserMenu, userMenuRef, setIsChangingPassword, logout
}: any) {
  return (
    <header className={`fixed top-0 left-0 lg:left-72 right-0 z-[500] h-16 flex items-center px-6 lg:px-8 border-b border-white/[0.03] transition-all duration-300 ${scrolled ? 'bg-[#020202]/85 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'bg-transparent backdrop-blur-none'}`}>
      <div className="flex-1 flex items-center gap-6">
        <div className="lg:hidden p-3 hover:bg-white/5 rounded-2xl text-white cursor-pointer transition-all" onClick={() => setSidebarOpen(!isSidebarOpen)}>
          <Menu size={24} />
        </div>
        <div className="relative group w-full max-w-xl flex items-center gap-4">
          <div className="w-full max-w-md">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-400 transition-colors" size={20} />
            <Input
              placeholder="Pesquisar notícias no radar..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateFilters('q', localSearch)}
              className="w-full h-10 bg-white/[0.15] border-white/40 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:bg-white/[0.25] focus-visible:border-white rounded-2xl pl-16 pr-6 text-base font-black text-white placeholder:text-zinc-300 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1),0_10px_50px_rgba(0,0,0,0.8)] hover:bg-white/[0.2] hover:border-white/60"
            />
          </div>
          
          {/* FILTRO DINÂMICO NO HEADER (APARECE NO SCROLL) */}
          <div className="w-[200px] flex-shrink-0">
            {scrolled && (
              <div className="relative animate-in fade-in slide-in-from-right-4 duration-500" ref={popoverRef}>
                <button 
                  onClick={() => setShowTagPopover(!showTagPopover)} 
                  className={`h-10 w-full px-6 rounded-2xl border flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-xl ${
                    showTagPopover ? 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)]' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  <Filter size={16} className={showTagPopover ? 'text-white' : 'text-cyan-500'} /> 
                  Filtros
                </button>
                {showTagPopover && (
                  <FilterPopover
                    categories={ALL_POSSIBLE_CATEGORIES}
                    selected={localCategories}
                    onUpdate={(cat: any) => updateFilters('categories', cat)}
                    selectedLang={localLangs}
                    onUpdateLang={(lang: any) => updateFilters('lang', lang)}
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
            className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-[1px] cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-xl"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="h-full w-full bg-[#0a0a0a] rounded-[inherit] overflow-hidden flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-xs uppercase tracking-tighter">{user.name.substring(0, 2)}</span>
              )}
            </div>
          </div>

          {showUserMenu && (
            <div className="absolute right-0 top-14 w-64 bg-[#0a0a0a] border border-white/10 rounded-3xl p-4 shadow-2xl z-[1000] animate-in fade-in zoom-in-95 duration-200">
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
  );
}
