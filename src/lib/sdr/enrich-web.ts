/**
 * Agente de Enriquecimento — lê o SITE público do lead e extrai contatos
 * (e-mail, telefone, WhatsApp). 100% grátis (só um fetch), sem chave.
 * Nunca inventa: se não achar no site, retorna vazio.
 */

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
// telefone BR: (11) 91234-5678 / 11912345678 / +55 11 3123-4567 ...
const PHONE_RE =
  /(?:\+?55\s?)?(?:\(?\d{2}\)?[\s.-]?)?(?:9\s?)?\d{4}[\s.-]?\d{4}/g;
const WA_RE = /(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=|whatsapp\.com\/send\?phone=)(\+?\d{8,15})/gi;

const EMAIL_JUNK = [
  "example.com", "sentry", "wixpress", "@2x", ".png", ".jpg", ".jpeg", ".gif",
  ".webp", ".svg", "email@", "seu@", "your@", "nome@", "domain.com",
];

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

/** Baixa o HTML de uma URL com timeout curto e tolerante a falha. */
async function fetchHtml(url: string, timeoutMs = 6000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SpotlogSDR/1.0; +https://www.spotlog.com.br)",
        Accept: "text/html",
      },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("html") && !ct.includes("text")) return null;
    const html = await res.text();
    return html.slice(0, 400_000); // teto de segurança
  } catch {
    return null;
  }
}

export type WebContacts = {
  emails: string[];
  phones: string[]; // dígitos normalizados (DDD + número)
  whatsapps: string[]; // dígitos com país quando houver
  socials: string[]; // perfis Instagram/Facebook/LinkedIn achados no site
};

// Perfis sociais em hrefs. Exclui links de compartilhar (sharer/intent) e páginas genéricas.
const SOCIAL_RE =
  /https?:\/\/(?:www\.)?(instagram\.com|facebook\.com|linkedin\.com)\/[a-z0-9._%\/-]{2,60}/gi;
const SOCIAL_JUNK = [
  "sharer", "share.php", "/intent", "/plugins", "/tr?", "facebook.com/2008",
  "instagram.com/p/", "instagram.com/reel", "linkedin.com/shareArticle",
];

function extractSocials(html: string): string[] {
  return Array.from(
    new Set(
      Array.from(html.matchAll(SOCIAL_RE))
        .map((m) => m[0].replace(/\/+$/, "").toLowerCase())
        .filter((u) => !SOCIAL_JUNK.some((j) => u.includes(j))),
    ),
  ).slice(0, 4);
}

