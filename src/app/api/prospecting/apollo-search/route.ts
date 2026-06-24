import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import {
  apolloSearchPeople,
  normalizeApolloPerson,
} from "@/lib/integrations/apollo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  q_keywords: z.string().optional(),
  q_organization_name: z.string().optional(),
  person_titles: z.array(z.string()).optional(),
  person_locations: z.array(z.string()).optional(),
  organization_locations: z.array(z.string()).optional(),
  organization_industry_tag_ids: z.array(z.string()).optional(),
  organization_num_employees_ranges: z.array(z.string()).optional(),
  page: z.number().int().min(1).max(50).optional(),
  per_page: z.number().int().min(1).max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const result = await apolloSearchPeople(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json({
      total_entries: result.total_entries,
      page: result.page,
      per_page: result.per_page,
      people: result.people.map((p) => ({
        ...normalizeApolloPerson(p),
        raw: { id: p.id },
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
