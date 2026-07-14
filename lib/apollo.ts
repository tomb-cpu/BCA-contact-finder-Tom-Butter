import { Composio } from "@composio/core";
import { TARGET_TITLES, MAX_CONTACTS } from "./titles";
import type { Contact } from "./types";

let client: Composio | null = null;

function getClient(): Composio {
  if (!client) {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey) throw new Error("COMPOSIO_API_KEY is not set");
    client = new Composio({ apiKey });
  }
  return client;
}

const userId = () => process.env.COMPOSIO_USER_ID || "default";
const connectedAccountId = () => process.env.COMPOSIO_APOLLO_CONNECTED_ACCOUNT_ID;

interface ApolloOrganization {
  id: string;
  name: string;
  website_url?: string;
  primary_domain?: string;
}

interface ApolloPerson {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  linkedin_url?: string;
  email?: string;
  phone_numbers?: { raw_number?: string; sanitized_number?: string }[];
  city?: string;
  country?: string;
  organization?: { name?: string };
}

// Thin wrapper around composio.tools.execute — centralized so the exact
// SDK call shape only needs updating in one place if the @composio/core
// API changes between versions.
async function executeTool<T = unknown>(
  slug: string,
  args: Record<string, unknown>
): Promise<T> {
  const composio = getClient();
  const account = connectedAccountId();
  const result = await composio.tools.execute(slug, {
    userId: userId(),
    dangerouslySkipVersionCheck: true,
    ...(account ? { connectedAccountId: account } : {}),
    arguments: args,
  });
  if (result && (result as { successful?: boolean }).successful === false) {
    throw new Error((result as { error?: string }).error || `${slug} failed`);
  }
  return ((result as { data?: T })?.data ?? result) as T;
}

export async function findOrganization(
  companyName: string
): Promise<ApolloOrganization | null> {
  const data = await executeTool<{ organizations?: ApolloOrganization[] }>(
    "APOLLO_ORGANIZATION_SEARCH",
    { q_organization_name: companyName, per_page: 5 }
  );
  const orgs = data?.organizations ?? [];
  if (!orgs.length) return null;
  const exact = orgs.find(
    (o) => o.name?.trim().toLowerCase() === companyName.trim().toLowerCase()
  );
  return exact ?? orgs[0];
}

export async function searchPeople(
  organizationId: string,
  limit: number = MAX_CONTACTS
): Promise<ApolloPerson[]> {
  const data = await executeTool<{ people?: ApolloPerson[] }>(
    "APOLLO_PEOPLE_SEARCH",
    {
      organization_ids: [organizationId],
      person_titles: TARGET_TITLES,
      per_page: limit,
      page: 1,
    }
  );
  return (data?.people ?? []).slice(0, limit);
}

// APOLLO_PEOPLE_SEARCH returns obfuscated contact fields; enrichment is a
// separate, credit-metered call that reveals the real email/phone.
export async function enrichPerson(person: ApolloPerson): Promise<ApolloPerson> {
  try {
    const data = await executeTool<{ person?: ApolloPerson }>(
      "APOLLO_PEOPLE_ENRICHMENT",
      {
        first_name: person.first_name,
        last_name: person.last_name,
        linkedin_url: person.linkedin_url,
        organization_name: person.organization?.name,
        reveal_personal_emails: true,
        reveal_phone_number: true,
      }
    );
    return { ...person, ...data?.person };
  } catch {
    return person;
  }
}

function toContact(p: ApolloPerson, company: string): Contact {
  return {
    id: p.id,
    name: p.name || `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
    title: p.title || "",
    company,
    linkedinUrl: p.linkedin_url ?? null,
    email: p.email && !p.email.includes("not_unlocked") ? p.email : null,
    phone:
      p.phone_numbers?.[0]?.sanitized_number ?? p.phone_numbers?.[0]?.raw_number ?? null,
    city: p.city ?? null,
    country: p.country ?? null,
  };
}

export interface LiveSearchOptions {
  limit?: number;
  autoEnrich?: boolean;
  enrichConcurrency?: number;
}

export interface LiveSearchResult {
  matchedOrganization: string | null;
  organizationDomain: string | null;
  contacts: Contact[];
}

export async function getCompanyContacts(
  companyName: string,
  opts: LiveSearchOptions = {}
): Promise<LiveSearchResult> {
  const limit = Math.min(opts.limit ?? MAX_CONTACTS, MAX_CONTACTS);
  const autoEnrich = opts.autoEnrich ?? true;
  const concurrency = opts.enrichConcurrency ?? 5;

  const org = await findOrganization(companyName);
  if (!org) {
    return { matchedOrganization: null, organizationDomain: null, contacts: [] };
  }

  let people = await searchPeople(org.id, limit);

  if (autoEnrich && people.length) {
    const enriched: ApolloPerson[] = [];
    for (let i = 0; i < people.length; i += concurrency) {
      const batch = people.slice(i, i + concurrency);
      const results = await Promise.all(batch.map((p) => enrichPerson(p)));
      enriched.push(...results);
    }
    people = enriched;
  }

  return {
    matchedOrganization: org.name,
    organizationDomain: org.primary_domain ?? org.website_url ?? null,
    contacts: people.map((p) => toContact(p, org.name)),
  };
}
