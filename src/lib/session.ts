import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "session";
const MAX_AGE_MS = 60 * 60 * 24 * 7 * 1000; // 7 dias
const encoder = new TextEncoder();

async function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET não configurado no ambiente.");
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function toBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string) {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(sig);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Valor de cookie assinado (HMAC): userId + versão da sessão + timestamp de emissão.
 * A versão permite revogar sessões antigas (troca de senha) sem precisar de um store.
 */
export async function createSessionValue(userId: string, version: number) {
  const payload = `${userId}.${version}.${Date.now()}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionValue(
  value: string | undefined | null
): Promise<{ userId: string; version: number } | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 4) return null;

  const [userId, versionStr, issuedAtStr, sig] = parts;
  if (!userId || !versionStr || !issuedAtStr || !sig) return null;

  const payload = `${userId}.${versionStr}.${issuedAtStr}`;
  const expected = await sign(payload);
  if (!timingSafeEqual(expected, sig)) return null;

  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > MAX_AGE_MS) return null;

  return { userId, version: Number(versionStr) };
}

export async function setSessionCookie(userId: string, version: number) {
  const value = await createSessionValue(userId, version);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

/**
 * Verifica assinatura + expiração e confirma no banco que a sessão ainda é a versão vigente
 * (troca de senha incrementa sessionVersion e derruba sessões antigas).
 */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const parsed = await verifySessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!parsed) return null;

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { sessionVersion: true }
  });
  if (!user || user.sessionVersion !== parsed.version) return null;

  return parsed.userId;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
