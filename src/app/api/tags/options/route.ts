import { NextResponse } from "next/server";
import { FILTER_CATEGORIES } from "@/data/taxonomy";
import { getIncidentTaxonomy } from "@/lib/incident-tags";
export async function GET(){try{const incidents=await getIncidentTaxonomy();const options=Object.fromEntries(FILTER_CATEGORIES.map(c=>[c,[...new Set(incidents.flatMap(i=>i.tags.filter(t=>t.category===c).map(t=>t.value)))].sort()]));return NextResponse.json({options});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Tag options failed."},{status:500});}}
