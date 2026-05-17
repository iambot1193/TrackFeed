'use client'

import { useState, useActionState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmail, resendVerificationAction } from "./actions";
import { ThemeToggle } from "@/components/theme-toggle";

function VerifyEmailContent() {
  const [code, setCode] = useState("");
  const [state, formAction, isPending] = useActionState(verifyEmail, null);
  const [isResending, setIsResending] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || "seu e-mail";

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Formata o código enquanto o usuário digita (ex: 123 456)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  const handleResend = async () => {
    setIsResending(true);
    const result = await resendVerificationAction();
    setIsResending(false);
    
    if (result?.error) {
      showNotify(result.error, "error");
    } else {
      showNotify("E-mail reenviado com sucesso! Verifique sua caixa de entrada.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4 relative overflow-hidden transition-colors duration-500">
      {/* NOTIFICAÇÃO TOAST */}
      {notification && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[1000] px-8 py-4 rounded-[2rem] border backdrop-blur-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-8 duration-500 ${
          notification.type === 'success' 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10" 
            : "bg-red-500/10 border-red-500/30 text-red-400 shadow-red-500/10"
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-xs font-black uppercase tracking-widest">{notification.message}</span>
        </div>
      )}

      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-purple-600/10 blur-[150px] rounded-full animate-slow-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-blue-600/10 blur-[150px] rounded-full animate-slow-pulse duration-1000" />
      </div>

      <Card className="w-full max-w-md border-zinc-800/50 bg-zinc-950/40 backdrop-blur-[40px] text-foreground relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-t-white/5 rounded-[2.5rem] overflow-hidden">
        {state?.success ? (
          <div className="p-8 text-center animate-in zoom-in-95 duration-500">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 size={40} className="animate-in slide-in-from-bottom-2 duration-700" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter uppercase italic mb-4">Verificado!</CardTitle>
            <p className="text-zinc-500 font-bold leading-relaxed mb-8">
              Seu e-mail foi confirmado com sucesso. <br/>
              <span className="text-emerald-500">Você já pode fechar esta guia</span> e voltar para a aba principal do TrackFeed.
            </p>
            <Button onClick={() => window.close()} className="w-full h-14 bg-zinc-900 hover:bg-black text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95">
              Fechar esta Guia
            </Button>
          </div>
        ) : (
          <>
            <CardHeader className="space-y-4 text-center select-none pt-10 pb-6">
              <div className="flex justify-center mb-2">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(147,51,234,0.3)]">
                  <Mail size={24} />
                </div>
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter uppercase italic bg-gradient-to-br from-white via-zinc-100 to-purple-400/50 bg-clip-text text-transparent">Verifique seu E-mail</CardTitle>
              <CardDescription className="text-zinc-200 font-black uppercase text-[10px] tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
                Enviamos um código de 6 dígitos para o endereço: <br/>
                <span className="text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full mt-2 inline-block border border-purple-500/20">{email}</span>
              </CardDescription>
            </CardHeader>
            
            <form action={formAction}>
              <CardContent className="space-y-6">
                {state?.error && (
                  <div className="flex items-center gap-2 p-3 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={16} />
                    {state.error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Input 
                      id="code" name="code" type="text" 
                      value={code} onChange={handleCodeChange}
                      placeholder="0 0 0 0 0 0"
                      className="w-full h-16 text-center text-3xl font-black tracking-[0.5em] bg-white/5 border-zinc-800/50 text-foreground focus-visible:ring-purple-500/50 rounded-2xl transition-all shadow-inner placeholder:text-zinc-800" 
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-center text-zinc-300 uppercase tracking-widest font-black italic">Digite o código de confirmação</p>
                </div>

                <Button 
                  type="submit" 
                  disabled={isPending || code.length < 6}
                  className="w-full h-14 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:brightness-110 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_20px_40px_rgba(147,51,234,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 select-none rounded-2xl"
                >
                  {isPending ? <RefreshCw className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                  {isPending ? "Verificando..." : "Confirmar E-mail"}
                </Button>
              </CardContent>
            </form>

            <CardFooter className="flex flex-col space-y-4 text-center border-t border-zinc-200 dark:border-zinc-800/50 mt-4 pt-6">
              <button 
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-purple-500 hover:text-purple-400 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {isResending ? "Reenviando..." : "Não recebeu? Reenviar e-mail"}
              </button>

              <Link href="/interests" className="w-full h-10 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center rounded-xl transition-all active:scale-95">
                Continuar sem verificar
              </Link>

              <Link href="/register" className="text-zinc-400 hover:text-foreground text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                <ArrowLeft size={14} />
                Voltar para o cadastro
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4 relative overflow-hidden">
        <div className="text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Carregando...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
