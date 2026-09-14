const SEED_PARTNERS = [
  { id: 1, name: "The Hague Academy & VNG International", country: "Netherlands", type: "International", person: "M. de Vries", contact: "mdevries@thehagueacademy.com" },
  { id: 2, name: "China National Academy of Governance", country: "China", type: "International", person: "Prof. L. Wei", contact: "int@cnag.gov.cn" },
  { id: 3, name: "Council of Governors", country: "Kenya", type: "Local", person: "E. Kiplagat", contact: "linkages@cog.go.ke" },
  { id: 4, name: "Uganda Management Institute", country: "Uganda", type: "Regional", person: "Prof. R. Ssemwanga", contact: "partnerships@umi.ac.ug" },
  { id: 5, name: "GIZ", country: "Germany", type: "International", person: "K. Hoffmann", contact: "k.hoffmann@giz.de" },
  { id: 6, name: "Kenya Revenue Authority", country: "Kenya", type: "Local", person: "L. Wambui", contact: "lwambui@kra.go.ke" },
  { id: 7, name: "Commonwealth Secretariat", country: "United Kingdom", type: "International", person: "T. Adeyemi", contact: "t.adeyemi@commonwealth.int" },
  { id: 8, name: "Ghana Institute of Management and Public Administration", country: "Ghana", type: "Regional", person: "Dr. K. Mensah", contact: "partnerships@gimpa.edu.gh" },
  { id: 9, name: "National School of Government", country: "South Africa", type: "Regional", person: "N. Dlamini", contact: "intl@thensg.gov.za" },
  { id: 10, name: "Public Service Commission", country: "Kenya", type: "Local", person: "G. Mwangi", contact: "gmwangi@publicservice.go.ke" },
  { id: 11, name: "Institut National du Service Public (INSP)", country: "France", type: "International", person: "C. Laurent", contact: "international@insp.gouv.fr" },
  { id: 12, name: "AAPAM", country: "Tanzania", type: "Regional", person: "N. Mushi", contact: "sec@aapam.org" },
];


const SEED_MOUS = [
  { id: 1, ref: "MOU-26-001", partnerId: 1, title: "Migration management training of trainers", stage: "implementation", stageSince: "2025-01-10", implSince: "2025-01-10", start: "2024-11-01", end: "2025-12-31", cats: ["Training & Capacity Building"], officer: "A. Wanjiru", contract: null, prev: null, isCompleted: false },
  { id: 2, ref: "MOU-26-002", partnerId: 2, title: "Knowledge exchange in public administration and policy", stage: "implementation", stageSince: "2025-09-02", implSince: "2025-09-02", start: "2025-04-24", end: "2028-04-24", cats: ["Training & Capacity Building", "Research"], officer: "P. Otieno", contract: null, prev: null, isCompleted: false },
  { id: 3, ref: "MOU-26-003", partnerId: 3, title: "County executive induction and devolution research", stage: "implementation", stageSince: "2024-11-20", implSince: "2024-11-20", start: "2024-10-01", end: "2027-09-30", cats: ["Training & Capacity Building"], officer: "S. Kimani", contract: 15000000, prev: null, isCompleted: false },
  { id: 4, ref: "MOU-26-004", partnerId: 4, title: "Faculty exchange and joint curriculum development", stage: "legal_external", stageSince: "2026-03-12", implSince: null, start: "2026-07-01", end: "2029-06-30", cats: ["Training & Capacity Building", "Research"], officer: "J. Mutiso", contract: 9500000, prev: null, isCompleted: false, holder: "National Treasury" },
  { id: 5, ref: "MOU-26-005", partnerId: 5, title: "Governance and anti-corruption capacity programme", stage: "implementation", stageSince: "2025-02-18", implSince: "2025-02-18", start: "2025-01-10", end: "2027-01-09", cats: ["Training & Capacity Building", "Research"], officer: "A. Wanjiru", contract: 33500000, prev: null, isCompleted: false },
  { id: 6, ref: "MOU-26-006", partnerId: 6, title: "Revenue administration training and consultancy", stage: "implementation", stageSince: "2025-06-30", implSince: "2025-06-30", start: "2025-06-01", end: "2026-11-30", cats: ["Consultancy", "Training & Capacity Building"], officer: "F. Achieng", contract: 22000000, prev: null, isCompleted: false },
  { id: 7, ref: "MOU-26-007", partnerId: 7, title: "Public service reform peer learning", stage: "legal_internal", stageSince: "2026-05-06", implSince: null, start: "2026-09-01", end: "2029-08-31", cats: ["Research", "Conferencing"], officer: "P. Otieno", contract: 12800000, prev: null, isCompleted: false },
  { id: 8, ref: "MOU-26-008", partnerId: 8, title: "Joint programme on economic governance", stage: "implementation", stageSince: "2024-06-01", implSince: "2024-06-01", start: "2024-04-03", end: "2027-04-03", cats: ["Training & Capacity Building", "Research"], officer: "S. Kimani", contract: null, prev: null, isCompleted: false },
  { id: 9, ref: "MOU-26-009", partnerId: 9, title: "Economic governance modules and faculty exchange", stage: "workplan", stageSince: "2026-07-21", implSince: null, start: "2025-10-30", end: "2028-10-30", cats: ["Training & Capacity Building"], officer: "J. Mutiso", contract: 7400000, prev: null, isCompleted: false },
  { id: 10, ref: "MOU-26-010", partnerId: 10, title: "Induction of newly appointed public officers", stage: "concurrence", stageSince: "2026-06-02", implSince: null, start: "2026-10-01", end: "2029-09-30", cats: ["Training & Capacity Building"], officer: "F. Achieng", contract: 28000000, prev: null, isCompleted: false },
  { id: 11, ref: "MOU-26-011", partnerId: 11, title: "LPNT curriculum development and study programmes", stage: "implementation", stageSince: "2025-08-14", implSince: "2025-08-14", start: "2025-07-10", end: "2028-07-10", cats: ["Training & Capacity Building", "Research"], officer: "A. Wanjiru", contract: 18000000, prev: null, isCompleted: false },
  { id: 12, ref: "MOU-26-012", partnerId: 12, title: "Annual roundtable hosting and secretariat support", stage: "implementation", stageSince: "2025-11-11", implSince: "2025-11-11", start: "2025-11-01", end: "2027-10-31", cats: ["Conferencing"], officer: "S. Kimani", contract: 5600000, prev: null, isCompleted: false },
];


