# BCA Contact Finder

Internal sales tool: type a company name, get up to 20 named investment
professionals — Portfolio Managers, CIOs, Investment Directors, Fixed Income
heads, family office investment staff, etc. — with title, LinkedIn profile,
email, and phone.

## Why this isn't built on LinkedIn's API directly

LinkedIn's public API (which is all a Composio "LinkedIn" agent can call) does
not expose a people-search-by-company-and-title endpoint. Sales Navigator's
people search is a private product with no public API access — no one can
legally call it from a third-party app. That's why a LinkedIn-only agent can
only return **aggregate audience counts** (as in the JSON you get from
`LINKEDIN_GET_AUDIENCE_COUNTS` / `LINKEDIN_SEARCH_AD_TARGETING_ENTITIES`), not
a list of named people.

To get actual names, this app uses **Apollo.io** (via Composio's Apollo
toolkit) instead, which maintains its own contact database and has a proper
people-search API. LinkedIn is still front-and-center in the product — every
contact returned includes their LinkedIn profile URL — but the underlying
search and enrichment run through Apollo.

## How it works

1. Sales rep types a company name.
2. `APOLLO_ORGANIZATION_SEARCH` resolves it to an Apollo organization.
3. `APOLLO_PEOPLE_SEARCH` finds people at that org matching the target title
   list (`lib/titles.ts` — 28 titles covering PM/CIO/Investment
   Director/Strategist/Fixed Income/Family Office/Macro roles).
4. `APOLLO_PEOPLE_ENRICHMENT` reveals verified email + phone for each match
   (this step spends Apollo credits — see `APOLLO_AUTO_ENRICH` below).
5. Results render as cards with copy-to-clipboard email/phone, a LinkedIn
   link, and one-click CSV export for the CRM.

If `COMPOSIO_API_KEY` is not set, the app runs in **demo mode**: it returns
realistic mock contacts (clearly labeled) so the UI/UX can be reviewed before
any live credentials exist.

## Setup

1. **Composio account** — sign up at [composio.dev](https://composio.dev) if
   you haven't already, and grab an API key from the dashboard.
2. **Connect Apollo** — in the Composio dashboard, add an Apollo connection
   using your Apollo account/API key. Note the user/entity ID that connection
   is attached to (defaults to `"default"` for a single-user setup).
3. Copy `.env.example` to `.env.local` and fill in:
   ```
   COMPOSIO_API_KEY=sk_...
   COMPOSIO_USER_ID=default
   APOLLO_AUTO_ENRICH=true
   ```
4. Install and run:
   ```
   npm install
   npm run dev
   ```
   Open http://localhost:3000.

## Deploying for the sales team

The simplest path is [Vercel](https://vercel.com): import this repo, set the
three environment variables above in the project settings, and deploy. Any
sales team member then just opens the deployed URL — no local setup needed.

## Cost note

Apollo bills per contact enrichment (email/phone reveal), not per search.
Searching is essentially free; revealing 20 contacts' full details on every
lookup will consume Apollo credits accordingly. Set `APOLLO_AUTO_ENRICH=false`
if you'd rather show name/title/LinkedIn immediately and only spend credits
when a rep explicitly asks for contact details (that per-row "reveal on
demand" flow is a natural follow-up if credit usage becomes a concern — the
current version reveals everything up front per your original ask for
contacts "immediately").

## Editing the target titles / firm types

Edit `lib/titles.ts`. `TARGET_TITLES` drives the Apollo `person_titles`
filter; `TARGET_COMPANY_TYPES` is there for future use if you want to bias
ambiguous company-name matches toward asset managers / hedge funds / PE /
family offices specifically.

## Tech stack

Next.js 14 (App Router) + TypeScript, single deployable app. Server route at
`app/api/search/route.ts` calls Composio server-side so the API key never
reaches the browser.
