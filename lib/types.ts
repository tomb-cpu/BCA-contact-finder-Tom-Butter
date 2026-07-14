export interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  linkedinUrl: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
}

export interface SearchResult {
  company: string;
  matchedOrganization: string | null;
  organizationDomain: string | null;
  contacts: Contact[];
  demo: boolean;
  note: string | null;
}
