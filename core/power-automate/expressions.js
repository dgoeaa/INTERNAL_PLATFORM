// Workflow Definition Language expression handling.
//
// Three string forms exist in a Logic Apps / Power Automate action definition and the
// difference between them is load-bearing:
//
//   "hello"                  a literal
//   "@triggerBody()"         the WHOLE value is an expression; the result keeps its type,
//                            so this is how you pass an object or an array
//   "Ref @{triggerBody()}"   interpolation; the result is coerced to string
//
// A literal '@' at the start of a value must be doubled ("@@") or the engine reads it as an
// expression and the flow fails at run time with a parse error. Everything here exists so
// the studio can tell these apart instead of hoping the user typed the right one.

/**
 * True when the value is a single whole-value expression (`@foo(...)`, not `@{foo(...)}`).
 *
 * A whole-value expression in WDL is always a function call — `@triggerBody()`,
 * `@variables('v')`, `@outputs('Compose')`. Requiring the call shape is what separates
 * those from a user typing "@here" as literal text, which must be escaped to "@@here"
 * rather than passed through as an expression the engine cannot resolve.
 */
export const isWholeExpression = v =>
  typeof v === 'string' && /^@[A-Za-z_][\w.]*\s*\(/.test(v.trim());

/** True when the value contains at least one `@{ … }` interpolation. */
export const hasInterpolation = v =>
  typeof v === 'string' && /@\{/.test(v);

/** True when the value carries any expression at all. */
export const hasExpression = v => isWholeExpression(v) || hasInterpolation(v);

/**
 * Escape a value the user means literally. Only a LEADING '@' is special, and only when it
 * is not already doubled — '@' inside a string ("a@b.com") is untouched by the engine, so
 * escaping it would corrupt every email address the studio emits.
 */
export const escapeLiteral = v => {
  const s = String(v ?? '');
  return /^@[^@]/.test(s) ? `@${s}` : s;
};

/**
 * Balance check for `@{ … }`. An unclosed interpolation is the single most common way a
 * hand-written expression fails, and it fails at save time in the designer with a message
 * that does not name the action — so it is worth catching here, where we can.
 *
 * Braces inside string literals within the expression are ignored, since
 * `@{concat('{', x)}` is legal and would otherwise read as unbalanced.
 */
export function interpolationErrors(value, label = 'value') {
  const s = String(value ?? '');
  const errors = [];
  let depth = 0, i = 0, quote = null;
  while (i < s.length) {
    const c = s[i];
    if (quote) {
      if (c === quote) quote = (s[i + 1] === quote) ? (i++, quote) : null;
      i++;
      continue;
    }
    if (depth > 0 && (c === "'" || c === '"')) { quote = c; i++; continue; }
    if (c === '@' && s[i + 1] === '{') { depth++; i += 2; continue; }
    if (c === '@' && s[i + 1] === '@') { i += 2; continue; }
    if (c === '}' && depth > 0) { depth--; i++; continue; }
    i++;
  }
  if (depth > 0) errors.push(`${label}: ${depth} unclosed "@{" — every @{ needs a matching }.`);
  if (quote) errors.push(`${label}: unterminated ${quote} quote inside an expression.`);
  return errors;
}

/**
 * Parse a value the user typed into what belongs in the JSON.
 *
 * `kind` decides the reading:
 *   'json'       — must parse as JSON; the parsed value goes in (objects, arrays, numbers).
 *   'expression' — verbatim, no escaping. The user is writing WDL and means it.
 *   'number'     — numeric unless it carries an expression, in which case verbatim.
 *   'boolean'    — true/false unless it carries an expression.
 *   'text'       — verbatim if it carries an expression, otherwise literal-escaped.
 *
 * Text passes expressions through deliberately: a subject line reading
 * "Acknowledgement for @{triggerBody()?['ref']}" is the normal case, not the exception.
 */
export function coerce(value, kind = 'text') {
  if (value === undefined || value === null || value === '') return undefined;
  switch (kind) {
    case 'json': {
      if (typeof value === 'object') return value;
      const s = String(value).trim();
      if (hasExpression(s) && !s.startsWith('{') && !s.startsWith('[')) return s;
      return JSON.parse(s);
    }
    case 'expression':
      return String(value);
    case 'number': {
      if (hasExpression(value)) return String(value);
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    }
    case 'boolean': {
      if (hasExpression(value)) return String(value);
      return value === true || value === 'true';
    }
    default:
      // Verbatim when it carries an expression: "Ref @{triggerBody()}" must survive intact.
      // Only a value with no expression in it can safely have a leading '@' doubled.
      return hasExpression(value) ? String(value) : escapeLiteral(value);
  }
}

/** Reference the output of a named action, for use inside `@{ }` or as a whole value. */
export const outputsOf = name => `@outputs('${name}')`;
/** Reference the body of a named action — what you want for connector and HTTP results. */
export const bodyOf = name => `@body('${name}')`;
/** Reference the trigger body. `?['x']` is the safe accessor: it yields null, not an error. */
export const triggerField = path => `@triggerBody()?['${path}']`;
/** Reference a flow variable. */
export const variable = name => `@variables('${name}')`;
/** The current item of the enclosing Apply-to-each. */
export const currentItem = () => '@item()';

/**
 * Condition operators the designer's condition card offers, mapped to their WDL function.
 * The designer renders a matching row per entry; anything outside this set has to be
 * written as raw JSON, which the studio also allows.
 */
export const ConditionOperators = Object.freeze([
  { id: 'equals', label: 'is equal to', fn: 'equals' },
  { id: 'notEquals', label: 'is not equal to', fn: 'equals', negate: true },
  { id: 'contains', label: 'contains', fn: 'contains' },
  { id: 'notContains', label: 'does not contain', fn: 'contains', negate: true },
  { id: 'greater', label: 'is greater than', fn: 'greater' },
  { id: 'greaterOrEquals', label: 'is greater than or equal to', fn: 'greaterOrEquals' },
  { id: 'less', label: 'is less than', fn: 'less' },
  { id: 'lessOrEquals', label: 'is less than or equal to', fn: 'lessOrEquals' },
  { id: 'startsWith', label: 'starts with', fn: 'startsWith' },
  { id: 'endsWith', label: 'ends with', fn: 'endsWith' },
  { id: 'isEmpty', label: 'is empty', fn: 'empty', unary: true },
  { id: 'isNotEmpty', label: 'is not empty', fn: 'empty', unary: true, negate: true }
]);

export const conditionOperator = id => ConditionOperators.find(o => o.id === id) || ConditionOperators[0];

/**
 * Build the `expression` object of an If action from simple rows.
 *
 * The designer's own shape is `{ and: [ {equals:[left,right]}, … ] }`, with negation
 * expressed as `{ not: { equals:[…] } }`. Rows whose left side is blank are dropped rather
 * than emitted as a comparison against nothing.
 */
export function buildCondition(rows = [], join = 'and') {
  const clauses = rows
    .filter(r => String(r?.left ?? '').trim() !== '')
    .map(r => {
      const op = conditionOperator(r.operator);
      const left = coerce(r.left, 'text');
      const clause = { [op.fn]: op.unary ? [left] : [left, coerce(r.right ?? '', 'text') ?? ''] };
      return op.negate ? { not: clause } : clause;
    });
  if (!clauses.length) return { and: [] };
  return { [join === 'or' ? 'or' : 'and']: clauses };
}
