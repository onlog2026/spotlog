import { getIntegration } from "./index";

export type ICP = {
  industries?: string[];
  titles?: string[];
  seniorities?: string[];
  countries?: string[];
  states?: string[];
  cities?: string[];
  company_sizes?: string[];
  revenue_ranges?: string[];
  keywords?: string[];
  excluded_companies?: string[];
  limit?: number;
};

export type ProspectingHit = {
  source: "apollo" | "google_places" | "linkedin";
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

export async function searchProspects(
  organization_id: string,
  icp: ICP,
  sources: string[],
): Promise<ProspectingHit[]> {
  const results: ProspectingHit[] = [];

  if (sources.includes("apollo")) {
    const r = await searchApollo(organization_id, icp).catch((e) => {
      console.warn("apollo search failed", e);
      return [];
    });
    results.push(...r);
  }

  if (sources.includes("google_places")) {
    const r = await searchGooglePlaces(organization_id, icp).catch((e) => {
      console.warn("google places search failed", e);
      return [];
    });
    results.push(...r);
  }

  return results;
}

async function searchApollo(
  organization_id: string,
  icp: ICP,
): Promise<ProspectingHit[]> {
  const integration = await getIntegration(organization_id, "apollo");
  if (!integration) return [];

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
  if (!res.ok) return [];
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
    source: "apollo",
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
  if (!integration) return [];

  const query = [
    icp.industries?.join(" OR "),
    icp.keywords?.join(" "),
    icp.cities?.join(" OR "),
    icp.states?.join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": integration.credentials.api_key,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.types,places.businessStatus,places.addressComponents",
      },
      body: JSON.stringify({
        textQuery: query || "empresas",
        pageSize: Math.min(icp.limit ?? 20, 20),
        languageCode: "pt-BR",
      }),
    },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      internationalPhoneNumber?: string;
      websiteUri?: string;
      types?: string[];
    }>;
  };

  return (data.places ?? []).map((p) => ({
    source: "google_places",
    external_id: p.id,
    company: {
      name: p.displayName?.text,
      address: p.formattedAddress,
      phone: p.internationalPhoneNumber,
      website: p.websiteUri,
      industry: p.types?.[0],
    },
    raw: p,
  }));
}
