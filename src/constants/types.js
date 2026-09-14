/* ---------- reference data: categories, types, lists ---------- */
export const CATS = ["Training & Capacity Building", "Research", "Consultancy", "Conferencing"];
export const TYPES = ["Local", "Regional", "International"];
export const UNITS = [
  "DLC", "Nairobi Campus", "Baringo Campus", "Embu Campus", "Mombasa Campus",
  "Matuga Campus", "School of Management & Innovation (SMI)", "Institute of Development Studies (IDS)",
  "Centre for Devolution Studies", "Learning & Development (L&D)", "Legal Services", "Finance"
];
export const EXTERNAL_BODIES = ["National Treasury", "Office of the Attorney General", "Ministry of Foreign Affairs"];
export const OFFICERS = ["A. Wanjiru", "P. Otieno", "S. Kimani", "J. Mutiso", "F. Achieng"];
export const BASES = [
  { v: "indicator", l: "Indicator — achieved against target" },
  { v: "milestone", l: "Milestone — complete or not" },
  { v: "narrative", l: "Narrative — recorded, not measured" },
];
export const VALUE_TYPES = [
  { v: "Revenue", stream: "income" },
  { v: "Grant", stream: "income" },
  { v: "In-kind asset", stream: "in_kind" },
  { v: "In-kind service", stream: "in_kind" },
  { v: "Cost saving", stream: "avoided" },
];
export const streamOf = t => (VALUE_TYPES.find(x => x.v === t) || {}).stream;
export const INCOME = ["Revenue", "Grant"];
export const NON_CASH = ["In-kind asset", "In-kind service", "Cost saving"];
export const ISSUE_TYPES = ["Financial", "Operational", "Legal"];
export const SEVERITIES = ["High", "Medium", "Low"];
export const ACT_STATUS = ["Not started", "Ongoing", "Completed", "Dormant", "Cancelled"];
