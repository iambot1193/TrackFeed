'use client'

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function VerifyChoicePage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<{top: string, left: string, delay: string, opacity: number}[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    const newParticles = [...Array(30)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      opacity: Math.random() * 0.5
    }));
    setParticles(newParticles);
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6 relative overflow-hidden selection:bg-purple-500/30">
      <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none z-[100]" />
      
      {/* Cinematic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-dots opacity-[0.2] mix-blend-overlay" />
        <div className="absolute inset-0 transition-transform duration-75 ease-out" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}>
          <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-purple-900/[0.12] blur-[200px] rounded-full animate-float-orb" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/[0.08] blur-[180px] rounded-full animate-slow-pulse" />
          {particles.map((p, i) => (
            <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: p.top, left: p.left, animationDelay: p.delay, opacity: p.opacity }} />
          ))}
        </div>
      </div>

      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-[520px] border-white/5 bg-white/[0.03] backdrop-blur-[60px] text-foreground relative z-10 shadow-[0_80px_150px_-30px_rgba(0,0,0,1)] rounded-[3.5rem] overflow-hidden border-t-white/10 p-2">
        <div className="bg-black/20 rounded-[inherit] p-10 lg:p-14">
          <CardHeader className="space-y-6 text-center pt-4 pb-12">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center font-black text-2xl text-white shadow-[0_0_50px_rgba(147,51,234,0.4)] animate-in zoom-in duration-1000">
                <ShieldCheck size={36} />
              </div>
            </div>
            <div className="space-y-3">
              <CardTitle className="text-5xl font-black tracking-tighter uppercase italic text-white">Quase lá!</CardTitle>
              <CardDescription className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] leading-relaxed">
                Sua conta foi criada. Como você deseja <br/> prosseguir agora?
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 px-0">
            <Link href="/verify-email" className="block group">
              <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.06] transition-all duration-500 flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Mail size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-black uppercase text-sm tracking-widest">Validar E-mail</h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Obtenha o selo de verificado agora</p>
                </div>
                <ArrowRight size={20} className="text-zinc-700 group-hover:text-white transition-all group-hover:translate-x-2" />
              </div>
            </Link>

            <Link href="/interests" className="block group">
              <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.06] transition-all duration-500 flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-cyan-600/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Zap size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-black uppercase text-sm tracking-widest">Explorar Interesses</h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Pular verificação e ver notícias</p>
                </div>
                <ArrowRight size={20} className="text-zinc-700 group-hover:text-white transition-all group-hover:translate-x-2" />
              </div>
            </Link>
          </CardContent>

          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 leading-relaxed">
              Você poderá verificar seu e-mail a qualquer momento no perfil.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
