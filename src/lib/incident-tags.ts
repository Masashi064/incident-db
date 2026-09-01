import "server-only";
import { unstable_cache } from "next/cache";
import { createSupabaseClient } from "@/lib/supabase";
import { TAG_CATEGORIES, TAXONOMY_VERSION, type TagCategory } from "@/data/taxonomy";
export type IncidentTag = { category:TagCategory; value:string; confidence:number; evidence:string };
export type IncidentTaxonomy = { incidentId:string; title:string|null; documentId:string; startPage:number; endPage:number; reviewStatus:string; reviewRequired:boolean; classificationNotes:string|null; tags:IncidentTag[] };
type C = {id:string;incident_id:string;review_status:string;review_required:boolean;classification_notes:string|null};
type I = {id:string;title:string|null;document_id:string;start_page:number;end_page:number};
type T = {classification_id:string;tag_category:string;tag_value:string;confidence:number|string;evidence:string};
async function fetchAll(): Promise<IncidentTaxonomy[]> {
  const db=createSupabaseClient();
  const cr=await db.from("incident_classifications").select("id,incident_id,review_status,review_required,classification_notes").eq("taxonomy_version",TAXONOMY_VERSION).neq("review_status","rejected");
  if(cr.error) throw cr.error; const cs=(cr.data??[]) as C[]; if(!cs.length) return [];
  const [ir,tr]=await Promise.all([
    db.from("incidents").select("id,title,document_id,start_page,end_page").in("id",cs.map(x=>x.incident_id)),
    db.from("incident_tags").select("classification_id,tag_category,tag_value,confidence,evidence").in("classification_id",cs.map(x=>x.id)).eq("taxonomy_version",TAXONOMY_VERSION).eq("source","ai").neq("review_status","rejected")
  ]);
  if(ir.error) throw ir.error; if(tr.error) throw tr.error;
  const incidents=new Map(((ir.data??[]) as I[]).map(x=>[x.id,x])); const by=new Map<string,IncidentTag[]>();
  for(const row of (tr.data??[]) as T[]){ if(!TAG_CATEGORIES.includes(row.tag_category as TagCategory)) continue; const list=by.get(row.classification_id)??[]; list.push({category:row.tag_category as TagCategory,value:row.tag_value,confidence:Number(row.confidence),evidence:row.evidence}); by.set(row.classification_id,list); }
  return cs.flatMap(c=>{const i=incidents.get(c.incident_id);return i?[{incidentId:i.id,title:i.title,documentId:i.document_id,startPage:i.start_page,endPage:i.end_page,reviewStatus:c.review_status,reviewRequired:c.review_required,classificationNotes:c.classification_notes,tags:by.get(c.id)??[]}]:[]});
}
// Bump the dataset key when public-read availability or the payload contract changes.
// This avoids serving a persisted empty value cached before the SELECT policy existed.
export const getIncidentTaxonomy=unstable_cache(fetchAll,["incident-taxonomy-1.2-public-v2"],{revalidate:60});
export function matchingIncidentIds(items:IncidentTaxonomy[],filters:Partial<Record<TagCategory,string[]>>){return new Set(items.filter(i=>Object.entries(filters).every(([c,v])=>!v?.length||i.tags.some(t=>t.category===c&&v.includes(t.value)))).map(i=>i.incidentId));}
export function incidentForPage(items:IncidentTaxonomy[],documentId:string,pageNumber:number){return items.filter(i=>i.documentId===documentId&&i.startPage<=pageNumber&&i.endPage>=pageNumber).sort((a,b)=>(a.endPage-a.startPage)-(b.endPage-b.startPage))[0]??null;}
