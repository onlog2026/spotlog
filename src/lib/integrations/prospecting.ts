import { getIntegration } from "./index";

export type ICP = {
  industries?: string[];
  titles?: string[];
  seniorities?: string[];
  countries?: string[];
  states?: string[];
  cities?: string[];
  neighborhood?: string;
  company_sizes?: string[];
  revenue_ranges?: string[];
  keywords?: string[];
  excluded_companies?: string[];
  limit?: number;
};

export type ProspectingHit = {
  source: "apollo" | "google_places" | "apify" | "linkedin" | "openstreetmap";
  external_id?: string;
  company: {
    name?: string;
    domain?: string;
    website?: string;
    industry?: string;
    size?: string;
    country?: string;
    state?: string;
    city?: string;
    address?: string;
    phone?: string;
    linkedin_url?: string;
    description?: string;
  };
  contact?: {
    full_name?: string;
    email?: string;
    phone?: string;
    job_title?: string;
    seniority?: string;
    linkedin_url?: string;
    is_decision_maker?: boolean;
  };
  raw?: unknown;
};

/** Diagnóstico por fonte — pra mostrar o que funcionou e o que falhou (não falhar calado). */
export type SourceDiag = { source: string; ok: boolean; count: number; error?: string };
export type ProspectResult = { hits: ProspectingHit[]; diagnostics: SourceDiag[] };

const RUNNERS: Record<
  string,
  (org: string, icp: ICP) => Promise<ProspectingHit[]>
> = {
  apollo: searchApollo,
  google_places: searchGooglePlaces,
  apify: searchApify,
  openstreetmap: searchOpenStreetMap,
};

/**
 * Roda TODAS as fontes selecionadas (se complementando), junta os resultados,
 * REMOVE DUPLICADOS (mesma empresa/contato) e devolve um diagnóstico por fonte.
 * Failover natural: se uma fonte falha ou estoura o limite, as outras continuam —
 * e o erro fica registrado em `diagnostics` (em vez de sumir).
 */
export async function searchProspects(
  organization_id: string,
  icp: ICP,
  sources: string[],
): Promise<ProspectResult> {
  const diagnostics: SourceDiag[] = [];
  const all: ProspectingHit[] = [];

  for (const s of sources) {
    const runner = RUNNERS[s];
    if (!runner) {
      diagnostics.push({ source: s, ok: false, count: 0, error: "fonte desconhecida" });
      continue;
    }
    try {
      const r = await runner(organization_id, icp);
      all.push(...r);
      diagnostics.push({ source: s, ok: true, count: r.length });
    } catch (e) {
      diagnostics.push({
        source: s,
        ok: false,
        count: 0,
        error: e instanceof Error ? e.message : "falha",
      });
    }
  }

  return { hits: dedupe(all), diagnostics };
}

/** Remove duplicados entre fontes: por e-mail > domínio/site > nome+telefone > id. */
function dedupe(hits: ProspectingHit[]): ProspectingHit[] {
  const seen = new Set<string>();
  const out: ProspectingHit[] = [];
  for (const h of hits) {
    const domain = (h.company?.domain || h.company?.website || "")
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "");
    const namePhone = [
      h.company?.name?.toLowerCase().trim(),
      (h.company?.phone || h.contact?.phone || "").replace(/\D/g, ""),
    ]
      .filter(Boolean)
      .join("|");
    const key =
      h.contact?.email?.toLowerCase() ||
      domain ||
      (namePhone.length > 3 ? namePhone : "") ||
      (h.external_id ? `${h.source}:${h.external_id}` : "");
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(h);
  }
  return out;
}

