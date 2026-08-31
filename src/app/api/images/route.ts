import { NextRequest, NextResponse } from "next/server";
import { sourceLabel, type DocumentSummary } from "@/lib/documents";
import { createSupabaseClient } from "@/lib/supabase";

const PAGE_SIZE = 24;
type ImageRow = { id: string; document_id: string; page_number: number; storage_path: string; caption: string | null; documents: DocumentSummary | DocumentSummary[] };

export async function GET(request: NextRequest) {
  const source = (request.nextUrl.searchParams.get("source") ?? "").trim();
  const page = Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  try {
    const supabase = createSupabaseClient();
    let query = supabase.from("document_images")
      .select("id,document_id,page_number,storage_path,caption,documents!inner(id,title,source_type,year)", { count: "exact" })
      .eq("excluded", false).order("document_id").order("page_number").range(from, from + PAGE_SIZE - 1);
    if (source) query = query.eq("documents.source_type", source);
    const { data, error, count } = await query;
    if (error) throw error;
    const rows = (data ?? []) as unknown as ImageRow[];
    const items = await Promise.all(rows.map(async (row) => {
      const document = Array.isArray(row.documents) ? row.documents[0] : row.documents;
      const { data: signed } = await supabase.storage.from("incident-images").createSignedUrl(row.storage_path, 3600);
      return { id: row.id, documentId: row.document_id, pageNumber: row.page_number, caption: row.caption,
        imageUrl: signed?.signedUrl ?? supabase.storage.from("incident-images").getPublicUrl(row.storage_path).data.publicUrl,
        title: document?.title ?? "Untitled document", source: document?.source_type ?? "unknown",
        sourceLabel: sourceLabel(document?.source_type ?? "unknown") };
    }));
    return NextResponse.json({ items, total: count ?? 0, page, pageSize: PAGE_SIZE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load images." }, { status: 500 });
  }
}