/* activities carry basis + several implementing units */
const SEED_ACTS = [
  { id: 1, mou: 1, name: "Migration programmes for Garissa and Turkana", cat: "Training & Capacity Building", units: ["DLC", "Nairobi Campus"], basis: "indicator", status: "Completed", planned: 6400000, start: "2025-02-10", end: "2025-11-18" },
  { id: 2, mou: 2, name: "Study visit by KSG to CNAG", cat: "Training & Capacity Building", units: ["School of Management & Innovation (SMI)", "Institute of Development Studies (IDS)"], basis: "indicator", status: "Ongoing", planned: 3200000, start: "2026-03-01", end: "2026-12-31" },
  { id: 3, mou: 2, name: "Host LPNT Cohort 4", cat: "Training & Capacity Building", units: ["Nairobi Campus"], basis: "milestone", status: "Not started", planned: 4000000, start: "2026-09-01", end: "2027-02-28" },
  { id: 4, mou: 3, name: "County executive induction — cohort 1", cat: "Training & Capacity Building", units: ["Centre for Devolution Studies"], basis: "indicator", status: "Not started", planned: 8000000, start: "2026-03-01", end: "2026-06-30" },
  { id: 5, mou: 5, name: "Integrity champions training", cat: "Training & Capacity Building", units: ["Baringo Campus"], basis: "indicator", status: "Ongoing", planned: 18000000, start: "2025-04-01", end: "2026-12-15" },
  { id: 6, mou: 5, name: "Anti-corruption research symposium", cat: "Research", units: ["Baringo Campus", "DLC"], basis: "indicator", status: "Ongoing", planned: 4500000, start: "2026-04-01", end: "2026-10-31" },
  { id: 7, mou: 6, name: "Tax administration certificate", cat: "Training & Capacity Building", units: ["Mombasa Campus"], basis: "indicator", status: "Completed", planned: 12000000, start: "2025-08-01", end: "2026-06-30" },
  { id: 8, mou: 6, name: "KRA advisory on revenue systems", cat: "Consultancy", units: ["Mombasa Campus"], basis: "indicator", status: "Ongoing", planned: 10000000, start: "2026-01-10", end: "2026-11-30" },
  { id: 9, mou: 8, name: "Economic governance modules I–III", cat: "Training & Capacity Building", units: ["School of Management & Innovation (SMI)", "Institute of Development Studies (IDS)"], basis: "indicator", status: "Ongoing", planned: 9000000, start: "2025-04-01", end: "2026-12-31" },
  { id: 10, mou: 8, name: "Ongoing correspondence on curriculum alignment", cat: "Research", units: ["DLC"], basis: "narrative", status: "Ongoing", planned: null, start: "2025-06-01", end: "2027-04-03" },
  { id: 11, mou: 11, name: "LPNT curriculum development", cat: "Training & Capacity Building", units: ["Learning & Development (L&D)"], basis: "milestone", status: "Completed", planned: 5000000, start: "2025-09-01", end: "2026-03-31" },
  { id: 12, mou: 11, name: "Hosted Cohort 2 LPNT", cat: "Training & Capacity Building", units: ["Nairobi Campus"], basis: "indicator", status: "Completed", planned: 8000000, start: "2026-01-15", end: "2026-06-20" },
  { id: 13, mou: 12, name: "AAPAM roundtable 2026", cat: "Conferencing", units: ["Nairobi Campus"], basis: "indicator", status: "Dormant", planned: 5600000, start: "2026-02-01", end: "2026-05-31" },
];

