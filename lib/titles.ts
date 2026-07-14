// Canonical BCA target title/company-type config.
// Edit this file to tune who counts as an "investment professional" for the search.

export const TARGET_TITLES: string[] = [
  "Portfolio Manager",
  "Senior Portfolio Manager",
  "Global Portfolio Manager",
  "Credit Portfolio Manager",
  "Equity Portfolio Manager",
  "Associate Portfolio Manager",
  "Discretionary Portfolio Manager",
  "Portfolio Allocation Manager",
  "Investment Manager",
  "Senior Investment Manager",
  "Asset Manager",
  "Investment Director",
  "Investment Strategist",
  "Head of Investments",
  "Chief Investment Officer",
  "CIO",
  "Head of Equity Allocation",
  "Head of Fixed Income",
  "Director Fixed Income",
  "Vice President Fixed Income",
  "Fixed Income Portfolio Manager",
  "Fixed Income Specialist",
  "Fixed Income Analyst",
  "Fixed Income Trader",
  "Family Office Investments",
  "Family Office Investment Manager",
  "Global Macro Portfolio Manager",
  "Macro Strategist",
];

// Apollo organization keyword tags used to bias company matching toward the
// right kind of firm when a company name is ambiguous (e.g. "Bridgewater").
export const TARGET_COMPANY_TYPES: string[] = [
  "asset management",
  "hedge fund",
  "private equity",
  "family office",
  "investment management",
];

export const MAX_CONTACTS = 20;
