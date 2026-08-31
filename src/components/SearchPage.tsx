"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HighlightedText } from "./HighlightedText";
import { SourceSelect, type SourceOption } from "./SourceSelect";

type Result = { documentId:string; title:string; sourceLabel:string; year:number|null; pageNumber:number; snippet:string };
type Response = { items:Result[]; total:number; page:number; pageSize:number; error?:string };

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [source, setSource] = useState("");
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Response>({ items:[], total:0, page:1, pageSize:20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const composing = useRef(false);

  useEffect(() => { fetch("/api/sources").then((r) => r.json()).then((r) => setSources(r.sources ?? [])).catch(() => undefined); }, []);
  useEffect(() => { const timer = setTimeout(() => { if (!composing.current) { setDebounced(query); setPage(1); } }, 300); return () => clearTimeout(timer); }, [query]);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page:String(page) });
    if (debounced.trim()) params.set("q", debounced.trim());
    if (source) params.set("source", source);
    queueMicrotask(() => { if (!controller.signal.aborted) { setLoading(true); setError(null); } });
    fetch(`/api/search?${params}`, { signal:controller.signal }).then(async (response) => {
      const json = await response.json(); if (!response.ok) throw new Error(json.error ?? "Search failed."); return json;
    }).then(setData).catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [debounced, source, page]);
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return <main className="shell page">
    <h1 className="page-heading">Search documents</h1>
    <p className="lede">Search page-level text across public process safety and incident investigation documents.</p>
    <section className="search-panel" aria-label="Search controls"><div className="controls">
      <div className="field"><label htmlFor="query">Keywords</label><input id="query" type="search" value={query} placeholder="e.g. vapor cloud, corrosion, explosion" onChange={(e) => setQuery(e.target.value)} onCompositionStart={() => composing.current = true} onCompositionEnd={(e) => { composing.current = false; setQuery(e.currentTarget.value); setDebounced(e.currentTarget.value); }} /></div>
      <SourceSelect value={source} sources={sources} onChange={(value) => { setSource(value); setPage(1); }} />
      <button onClick={() => { setQuery(""); setDebounced(""); setSource(""); }}>Clear</button>
    </div></section>
    <div className="status-row"><span>{loading ? "Searching…" : `${data.total.toLocaleString()} page ${data.total === 1 ? "match" : "matches"}`}</span>{data.total > 0 && <span>Page {page} of {pages}</span>}</div>
    {error && <p className="error">{error}</p>}
    {!error && !loading && !data.items.length && <div className="empty">No matching document pages were found.</div>}
    <ol className="result-list">
      {data.items.map((item) => <li className="result" key={`${item.documentId}-${item.pageNumber}`}><Link href={`/viewer/${encodeURIComponent(item.documentId)}?page=${item.pageNumber}`}>
        <h2><HighlightedText text={item.title} query={debounced} /></h2>
        <div className="meta"><span className="source">{item.sourceLabel}</span>{item.year && <span>Published {item.year}</span>}<span>PDF page {item.pageNumber}</span></div>
        <p className="snippet"><HighlightedText text={item.snippet} query={debounced} /></p>
      </Link></li>)}
    </ol>
    {data.total > data.pageSize && <div className="pager"><button disabled={loading || page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button><span>{page} / {pages}</span><button disabled={loading || page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button></div>}
  </main>;
}