/* several indicators per activity, different units of measure */
const SEED_INDICATORS = [
  { id: 1, act: 1, name: "Trainers certified", unit: "trainers", target: 40 },
  { id: 2, act: 1, name: "Counties covered", unit: "counties", target: 2 },
  { id: 3, act: 2, name: "Study visits conducted", unit: "visits", target: 1 },
  { id: 4, act: 2, name: "Faculty participating", unit: "participants", target: 20 },
  { id: 5, act: 4, name: "Executives inducted", unit: "executives", target: 200 },
  { id: 6, act: 5, name: "Officers trained", unit: "participants", target: 400 },
  { id: 7, act: 6, name: "Papers presented", unit: "papers", target: 12 },
  { id: 8, act: 7, name: "Officers certified", unit: "participants", target: 250 },
  { id: 9, act: 8, name: "Advisory notes issued", unit: "notes", target: 10 },
  { id: 10, act: 9, name: "Modules delivered", unit: "modules", target: 3 },
  { id: 11, act: 9, name: "Participants across modules", unit: "participants", target: 90 },
  { id: 12, act: 12, name: "Cohort participants hosted", unit: "participants", target: 35 },
  { id: 13, act: 13, name: "Delegates hosted", unit: "delegates", target: 300 },
];

const SEED_ACH = [
  { id: 1, ind: 1, date: "2025-09-22", value: 40, note: "Two cohorts certified" },
  { id: 2, ind: 2, date: "2025-09-22", value: 2, note: "Garissa and Turkana" },
  { id: 3, ind: 3, date: "2026-06-18", value: 1, note: "Study visit completed June 2026" },
  { id: 4, ind: 4, date: "2026-06-18", value: 5, note: "Five faculty travelled" },
  { id: 5, ind: 6, date: "2025-11-20", value: 150, note: "Cohorts 1-2" },
  { id: 6, ind: 6, date: "2026-04-15", value: 120, note: "Cohort 3" },
  { id: 7, ind: 6, date: "2026-08-10", value: 91, note: "Cohort 4" },
  { id: 8, ind: 7, date: "2026-08-02", value: 9, note: "Symposium papers" },
  { id: 9, ind: 8, date: "2026-06-30", value: 244, note: "Certification issued" },
  { id: 10, ind: 9, date: "2026-08-19", value: 7, note: "Notes 1-7" },
  { id: 11, ind: 10, date: "2025-08-20", value: 1, note: "Module II, South Africa" },
  { id: 12, ind: 10, date: "2025-11-14", value: 1, note: "Module III, Kenya" },
  { id: 13, ind: 11, date: "2025-11-14", value: 62, note: "Across modules II and III" },
  { id: 14, ind: 12, date: "2026-06-20", value: 33, note: "Cohort 2 hosted" },
];

