import { NextRequest, NextResponse } from "next/server";
import { verifySessionValue } from "@/lib/session";

const PROTECTED_PATHS = ["/dashboard", "/interests", "/verify-email"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Checagem rápida de assinatura/validade (sem DB — middleware roda no edge runtime).
  // A checagem autoritativa de versão de sessão acontece em getSessionUserId, nas páginas/actions.
  const session = await verifySessionValue(request.cookies.get("session")?.value);
  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/interests/:path*", "/verify-email/:path*"],
};
