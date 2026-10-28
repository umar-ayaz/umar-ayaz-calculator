// Turns what a person typed into an exact decimal, or says why it can't.
// Nothing here goes through floating point: digits stay as text until the
// validator turns them into whole numbers.

export type Decimal = {
  negative: boolean;
  /** Digits before the point, no leading zeros ("0" if there are none). */
  whole: string;
  /** Digits after the point, no trailing zeros ("" if there are none). */
  fraction: string;
};

export type Parsed =
  | { kind: "empty" }
  | { kind: "notANumber" }
  | { kind: "number"; value: Decimal };

const MINUS_SIGN = "−"; // U+2212, the minus that comes with copy and paste

// An optional "-", then digits with an optional point: "5", "5.", ".5", "5.25".
// [0-9] rather than \d so only ASCII digits count.
const NUMBER = /^(-?)([0-9]*)(?:\.([0-9]*))?$/;

function toDecimal(text: string): Parsed {
  const match = NUMBER.exec(text);
  if (match === null) return { kind: "notANumber" };
  const [, sign = "", whole = "", fraction = ""] = match;
  // A number needs at least one digit somewhere: "-", "." and "-." are not numbers.
  if (whole === "" && fraction === "") return { kind: "notANumber" };
  return {
    kind: "number",
    value: {
      negative: sign === "-",
      whole: whole.replace(/^0+(?=[0-9])/, "") || "0",
      fraction: fraction.replace(/0+$/, ""),
    },
  };
}

/**
 * Steps shared by every field. `strip` removes the symbols that belong to the
 * field and runs after the empty check, so a field holding only "£" or "%" is
 * not empty: it goes on to fail as not a number.
 */
function read(text: string, strip: (s: string) => string): Parsed {
  const trimmed = text.trim();
  if (trimmed === "") return { kind: "empty" };
  // Only U+2212 is a minus sign. An en dash is not, and is left to fail.
  const minusFixed = trimmed.replaceAll(MINUS_SIGN, "-");
  return toDecimal(strip(minusFixed).trim());
}

// A "£" is allowed first, or straight after a minus sign, and nowhere else.
function stripPound(s: string): string {
  if (s.startsWith("£")) return s.slice(1).trimStart();
  if (s.startsWith("-£")) return `-${s.slice(2).trimStart()}`;
  return s;
}

// Commas are ignored wherever they are, so "2,00,000" is 200000.
export function parseLoanAmount(text: string): Parsed {
  return read(text, (s) => stripPound(s).replaceAll(",", ""));
}

// One "%" is allowed, at the end. A comma is not a number here.
export function parseInterestRate(text: string): Parsed {
  return read(text, (s) => (s.endsWith("%") ? s.slice(0, -1) : s));
}

// Nothing is stripped: "25 years", "£25" and "2,5" are not numbers.
export function parseTerm(text: string): Parsed {
  return read(text, (s) => s);
}
