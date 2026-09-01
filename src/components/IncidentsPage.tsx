"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SourceSelect, type SourceOption } from "./SourceSelect";
import { TagFilterDropdown } from "./TagFilterDropdown";
import { categoryDefinitions, type TagCategory } from "@/data/taxonomy";

const FILTERABLE_CATEGORIES: TagCategory[] = ["facility_type", "industry"];
type SortField = "date" | "company" | "fatality" | "injury" | "damage";

type Item = {
  incidentId: string; title: string; documentId: string; documentTitle: string;
  source: string; sourceLabel: string; startPage: number; endPage: number;
  incidentDate: string | null; city: string | null; state: string | null;
  fatalityCount: number | null; seriousInjuryCount: number | null; propertyDamageMillion: number | null;
};
type Response = { items: Item[]; total: number; page: number; pageSize: number; error?: string };
type Options = Partial<Record<TagCategory, string[]>>;

function formatDate(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function formatCount(value: number | null) {
  return value === null ? "-" : value.toLocaleString();
}
function formatDamage(value: number | null) {
  return value === null ? "-" : value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export default function IncidentsPage() {
  const [source, setSource] = useState("");
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [options, setOptions] = useState<Options>({});
  const [filters, setFilters] = useState<Options>({});
  const [sort, setSort] = useState<SortField>("date");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Response>({ items: [], total: 0, page: 1, pageSize: 50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<TagCategory | null>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Partial<Record<TagCategory, HTMLButtonElement | null>>>({});

  useEffect(() => {
    fetch("/api/sources").then((r) => r.json()).then((r) => setSources(r.sources ?? [])).catch(() => undefined);
    fetch("/api/tags/options").then((r) => r.json()).then((r) => setOptions(r.options ?? {})).catch(() => undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), sort, dir });
    if (source) params.set("source", source);
    for (const [category, values] of Object.entries(filters)) for (const value of values ?? []) params.append(category, value);
    queueMicrotask(() => { if (!controller.signal.aborted) { setLoading(true); setError(null); } });
    fetch(`/api/incidents?${params}`, { signal: controller.signal })
      .then(async (response) => { const json = await response.json(); if (!response.ok) throw new Error(json.error ?? "Unable to load incidents."); return json; })
      .then(setData)
      .catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [source, filters, sort, dir, page]);

  useEffect(() => {
    if (!openCategory) return;
    function onPointerDown(e: MouseEvent) { if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) setOpenCategory(null); }
    function onKeyDown(e: KeyboardEvent) { if (e.key === "Escape" && openCategory) { triggerRefs.current[openCategory]?.focus(); setOpenCategory(null); } }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("mousedown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [openCategory]);

  const toggleFilter = (category: TagCategory, value: string) => {
    setFilters((current) => { const selected = current[category] ?? []; return { ...current, [category]: selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value] }; });
    setPage(1);
  };
  const chipEntries = FILTERABLE_CATEGORIES.flatMap((category) => (filters[category] ?? []).map((value) => ({ category, value })));
  const active = chipEntries.length;
  const clearFilters = () => { setFilters({}); setPage(1); };

  function changeSort(field: SortField) {
    if (field === sort) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(field); setDir(field === "company" ? "asc" : "desc"); }
    setPage(1);
  }

  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const totals = data.items.reduce(
    (acc, item) => ({
      fatalities: acc.fatalities + (item.fatalityCount ?? 0),
      injuries: acc.injuries + (item.seriousInjuryCount ?? 0),
      damage: acc.damage + (item.propertyDamageMillion ?? 0),
      knownFatalities: acc.knownFatalities || item.fatalityCount !== null,
      knownInjuries: acc.knownInjuries || item.seriousInjuryCount !== null,
      knownDamage: acc.knownDamage || item.propertyDamageMillion !== null,
    }),
    { fatalities: 0, injuries: 0, damage: 0, knownFatalities: false, knownInjuries: false, knownDamage: false },
  );

  return (
    <main className="shell page">
      <h1 className="page-heading">Incidents</h1>
      <p className="lede">Structured incident boundaries extracted from public process safety and incident investigation documents. Select a company or incident title to open the source article in the PDF viewer.</p>

      <section className="search-panel" aria-label="Incident filters">
        <div className="controls" style={{ gridTemplateColumns: "minmax(220px,300px) auto" }}>
          <SourceSelect value={source} sources={sources} onChange={(value) => { setSource(value); setPage(1); }} />
          <button onClick={() => { setSource(""); clearFilters(); }}>Clear</button>
        </div>
        <p className="filter-help">Facility Type and Industry filters use the same AI taxonomy classification as the Search page.</p>
        {active > 0 && (
          <div className="selected-filters">
            <span className="selected-label">Selected:</span>
            <ul className="chip-list">
              {chipEntries.map(({ category, value }) => (
                <li key={`${category}-${value}`}>
                  <button type="button" className="chip" onClick={() => toggleFilter(category, value)} aria-label={`Remove ${categoryDefinitions[category].label} filter: ${value}`}>
                    <span>{value}</span><span className="chip-remove" aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="text-button clear-filters" onClick={clearFilters}>Clear all</button>
          </div>
        )}
        <div className="tag-filters" ref={filterBarRef}>
          {FILTERABLE_CATEGORIES.map((category) => (
            <TagFilterDropdown
              key={category}
              category={category}
              values={options[category] ?? []}
              selected={filters[category] ?? []}
              open={openCategory === category}
              onToggleOpen={() => setOpenCategory((c) => (c === category ? null : category))}
              onToggleValue={(value) => toggleFilter(category, value)}
              registerTrigger={(el) => { triggerRefs.current[category] = el; }}
            />
          ))}
        </div>
      </section>

      <div className="status-row">
        <span>{loading ? "Updating…" : `${data.total.toLocaleString()} ${data.total === 1 ? "incident" : "incidents"}`}</span>
        {data.total > 0 && <span>Page {page} of {pages}</span>}
      </div>
      {error && <p className="error">{error}</p>}
      {!error && !loading && !data.items.length && <div className="empty">No incidents matched these filters.</div>}

      {data.items.length > 0 && (
        <>
          <div className="incident-table-wrap">
            <table className="incident-table">
              <caption className="visually-hidden">Structured incident list</caption>
              <thead>
                <tr>
                  <SortHeader label="Incident Date" field="date" sort={sort} dir={dir} onSort={changeSort} />
                  <SortHeader label="Company / Incident" field="company" sort={sort} dir={dir} onSort={changeSort} />
                  <th scope="col">City</th>
                  <th scope="col">State</th>
                  <SortHeader label="Fatality" field="fatality" sort={sort} dir={dir} onSort={changeSort} align="right" />
                  <SortHeader label="Serious Injury" field="injury" sort={sort} dir={dir} onSort={changeSort} align="right" />
                  <SortHeader label="Property Damage ($M)" field="damage" sort={sort} dir={dir} onSort={changeSort} align="right" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.incidentId}>
                    <td data-label="Incident Date">{formatDate(item.incidentDate)}</td>
                    <td data-label="Company / Incident">
                      <Link href={`/viewer/${encodeURIComponent(item.documentId)}?page=${item.startPage}`}>{item.title}</Link>
                      <span className="incident-source">{item.sourceLabel}</span>
                    </td>
                    <td data-label="City">{item.city ?? "-"}</td>
                    <td data-label="State">{item.state ?? "-"}</td>
                    <td data-label="Fatality" className="num">{formatCount(item.fatalityCount)}</td>
                    <td data-label="Serious Injury" className="num">{formatCount(item.seriousInjuryCount)}</td>
                    <td data-label="Property Damage ($M)" className="num">{formatDamage(item.propertyDamageMillion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="incident-totals">
            {data.total.toLocaleString()} incident{data.total === 1 ? "" : "s"} shown
            {totals.knownFatalities && ` · ${totals.fatalities.toLocaleString()} fatalities`}
            {totals.knownInjuries && ` · ${totals.injuries.toLocaleString()} serious injuries`}
            {totals.knownDamage && ` · $${totals.damage.toLocaleString(undefined, { maximumFractionDigits: 3 })}M property damage`}
          </p>
        </>
      )}

      {data.total > data.pageSize && (
        <div className="pager">
          <button disabled={loading || page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>{page} / {pages}</span>
          <button disabled={loading || page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </main>
  );
}

function SortHeader({ label, field, sort, dir, onSort, align }: { label: string; field: SortField; sort: SortField; dir: "asc" | "desc"; onSort: (field: SortField) => void; align?: "right" }) {
  const activeSort = sort === field;
  return (
    <th scope="col" aria-sort={activeSort ? (dir === "asc" ? "ascending" : "descending") : "none"} className={align === "right" ? "num" : undefined}>
      <button type="button" className="sort-button" onClick={() => onSort(field)}>
        {label}
        {activeSort && <span aria-hidden="true" className="sort-indicator">{dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}
