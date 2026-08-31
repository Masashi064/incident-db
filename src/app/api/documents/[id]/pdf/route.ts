import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = createSupabaseClient();
    const { data: document, error } = await supabase.from("documents").select("storage_path,filename").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!document?.storage_path) return NextResponse.json({ error: "PDF is not available." }, { status: 404 });
    const { data: signed, error: signError } = await supabase.storage.from("incident-pdfs").createSignedUrl(document.storage_path, 300);
    const publicUrl = supabase.storage.from("incident-pdfs").getPublicUrl(document.storage_path).data.publicUrl;
    const storageUrl = signed?.signedUrl || publicUrl;
    if (!storageUrl) throw signError ?? new Error("Unable to resolve PDF.");
    const headers = new Headers();
    const range = request.headers.get("range");
    if (range) headers.set("range", range);
    const upstream = await fetch(storageUrl, { headers, cache: "no-store" });
    if (!upstream.ok || !upstream.body) throw new Error(`Storage returned HTTP ${upstream.status}.`);
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set("content-type", "application/pdf");
    responseHeaders.set("content-disposition", `inline; filename="${String(document.filename ?? "incident.pdf").replace(/["\r\n]/g, "")}"`);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load PDF." }, { status: 500 });
  }
}
