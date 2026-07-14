import { CmsSubnav } from "@/components/cms/cms-subnav";
import { createClient } from "@/lib/supabase/server";
import { requireOrgModule } from "@/lib/entitlements";

async function cmsHealthCheck(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("cms_posts")
      .select("id", { count: "exact", head: true })
      .limit(1);
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  await requireOrgModule("cms"); // Eixo A — neutro enquanto enforcement OFF
  const healthy = await cmsHealthCheck();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">CMS</h1>
        <p className="text-muted-foreground mt-1">
          Conteúdo do site público — blog, novidades e cases.
        </p>
      </div>
      {!healthy && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          <strong>CMS temporariamente indisponível.</strong>{" "}
          O cache do Supabase está travado. Vá em{" "}
          <a
            href="https://supabase.com/dashboard/project/lfvuwrpfdnyqfxjaicba/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold"
          >
            Settings → API → Restart server
          </a>{" "}
          e aguarde ~30s.
        </div>
      )}
      <CmsSubnav />
      {children}
    </div>
  );
}
