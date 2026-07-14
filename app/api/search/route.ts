import { NextRequest, NextResponse } from "next/server";
import { getCompanyContacts } from "@/lib/apollo";
import { buildMockResult } from "@/lib/mock";
import { MAX_CONTACTS } from "@/lib/titles";
import type { SearchResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { company?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const company = body.company?.trim();
  if (!company) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  if (!process.env.COMPOSIO_API_KEY) {
    return NextResponse.json(buildMockResult(company, MAX_CONTACTS));
  }

  try {
    const autoEnrich = process.env.APOLLO_AUTO_ENRICH !== "false";
    const { matchedOrganization, organizationDomain, contacts } = await getCompanyContacts(
      company,
      { limit: MAX_CONTACTS, autoEnrich }
    );

    if (!matchedOrganization) {
      const result: SearchResult = {
        company,
        matchedOrganization: null,
        organizationDomain: null,
        contacts: [],
        demo: false,
        note: `No matching company found in Apollo for "${company}". Check spelling, or try the firm's registered name.`,
      };
      return NextResponse.json(result);
    }

    const result: SearchResult = {
      company,
      matchedOrganization,
      organizationDomain,
      contacts,
      demo: false,
      note:
        contacts.length === 0
          ? `Found ${matchedOrganization} but no one there matched the target investment titles.`
          : null,
    };
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed.";
    return NextResponse.json(
      { error: `${message} Check the Composio/Apollo connection.` },
      { status: 502 }
    );
  }
}
