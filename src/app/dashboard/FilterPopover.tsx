'use client'

import { Globe, Filter } from "lucide-react";

export function FilterPopover({ categories, selected, onUpdate, selectedLang, onUpdateLang }: any) {
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
