import { prisma } from "@/lib/prisma";

export const VALID_CATEGORY_SLUGS = [
  "general", "technology", "business", "health", "science",
  "sports", "games", "crypto", "movies", "music"
];

export function sanitizeCategories(categories: string[]): string[] {
  return categories.filter((c) => VALID_CATEGORY_SLUGS.includes(c));
}

export async function setUserPreferences(userId: string, categories: string[], client: any = prisma) {
  const clean = sanitizeCategories(categories);
  await client.preference.deleteMany({ where: { userId } });
  if (clean.length > 0) {
    await client.preference.createMany({
      data: clean.map((categoryName) => ({ userId, categoryName }))
    });
  }
  return clean;
}
