"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_THEME, type ThemeTokens } from "@/components/v3/theme";

export async function salvarTema(fd: FormData) {
  await requireSession();
  const supabase = await createClient();

  const num = (k: string, fb: number) => {
    const v = Number(fd.get(k));
    return Number.isFinite(v) && v > 0 ? v : fb;
  };
  const str = (k: string, fb: string) => {
    const v = (fd.get(k) as string)?.trim();
    return v || fb;
  };

  const tokens: ThemeTokens = {
    pageBg: str("pageBg", DEFAULT_THEME.pageBg),
    cardBg: str("cardBg", DEFAULT_THEME.cardBg),
    primary: str("primary", DEFAULT_THEME.primary),
    primaryDark: str("primaryDark", DEFAULT_THEME.primaryDark),
    secondary: str("secondary", DEFAULT_THEME.secondary),
    secondaryDeep: str("secondaryDeep", DEFAULT_THEME.secondaryDeep),
    textStrong: str("textStrong", DEFAULT_THEME.textStrong),
    textBody: str("textBody", DEFAULT_THEME.textBody),
    textMuted: str("textMuted", DEFAULT_THEME.textMuted),
    radius: num("radius", DEFAULT_THEME.radius),
    headingFont: str("headingFont", DEFAULT_THEME.headingFont),
    bodyFont: str("bodyFont", DEFAULT_THEME.bodyFont),
    baseFontPx: num("baseFontPx", DEFAULT_THEME.baseFontPx),
    logoUrl: str("logoUrl", ""),
    logoSize: num("logoSize", DEFAULT_THEME.logoSize),
    faviconUrl: str("faviconUrl", ""),
    logoUrlSite: str("logoUrlSite", ""),
    faviconUrlSite: str("faviconUrlSite", ""),
  };

  const { error } = await supabase.from("site_cards").upsert(
    {
      page: "home",
      section: "theme",
      slot: "tokens",
      title: "Tema do site",
      active: true,
      sort: 0,
      metadata: { tokens },
    },
    { onConflict: "page,section,slot" },
  );
  if (error) throw new Error(error.message);

  revalidatePath("/app/cms/site/tema");
  revalidatePath("/nova");
  revalidatePath("/");
  revalidateTag("site-branding");
  return { ok: true as const };
}
