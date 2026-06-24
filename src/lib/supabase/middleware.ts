import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isAuthArea =
    url.pathname.startsWith("/app") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/onboarding");
  const isPortalArea = url.pathname.startsWith("/portal") && !url.pathname.startsWith("/portal-login");
  const isAuthPage =
    url.pathname.startsWith("/login") || url.pathname.startsWith("/cadastro");
  const isPortalAuthPage = url.pathname.startsWith("/portal-login");

  if (isAuthArea && !user) {
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isPortalArea && !user) {
    url.pathname = "/portal-login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  if (isPortalAuthPage && user) {
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
