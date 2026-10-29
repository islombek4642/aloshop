import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { LOCALES, DEFAULT_LOCALE } from "./lib/constants/locales";
import { verifySessionToken, ADMIN_SESSION_COOKIE } from "./lib/auth/session";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);

  let locale = DEFAULT_LOCALE;
  let rest = segments;

  if (segments.length > 0 && LOCALES.includes(segments[0] as typeof LOCALES[number])) {
    locale = segments[0] as typeof LOCALES[number];
    rest = segments.slice(1);
  }

  // Check if route is an admin route
  if (rest[0] === "admin") {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = token ? await verifySessionToken(token) : null;
    const isLoginPage = rest[1] === "login";

    if (isLoginPage) {
      if (session) {
        // Authenticated users should not see login page -> redirect to dashboard
        return NextResponse.redirect(
          new URL(`/${locale}/admin/dashboard`, request.url)
        );
      }
      // Unauthenticated users can view login
      request.headers.set("x-pathname", pathname);
      return intlMiddleware(request);
    }

    // Root /admin or /[locale]/admin -> redirect to dashboard or login
    if (rest.length === 1) {
      const destination = session ? "dashboard" : "login";
      return NextResponse.redirect(
        new URL(`/${locale}/admin/${destination}`, request.url)
      );
    }

    // All other /admin/* routes require a valid session
    if (!session) {
      return NextResponse.redirect(
        new URL(`/${locale}/admin/login`, request.url)
      );
    }

    request.headers.set("x-pathname", pathname);
    return intlMiddleware(request);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
