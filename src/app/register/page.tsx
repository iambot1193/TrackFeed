'use client'

import { useState, useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, ShieldCheck, ArrowRight } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { registerUser } from "./actions";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerUser, null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
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

  const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

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

      <Card className="w-full max-w-[420px] border-white/5 bg-white/[0.03] backdrop-blur-[60px] text-foreground relative z-10 shadow-[0_80px_150px_-30px_rgba(0,0,0,1)] rounded-[2.5rem] overflow-hidden border-t-white/10 p-1.5">
        <div className="bg-black/20 rounded-[inherit] p-6 lg:p-8">
          <CardHeader className="space-y-4 text-center pt-2 pb-5">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-[1.25rem] bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center font-black text-lg text-white shadow-[0_0_30px_rgba(147,51,234,0.3)]">
                TF
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black tracking-tighter uppercase italic text-white">TrackFeed</CardTitle>
              <CardDescription className="text-zinc-500 font-black uppercase text-[8px] tracking-[0.3em] bg-white/5 py-1 rounded-full border border-white/5 px-4 inline-block mx-auto">
                Crie sua conta para começar
              </CardDescription>
            </div>
            
            {/* INFORMATIVO DE VERIFICAÇÃO */}
            <div className="mt-2 p-4 bg-purple-500/5 border border-purple-500/10 rounded-[1.5rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-1000">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest leading-none mb-1 italic">Benefício exclusivo</p>
                <p className="text-[10px] text-zinc-400 font-bold leading-tight">Ganhe o selo de <span className="text-white">Conta Verificada</span> após confirmar seu e-mail.</p>
              </div>
            </div>
          </CardHeader>
          
          <form action={formAction} className="space-y-4 px-1">
            {state?.error && (
              <div className="flex items-center gap-3 p-4 text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-4 italic">
                <AlertCircle size={16} />
                {state.error}
              </div>
            )}

            <div className="space-y-2 group">
              <Label className="text-zinc-500 font-black uppercase text-[8px] tracking-[0.2em] px-2 group-focus-within:text-purple-400 transition-all">Usuário</Label>
              <Input 
                id="name" name="name" type="text" 
                defaultValue={state?.name || ""}
                placeholder="Como quer ser chamado?" required 
                className="h-12 bg-white/[0.03] border-white/5 text-white focus-visible:ring-purple-500/30 rounded-xl text-xs font-bold placeholder:text-zinc-700 transition-all shadow-inner px-4" 
              />
            </div>

            <div className="space-y-2 group">
              <Label className="text-zinc-500 font-black uppercase text-[8px] tracking-[0.2em] px-2 group-focus-within:text-purple-400 transition-all">E-mail</Label>
              <Input 
                id="email" name="email" type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com" required 
                className="h-12 bg-white/[0.03] border-white/5 text-white focus-visible:ring-purple-500/30 rounded-xl text-xs font-bold placeholder:text-zinc-700 transition-all shadow-inner px-4" 
              />
            </div>
            
            <div className="space-y-2 group">
              <Label className="text-zinc-500 font-black uppercase text-[8px] tracking-[0.2em] px-2 group-focus-within:text-purple-400 transition-all">Segurança</Label>
              <div className="relative">
                <Input 
                  id="password" name="password" type={showPassword ? "text" : "password"} required
                  placeholder="Senha"
                  className="peer h-12 bg-white/[0.03] border-white/5 text-white focus-visible:ring-purple-500/30 pr-12 rounded-xl text-xs font-bold placeholder:text-zinc-700 transition-all shadow-inner px-4" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-all active:scale-90 outline-none p-1">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {process.env.NODE_ENV === "production" && (
              <div className="flex justify-center py-1.5 scale-90 select-none overflow-hidden rounded-xl bg-black/40 p-3 border border-white/5">
                <ReCAPTCHA sitekey={SITE_KEY} onChange={(token) => setCaptchaToken(token)} theme="dark" />
                <input type="hidden" name="g-recaptcha-response" value={captchaToken || ""} />
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isPending || (process.env.NODE_ENV === "production" && !captchaToken)}
              className="w-full h-12 bg-white text-black hover:bg-purple-600 hover:text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 rounded-xl group overflow-hidden mt-2"
            >
              <div className="flex items-center gap-3">
                <span>{isPending ? "Criando..." : "Finalizar Cadastro"}</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Button>
          </form>

          <CardFooter className="flex flex-col space-y-3 text-center mt-6 pt-4 border-t border-white/5 px-0 pb-2">
            <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.15em]">
              Já tem uma conta?{" "}
              <Link href="/" className="text-white hover:text-purple-400 font-black transition-all hover:underline underline-offset-4">
                Fazer Login
              </Link>
            </p>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
