import { NextRequest, NextResponse } from "next/server";
import { sourceLabel, type DocumentSummary } from "@/lib/documents";
import { createSupabaseClient } from "@/lib/supabase";
import { getIncidentTaxonomy, matchingIncidentIds } from "@/lib/incident-tags";
import type { TagCategory } from "@/data/taxonomy";

const PAGE_SIZE = 50;
const SORT_FIELDS = ["date", "company", "fatality", "injury", "damage"] as const;
type SortField = (typeof SORT_FIELDS)[number];
// `incidents` (as of this schema) has no fatality/serious-injury/property-damage columns.
// These filter categories are the only ones with real, structured data behind them.
const FILTERABLE_CATEGORIES: TagCategory[] = ["facility_type", "industry"];

type IncidentRow = {
  id: string; document_id: string; title: string | null; start_page: number; end_page: number;
  incident_date: string | null; location: string | null;
  fatality_count?: number | null; serious_injury_count?: number | null; property_damage_musd?: number | null;
  metadata: Record<string, unknown> | null;
  documents: DocumentSummary | DocumentSummary[];
};

function documentOf(value: IncidentRow["documents"]) {
  return Array.isArray(value) ? value[0] : value;
}

// `location` is not yet populated for any row; this parses "City, State" if/when it is,
// without inventing a value when the column is empty.
function splitLocation(location: string | null) {
  if (!location) return { city: null as string | null, state: null as string | null };
  const idx = location.lastIndexOf(",");
  if (idx === -1) return { city: location.trim() || null, state: null };
  return { city: location.slice(0, idx).trim() || null, state: location.slice(idx + 1).trim() || null };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const source = (params.get("source") ?? "").trim();
  const sortParam = params.get("sort") ?? "date";
  const sort = (SORT_FIELDS as readonly string[]).includes(sortParam) ? (sortParam as SortField) : "date";
  const dir = params.get("dir") === "asc" ? "asc" : "desc";
  const filters = Object.fromEntries(
    FILTERABLE_CATEGORIES.map((c) => [c, params.getAll(c).filter(Boolean)]),
  ) as Partial<Record<TagCategory, string[]>>;
  const hasFilters = Object.values(filters).some((v) => v?.length);

  try {
    const supabase = createSupabaseClient();
    let eligibleIds: Set<string> | null = null;
    if (hasFilters) {
      const taxonomy = await getIncidentTaxonomy();
      eligibleIds = matchingIncidentIds(taxonomy, filters);
      if (!eligibleIds.size) return NextResponse.json({ items: [], total: 0, page, pageSize: PAGE_SIZE, sort, dir });
    }

    const selectBase = "id,document_id,title,start_page,end_page,incident_date,location,metadata,documents!inner(id,title,source_type,year)";
    const promotedSelect = "id,document_id,title,start_page,end_page,incident_date,location,metadata,fatality_count,serious_injury_count,property_damage_musd,documents!inner(id,title,source_type,year)";
    const applyFilters = (query: any) => {
      if (source) query = query.eq("documents.source_type", source);
      if (eligibleIds) query = query.in("id", [...eligibleIds]);
      return query;
    };
    let query = applyFilters(supabase.from("incidents").select(promotedSelect));
    let result = await query;
    if (result.error) result = await applyFilters(supabase.from("incidents").select(selectBase));
    const { data, error } = result;
    if (error) throw error;

    const rows = (data ?? []) as unknown as IncidentRow[];
    const items = rows.map((row) => {
      const document = documentOf(row.documents);
      const { city, state } = splitLocation(row.location);
      const event = (row.metadata?.accidental_release_event ?? {}) as Record<string, unknown>;
      const numeric = (value: unknown) => typeof value === "number" ? value : null;
      return {
        incidentId: row.id,
        title: row.title ?? "Untitled incident",
        documentId: row.document_id,
        documentTitle: document?.title ?? "Untitled document",
        source: document?.source_type ?? "unknown",
        sourceLabel: sourceLabel(document?.source_type ?? "unknown"),
        startPage: row.start_page,
        endPage: row.end_page,
        incidentDate: row.incident_date,
        city,
        state,
        fatalityCount: row.fatality_count ?? numeric(event.fatality),
        seriousInjuryCount: row.serious_injury_count ?? numeric(event.serious_injury),
        propertyDamageMillion: row.property_damage_musd ?? numeric(event.substantial_property_damage_musd),
      };
    });

    const dirMul = dir === "asc" ? 1 : -1;
    function sortKey(item: (typeof items)[number]): string | number | null {
      switch (sort) {
        case "company": return item.title.toLowerCase();
        case "fatality": return item.fatalityCount;
        case "injury": return item.seriousInjuryCount;
        case "damage": return item.propertyDamageMillion;
        default: return item.incidentDate;
      }
    }
    items.sort((a, b) => {
      const av = sortKey(a);
      const bv = sortKey(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (av < bv) return -1 * dirMul;
      if (av > bv) return 1 * dirMul;
      return 0;
    });

    const total = items.length;
    const from = (page - 1) * PAGE_SIZE;
    const paged = items.slice(from, from + PAGE_SIZE);
    return NextResponse.json({ items: paged, total, page, pageSize: PAGE_SIZE, sort, dir });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load incidents." }, { status: 500 });
  }
}
