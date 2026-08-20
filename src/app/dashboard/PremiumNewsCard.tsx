'use client'

import { ArrowRight, BookmarkIcon } from "lucide-react";
import { tagColors } from "./categories";

export function PremiumNewsCard({ article, isFavorite, onFavorite, onClick, gridColumns }: any) {
  const category = article.category || "general";
  const colorClass = tagColors[category] || "bg-zinc-700";

  return (
    <div className="group relative border border-white/5 bg-white/5 backdrop-blur-2xl rounded-[1.5rem] transition-all duration-700 flex flex-col h-full hover:border-white/20 hover:-translate-y-3 overflow-hidden cursor-pointer" onClick={onClick}>
      <div className={`relative aspect-[16/9] ${gridColumns === 4 ? 'm-2 rounded-[0.9rem]' : 'm-2.5 rounded-[1rem]'} overflow-hidden`}>
        <img src={article.urlToImage} alt={article.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
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
