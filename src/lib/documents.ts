export type DocumentSummary = {
  id: string;
  title: string;
  source_type: string;
  year: number | null;
};

export function sourceLabel(source: string) {
  const known: Record<string, string> = {
    ccps: "CCPS Safety Beacon",
    csb: "CSB",
  };
  return known[source.toLowerCase()] ?? source.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function excerpt(text: string | null, query: string, radius = 190) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  const terms = query.trim().split(/\s+/).map((term) => term.replace(/^[-+]+/, "")).filter(Boolean);
  if (!terms.length) return clean.slice(0, radius * 2);
  const lower = clean.toLowerCase();
  const hits = terms.map((term) => lower.indexOf(term.toLowerCase())).filter((index) => index >= 0);
  const hit = hits.length ? Math.min(...hits) : 0;
  const start = Math.max(0, hit - radius);
  const end = Math.min(clean.length, hit + radius);
  return `${start ? "…" : ""}${clean.slice(start, end)}${end < clean.length ? "…" : ""}`;
}
