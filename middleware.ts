import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];
const OG_PATHS = ["/market/", "/profile/", "/leaderboard"];

function isBot(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") || "";
  return /Discordbot|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot/i.test(ua);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow bots through on market/profile pages for OG previews
  if (isBot(request) && OG_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hasAuth = request.cookies.has("wallet_key");
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Redirect unauthenticated users to login
  if (!hasAuth && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login
  if (hasAuth && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
