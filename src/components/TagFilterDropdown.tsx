"use client";
import { categoryDefinitions,type TagCategory } from "@/data/taxonomy";
export function TagFilterDropdown({category,values,selected,open,onToggleOpen,onToggleValue,registerTrigger}:{category:TagCategory;values:string[];selected:string[];open:boolean;onToggleOpen:()=>void;onToggleValue:(value:string)=>void;registerTrigger:(el:HTMLButtonElement|null)=>void}){
 const def=categoryDefinitions[category];const panelId=`tag-filter-${category}`;
 const summary=selected.length===0?null:selected.length===1?selected[0]:`${selected[0]} +${selected.length-1}`;
 return <div className="tag-dropdown">
  <button type="button" ref={registerTrigger} className={`tag-dropdown-trigger${selected.length?" has-selection":""}`} aria-haspopup="true" aria-expanded={open} aria-controls={panelId} onClick={onToggleOpen}>
   <span className="tag-dropdown-label">{def.label}</span>
   {summary&&<span className="tag-dropdown-summary">{summary}</span>}
   <span className="tag-dropdown-caret" aria-hidden="true">▾</span>
  </button>
  {open&&<div id={panelId} className="tag-dropdown-panel" role="group" aria-label={`${def.label} filter options`}>
   {values.length===0&&<p className="tag-dropdown-empty">No values available yet.</p>}
   {values.map(value=><label key={value} className="tag-dropdown-option"><input type="checkbox" checked={selected.includes(value)} onChange={()=>onToggleValue(value)}/><span>{value}</span></label>)}
  </div>}
 </div>;
}
