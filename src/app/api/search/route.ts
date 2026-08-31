import { NextRequest, NextResponse } from "next/server";
import { excerpt, sourceLabel, type DocumentSummary } from "@/lib/documents";
import { createSupabaseClient } from "@/lib/supabase";

const PAGE_SIZE = 20;
type PageRow = { document_id: string; page_number: number; text: string | null; documents: DocumentSummary | DocumentSummary[] };

function documentOf(value: PageRow["documents"]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const source = (request.nextUrl.searchParams.get("source") ?? "").trim();
  const page = Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  try {
    const supabase = createSupabaseClient();
    let query = supabase
      .from("document_pages")
      .select("document_id,page_number,text,documents!inner(id,title,source_type,year)", { count: "exact" })
      .order("document_id")
      .order("page_number")
      .range(from, from + PAGE_SIZE - 1);
    if (q) query = query.textSearch("search_vector", q, { type: "websearch", config: "english" });
    if (source) query = query.eq("documents.source_type", source);
    let result = await query;

    // Older deployments may not yet have the generated search_vector column.
    if (result.error && q && /search_vector/i.test(result.error.message)) {
      let fallback = supabase
        .from("document_pages")
        .select("document_id,page_number,text,documents!inner(id,title,source_type,year)", { count: "exact" })
        .textSearch("text", q, { type: "websearch", config: "english" })
        .order("document_id").order("page_number").range(from, from + PAGE_SIZE - 1);
      if (source) fallback = fallback.eq("documents.source_type", source);
      result = await fallback;
    }
    if (result.error) throw result.error;
    const rows = (result.data ?? []) as unknown as PageRow[];
    return NextResponse.json({
      items: rows.map((row) => {
        const document = documentOf(row.documents);
        return {
          documentId: row.document_id,
          title: document?.title ?? "Untitled document",
          source: document?.source_type ?? "unknown",
          sourceLabel: sourceLabel(document?.source_type ?? "unknown"),
          year: document?.year ?? null,
          pageNumber: row.page_number,
          snippet: excerpt(row.text, q),
        };
      }),
      total: result.count ?? 0, page, pageSize: PAGE_SIZE,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Search failed." }, { status: 500 });
  }
}
