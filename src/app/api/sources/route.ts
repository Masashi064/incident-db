import { NextResponse } from "next/server";
import { sourceLabel } from "@/lib/documents";
import { createSupabaseClient } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await createSupabaseClient().from("documents").select("source_type").order("source_type");
    if (error) throw error;
    const values = [...new Set((data ?? []).map((row) => row.source_type).filter(Boolean))];
    return NextResponse.json({ sources: values.map((value) => ({ value, label: sourceLabel(value) })) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load sources." }, { status: 500 });
  }
}
