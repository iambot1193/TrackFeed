'use client'

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
import { loginUser } from "./login-actions";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(loginUser, null);

  const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-purple-600/10 blur-[150px] rounded-full animate-slow-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-blue-600/10 blur-[150px] rounded-full animate-slow-pulse duration-1000" />
      </div>

      <Card className="w-full max-w-md border-zinc-800/50 bg-zinc-950/40 backdrop-blur-[40px] text-foreground relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-t-white/5 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-2 text-center select-none pt-10 pb-6">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-[0_0_30px_rgba(147,51,234,0.3)] animate-in zoom-in duration-700">
              TF
            </div>
          </div>
          <CardTitle className="text-4xl font-black tracking-tighter uppercase italic bg-gradient-to-br from-white via-zinc-100 to-purple-400/50 bg-clip-text text-transparent drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">TrackFeed</CardTitle>
        </CardHeader>
        
        <form action={formAction}>
          <CardContent className="space-y-6 px-10">
            {state?.error && (
              <div className="flex items-center gap-3 p-4 text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2 select-none italic">
                <AlertCircle size={16} />
                {state.error}
              </div>
            )}

            <div className="space-y-2 group">
              <Label htmlFor="identifier" className="select-none text-zinc-200 font-black uppercase text-[9px] tracking-widest px-1 group-focus-within:text-purple-400 transition-colors">
                E-mail ou Usuário
              </Label>
              <Input 
                id="identifier" name="identifier" type="text" 
                defaultValue={state?.identifier || ""}
                placeholder="E-mail ou Usuário" required 
                className="h-14 bg-white/5 border-zinc-800/50 text-white focus-visible:ring-purple-500/50 rounded-2xl text-sm font-bold placeholder:text-zinc-600 transition-all shadow-inner" 
              />
            </div>
            
            <div className="space-y-2 group">
              <Label htmlFor="password" title="Sua senha secreta" className="select-none text-zinc-200 font-black uppercase text-[9px] tracking-widest px-1 group-focus-within:text-purple-400 transition-colors">
                Senha
              </Label>
              <div className="relative">
                <Input 
                  id="password" name="password" type={showPassword ? "text" : "password"} required
                  placeholder="Senha"
                  className="peer h-14 bg-white/5 border-zinc-800/50 text-white focus-visible:ring-purple-500/50 pr-12 rounded-2xl text-sm font-bold placeholder:text-zinc-600 transition-all shadow-inner" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-all active:scale-90 outline-none select-none p-1">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* GOOGLE RECAPTCHA - Só aparece em Produção */}
            {process.env.NODE_ENV === "production" && (
              <div className="flex justify-center py-2 scale-90 select-none overflow-hidden rounded-2xl bg-black/20 p-2 border border-zinc-800/50">
                <ReCAPTCHA
                  sitekey={SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                  theme="dark"
                />
                {/* Campo oculto para passar o token para o formAction */}
                <input type="hidden" name="g-recaptcha-response" value={captchaToken || ""} />
              </div>
            )}


            <Button 
              type="submit" 
              disabled={isPending || (process.env.NODE_ENV === "production" && !captchaToken)}
              className="w-full h-14 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:brightness-110 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_20px_40px_rgba(147,51,234,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 select-none rounded-2xl"
            >
              {isPending ? "Autenticando..." : "Entrar"}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="flex flex-col space-y-4 text-center border-t border-zinc-900/50 mt-8 py-8 px-10 select-none bg-black/20">
          <p className="text-zinc-200 text-[10px] font-black uppercase tracking-widest">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-purple-500 hover:text-purple-400 font-black transition-all hover:underline underline-offset-8">
              Cadastre-se agora
            </Link>
          </p>
          <Link 
            href={state?.identifier ? `/forgot-password?email=${encodeURIComponent(state.identifier)}` : "/forgot-password"} 
            className="text-zinc-300 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all"
          >
            ESQUECEU SUA SENHA?
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
