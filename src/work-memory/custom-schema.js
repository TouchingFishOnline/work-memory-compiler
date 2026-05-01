const SUPPORTED_FIELD_TYPES = new Set(["string", "number", "boolean", "enum", "date"]);
const FIELD_ID_PATTERN = /^[a-z][a-z0-9_]{0,40}$/u;

function validateCustomEventSchema(schema = {}) {
  const fields = Array.isArray(schema.fields) ? schema.fields : [];
  if (fields.length > 20) {
    throw new Error("custom event schema supports at most 20 fields.");
  }
  const seen = new Set();
  return {
    fields: fields.map((field) => {
      const next = validateField(field);
      if (seen.has(next.id)) {
        throw new Error(`duplicate field id: ${next.id}`);
      }
      seen.add(next.id);
      return next;
    }),
  };
}

function validateField(field = {}) {
  const id = normalizeText(field.id);
  if (!FIELD_ID_PATTERN.test(id)) {
    throw new Error(`invalid field id: ${field.id}`);
  }
  const type = normalizeText(field.type);
  if (!SUPPORTED_FIELD_TYPES.has(type)) {
    throw new Error(`unsupported field type: ${type}`);
  }
  const next = {
    id,
    label: normalizeText(field.label) || id,
    type,
    required: field.required === undefined ? false : Boolean(field.required),
  };
  if (type === "enum") {
    const options = Array.isArray(field.options) ? field.options.map(normalizeText).filter(Boolean) : [];
    if (options.length === 0 || options.length > 20) {
      throw new Error("enum fields require 1-20 string options.");
    }
    next.options = [...new Set(options)];
  }
  return next;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

module.exports = {
  validateCustomEventSchema,
};
