const { createId } = require("./id");

function buildDecisionPatch({ decision = {}, material = {}, now } = {}) {
  const timestamp = typeof now === "string" && now.trim() ? now.trim() : new Date().toISOString();
  const materialFacts = extractFacts(material.text);
  return {
    id: createId("dpatch"),
    decision_id: requireText(decision.id, "decision.id"),
    material_id: requireText(material.id, "material.id"),
    material_title: typeof material.title === "string" ? material.title.trim() : "",
    material_facts: materialFacts,
    proposed_context_additions: materialFacts,
    proposed_rationale_additions: [],
    followup_questions: [],
    status: "draft",
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function extractFacts(text) {
  return String(text || "")
    .split(/\r?\n/u)
    .map((line) => line.replace(/^[-*\s]+/u, "").trim())
    .filter(Boolean);
}

function requireText(value, field) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    throw new Error(`${field} is required.`);
  }
  return text;
}

module.exports = {
  buildDecisionPatch,
};
