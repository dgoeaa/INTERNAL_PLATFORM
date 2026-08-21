// JSON Schema inference from a sample payload.
//
// Parse JSON is the action that makes a payload's fields pickable downstream, and writing
// its schema by hand is the most tedious thing in building a flow. The designer offers
// "Generate from sample" for exactly this reason; this is the same idea, offline.
//
// TWO DELIBERATE DEPARTURES FROM WHAT THE DESIGNER GENERATES
//
//   No `required`. The designer sometimes emits a required[] listing every key it saw in
//   the sample. That turns Parse JSON into a validator: a later payload missing an optional
//   field fails the action outright, at run time, with "Invalid type. Expected X but got
//   Null" — a failure caused by the schema rather than by the data. Since a sample is one
//   observation and not a contract, we describe what fields ARE rather than assert what
//   they must be.
//
//   Array items are merged, not taken from the first element. A sample whose first item
//   happens to omit an optional field would otherwise produce a schema that hides it from
//   the token picker for every later item too.

/** Merge two inferred schemas into one that accommodates both. */
function merge(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.type === 'object' && b.type === 'object') {
    const properties = { ...a.properties };
    for (const [k, v] of Object.entries(b.properties || {})) properties[k] = merge(properties[k], v);
    return { type: 'object', properties };
  }
  if (a.type === 'array' && b.type === 'array') return { type: 'array', items: merge(a.items, b.items) };
  if (a.type === b.type) return a;
  // A field seen as both integer and number is a number; anything else genuinely varies, and
  // the honest description of a field that varies is one with no type constraint at all.
  if ((a.type === 'integer' && b.type === 'number') || (a.type === 'number' && b.type === 'integer')) return { type: 'number' };
  return {};
}

/** Infer a JSON Schema describing a parsed sample value. */
export function inferSchema(value) {
  if (value === null || value === undefined) return {};
  if (Array.isArray(value)) {
    let items = null;
    for (const item of value) items = merge(items, inferSchema(item));
    return items ? { type: 'array', items } : { type: 'array' };
  }
  if (typeof value === 'object') {
    const properties = {};
    for (const [k, v] of Object.entries(value)) properties[k] = inferSchema(v);
    return { type: 'object', properties };
  }
  if (typeof value === 'boolean') return { type: 'boolean' };
  if (typeof value === 'number') return { type: Number.isInteger(value) ? 'integer' : 'number' };
  return { type: 'string' };
}

/** Parse a sample and infer from it, with a message a person can act on when it will not parse. */
export function schemaFromSample(text) {
  let sample;
  try { sample = JSON.parse(text); }
  catch (e) { throw new Error(`The sample is not valid JSON — ${e.message}`); }
  return inferSchema(sample);
}

export const schemaTextFromSample = text => JSON.stringify(schemaFromSample(text), null, 2);
