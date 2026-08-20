'use client'

import { SearchX } from "lucide-react";

export function EmptyState({ title, description }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in zoom-in duration-700">
      <SearchX size={64} className="text-zinc-800 mb-8" />
      <h3 className="text-3xl font-black uppercase text-zinc-500 tracking-tighter">{title}</h3>
      <p className="text-zinc-600 font-bold mt-2">{description}</p>
    </div>
  );
}