const SEED_VALUES = [
  { id: 1, mou: 1, act: 1, type: "Revenue", desc: "Programme fees — Garissa and Turkana", amount: 1470800, date: "2025-09-30", evidence: "Receipt batch 3312" },
  { id: 2, mou: 5, act: 5, type: "Grant", desc: "GIZ programme support", amount: 22000000, date: "2026-01-20", evidence: "" },
  { id: 3, mou: 5, act: 5, type: "Revenue", desc: "Course fees from participants", amount: 4500000, date: "2026-03-14", evidence: "" },
  { id: 4, mou: 5, act: 5, type: "In-kind asset", desc: "Library books and training furniture donated", amount: 1800000, date: "2026-05-02", evidence: "Supplier valuation + delivery note DN/4471" },
  { id: 5, mou: 5, act: 6, type: "In-kind service", desc: "Two GIZ facilitators seconded for six weeks", amount: 900000, date: "2026-06-10", evidence: "Secondment letter; consultant day-rate comparison" },
  { id: 6, mou: 5, act: 5, type: "Cost saving", desc: "Partner-sponsored venue and catering", amount: 3100000, date: "2026-07-11", evidence: "3 quotations; KSG would have paid 3.1M" },
  { id: 7, mou: 6, act: 8, type: "Revenue", desc: "Consultancy fees — KRA advisory", amount: 8950000, date: "2026-08-04", evidence: "" },
  { id: 8, mou: 6, act: 7, type: "In-kind service", desc: "Secondment of two KRA facilitators", amount: 1800000, date: "2026-08-12", evidence: "Secondment letter; day-rate basis" },
  { id: 9, mou: 11, act: 12, type: "Revenue", desc: "LPNT cohort 2 hosting fees", amount: 14356000, date: "2026-06-25", evidence: "" },
  { id: 10, mou: 12, act: 13, type: "Cost saving", desc: "Secretariat support absorbed by partner", amount: 400000, date: "2026-01-29", evidence: "Memo DLC/12/26; comparative quote" },
];

const SEED_ISSUES = [
  { id: 1, mou: 3, type: "Operational", desc: "Implementing unit not designated after signing", sev: "High", status: "Ongoing", unit: "DLC", target: "2026-09-15", origTarget: "2026-09-15", revisions: [], raised: "2026-04-02", resolvedOn: null, resolution: "" },
  { id: 2, mou: 4, type: "Legal", desc: "Awaiting National Treasury concurrence on financial clauses", sev: "High", status: "Ongoing", unit: "Legal Services", target: "2026-07-30", origTarget: "2026-05-30", revisions: [{ from: "2026-05-30", to: "2026-07-30", on: "2026-05-25", why: "Treasury requested further documentation" }], raised: "2026-05-18", resolvedOn: null, resolution: "" },
  { id: 3, mou: 12, type: "Operational", desc: "Roundtable postponed; no revised workplan submitted", sev: "Medium", status: "Pending", unit: "Nairobi Campus", target: "2026-09-05", origTarget: "2026-09-05", revisions: [], raised: "2026-03-11", resolvedOn: null, resolution: "" },
  { id: 4, mou: 2, type: "Financial", desc: "Cohort 4 hosting budget not yet confirmed", sev: "Medium", status: "Ongoing", unit: "Finance", target: "2026-09-20", origTarget: "2026-09-20", revisions: [], raised: "2026-07-30", resolvedOn: null, resolution: "" },
  { id: 5, mou: 7, type: "Legal", desc: "Partner requested amendment to IP clause", sev: "Low", status: "Ongoing", unit: "Legal Services", target: "2026-10-10", origTarget: "2026-10-10", revisions: [], raised: "2026-06-21", resolvedOn: null, resolution: "" },
  { id: 6, mou: 5, type: "Financial", desc: "In-kind furniture donation lacked a valuation basis at receipt", sev: "Medium", status: "Resolved", unit: "Finance", target: "2026-06-15", origTarget: "2026-06-15", revisions: [], raised: "2026-05-06", resolvedOn: "2026-06-09", resolution: "Supplier valuation obtained and delivery note DN/4471 attached. Entry now carries a defensible basis and has been passed to the asset register." },
  { id: 7, mou: 11, type: "Operational", desc: "Cohort 2 attendance register not submitted by campus", sev: "Low", status: "Resolved", unit: "Nairobi Campus", target: "2026-07-10", origTarget: "2026-07-10", revisions: [], raised: "2026-06-22", resolvedOn: "2026-07-02", resolution: "Register received from campus registrar and achievement logged against the cohort indicator." },
];

export {
  SEED_PARTNERS,
  SEED_MOUS,
  SEED_ACTS,
  SEED_INDICATORS,
  SEED_ACH,
  SEED_VALUES,
  SEED_ISSUES,
};
