'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export default function VerifyChoicePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-purple-600/10 blur-[150px] rounded-full animate-slow-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-blue-600/10 blur-[150px] rounded-full animate-slow-pulse duration-1000" />
      </div>

      <Card className="w-full max-w-lg border-zinc-800/50 bg-zinc-950/40 backdrop-blur-[40px] text-foreground relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-t-white/5 rounded-[2.5rem] overflow-hidden p-8">
        <CardHeader className="space-y-4 text-center select-none pb-10">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 rounded-[2rem] bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_40px_rgba(147,51,234,0.4)]">
              <ShieldCheck size={32} />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter uppercase italic bg-gradient-to-br from-white via-zinc-100 to-purple-400/50 bg-clip-text text-transparent">Quase lá!</CardTitle>
          <CardDescription className="text-zinc-200 font-black uppercase text-[10px] tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
            Sua conta foi criada. Como você deseja prosseguir agora?
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Link href={`/verify-email?email=${encodeURIComponent(email)}`} className="block group">
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-600/20 to-purple-900/10 border border-purple-500/30 hover:border-purple-500 transition-all duration-500 hover:scale-[1.02] active:scale-95 group-hover:shadow-[0_20px_40px_rgba(147,51,234,0.15)] relative overflow-hidden">
              <div className="flex items-center gap-6 relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-xl">
                  <Mail size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white group-hover:text-purple-400 transition-colors italic">Validar E-mail</h3>
                  <p className="text-[10px] text-zinc-300 font-black uppercase tracking-tighter mt-1">Obtenha o selo de verificado agora</p>
                </div>
                <ArrowRight size={20} className="text-purple-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl -z-0" />
            </div>
          </Link>

          <Link href="/interests" className="block group">
            <div className="p-6 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700 transition-all duration-500 hover:scale-[1.02] active:scale-95 group-hover:bg-zinc-900/60 relative overflow-hidden">
              <div className="flex items-center gap-6 relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-white transition-colors shadow-inner">
                  <Sparkles size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-200 group-hover:text-white transition-colors italic">Explorar Interesses</h3>
                  <p className="text-[10px] text-zinc-400 font-black uppercase tracking-tighter mt-1">Pular verificação e ver notícias</p>
                </div>
                <ArrowRight size={20} className="text-zinc-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <p className="text-[9px] text-center text-zinc-400 font-black uppercase tracking-[0.2em] pt-4 italic">
            Você poderá verificar seu e-mail a qualquer momento no perfil.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
