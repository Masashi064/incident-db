"use client";
import Link from "next/link";
import { useEffect,useRef,useState } from "react";
import { HighlightedText } from "./HighlightedText";
import { SourceSelect,type SourceOption } from "./SourceSelect";
import { IncidentTags } from "./IncidentTags";
import { TaxonomyHelp } from "./TaxonomyHelp";
import { TagFilterDropdown } from "./TagFilterDropdown";
import { FILTER_CATEGORIES,categoryDefinitions,type TagCategory } from "@/data/taxonomy";
import type { IncidentTaxonomy } from "@/lib/incident-tags";
type Result={documentId:string;title:string;sourceLabel:string;year:number|null;pageNumber:number;snippet:string;incident:IncidentTaxonomy|null};
type Response={items:Result[];total:number;page:number;pageSize:number;error?:string};
type Options=Partial<Record<TagCategory,string[]>>;
export default function SearchPage(){
 const[query,setQuery]=useState("");const[debounced,setDebounced]=useState("");const[source,setSource]=useState("");const[sources,setSources]=useState<SourceOption[]>([]);const[page,setPage]=useState(1);const[data,setData]=useState<Response>({items:[],total:0,page:1,pageSize:20});const[options,setOptions]=useState<Options>({});const[filters,setFilters]=useState<Options>({});const[loading,setLoading]=useState(true);const[error,setError]=useState<string|null>(null);const composing=useRef(false);
 const[openCategory,setOpenCategory]=useState<TagCategory|null>(null);const filterBarRef=useRef<HTMLDivElement>(null);const triggerRefs=useRef<Partial<Record<TagCategory,HTMLButtonElement|null>>>({});
 useEffect(()=>{fetch("/api/sources").then(r=>r.json()).then(r=>setSources(r.sources??[])).catch(()=>undefined);fetch("/api/tags/options").then(r=>r.json()).then(r=>setOptions(r.options??{})).catch(()=>undefined);},[]);
 useEffect(()=>{const timer=setTimeout(()=>{if(!composing.current){setDebounced(query);setPage(1);}},300);return()=>clearTimeout(timer);},[query]);
 useEffect(()=>{const controller=new AbortController();const params=new URLSearchParams({page:String(page)});if(debounced.trim())params.set("q",debounced.trim());if(source)params.set("source",source);for(const[c,values]of Object.entries(filters))for(const value of values??[])params.append(c,value);queueMicrotask(()=>{if(!controller.signal.aborted){setLoading(true);setError(null);}});fetch(`/api/search?${params}`,{signal:controller.signal}).then(async response=>{const json=await response.json();if(!response.ok)throw new Error(json.error??"Search failed.");return json;}).then(setData).catch(reason=>{if(reason.name!=="AbortError")setError(reason.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[debounced,source,page,filters]);
 useEffect(()=>{
  if(!openCategory)return;
  function onPointerDown(e:MouseEvent){if(filterBarRef.current&&!filterBarRef.current.contains(e.target as Node))setOpenCategory(null);}
  function onKeyDown(e:KeyboardEvent){if(e.key==="Escape"&&openCategory){triggerRefs.current[openCategory]?.focus();setOpenCategory(null);}}
  document.addEventListener("mousedown",onPointerDown);document.addEventListener("keydown",onKeyDown);
  return()=>{document.removeEventListener("mousedown",onPointerDown);document.removeEventListener("keydown",onKeyDown);};
 },[openCategory]);
 const toggle=(category:TagCategory,value:string)=>{setFilters(current=>{const selected=current[category]??[];return{...current,[category]:selected.includes(value)?selected.filter(v=>v!==value):[...selected,value]};});setPage(1);};
 const clearFilters=()=>{setFilters({});setPage(1);};
 const chipEntries=FILTER_CATEGORIES.flatMap(category=>(filters[category]??[]).map(value=>({category,value})));
 const active=chipEntries.length;const pages=Math.max(1,Math.ceil(data.total/data.pageSize));
 return <main className="shell page"><div className="heading-row"><div><h1 className="page-heading">Search documents</h1><p className="lede">Search page-level text across public process safety and incident investigation documents.</p></div></div>
 <section className="search-panel" aria-label="Search controls"><div className="controls"><div className="field"><label htmlFor="query">Keywords</label><input id="query" type="search" value={query} placeholder="e.g. vapor cloud, corrosion, explosion" onChange={e=>setQuery(e.target.value)} onCompositionStart={()=>composing.current=true} onCompositionEnd={e=>{composing.current=false;setQuery(e.currentTarget.value);setDebounced(e.currentTarget.value);}}/></div><SourceSelect value={source} sources={sources} onChange={value=>{setSource(value);setPage(1);}}/><button onClick={()=>{setQuery("");setDebounced("");setSource("");setFilters({});}}>Clear</button></div>
 <section className="filter-panel" aria-label="Incident tag filters">
  <div className="filter-head"><h2 className="filter-heading">Incident tag filters</h2><TaxonomyHelp/></div>
  <p className="filter-help">Select any match within a category; selections across categories must all match.</p>
  {active>0&&<div className="selected-filters"><span className="selected-label">Selected:</span><ul className="chip-list">{chipEntries.map(({category,value})=><li key={`${category}-${value}`}><button type="button" className="chip" onClick={()=>toggle(category,value)} aria-label={`Remove ${categoryDefinitions[category].label} filter: ${value}`}><span>{value}</span><span className="chip-remove" aria-hidden="true">×</span></button></li>)}</ul><button type="button" className="text-button clear-filters" onClick={clearFilters}>Clear all</button></div>}
  <p className="filter-status" role="status" aria-live="polite">{loading?<><span className="spinner" aria-hidden="true"></span> Updating results…</>:active>0?`Showing ${data.total.toLocaleString()} ${data.total===1?"page":"pages"} matching ${active} selected ${active===1?"tag":"tags"}`:null}</p>
  <div className="tag-filters" ref={filterBarRef}>{FILTER_CATEGORIES.map(category=><TagFilterDropdown key={category} category={category} values={options[category]??[]} selected={filters[category]??[]} open={openCategory===category} onToggleOpen={()=>setOpenCategory(current=>current===category?null:category)} onToggleValue={value=>toggle(category,value)} registerTrigger={el=>{triggerRefs.current[category]=el;}}/>)}</div>
 </section></section>
 <div className="status-row"><span>{loading?"Searching…":`${data.total.toLocaleString()} page ${data.total===1?"match":"matches"}`}</span>{data.total>0&&<span>Page {page} of {pages}</span>}</div>{error&&<p className="error">{error}</p>}{!error&&!loading&&!data.items.length&&<div className="empty">No matching document pages were found.</div>}
 <ol className="result-list">{data.items.map(item=><li className="result" key={`${item.documentId}-${item.pageNumber}`}><div className="result-body"><Link className="result-title" href={`/viewer/${encodeURIComponent(item.documentId)}?page=${item.pageNumber}`}><h2><HighlightedText text={item.title} query={debounced}/></h2></Link><div className="meta"><span className="source">{item.sourceLabel}</span>{item.year&&<span>Published {item.year}</span>}<span>PDF page {item.pageNumber}</span></div><p className="snippet"><HighlightedText text={item.snippet} query={debounced}/></p>{item.incident&&<IncidentTags incident={item.incident}/>}</div></li>)}</ol>
 {data.total>data.pageSize&&<div className="pager"><button disabled={loading||page===1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>{page} / {pages}</span><button disabled={loading||page>=pages} onClick={()=>setPage(p=>p+1)}>Next</button></div>}</main>;
}
