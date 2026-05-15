'use client'

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Cpu, Trophy, Briefcase, Film, FlaskConical, 
  HeartPulse, Globe, Code2, Sparkles, Paintbrush, 
  Gamepad2, Bitcoin, Clapperboard, Music, Shirt, Check,
  Loader2, Palette
} from "lucide-react";
import { saveInterests } from "./actions";

const categories = [
  { id: "technology", label: "Tecnologia", icon: Cpu, color: "from-blue-500 to-cyan-400" },
  { id: "sports", label: "Esportes", icon: Trophy, color: "from-orange-500 to-yellow-400" },
  { id: "science", label: "Ciência", icon: FlaskConical, color: "from-purple-500 to-indigo-400" },
  { id: "health", label: "Saúde", icon: HeartPulse, color: "from-red-500 to-orange-400" },
  { id: "general", label: "Geral", icon: Globe, color: "from-zinc-500 to-slate-400" },
  { id: "games", label: "Games", icon: Gamepad2, color: "from-green-500 to-emerald-400" },
  { id: "crypto", label: "Cripto", icon: Bitcoin, color: "from-yellow-600 to-orange-500" },
  { id: "movies", label: "Cinema", icon: Clapperboard, color: "from-red-600 to-rose-500" },
  { id: "music", label: "Música", icon: Music, color: "from-indigo-600 to-blue-500" },
  { id: "business", label: "Negócios", icon: Briefcase, color: "from-emerald-600 to-green-500" },
];

