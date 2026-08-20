'use server'

import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { setUserPreferences, sanitizeCategories } from "@/lib/preferences";

export async function saveInterests(interests: string[]) {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect("/");
  }

  if (sanitizeCategories(interests).length < 1) {
    return { error: "Selecione pelo menos 1 interesse válido." };
  }

  try {
    await setUserPreferences(userId, interests);
  } catch {
    return { error: "Ocorreu um erro no banco de dados. Tente novamente." };
  }

  redirect("/dashboard");
}
