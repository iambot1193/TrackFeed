'use client'

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Cpu, Trophy, Briefcase, FlaskConical,
  HeartPulse, Globe, Gamepad2, Bitcoin, Clapperboard, Music, Check,
  Loader2, ArrowRight
} from "lucide-react";
import { saveInterests } from "./actions";

const categories = [
  { id: "technology", label: "Tecnologia", icon: Cpu },
  { id: "sports", label: "Esportes", icon: Trophy },
  { id: "science", label: "Ciência", icon: FlaskConical },
  { id: "health", label: "Saúde", icon: HeartPulse },
  { id: "general", label: "Geral", icon: Globe },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "crypto", label: "Cripto", icon: Bitcoin },
  { id: "movies", label: "Cinema", icon: Clapperboard },
  { id: "music", label: "Música", icon: Music },
  { id: "business", label: "Negócios", icon: Briefcase },
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 15, y: (e.clientY / window.innerHeight - 0.5) * 15 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col relative overflow-hidden selection:bg-purple-500/30">
      <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none z-[100]" />
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-dots opacity-[0.2] mix-blend-overlay" />
        <div className="absolute inset-0 transition-transform duration-75 ease-out" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}>
          <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-purple-900/[0.12] blur-[200px] rounded-full animate-float-orb" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/[0.08] blur-[180px] rounded-full animate-slow-pulse" />
        </div>
      </div>

      <header className="p-6 lg:p-8 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(147,51,234,0.35)] transition-transform group-hover:scale-110">
            TF
          </div>
          <span className="text-xl font-black italic tracking-tighter text-white">TrackFeed</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 relative z-10 -mt-14 lg:-mt-22">
        <div className="space-y-3 -mt-4 mb-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 px-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.2] text-white italic py-4">
            O que te desperta <br/>
            <span className="text-glow bg-gradient-to-br from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent px-2">curiosidade?</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium max-w-lg mx-auto leading-relaxed">
            Personalize sua inteligência. Escolha até 5 temas para nutrir seu feed imersivo.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((cat, idx) => {
            const isSelected = selected.includes(cat.id);
            const Icon = cat.icon;
            const style = categoryStyles[cat.id];

            return (
              <Card
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`group relative overflow-hidden cursor-pointer border backdrop-blur-2xl transition-all duration-700 h-28 flex flex-col items-center justify-center gap-2 rounded-[1.5rem] animate-in fade-in slide-in-from-bottom-12 duration-1000 ${
                  isSelected 
                    ? `${style.border} ${style.bg} ${style.shadow} scale-105 border-opacity-50` 
                    : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {isSelected && (
                  <div className={`absolute top-2.5 right-2.5 ${style.text} animate-in zoom-in duration-500`}>
                    <Check size={12} strokeWidth={4} />
                  </div>
                )}
                <div className={`p-2.5 rounded-xl transition-all duration-700 ${isSelected ? `scale-110 ${style.text}` : "text-zinc-600 group-hover:text-zinc-300 bg-white/5"}`}>
                  <Icon size={20} strokeWidth={isSelected ? 2.5 : 2} />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-[0.3em] transition-all duration-700 ${isSelected ? "text-white" : "text-zinc-600 group-hover:text-zinc-400"} leading-loose`}>
                  {cat.label}
                </span>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="flex items-center gap-2">
             <div className="h-[1px] w-10 bg-white/20" />
             <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-300">
               {selected.length} / 5 Selecionados
             </span>
             <div className="h-[1px] w-10 bg-white/20" />
          </div>

          <Button 
            onClick={handleContinue}
            disabled={selected.length < 1 || selected.length > 5 || isPending}
            className={`h-12 min-w-[320px] rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.3em] transition-all duration-700 shadow-2xl active:scale-95 group relative overflow-hidden ${
              selected.length >= 1 
                ? "bg-white text-black hover:bg-cyan-500 hover:text-white scale-105" 
                : "bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed"
            }`}
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                <span>Calibrando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Finalizar Escolha</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </div>
            )}
          </Button>
          
          <p className={`text-[8px] font-black uppercase tracking-[0.25em] transition-all duration-700 ${selected.length < 1 ? "text-cyan-500 animate-pulse" : "text-zinc-300"}`}>
            {selected.length < 1 ? "⚠️ Escolha ao menos 1 tópico" : "Tudo pronto para começar sua leitura"}
          </p>
        </div>
      </main>
    </div>
  );
}