const categoryStyles: Record<string, { border: string, bg: string, text: string, shadow: string }> = {
  technology: { border: "border-blue-500", bg: "bg-blue-500/10", text: "text-blue-400", shadow: "shadow-[0_0_20px_rgba(59,130,246,0.2)]" },
  sports: { border: "border-orange-500", bg: "bg-orange-500/10", text: "text-orange-400", shadow: "shadow-[0_0_20px_rgba(249,115,22,0.2)]" },
  science: { border: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-400", shadow: "shadow-[0_0_20px_rgba(168,85,247,0.2)]" },
  health: { border: "border-red-500", bg: "bg-red-500/10", text: "text-red-400", shadow: "shadow-[0_0_20px_rgba(239,68,68,0.2)]" },
  general: { border: "border-zinc-500", bg: "bg-zinc-500/10", text: "text-zinc-400", shadow: "shadow-[0_0_20px_rgba(113,113,122,0.2)]" },
  games: { border: "border-green-500", bg: "bg-green-500/10", text: "text-green-400", shadow: "shadow-[0_0_20px_rgba(34,197,94,0.2)]" },
  crypto: { border: "border-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-400", shadow: "shadow-[0_0_20px_rgba(234,179,8,0.2)]" },
  movies: { border: "border-rose-500", bg: "bg-rose-500/10", text: "text-rose-400", shadow: "shadow-[0_0_20_rgba(244,63,94,0.2)]" },
  music: { border: "border-indigo-500", bg: "bg-indigo-500/10", text: "text-indigo-400", shadow: "shadow-[0_0_20px_rgba(99,102,241,0.2)]" },
  business: { border: "border-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-400", shadow: "shadow-[0_0_20px_rgba(16,185,129,0.2)]" },
};

export default function InterestsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const toggleCategory = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((i) => i !== id));
    } else if (selected.length < 5) {
      setSelected([...selected, id]);
    }
  };

  const handleContinue = () => {
    if (selected.length >= 1 && selected.length <= 5) {
      startTransition(async () => {
        const result = await saveInterests(selected);
        if (result?.error) {
          alert(result.error);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 -left-1/4 w-[50%] h-[50%] bg-purple-600/5 blur-[150px] rounded-full animate-slow-float" />
        <div className="absolute bottom-1/4 -right-1/4 w-[50%] h-[50%] bg-blue-600/5 blur-[150px] rounded-full animate-slow-float duration-1000" />
      </div>

      <header className="p-6 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/20 backdrop-blur-3xl sticky top-0 z-50">
        <div className="flex items-center gap-3 select-none">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]">
            TF
          </div>
          <span className="hidden md:block text-xl font-black tracking-tighter uppercase italic bg-gradient-to-br from-white via-zinc-100 to-purple-400/50 bg-clip-text text-transparent">
            TrackFeed
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Sistema Online</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 py-8 relative z-10">
        <div className="space-y-6 mb-20 text-center select-none animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
            O que te desperta <span className="bg-gradient-to-br from-purple-400 to-indigo-600 bg-clip-text text-transparent drop-shadow-2xl">curiosidade?</span>
          </h1>
          <p className="text-zinc-400 text-lg font-bold max-w-2xl mx-auto">
            Escolha de 1 a 5 temas para personalizarmos seu feed com as notícias mais relevantes para você.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((cat) => {
            const isSelected = selected.includes(cat.id);
            const Icon = cat.icon;
            const style = categoryStyles[cat.id] || categoryStyles.general;

            return (
              <Card
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`group relative overflow-hidden cursor-pointer border-2 transition-all duration-500 h-40 flex flex-col items-center justify-center gap-4 select-none rounded-[2rem] ${
                  isSelected 
                    ? `${style.border} ${style.bg} ${style.shadow} scale-105` 
                    : "border-zinc-800/50 bg-zinc-950/40 backdrop-blur-sm hover:border-zinc-600 hover:bg-zinc-900/50"
                }`}
              >
                {/* Check Badge */}
                {isSelected && (
                  <div className={`absolute top-4 right-4 ${style.bg.replace('/10', '')} rounded-full p-1.5 animate-in zoom-in duration-300 shadow-lg`}>
                    <Check size={12} className="text-white" strokeWidth={4} />
                  </div>
                )}

                <div className={`p-4 rounded-2xl transition-all duration-500 ${isSelected ? `scale-110 ${style.text}` : "text-zinc-600 group-hover:text-zinc-400 bg-white/5"}`}>
                  <Icon size={40} strokeWidth={isSelected ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isSelected ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                  {cat.label}
                </span>
              </Card>
            );
          })}
        </div>

        <div className="mt-20 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div className="flex items-center gap-3">
             <div className="h-px w-12 bg-zinc-800" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
               {selected.length} de 5 selecionados
             </span>
             <div className="h-px w-12 bg-zinc-800" />
          </div>

          <Button 
            onClick={handleContinue}
            disabled={selected.length < 1 || selected.length > 5 || isPending}
            className={`h-20 min-w-[380px] rounded-[2.5rem] font-black uppercase text-sm tracking-[0.3em] transition-all duration-500 shadow-2xl active:scale-95 group relative overflow-hidden ${
              selected.length >= 1 && selected.length <= 5 
                ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white hover:brightness-110 hover:shadow-purple-500/30 scale-105" 
                : "bg-zinc-900/50 text-zinc-600 border border-zinc-800 cursor-not-allowed"
            }`}
          >
            {isPending ? (
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin" size={24} />
                <span>Personalizando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span>Finalizar Escolha</span>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 ${selected.length >= 1 ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-600"}`}>
                  <Check size={16} strokeWidth={4} />
                </div>
              </div>
            )}
            
            {/* Progress Bar Overlay at the bottom of the button */}
            {selected.length >= 1 && !isPending && (
               <div 
                 className="absolute bottom-0 left-0 h-1.5 bg-white/30 transition-all duration-500" 
                 style={{ width: `${(selected.length / 5) * 100}%` }}
               />
            )}
          </Button>
          
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-2 transition-all duration-500 ${selected.length < 1 ? "text-purple-400 animate-pulse" : "text-zinc-600 opacity-50"}`}>
            {selected.length < 1 ? "⚠️ Escolha pelo menos 1 tópico para continuar" : "Tudo pronto para começar!"}
          </p>
        </div>
      </main>

      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-1/4 w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 -right-1/4 w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
