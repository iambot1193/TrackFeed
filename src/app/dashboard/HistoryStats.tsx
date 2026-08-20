'use client'

import { tagColors } from "./categories";

export function HistoryStats({ stats, isFavs }: any) {
  const categories = Object.entries(stats.categories).sort((a: any, b: any) => b[1] - a[1]);
  const total = stats.totalRead;
  const mainStat = isFavs ? stats.totalRead : stats.totalClicks;
  const mainLabel = isFavs ? "Total Salvo" : "Total de Interações";

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
        <div className="text-5xl font-black text-white tracking-tighter">{mainStat}</div>
        <div className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em]">{mainLabel}</div>
      </div>
    </div>
  );
}