const MAILTO_RE = /mailto:([^"'?\s>]+)/gi;
const TEL_RE = /tel:(\+?[\d\s().-]{8,20})/gi;

function extractFromHtml(html: string): WebContacts {
  const text = html.replace(/<[^>]+>/g, " ");

  // Links mailto:/tel: são a fonte MAIS confiável (o dono botou ali de propósito).
  const hrefEmails = Array.from(html.matchAll(MAILTO_RE)).map((m) =>
    m[1].toLowerCase().trim(),
  );
  const hrefPhones = Array.from(html.matchAll(TEL_RE)).map((m) => onlyDigits(m[1]));

  const emails = Array.from(
    new Set(
      [...hrefEmails, ...(text.match(EMAIL_RE) ?? [])]
        .map((e) => e.toLowerCase().trim())
        .filter((e) => !EMAIL_JUNK.some((j) => e.includes(j)))
        .filter((e) => e.length <= 80),
    ),
  ).slice(0, 5);

  const whatsapps = Array.from(
    new Set(
      Array.from(html.matchAll(WA_RE)).map((m) => onlyDigits(m[1])).filter(Boolean),
    ),
  ).slice(0, 3);

  const phones = Array.from(
    new Set(
      [...hrefPhones, ...(text.match(PHONE_RE) ?? []).map((p) => onlyDigits(p))]
        // BR: 10 (fixo c/ DDD) ou 11 (celular c/ DDD); ou 12/13 com 55
        .map((d) => (d.length >= 12 && d.startsWith("55") ? d.slice(2) : d))
        .filter((d) => d.length === 10 || d.length === 11),
    ),
  ).slice(0, 4);

  return { emails, phones, whatsapps, socials: extractSocials(html) };
}

/**
 * Respeito básico a robots.txt (compliance): busca /robots.txt do host e
 * bloqueia SÓ se o site proibir tudo pra qualquer robô (Disallow: / em
 * User-agent: *). Best-effort e cacheado por host — na dúvida, permite.
 */
const robotsCache = new Map<string, boolean>();
async function robotsAllows(url: string): Promise<boolean> {
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return true;
  }
  if (robotsCache.has(origin)) return robotsCache.get(origin)!;
  let allowed = true;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${origin}/robots.txt`, {
      signal: ctrl.signal,
      headers: { "User-Agent": "SpotlogSDR/1.0" },
    });
    clearTimeout(t);
    if (res.ok) {
      const txt = (await res.text()).toLowerCase();
      // Procura o bloco "user-agent: *" e vê se tem "disallow: /" logo abaixo.
      const star = txt.split(/user-agent:\s*\*/)[1] ?? "";
      const block = star.split(/user-agent:/)[0] ?? "";
      if (/disallow:\s*\/\s*(\n|$)/.test(block)) allowed = false;
    }
  } catch {
    /* sem robots.txt acessível → permite (comportamento padrão da web) */
  }
  robotsCache.set(origin, allowed);
  return allowed;
}

/**
 * Agente Identificador de Dores — regras objetivas sobre o site (grátis, sem IA):
 * cada "dor" é uma oportunidade de venda/argumento pro SDR. Nunca inventa —
 * só reporta o que dá pra checar no HTML.
 */
function detectDores(html: string | null, url: string, contacts: WebContacts): string[] {
  const dores: string[] = [];
  if (!html) {
    dores.push("Site fora do ar ou muito lento (não respondeu).");
    return dores;
  }
  const low = html.toLowerCase();
  if (/^http:\/\//i.test(url.trim())) dores.push("Site sem HTTPS (cadeado de segurança).");
  if (contacts.whatsapps.length === 0 && !low.includes("whatsapp") && !low.includes("wa.me"))
    dores.push("Sem WhatsApp no site.");
  if (contacts.emails.length === 0) dores.push("Sem e-mail de contato visível.");
  if (!low.includes('name="viewport"') && !low.includes("name='viewport'"))
    dores.push("Não parece adaptado pra celular (sem viewport).");
  if (!low.includes('name="description"') && !low.includes("name='description'"))
    dores.push("Sem meta descrição (SEO fraco).");
  if (html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length < 1200)
    dores.push("Site muito simples / pouco conteúdo.");
  return dores;
}

// Páginas onde contato costuma estar (PT + EN). Tentadas em ordem.
const CONTACT_PATHS = [
  "/contato", "/contact", "/fale-conosco", "/faleconosco",
  "/atendimento", "/sobre", "/about", "/contatos",
];

function mergeContacts(a: WebContacts, b: WebContacts): WebContacts {
  return {
    emails: Array.from(new Set([...a.emails, ...b.emails])).slice(0, 5),
    phones: Array.from(new Set([...a.phones, ...b.phones])).slice(0, 4),
    whatsapps: Array.from(new Set([...a.whatsapps, ...b.whatsapps])).slice(0, 3),
    socials: Array.from(new Set([...a.socials, ...b.socials])).slice(0, 4),
  };
}

/** Acha links de contato dentro do HTML da home (href com "contato"/"contact"). */
function contactLinksFromHome(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = m[1];
    if (/(contato|contact|fale|atendimento)/i.test(href)) {
      try {
        out.push(new URL(href, baseUrl).toString());
      } catch {
        /* href inválido */
      }
    }
    if (out.length >= 3) break;
  }
  return out;
}

/**
 * Crawl compliant: respeita robots.txt, lê a home e — se faltar e-mail/WhatsApp —
 * segue as páginas de contato (as fixas + as descobertas na home). Grátis.
 * Retorna também o html da home (pra análise de dores) e se chegou ao site.
 */
async function crawlSite(
  url: string,
): Promise<{ contacts: WebContacts; home: string | null; blocked: boolean }> {
  if (!(await robotsAllows(url))) {
    return { contacts: { emails: [], phones: [], whatsapps: [], socials: [] }, home: null, blocked: true };
  }
  const home = await fetchHtml(url);
  let acc: WebContacts = home
    ? extractFromHtml(home)
    : { emails: [], phones: [], whatsapps: [], socials: [] };

  if (home && acc.emails.length === 0 && acc.whatsapps.length === 0) {
    const paths = CONTACT_PATHS.map((p) => {
      try {
        return new URL(p, url).toString();
      } catch {
        return null;
      }
    }).filter(Boolean) as string[];
    // páginas de contato descobertas na própria home entram primeiro
    const targets = Array.from(new Set([...contactLinksFromHome(home, url), ...paths])).slice(0, 6);
    for (const u of targets) {
      const page = await fetchHtml(u, 5000);
      if (page) {
        acc = mergeContacts(acc, extractFromHtml(page));
        if (acc.emails.length || acc.whatsapps.length) break;
      }
    }
  }
  return { contacts: acc, home, blocked: false };
}

export type SiteAnalysis = WebContacts & { dores: string[]; reached: boolean };

/**
 * Analisa o site do lead: contatos + dores, num único crawl.
 * (Usado pelo botão "Enriquecer & validar".)
 */
export async function analyzeLeadSite(rawUrl: string): Promise<SiteAnalysis> {
  let url = rawUrl.trim();
  if (!url) return { emails: [], phones: [], whatsapps: [], socials: [], dores: [], reached: false };
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

  const { contacts, home, blocked } = await crawlSite(url);
  const dores = detectDores(home, url, contacts);
  if (blocked) dores.push("Site bloqueia robôs de leitura (robots.txt) — respeitamos e não raspamos.");
  return { ...contacts, dores, reached: home !== null };
}

/**
 * Enriquece a partir do site: tenta a home e, se achar pouco, a /contato.
 * Retorna contatos encontrados (pode vir vazio — nunca inventa).
 */
export async function enrichFromWebsite(rawUrl: string): Promise<WebContacts> {
  let url = rawUrl.trim();
  if (!url) return { emails: [], phones: [], whatsapps: [], socials: [] };
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  const { contacts } = await crawlSite(url);
  return contacts;
}
