// Safe payroll formula evaluator.
// Supports numbers, whitelisted variables, + - * / % ^, parentheses,
// and the functions min, max, round, abs, floor, ceil.
// No eval() — formulas are parsed with a small recursive-descent parser,
// so user-entered formulas can never execute arbitrary code.

export const DEFAULT_FORMULAS = {
  gross_formula: "basic_salary + allowances + bonus + overtime",
  tax_formula: "gross * tax_rate / 100",
  net_formula: "gross - deductions - tax",
};

// Variables available in every formula. `overtime` is a convenience
// variable equal to overtime_hours * overtime_rate.
export const BASE_VARIABLES = [
  "basic_salary",
  "allowances",
  "deductions",
  "overtime_hours",
  "overtime_rate",
  "overtime",
  "bonus",
  "tax_rate",
];

// Extra variables available per formula stage (later stages can use
// the results of earlier ones).
export const STAGE_VARIABLES = {
  gross_formula: [],
  tax_formula: ["gross"],
  net_formula: ["gross", "tax"],
};

export const FORMULA_FUNCTIONS = ["min", "max", "round", "abs", "floor", "ceil"];

const FUNCTIONS = {
  min: (...args) => Math.min(...args),
  max: (...args) => Math.max(...args),
  round: (value, decimals = 0) => {
    const m = 10 ** decimals;
    return Math.round(value * m) / m;
  },
  abs: (value) => Math.abs(value),
  floor: (value) => Math.floor(value),
  ceil: (value) => Math.ceil(value),
};

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function tokenize(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < input.length && /[0-9.]/.test(input[j])) j += 1;
      const text = input.slice(i, j);
      if ((text.match(/\./g) || []).length > 1) {
        throw new Error(`Invalid number "${text}"`);
      }
      tokens.push({ type: "num", value: parseFloat(text) });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < input.length && /[a-zA-Z0-9_]/.test(input[j])) j += 1;
      tokens.push({ type: "ident", value: input.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if ("+-*/%^(),".includes(ch)) {
      tokens.push({ type: ch });
      i += 1;
      continue;
    }
    throw new Error(`Unexpected character "${ch}"`);
  }
  return tokens;
}

export function evaluateFormula(expression, variables) {
  const expr = String(expression ?? "").trim();
  if (!expr) throw new Error("Formula is empty");

  const tokens = tokenize(expr);
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseExpression() {
    let left = parseTerm();
    while (peek() && (peek().type === "+" || peek().type === "-")) {
      const op = next().type;
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm() {
    let left = parseUnary();
    while (peek() && ["*", "/", "%"].includes(peek().type)) {
      const op = next().type;
      const right = parseUnary();
      if (op === "*") left *= right;
      // Spreadsheet-style behavior: dividing by zero yields 0 instead of
      // breaking the whole row (e.g. when overtime_hours is 0).
      else if (op === "/") left = right === 0 ? 0 : left / right;
      else left = right === 0 ? 0 : left % right;
    }
    return left;
  }

  function parseUnary() {
    if (peek() && (peek().type === "-" || peek().type === "+")) {
      const op = next().type;
      const value = parseUnary();
      return op === "-" ? -value : value;
    }
    return parsePower();
  }

  function parsePower() {
    const base = parsePrimary();
    if (peek() && peek().type === "^") {
      next();
      const exponent = parseUnary();
      return base ** exponent;
    }
    return base;
  }

  function parsePrimary() {
    const token = next();
    if (!token) throw new Error("Unexpected end of formula");

    if (token.type === "num") return token.value;

    if (token.type === "(") {
      const value = parseExpression();
      const closing = next();
      if (!closing || closing.type !== ")") throw new Error("Missing closing parenthesis");
      return value;
    }

    if (token.type === "ident") {
      if (peek() && peek().type === "(") {
        const fn = FUNCTIONS[token.value];
        if (!fn) throw new Error(`Unknown function "${token.value}"`);
        next(); // consume "("
        const args = [];
        if (peek() && peek().type !== ")") {
          args.push(parseExpression());
          while (peek() && peek().type === ",") {
            next();
            args.push(parseExpression());
          }
        }
        const closing = next();
        if (!closing || closing.type !== ")") throw new Error("Missing closing parenthesis");
        return fn(...args);
      }
      if (!(token.value in variables)) {
        throw new Error(`Unknown variable "${token.value}"`);
      }
      return toNumber(variables[token.value]);
    }

    throw new Error(`Unexpected "${token.type}" in formula`);
  }

  const result = parseExpression();
  if (pos < tokens.length) throw new Error("Unexpected input after end of formula");
  if (!Number.isFinite(result)) throw new Error("Formula did not produce a valid number");
  return result;
}

export function buildRowVariables(row) {
  const overtimeHours = toNumber(row.overtime_hours);
  const overtimeRate = toNumber(row.overtime_rate);
  return {
    basic_salary: toNumber(row.basic_salary),
    allowances: toNumber(row.allowances),
    deductions: toNumber(row.deductions),
    overtime_hours: overtimeHours,
    overtime_rate: overtimeRate,
    overtime: overtimeHours * overtimeRate,
    bonus: toNumber(row.bonus),
    tax_rate: toNumber(row.tax_rate),
  };
}

// Calculates gross/tax/net for one payroll row using the given formulas.
// Never throws: a broken formula yields zeros plus an error message so a
// single bad row can't crash the table render.
export function calcRowWithFormulas(row, formulas) {
  const vars = buildRowVariables(row);
  try {
    const gross = evaluateFormula(formulas.gross_formula, vars);
    const tax = evaluateFormula(formulas.tax_formula, { ...vars, gross });
    const net = evaluateFormula(formulas.net_formula, { ...vars, gross, tax });
    return { ot: vars.overtime, gross, tax, net, error: null };
  } catch (err) {
    return { ot: vars.overtime, gross: 0, tax: 0, net: 0, error: err.message };
  }
}

// Validates all three formulas against a sample row.
// Returns an object with a message per invalid formula key (empty when all valid).
export function validateFormulas(formulas, sampleRow) {
  const vars = buildRowVariables(sampleRow);
  const errors = {};

  let gross = 0;
  try {
    gross = evaluateFormula(formulas.gross_formula, vars);
  } catch (err) {
    errors.gross_formula = err.message;
  }

  let tax = 0;
  try {
    tax = evaluateFormula(formulas.tax_formula, { ...vars, gross });
  } catch (err) {
    errors.tax_formula = err.message;
  }

  try {
    evaluateFormula(formulas.net_formula, { ...vars, gross, tax });
  } catch (err) {
    errors.net_formula = err.message;
  }

  return errors;
}