async function searchApollo(
  organization_id: string,
  icp: ICP,
): Promise<ProspectingHit[]> {
  const integration = await getIntegration(organization_id, "apollo");
  if (!integration) throw new Error("Apollo não configurada");

  const body = {
    page: 1,
    per_page: Math.min(icp.limit ?? 25, 100),
    person_titles: icp.titles,
    person_seniorities: icp.seniorities,
    organization_industries: icp.industries,
    organization_locations: [
      ...(icp.cities ?? []),
      ...(icp.states ?? []),
      ...(icp.countries ?? []),
    ].filter(Boolean),
    q_keywords: icp.keywords?.join(" "),
  };

  const res = await fetch("https://api.apollo.io/v1/mixed_people/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": integration.credentials.api_key,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(`Apollo ${res.status}: ${err?.error || res.statusText}`);
  }
  const data = (await res.json()) as {
    people?: Array<{
      id?: string;
      name?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      title?: string;
      seniority?: string;
      linkedin_url?: string;
      organization?: {
        name?: string;
        website_url?: string;
        primary_domain?: string;
        industry?: string;
        estimated_num_employees?: number;
        country?: string;
        state?: string;
        city?: string;
        phone?: string;
        linkedin_url?: string;
        short_description?: string;
      };
    }>;
  };

  return (data.people ?? []).map((p) => ({
    source: "apollo" as const,
    external_id: p.id,
    contact: {
      full_name: p.name ?? [p.first_name, p.last_name].filter(Boolean).join(" "),
      email: p.email,
      job_title: p.title,
      seniority: p.seniority,
      linkedin_url: p.linkedin_url,
      is_decision_maker:
        /director|head|chief|owner|founder|vp|gerente|diretor|presidente|c-?level/i.test(
          p.title ?? "",
        ),
    },
    company: {
      name: p.organization?.name,
      domain: p.organization?.primary_domain,
      website: p.organization?.website_url,
      industry: p.organization?.industry,
      size: p.organization?.estimated_num_employees?.toString(),
      country: p.organization?.country,
      state: p.organization?.state,
      city: p.organization?.city,
      phone: p.organization?.phone,
      linkedin_url: p.organization?.linkedin_url,
      description: p.organization?.short_description,
    },
    raw: p,
  }));
}

async function searchGooglePlaces(
  organization_id: string,
  icp: ICP,
): Promise<ProspectingHit[]> {
  const integration = await getIntegration(organization_id, "google_places");
  if (!integration) throw new Error("Google Places não configurada");

  // Consulta em texto natural: "farmácia de manipulação Santana São Paulo SP"
  const query = [
    icp.industries?.join(" "),
    icp.keywords?.join(" "),
    icp.neighborhood,
    icp.cities?.join(" "),
    icp.states?.join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": integration.credentials.api_key,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.types,places.businessStatus",
    },
    body: JSON.stringify({
      textQuery: query || "empresas",
      pageSize: Math.min(icp.limit ?? 20, 20),
      languageCode: "pt-BR",
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(`Google Places ${res.status}: ${err?.error?.message || res.statusText}`);
  }
  const data = (await res.json()) as {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      internationalPhoneNumber?: string;
      nationalPhoneNumber?: string;
      websiteUri?: string;
      types?: string[];
    }>;
  };

  return (data.places ?? []).map((p) => ({
    source: "google_places" as const,
    external_id: p.id,
    company: {
      name: p.displayName?.text,
      address: p.formattedAddress,
      phone: p.internationalPhoneNumber || p.nationalPhoneNumber,
      website: p.websiteUri,
      industry: p.types?.[0],
    },
    raw: p,
  }));
}

/**
 * Apify — scraper do Google Maps (actor compass/crawler-google-places).
 * Pega empresas locais com telefone/endereço, inclusive as que NÃO têm site.
 * Barato (centavos/lead) e funciona sem plano pago como a Apollo.
 */
