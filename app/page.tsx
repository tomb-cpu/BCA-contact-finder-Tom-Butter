"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { TARGET_TITLES } from "@/lib/titles";
import type { SearchResult, Contact } from "@/lib/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

function exportCsv(result: SearchResult) {
  const header = ["Name", "Title", "Company", "LinkedIn", "Email", "Phone", "City", "Country"];
  const rows = result.contacts.map((c) => [
    c.name,
    c.title,
    c.company,
    c.linkedinUrl ?? "",
    c.email ?? "",
    c.phone ?? "",
    c.city ?? "",
    c.country ?? "",
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${result.company.replace(/[^a-z0-9]+/gi, "-")}-contacts.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function ContactCard({ contact }: { contact: Contact }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (field: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied((c) => (c === field ? null : c)), 1500);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div style={{ display: "flex", gap: 10 }}>
          <div className={styles.avatar}>{initials(contact.name) || "?"}</div>
          <div>
            <p className={styles.name}>{contact.name || "Name unavailable"}</p>
            <p className={styles.roleTitle}>{contact.title || "Title unavailable"}</p>
          </div>
        </div>
        {contact.linkedinUrl && (
          <a
            className={styles.linkedinLink}
            href={contact.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <LinkedInIcon /> Profile
          </a>
        )}
      </div>
      <div className={styles.cardDetails}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Email</span>
          <span className={styles.detailValue}>{contact.email ?? <em className={styles.muted}>Not available</em>}</span>
          {contact.email && (
            <button className={styles.copyButton} onClick={() => copy("email", contact.email!)}>
              {copied === "email" ? "Copied" : "Copy"}
            </button>
          )}
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Phone</span>
          <span className={styles.detailValue}>{contact.phone ?? <em className={styles.muted}>Not available</em>}</span>
          {contact.phone && (
            <button className={styles.copyButton} onClick={() => copy("phone", contact.phone!)}>
              {copied === "phone" ? "Copied" : "Copy"}
            </button>
          )}
        </div>
        {(contact.city || contact.country) && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Loc.</span>
            <span className={styles.detailValue}>
              {[contact.city, contact.country].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [showTitles, setShowTitles] = useState(false);

  const runSearch = async () => {
    const trimmed = company.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setResult(data as SearchResult);
      }
    } catch {
      setError("Could not reach the search service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.brand}>
            <span className={styles.brandDot} />
            BCA Contact Finder
          </div>
          <h1 className={styles.title}>Find investment decision-makers, instantly</h1>
          <p className={styles.subtitle}>
            Type any asset manager, hedge fund, private equity firm, or family office. Get up to
            20 named investment professionals — Portfolio Managers, CIOs, Investment Directors and
            more — with title, LinkedIn profile, email and phone.
          </p>
          <div className={styles.searchRow}>
            <input
              className={styles.input}
              placeholder="e.g. Bridgewater Associates"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
            />
            <button className={styles.button} onClick={runSearch} disabled={loading || !company.trim()}>
              {loading ? "Searching…" : "Find Contacts"}
            </button>
          </div>
          <button className={styles.titlesToggle} onClick={() => setShowTitles((v) => !v)}>
            {showTitles ? "Hide" : "Show"} the {TARGET_TITLES.length} titles we search for
          </button>
          {showTitles && (
            <div className={styles.titleChips}>
              {TARGET_TITLES.map((t) => (
                <span className={styles.chip} key={t}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.main}>
        {error && <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div>}

        {result?.demo && (
          <div className={`${styles.banner} ${styles.bannerDemo}`}>
            <strong>Demo mode.</strong> {result.note}
          </div>
        )}

        {result && !result.demo && result.note && (
          <div className={`${styles.banner} ${styles.bannerInfo}`}>{result.note}</div>
        )}

        {loading && (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div className={styles.skeletonCard} key={i} />
            ))}
          </div>
        )}

        {!loading && result && result.contacts.length > 0 && (
          <>
            <div className={styles.resultsHeader}>
              <div className={styles.companyRow}>
                {result.organizationDomain && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.logo}
                    src={`https://logo.clearbit.com/${result.organizationDomain}`}
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div>
                  <p className={styles.companyName}>{result.matchedOrganization}</p>
                  <p className={styles.companyMeta}>
                    {result.contacts.length} contact{result.contacts.length === 1 ? "" : "s"} found
                  </p>
                </div>
              </div>
              <button className={styles.exportButton} onClick={() => exportCsv(result)}>
                Export CSV
              </button>
            </div>
            <div className={styles.grid}>
              {result.contacts.map((c) => (
                <ContactCard contact={c} key={c.id} />
              ))}
            </div>
          </>
        )}

        {!loading && result && result.contacts.length === 0 && (
          <div className={styles.emptyState}>No contacts to show for this search.</div>
        )}

        {!loading && !result && !error && (
          <div className={styles.emptyState}>
            Enter a company name above to pull its investment team's contact details.
          </div>
        )}
      </div>

      <div className={styles.footer}>BCA Contact Finder — internal sales tool</div>
    </div>
  );
}
