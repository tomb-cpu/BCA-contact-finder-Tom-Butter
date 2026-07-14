import { TARGET_TITLES } from "./titles";
import type { Contact, SearchResult } from "./types";

const FIRST_NAMES = [
  "James", "Olivia", "William", "Sophia", "Alexander", "Charlotte", "Benjamin",
  "Amelia", "Henry", "Isabella", "Edward", "Grace", "George", "Emily",
  "Thomas", "Chloe", "Oliver", "Freya", "Samuel", "Eleanor",
];

const LAST_NAMES = [
  "Whitfield", "Ashworth", "Marlowe", "Sinclair", "Harrington", "Pemberton",
  "Fairweather", "Hargreaves", "Kensington", "Radcliffe", "Ellison",
  "Blackwood", "Carmichael", "Delacroix", "Winslow", "Thackeray",
  "Beaumont", "Sutherland", "Montague", "Fitzgerald",
];

function slugifyDomain(company: string): string {
  return (
    company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20) || "example"
  ) + ".com";
}

function seededPick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function buildMockResult(company: string, limit: number): SearchResult {
  const domain = slugifyDomain(company);
  const contacts: Contact[] = Array.from({ length: limit }).map((_, i) => {
    const first = seededPick(FIRST_NAMES, i * 7 + 3);
    const last = seededPick(LAST_NAMES, i * 11 + 5);
    const title = seededPick(TARGET_TITLES, i * 13 + 1);
    const handle = `${first}${last}`.toLowerCase();
    return {
      id: `demo-${i}`,
      name: `${first} ${last}`,
      title,
      company,
      linkedinUrl: `https://www.linkedin.com/in/${handle}-${(i + 1) * 17}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
      phone: `+1 (415) 555-${String(1000 + i * 37).slice(-4)}`,
      city: seededPick(["New York", "London", "Boston", "Chicago", "Zurich", "Singapore"], i),
      country: seededPick(["USA", "UK", "USA", "USA", "Switzerland", "Singapore"], i),
    };
  });

  return {
    company,
    matchedOrganization: company,
    organizationDomain: domain,
    contacts,
    demo: true,
    note:
      "Demo data — Composio is not yet connected to a live contact-enrichment provider (e.g. Apollo.io). Set COMPOSIO_API_KEY and connect Apollo to return real contacts.",
  };
}
