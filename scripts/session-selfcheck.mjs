/**
 * Self-check da assinatura de sessão (node scripts/session-selfcheck.mjs).
 * Replica a lógica de src/lib/session.ts sem depender de next/headers ou do banco,
 * cobrindo o que precisa valer para a sessão ser segura.
 */
import assert from "node:assert/strict";

const SESSION_SECRET = "segredo-de-teste";
const MAX_AGE_MS = 60 * 60 * 24 * 7 * 1000;
const encoder = new TextEncoder();

async function getKey(secret = SESSION_SECRET) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

function toBase64Url(buffer) {
  return Buffer.from(buffer).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload, secret) {
  return toBase64Url(await crypto.subtle.sign("HMAC", await getKey(secret), encoder.encode(payload)));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function createSessionValue(userId, version, now = Date.now(), secret) {
  const payload = `${userId}.${version}.${now}`;
  return `${payload}.${await sign(payload, secret)}`;
}

async function verifySessionValue(value, secret) {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const [userId, versionStr, issuedAtStr, sig] = parts;
  if (!userId || !versionStr || !issuedAtStr || !sig) return null;
  const expected = await sign(`${userId}.${versionStr}.${issuedAtStr}`, secret);
  if (!timingSafeEqual(expected, sig)) return null;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > MAX_AGE_MS) return null;
  return { userId, version: Number(versionStr) };
}

const UID = "3f8c1e2a-0000-4444-8888-aaaabbbbcccc";

// Caminho feliz: ida e volta preserva userId e versão
const ok = await verifySessionValue(await createSessionValue(UID, 2));
assert.deepEqual(ok, { userId: UID, version: 2 });

// Cookie forjado: trocar o userId sem reassinar não passa
const forged = (await createSessionValue(UID, 0)).replace(UID, "11111111-2222-3333-4444-555555555555");
assert.equal(await verifySessionValue(forged), null, "userId trocado deveria ser rejeitado");

// Escalar a versão da sessão sem reassinar não passa
const [u, , iat, sig] = (await createSessionValue(UID, 0)).split(".");
assert.equal(await verifySessionValue(`${u}.99.${iat}.${sig}`), null, "versão adulterada deveria ser rejeitada");

// Expiração é validada no servidor, não só pelo maxAge do navegador
const stale = await createSessionValue(UID, 0, Date.now() - MAX_AGE_MS - 1000);
assert.equal(await verifySessionValue(stale), null, "sessão expirada deveria ser rejeitada");
const fresh = await createSessionValue(UID, 0, Date.now() - MAX_AGE_MS + 60_000);
assert.ok(await verifySessionValue(fresh), "sessão dentro da validade deveria ser aceita");

// Outro SESSION_SECRET não consegue assinar sessões válidas
const otherSecret = await createSessionValue(UID, 0, Date.now(), "outro-segredo");
assert.equal(await verifySessionValue(otherSecret), null, "assinatura de outro segredo deveria ser rejeitada");

// Entradas malformadas não derrubam a verificação
for (const bad of [null, undefined, "", "sem-pontos", "a.b.c", "a.b.c.d.e"]) {
  assert.equal(await verifySessionValue(bad), null, `entrada inválida aceita: ${bad}`);
}

console.log("session self-check: OK");
