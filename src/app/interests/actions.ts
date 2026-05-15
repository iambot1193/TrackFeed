'use server'

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function saveInterests(interests: string[]) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/");
  }

  if (interests.length < 1) {
    return { error: "Selecione pelo menos 1 interesse." };
  }

  try {
    await prisma.preference.deleteMany({
      where: { userId }
    });

    await prisma.preference.createMany({
      data: interests.map(category => ({
        userId,
        categoryName: category
      }))
    });
  } catch (error: any) {
    return { error: "Ocorreu um erro no banco de dados. Tente novamente." };
  }

  redirect("/dashboard");
}
