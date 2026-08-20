'use client'

export function NewsSkeletonGrid({ gridColumns }: { gridColumns: number }) {
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
