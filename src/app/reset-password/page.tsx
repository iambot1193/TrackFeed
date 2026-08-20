'use client'

import { useState, useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { resetPassword } from "./actions";
import { ThemeToggle } from "@/components/theme-toggle";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(resetPassword, null);

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-bold">Link Inválido</h2>
        <p className="text-zinc-400">Este link de recuperação não possui um token válido.</p>
        <Button asChild className="w-full bg-zinc-800 hover:bg-zinc-700">
          <Link href="/forgot-password">Solicitar Novo Link</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      
      <CardContent className="space-y-4 px-0">
        {state?.error && (
          <div className="flex items-center gap-2 p-3 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={16} />
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-emerald-400">Senha Alterada!</h3>
              <p className="text-sm text-zinc-400">Sua nova senha já está ativa. Você pode fazer login agora.</p>
            </div>
            <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              <Link href="/">Ir para o Login</Link>
            </Button>
          </div>
        )}

        {!state?.success && (
          <>
            <div className="space-y-2">
              <Label htmlFor="password" title="Mínimo 6 caracteres" className="select-none text-zinc-900 dark:text-zinc-200 font-bold">
                Nova Senha
              </Label>
              <div className="relative">
                <Input 
                  id="password" name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-foreground focus-visible:ring-purple-500 pl-10 pr-10 shadow-sm transition-all h-12 rounded-xl" 
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-all active:scale-90 outline-none select-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isPending}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 rounded-xl"
            >
              {isPending ? "Redefinindo..." : "Confirmar Nova Senha"}
            </Button>
          </>
        )}
      </CardContent>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-purple-500/20 dark:bg-purple-900/30 blur-[120px] rounded-full transition-all duration-700" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] bg-blue-500/20 dark:bg-blue-900/30 blur-[120px] rounded-full transition-all duration-700" />
      </div>

      <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-2xl text-foreground relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-t-white/20">
        <CardHeader className="space-y-1 text-center select-none">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
              <Lock size={24} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Nova Senha</CardTitle>
          <CardDescription className="text-zinc-400">
            Crie uma senha forte para proteger sua conta.
          </CardDescription>
        </CardHeader>
        
        <div className="px-6 pb-6">
          <Suspense fallback={<div className="text-center py-8">Carregando...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </Card>
    </div>
  );
}
