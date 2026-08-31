"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export default function PdfViewer({ documentId, initialPage }: { documentId:string; initialPage:number }) {
  const router=useRouter(); const container=useRef<HTMLDivElement|null>(null); const [width,setWidth]=useState(900); const [pages,setPages]=useState(0);
  const [page,setPage]=useState(Math.max(1,initialPage)); const [input,setInput]=useState(String(Math.max(1,initialPage))); const [error,setError]=useState<string|null>(null);
  const file=useMemo(()=>`/api/documents/${encodeURIComponent(documentId)}/pdf`,[documentId]);
  useEffect(()=>{ if(!container.current)return; const observer=new ResizeObserver(()=>setWidth(container.current?.clientWidth??900)); observer.observe(container.current); return()=>observer.disconnect(); },[]);
  function go(next:number){ const bounded=Math.min(Math.max(1,next),pages||next); setPage(bounded); setInput(String(bounded)); router.replace(`/viewer/${encodeURIComponent(documentId)}?page=${bounded}`,{scroll:false}); }
  return <main className="viewer-shell"><div className="viewer-head"><div><h1>PDF viewer</h1><div className="meta"><span>Document {documentId}</span><span>Physical PDF page {page}</span></div></div><Link href="/">← Back to search</Link></div>
    <div className="viewer-toolbar"><button disabled={page<=1} onClick={()=>go(page-1)}>Previous</button><label>Page <input aria-label="Page number" inputMode="numeric" value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter")go(Number.parseInt(input,10)||1);}} onBlur={()=>go(Number.parseInt(input,10)||page)}/></label><span>of {pages||"…"}</span><button disabled={!pages||page>=pages} onClick={()=>go(page+1)}>Next</button><a href={`${file}?download=1`} target="_blank" rel="noreferrer">Open PDF</a></div>
    <div className="viewer-canvas" ref={container}>{error?<div className="viewer-error"><p className="error">{error}</p><a href={file} target="_blank" rel="noreferrer">Open PDF in a new tab</a></div>:<Document file={file} onLoadSuccess={({numPages})=>{setPages(numPages);if(page>numPages)go(numPages);}} onLoadError={(reason)=>setError(reason.message||"Unable to load PDF.")} loading={<div className="viewer-error">Loading PDF…</div>}><Page pageNumber={page} width={Math.max(280,Math.min(width-38,1100))} renderTextLayer={false} renderAnnotationLayer={false} loading={<div className="viewer-error">Rendering page {page}…</div>}/></Document>}</div>
  </main>;
}
