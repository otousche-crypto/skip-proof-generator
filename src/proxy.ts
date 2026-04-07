import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedRoutes = ["/profile"];
const authRoutes = ["/login"];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Redirect unauthenticated users from protected routes
  if (protectedRoutes.some((r) => path.startsWith(r)) && !user) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // Redirect authenticated users away from login
  if (authRoutes.some((r) => path.startsWith(r)) && user) {
    return NextResponse.redirect(new URL("/profile", request.nextUrl));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|samples|.*\\.(?:svg|png|jpg|mp3|wav)$).*)",
  ],
};
