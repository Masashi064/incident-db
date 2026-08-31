"use client";
/* eslint-disable @next/next/no-img-element -- image hosts are runtime Supabase signed URLs */

import Link from "next/link";
import { useEffect, useState } from "react";
import { SourceSelect, type SourceOption } from "./SourceSelect";

type Item = { id:string; documentId:string; pageNumber:number; caption:string|null; imageUrl:string; title:string; sourceLabel:string };
type Response = { items:Item[]; total:number; page:number; pageSize:number };

export default function ImagesPage() {
  const [source,setSource] = useState(""); const [sources,setSources] = useState<SourceOption[]>([]); const [page,setPage] = useState(1);
  const [data,setData] = useState<Response>({items:[],total:0,page:1,pageSize:24}); const [loading,setLoading] = useState(true); const [error,setError] = useState<string|null>(null);
  useEffect(() => { fetch("/api/sources").then((r) => r.json()).then((r) => setSources(r.sources ?? [])).catch(() => undefined); }, []);
  useEffect(() => { const controller = new AbortController(); const params = new URLSearchParams({page:String(page)}); if(source) params.set("source",source); queueMicrotask(()=>{if(!controller.signal.aborted){setLoading(true);setError(null);}});
    fetch(`/api/images?${params}`,{signal:controller.signal}).then(async(r)=>{const j=await r.json();if(!r.ok)throw new Error(j.error??"Unable to load images.");return j;}).then(setData).catch((e)=>{if(e.name!=="AbortError")setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);}); return()=>controller.abort(); },[source,page]);
  const pages=Math.max(1,Math.ceil(data.total/data.pageSize));
  return <main className="shell page"><h1 className="page-heading">Document images</h1><p className="lede">User-facing figures and photographs extracted from the document library. Select an image to open its PDF page.</p>
    <section className="search-panel"><div className="controls" style={{gridTemplateColumns:"minmax(220px, 300px) auto"}}><SourceSelect value={source} sources={sources} onChange={(value)=>{setSource(value);setPage(1);}}/><button onClick={()=>{setSource("");setPage(1);}}>Clear</button></div></section>
    <div className="status-row"><span>{loading?"Loading images…":`${data.total.toLocaleString()} images`}</span>{data.total>0&&<span>Page {page} of {pages}</span>}</div>
    {error&&<p className="error">{error}</p>}{!error&&!loading&&!data.items.length&&<div className="empty">No gallery images were found.</div>}
    <div className="gallery">{data.items.map((item)=><Link className="image-card" href={`/viewer/${encodeURIComponent(item.documentId)}?page=${item.pageNumber}`} key={item.id}><div className="thumb">{/* Signed Supabase URLs are dynamic and cannot use a static Next Image host allowlist. */}<img src={item.imageUrl} alt={item.caption||`Image from ${item.title}, page ${item.pageNumber}`} loading="lazy"/></div><div className="image-info"><span className="source">{item.sourceLabel} · page {item.pageNumber}</span><h2>{item.title}</h2>{item.caption&&<p className="caption">{item.caption}</p>}</div></Link>)}</div>
    {data.total>data.pageSize&&<div className="pager"><button disabled={loading||page===1} onClick={()=>setPage((p)=>p-1)}>Previous</button><span>{page} / {pages}</span><button disabled={loading||page>=pages} onClick={()=>setPage((p)=>p+1)}>Next</button></div>}
  </main>;
}