async function searchApify(
  organization_id: string,
  icp: ICP,
): Promise<ProspectingHit[]> {
  // Token vem da integração da org OU da env APIFY_TOKEN (fallback global).
  const integration = await getIntegration(organization_id, "apify");
  const token =
    integration?.credentials?.api_token ||
    integration?.credentials?.token ||
    integration?.credentials?.api_key ||
    process.env.APIFY_TOKEN;
  if (!token) throw new Error("Apify sem token (configure APIFY_TOKEN).");

  const query =
    [
      icp.industries?.join(" "),
      icp.keywords?.join(" "),
      icp.neighborhood,
      icp.cities?.join(" "),
      icp.states?.join(" "),
    ]
      .filter(Boolean)
      .join(" ") || "empresas";

  const res = await fetch(
    `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${encodeURIComponent(
      token,
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // NÃO enviar language:"pt" — o actor rejeita (só aceita en/es/etc.).
      // Resultado já vem localizado pela busca (cidade/bairro no texto).
      body: JSON.stringify({
        searchStringsArray: [query],
        maxCrawledPlacesPerSearch: Math.min(icp.limit ?? 20, 50),
      }),
    },
  );
  if (!res.ok) throw new Error(`Apify ${res.status}: ${res.statusText}`);
  const items = (await res.json()) as Array<{
    placeId?: string;
    id?: string;
    title?: string;
    address?: string;
    phone?: string;
    phoneUnformatted?: string;
    website?: string;
    categoryName?: string;
    category?: string;
    city?: string;
    state?: string;
    countryCode?: string;
  }>;

  return (Array.isArray(items) ? items : []).map((it) => ({
    source: "apify" as const,
    external_id: it.placeId || it.id,
    company: {
      name: it.title,
      address: it.address,
      phone: it.phone || it.phoneUnformatted,
      website: it.website,
      industry: it.categoryName || it.category,
      city: it.city,
      state: it.state,
      country: it.countryCode,
    },
    raw: it,
  }));
}

// ============================================================================
// OpenStreetMap (Overpass + Nominatim) — fonte 100% GRÁTIS, sem chave/cartão.
// Busca empresas por nicho dentro da cidade e devolve nome/endereço/telefone/
// site/e-mail/WhatsApp reais do mapa colaborativo. Dado real, nunca inventado.
// ============================================================================

const OSM_UA = "Spotlog-SDR/1.0 (prospeccao B2B)";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Bbox = [number, number, number, number]; // [south, north, west, east]

/** Uma consulta ao Nominatim (grátis). viewbox opcional trava o resultado numa área. */
async function nominatim(q: string, viewbox?: string): Promise<Bbox | null> {
  let url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=" +
    encodeURIComponent(q);
  if (viewbox) url += "&viewbox=" + viewbox + "&bounded=1";
  const res = await fetch(url, { headers: { "User-Agent": OSM_UA } });
  if (!res.ok) return null;
  const arr = (await res.json()) as Array<{ boundingbox?: string[] }>;
  const bb = arr?.[0]?.boundingbox;
  if (!bb || bb.length < 4) return null;
  const [s, n, w, e] = bb.map(Number);
  if ([s, n, w, e].some((x) => !Number.isFinite(x))) return null;
  return [s, n, w, e];
}

/**
 * Geocoda a área de busca. Geocoda a CIDADE primeiro; se houver bairro,
 * geocoda o bairro TRAVADO dentro da cidade (viewbox) — evita pegar uma
 * cidade homônima no interior (ex.: "Santana"). Fallback = cidade inteira.
 */
async function geocodeArea(
  city: string,
  state?: string,
  neighborhood?: string,
): Promise<Bbox | null> {
  const cityBbox = await nominatim([city, state, "Brasil"].filter(Boolean).join(", "));
  if (!neighborhood) return cityBbox;
  if (!cityBbox)
    return nominatim([neighborhood, city, state, "Brasil"].filter(Boolean).join(", "));
  // viewbox = west,north,east,south
  const vb = [cityBbox[2], cityBbox[1], cityBbox[3], cityBbox[0]].join(",");
  const nb = await nominatim([neighborhood, city, state].filter(Boolean).join(", "), vb);
  return nb ?? cityBbox;
}

/** Remove acentos p/ casar o nicho no mapa de categorias. */
function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/**
 * Mapa nicho → filtros de categoria OSM. Assim "farmácia" acha farmácias pela
 * CATEGORIA (não só pelo nome). Nicho desconhecido cai na busca por nome.
 */
const NICHE_TAGS: Record<string, string[]> = {
  farmacia: ['["amenity"="pharmacy"]', '["shop"="chemist"]', '["healthcare"="pharmacy"]'],
  drogaria: ['["amenity"="pharmacy"]', '["shop"="chemist"]'],
  manipulacao: ['["amenity"="pharmacy"]', '["healthcare"="pharmacy"]'],
  restaurante: ['["amenity"="restaurant"]'],
  lanchonete: ['["amenity"="fast_food"]', '["amenity"="cafe"]'],
  pizzaria: ['["amenity"="restaurant"]', '["cuisine"="pizza"]'],
  padaria: ['["shop"="bakery"]'],
  mercado: ['["shop"="supermarket"]', '["shop"="convenience"]'],
  supermercado: ['["shop"="supermarket"]'],
  hortifruti: ['["shop"="greengrocer"]'],
  acougue: ['["shop"="butcher"]'],
  clinica: ['["amenity"="clinic"]', '["healthcare"="clinic"]', '["amenity"="doctors"]'],
  hospital: ['["amenity"="hospital"]'],
  laboratorio: ['["healthcare"="laboratory"]'],
  dentista: ['["amenity"="dentist"]', '["healthcare"="dentist"]'],
  veterinaria: ['["amenity"="veterinary"]'],
  petshop: ['["shop"="pet"]'],
  academia: ['["leisure"="fitness_centre"]', '["sport"="fitness"]'],
  hotel: ['["tourism"="hotel"]'],
  pousada: ['["tourism"="guest_house"]', '["tourism"="hotel"]'],
  escola: ['["amenity"="school"]'],
  faculdade: ['["amenity"="university"]', '["amenity"="college"]'],
  oficina: ['["shop"="car_repair"]', '["craft"="car_repair"]'],
  autopecas: ['["shop"="car_parts"]'],
  concessionaria: ['["shop"="car"]'],
  salao: ['["shop"="hairdresser"]', '["shop"="beauty"]'],
  barbearia: ['["shop"="hairdresser"]'],
  hamburgueria: ['["amenity"="fast_food"]'],
  cafeteria: ['["amenity"="cafe"]'],
  advogado: ['["office"="lawyer"]'],
  advocacia: ['["office"="lawyer"]'],
  contabilidade: ['["office"="accountant"]'],
  imobiliaria: ['["office"="estate_agent"]'],
  otica: ['["shop"="optician"]'],
  papelaria: ['["shop"="stationery"]'],
  loja: ['["shop"]'],
  posto: ['["amenity"="fuel"]'],
  banco: ['["amenity"="bank"]'],
};

const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "para", "pra", "com", "a", "o",
  "as", "os", "no", "na", "the",
]);

export async function searchOpenStreetMap(
  _organization_id: string,
  icp: ICP,
): Promise<ProspectingHit[]> {
  const terms = [...(icp.industries ?? []), ...(icp.keywords ?? [])]
    .map((t) => t.trim())
    .filter(Boolean);
  if (terms.length === 0)
    throw new Error("Informe ao menos um nicho/segmento (ex.: farmácia, logística).");
  const city = (icp.cities ?? [])[0];
  if (!city) throw new Error("Informe a cidade da busca (ex.: São Paulo).");
  const state = (icp.states ?? [])[0];
  const limit = Math.min(Math.max(icp.limit ?? 30, 1), 60);

  const bbox = await geocodeArea(city, state, icp.neighborhood);
  if (!bbox) throw new Error(`Não encontrei "${city}" no mapa (OpenStreetMap).`);
  const [s, n, w, e] = bbox;
  const box = `${s},${w},${n},${e}`; // bbox do Overpass = south,west,north,east

  // 1) filtros por CATEGORIA (nicho conhecido → tags OSM) + 2) por NOME (palavras
  // significativas). União dos dois = achamos por categoria E por nome.
  // quebra os termos em palavras (o nicho é casado por PALAVRA, não pela frase)
  const termWords = terms
    .flatMap((t) => t.split(/\s+/))
    .map((x) => x.trim())
    .filter(Boolean);

  const tagFilters = new Set<string>();
  for (const w0 of termWords) {
    for (const tag of NICHE_TAGS[stripAccents(w0)] ?? []) tagFilters.add(tag);
  }
  const nameWords = Array.from(
    new Set(
      termWords.filter(
        (w0) => w0.length >= 3 && !STOPWORDS.has(stripAccents(w0)),
      ),
    ),
  );

  const clauses: string[] = [];
  for (const tag of tagFilters) {
    clauses.push(`node${tag}(${box});way${tag}(${box});`);
  }
  if (nameWords.length) {
    const regex = nameWords.map(escapeRegex).join("|");
    clauses.push(`node["name"~"${regex}",i](${box});way["name"~"${regex}",i](${box});`);
  }
  if (clauses.length === 0)
    throw new Error("Nicho/segmento inválido. Ex.: farmácia, restaurante, clínica.");

  // pede mais que o limite (filtramos por nome depois) e cortamos no fim
  const query =
    `[out:json][timeout:25];(${clauses.join("")});out center ${Math.min(limit * 3, 120)};`;

  const res = await fetch(
    "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query),
    { headers: { "User-Agent": OSM_UA } },
  );
  if (!res.ok) throw new Error(`OpenStreetMap ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as {
    elements?: Array<{ id?: number; type?: string; tags?: Record<string, string> }>;
  };

  const seen = new Set<string>();
  const hits: ProspectingHit[] = [];
  for (const el of data.elements ?? []) {
    if (hits.length >= limit) break;
    const t = el.tags ?? {};
    const name = t.name;
    if (!name) continue;
    const key = name.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);

    const whatsapp = t["contact:whatsapp"] || t["contact:mobile"];
    const phone = t.phone || t["contact:phone"] || whatsapp;
    const website = t.website || t["contact:website"];
    const email = t.email || t["contact:email"];
    const address = [
      t["addr:street"],
      t["addr:housenumber"],
      t["addr:suburb"],
      t["addr:city"] || city,
    ]
      .filter(Boolean)
      .join(", ");

    hits.push({
      source: "openstreetmap",
      external_id: `${el.type}/${el.id}`,
      company: {
        name,
        website: website || undefined,
        phone: phone || undefined,
        address: address || undefined,
        city: t["addr:city"] || city,
        state: state || undefined,
        industry:
          t.shop || t.office || t.amenity || t.craft || t.healthcare || terms[0],
      },
      contact:
        email || whatsapp
          ? { email: email || undefined, phone: whatsapp || undefined }
          : undefined,
      raw: t,
    });
  }
  return hits;
}
