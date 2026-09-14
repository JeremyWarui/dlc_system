/* ---------- reference data: stages ---------- */
export const STAGES = [
  { code: "eoi", label: "Expression of interest", phase: "Inception", seq: 10, holder: "DLC" },
  { code: "inception", label: "Inception meeting", phase: "Inception", seq: 20, holder: "DLC" },
  { code: "drafting", label: "Drafting", phase: "Inception", seq: 30, holder: "DLC" },
  { code: "legal_internal", label: "Legal clearance", phase: "Inception", seq: 40, holder: "Legal Services" },
  { code: "legal_external", label: "Treasury / OAG", phase: "Inception", seq: 50, holder: "External" },
  { code: "mfa", label: "Transmitted to MFA", phase: "Inception", seq: 60, holder: "External" },
  { code: "concurrence", label: "Concurrence received", phase: "Inception", seq: 70, holder: "Partner" },
  { code: "signed", label: "Signed", phase: "Inception", seq: 80, holder: "DLC" },
  { code: "jtc", label: "JTC established", phase: "Activation", seq: 90, holder: "DLC" },
  { code: "workplan", label: "Workplan approved", phase: "Activation", seq: 100, holder: "DLC" },
  { code: "implementation", label: "Implementation", phase: "Implementation", seq: 110, holder: "Implementing unit" },
  { code: "closed", label: "Closed", phase: "Closure", seq: 120, holder: "—" },
];

export const SEQ_SIGNED = 80;
export const SEQ_IMPL = 110;
export const SEQ_CLOSED = 120;

export const sIdx = c => STAGES.findIndex(s => s.code === c);
export const stageOf = c => STAGES[sIdx(c)] || STAGES[0];
