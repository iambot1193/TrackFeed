'use client'

import { LayoutDashboard, Compass, Bookmark, History, User, LogOut, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Sidebar({ activeTab, updateFilters, isSidebarOpen, setSidebarOpen, user, logout, lastUpdated }: any) {
  const syncTime = lastUpdated 
    ? new Date(lastUpdated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const menuItems = [
    { id: 'home', icon: LayoutDashboard, label: 'Home' },
    { id: 'explore', icon: Compass, label: 'Descobrir' },
    { id: 'favs', icon: Bookmark, label: 'Favoritos' },
    { id: 'history', icon: History, label: 'Histórico' },
  ];

  return (
    <aside className={`fixed left-0 top-0 bottom-0 z-[600] w-80 bg-[#050505]/20 backdrop-blur-[50px] border-r border-white/[0.03] transition-transform duration-700 ease-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-10 h-full flex flex-col">
        <div className="flex items-center gap-4 mb-16 px-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-black text-white shadow-2xl">TF</div>
          <span className="text-xl font-black text-white tracking-tighter">TrackFeed</span>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6 px-4">Navegação</div>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { updateFilters('tab', item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 group relative ${activeTab === item.id ? 'bg-cyan-500/10 text-cyan-400' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-cyan-400' : 'group-hover:scale-110 transition-transform'} />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
              {activeTab === item.id && <div className="absolute left-0 w-1 h-6 bg-cyan-500 rounded-r-full" />}
            </button>
          ))}

          <div className="pt-12">
            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6 px-4">Configurações</div>
            <button
              onClick={() => { updateFilters('tab', 'profile'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 group ${activeTab === 'profile' ? 'bg-cyan-500/10 text-cyan-400' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              <User size={20} />
              <span className="font-bold text-sm tracking-tight">Meu Perfil</span>
            </button>

            <div className="mt-8 p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Sincronizado</span>
                </div>
                <span className="text-[10px] font-bold text-zinc-600">{syncTime}</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-10 border-t border-white/5">
          <div className="flex items-center justify-between px-4">
            <button 
              onClick={() => { updateFilters('tab', 'profile'); setSidebarOpen(false); }} 
              className="flex items-center gap-3 hover:opacity-80 transition-all text-left cursor-pointer group"
            >
              <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-white/10 group-hover:border-cyan-500/50 flex items-center justify-center text-[10px] font-black text-white uppercase overflow-hidden transition-colors">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} className="w-full h-full object-cover" />
                ) : (
                  user.name.substring(0, 2)
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white uppercase truncate w-24 group-hover:text-cyan-400 transition-colors">{user.name}</span>
                <span className="text-[10px] text-zinc-600">Pro Member</span>
              </div>
            </button>
            <button onClick={logout} className="p-2 text-zinc-600 hover:text-red-400 transition-colors"><LogOut size={18} /></button>
          </div>
        </div>
      </div>
    </aside>
  );
}
