'use client'

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Cpu, Trophy, Briefcase, Film, FlaskConical, 
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

      <header className="p-8 lg:p-12 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-2xl transition-transform group-hover:scale-110">
            TF
          </div>
          <span className="text-2xl font-black italic tracking-tighter text-white">TrackFeed</span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-8 relative z-10">
        <div className="space-y-12 -mt-16 mb-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 px-4">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.3] text-white italic py-8">
            O que te desperta <br/>
            <span className="text-glow bg-gradient-to-br from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent px-4">curiosidade?</span>
          </h1>
          <p className="text-zinc-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Personalize sua inteligência. Escolha até 5 temas para nutrir seu feed imersivo.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {categories.map((cat, idx) => {
            const isSelected = selected.includes(cat.id);
            const Icon = cat.icon;
            const style = categoryStyles[cat.id];

            return (
              <Card
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`group relative overflow-hidden cursor-pointer border backdrop-blur-2xl transition-all duration-700 h-48 flex flex-col items-center justify-center gap-6 rounded-[3rem] animate-in fade-in slide-in-from-bottom-12 duration-1000 ${
                  isSelected 
                    ? `${style.border} ${style.bg} ${style.shadow} scale-105 border-opacity-50` 
                    : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {isSelected && (
                  <div className={`absolute top-6 right-6 ${style.text} animate-in zoom-in duration-500`}>
                    <Check size={20} strokeWidth={4} />
                  </div>
                )}
                <div className={`p-5 rounded-2xl transition-all duration-700 ${isSelected ? `scale-110 ${style.text}` : "text-zinc-600 group-hover:text-zinc-300 bg-white/5"}`}>
                  <Icon size={44} strokeWidth={isSelected ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-700 ${isSelected ? "text-white" : "text-zinc-600 group-hover:text-zinc-400"} leading-loose`}>
                  {cat.label}
                </span>
              </Card>
            );
          })}
        </div>

        <div className="mt-28 flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="flex items-center gap-4">
             <div className="h-[1px] w-16 bg-white/20" />
             <span className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-300">
               {selected.length} / 5 Selecionados
             </span>
             <div className="h-[1px] w-16 bg-white/20" />
          </div>

          <Button 
            onClick={handleContinue}
            disabled={selected.length < 1 || selected.length > 5 || isPending}
            className={`h-24 min-w-[450px] rounded-[3rem] font-black uppercase text-[12px] tracking-[0.4em] transition-all duration-700 shadow-2xl active:scale-95 group relative overflow-hidden ${
              selected.length >= 1 
                ? "bg-white text-black hover:bg-cyan-500 hover:text-white scale-105" 
                : "bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed"
            }`}
          >
            {isPending ? (
              <div className="flex items-center gap-4">
                <Loader2 className="animate-spin" size={24} />
                <span>Calibrando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span>Finalizar Escolha</span>
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-2" />
              </div>
            )}
          </Button>
          
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-700 ${selected.length < 1 ? "text-cyan-500 animate-pulse" : "text-zinc-300"}`}>
            {selected.length < 1 ? "⚠️ Escolha ao menos 1 tópico" : "Tudo pronto para começar sua leitura"}
          </p>
        </div>
      </main>
    </div>
  );
}
