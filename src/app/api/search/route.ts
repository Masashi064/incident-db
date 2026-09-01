import { NextRequest,NextResponse } from "next/server";
import { excerpt,sourceLabel,type DocumentSummary } from "@/lib/documents";
import { createSupabaseClient } from "@/lib/supabase";
import { FILTER_CATEGORIES,type TagCategory } from "@/data/taxonomy";
import { getIncidentTaxonomy,incidentForPage,matchingIncidentIds } from "@/lib/incident-tags";
const PAGE_SIZE=20;
type PageRow={document_id:string;page_number:number;text:string|null;documents:DocumentSummary|DocumentSummary[]};
function documentOf(value:PageRow["documents"]){return Array.isArray(value)?value[0]:value;}
export async function GET(request:NextRequest){const q=(request.nextUrl.searchParams.get("q")??"").trim();const source=(request.nextUrl.searchParams.get("source")??"").trim();const page=Math.max(1,Number.parseInt(request.nextUrl.searchParams.get("page")??"1",10)||1);const from=(page-1)*PAGE_SIZE;
 try{const supabase=createSupabaseClient();const taxonomy=await getIncidentTaxonomy();const filters=Object.fromEntries(FILTER_CATEGORIES.map(c=>[c,request.nextUrl.searchParams.getAll(c).filter(Boolean)])) as Partial<Record<TagCategory,string[]>>;const hasFilters=Object.values(filters).some(v=>v?.length);let eligible=taxonomy;if(hasFilters){const ids=matchingIncidentIds(taxonomy,filters);eligible=taxonomy.filter(i=>ids.has(i.incidentId));if(!eligible.length)return NextResponse.json({items:[],total:0,page,pageSize:PAGE_SIZE});}
  let query=supabase.from("document_pages").select("document_id,page_number,text,documents!inner(id,title,source_type,year)",{count:"exact"}).order("document_id").order("page_number").range(from,from+PAGE_SIZE-1);
  if(q)query=query.textSearch("search_vector",q,{type:"websearch",config:"english"});if(source)query=query.eq("documents.source_type",source);
  if(hasFilters){const ranges=eligible.map(i=>`and(document_id.eq.${i.documentId},page_number.gte.${i.startPage},page_number.lte.${i.endPage})`);query=query.or(ranges.join(","));}
  let result=await query;
  if(result.error&&q&&/search_vector/i.test(result.error.message)){let fallback=supabase.from("document_pages").select("document_id,page_number,text,documents!inner(id,title,source_type,year)",{count:"exact"}).textSearch("text",q,{type:"websearch",config:"english"}).order("document_id").order("page_number").range(from,from+PAGE_SIZE-1);if(source)fallback=fallback.eq("documents.source_type",source);if(hasFilters){const ranges=eligible.map(i=>`and(document_id.eq.${i.documentId},page_number.gte.${i.startPage},page_number.lte.${i.endPage})`);fallback=fallback.or(ranges.join(","));}result=await fallback;}
  if(result.error)throw result.error;const rows=(result.data??[]) as unknown as PageRow[];return NextResponse.json({items:rows.map(row=>{const document=documentOf(row.documents);return{documentId:row.document_id,title:document?.title??"Untitled document",source:document?.source_type??"unknown",sourceLabel:sourceLabel(document?.source_type??"unknown"),year:document?.year??null,pageNumber:row.page_number,snippet:excerpt(row.text,q),incident:incidentForPage(taxonomy,row.document_id,row.page_number)};}),total:result.count??0,page,pageSize:PAGE_SIZE});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Search failed."},{status:500});}}
