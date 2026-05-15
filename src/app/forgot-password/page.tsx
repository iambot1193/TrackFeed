'use client'

import { useState, useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { requestPasswordReset } from "./actions";
import { ThemeToggle } from "@/components/theme-toggle";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [state, formAction, isPending] = useActionState(requestPasswordReset, null);

  return (
    <form action={formAction}>
      <CardContent className="space-y-4">
        {state?.error && (
          <div className="flex items-center gap-2 p-3 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={16} />
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="flex items-center gap-2 p-3 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 size={16} />
            E-mail enviado! Verifique sua caixa de entrada.
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="select-none text-zinc-900 dark:text-zinc-200 font-bold">
            E-mail da Conta
          </Label>
          <div className="relative">
            <Input 
              id="email" name="email" type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com" required 
              className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-foreground focus-visible:ring-purple-500 pl-10 shadow-sm transition-all h-12 rounded-xl" 
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isPending || state?.success}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 rounded-xl"
        >
          {isPending ? "Enviando..." : "Enviar Link de Recuperação"}
        </Button>
      </CardContent>
    </form>
  );
}

export default function ForgotPasswordPage() {
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
              <KeyRound size={24} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Recuperar Senha</CardTitle>
          <CardDescription className="text-zinc-400">
            Digite seu e-mail e enviaremos um link para você criar uma nova senha.
          </CardDescription>
        </CardHeader>
        
        <Suspense fallback={<div className="text-center py-8">Carregando...</div>}>
          <ForgotPasswordForm />
        </Suspense>

        <CardFooter className="flex flex-col space-y-4 text-center border-t border-zinc-200 dark:border-zinc-800/50 mt-4 pt-6">
          <Link href="/" className="text-zinc-400 hover:text-foreground text-sm font-medium flex items-center justify-center gap-2 transition-all">
            <ArrowLeft size={14} />
            Voltar para o Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
