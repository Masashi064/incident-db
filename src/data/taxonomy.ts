export const TAXONOMY_VERSION = "1.2";
export const TAG_CATEGORIES = ["facility_type", "industry", "event_type", "damage_type", "human_consequence", "equipment", "cause_factor"] as const;
export type TagCategory = (typeof TAG_CATEGORIES)[number];
type Definition = { label:string; question:string; description:string; examples:string[] };
export const categoryDefinitions: Record<TagCategory, Definition> = {
  facility_type:{label:"Facility Type",question:"What kind of facility was involved?",description:"The kind of facility involved in the incident.",examples:["Refinery","Chemical Plant","Gas Processing Plant","Paper Mill"]},
  industry:{label:"Industry",question:"Which industry does the facility belong to?",description:"The industry to which the facility belongs.",examples:["Oil & Gas","Chemicals","Pulp & Paper"]},
  event_type:{label:"Event Type",question:"What physically happened?",description:"The physical incident sequence—not its cause or resulting damage.",examples:["Loss of Containment","Overpressure","Ignition","Vapor Cloud Formation","Unintended Chemical Reaction"]},
  damage_type:{label:"Damage Type",question:"What was the result?",description:"Damage or consequences resulting from the incident.",examples:["Fire","Explosion","Property Damage","Structural Damage","Business Interruption"]},
  human_consequence:{label:"Human Consequence",question:"What happened to people?",description:"Consequences for people resulting from the incident.",examples:["Fatality","Injury","Evacuation","No Reported Injury"]},
  equipment:{label:"Equipment",question:"What equipment was involved?",description:"Equipment involved in the incident.",examples:["Valve","Piping","Tank","Distillation Column","Rupture Disc"]},
  cause_factor:{label:"Cause Factor",question:"Why did it happen?",description:"A cause or condition that contributed to the incident—not merely an event in its sequence.",examples:["Corrosion","Mechanical Failure","Procedure","Human Error","Design Deficiency","Physical Impact"]},
};
export const tagDefinitions: Record<string,string> = {
  "Property Damage":"Physical or monetary damage to equipment, assets, or property. A release alone does not necessarily mean property damage.",
  "Structural Damage":"Damage specifically involving buildings, roofs, walls, foundations, structural supports, or structural steel. Generic equipment damage is not automatically structural damage.",
  "Loss of Containment":"An unplanned release of material from equipment, piping, or another containment system.",
  "Overpressure":"Pressure exceeding the intended, design, or rated operating condition.",
  "Unintended Chemical Reaction":"An unintended chemical reaction that does not necessarily meet the definition of a runaway reaction.",
  "Runaway Reaction":"An uncontrolled or self-accelerating chemical reaction.",
  "Physical Impact":"External physical force—such as a forklift, vehicle, dropped object, or scissor lift—that contributes to equipment damage or loss of containment.",
  "Human Error":"A specific incorrect or unintended human action described in the source. It does not mean one person was solely responsible.",
  "Procedure":"A missing, inadequate, or unclear procedure, or a failure to follow a required procedure.",
  "Chemical Release":"Release of a chemical substance.",
  "Toxic Release":"A release involving material explicitly described as toxic or harmful to people, or causing toxic exposure. Chemical Release and Toxic Release may both apply.",
};
export const AI_TAG_DISCLAIMER = "Tags are generated from the incident source text using a controlled taxonomy. AI-generated classifications are intended as reference aids and may be subject to review.";
export const FILTER_CATEGORIES: TagCategory[] = ["facility_type","event_type","damage_type","equipment","cause_factor","industry","human_consequence"];
export const COMPACT_CATEGORIES: TagCategory[] = ["facility_type","event_type","damage_type","human_consequence","equipment","cause_factor"];
