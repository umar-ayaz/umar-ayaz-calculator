import { MESSAGES } from "./messages";
import {
  parseInterestRate,
  parseLoanAmount,
  parseTerm,
  type Decimal,
} from "./parse";

export type RepaymentType = "repayment" | "interestOnly";

export type Field = "loanAmount" | "interestRate" | "term";

/** What the form holds: the text of the three fields and the chosen type. */
export type RawInputs = {
  loanAmount: string;
  interestRate: string;
  term: string;
  repaymentType: RepaymentType;
};

/** Validated values, all whole numbers. */
export type Inputs = {
  /** Loan in pence. */
  loanPence: number;
  /** Annual rate in thousandths of a percent: 5.125% is 5125. */
  rateMilliPercent: number;
  /** Term in whole years. */
  termYears: number;
  repaymentType: RepaymentType;
};

export type Validation =
  | { ok: true; inputs: Inputs }
  | { ok: false; errors: Partial<Record<Field, string>> };

type FieldResult = { value: number } | { error: string };

/**
 * The value as a whole number scaled by 10^places. Only call this once the
 * decimal is known to have no more than `places` decimal places.
 */
function scaled(d: Decimal, places: number): bigint {
  const magnitude = BigInt(d.whole + d.fraction.padEnd(places, "0"));
  // "-0" gives -0n, which is 0n: a minus sign in front of zero changes nothing.
  return d.negative ? -magnitude : magnitude;
}

function checkLoanAmount(text: string): FieldResult {
  const m = MESSAGES.loanAmount;
  const parsed = parseLoanAmount(text);
  if (parsed.kind === "empty") return { error: m.empty };
  if (parsed.kind === "notANumber") return { error: m.notANumber };
  if (parsed.value.fraction.length > 2) return { error: m.decimals };
  const pence = scaled(parsed.value, 2);
  // £1,000 to £10,000,000 inclusive. This is also what catches 0 and negatives.
  if (pence < 100_000n || pence > 1_000_000_000n) return { error: m.range };
  return { value: Number(pence) };
}

function checkInterestRate(text: string): FieldResult {
  const m = MESSAGES.interestRate;
  const parsed = parseInterestRate(text);
  if (parsed.kind === "empty") return { error: m.empty };
  if (parsed.kind === "notANumber") return { error: m.notANumber };
  if (parsed.value.fraction.length > 3) return { error: m.decimals };
  const milli = scaled(parsed.value, 3);
  if (milli < 0n) return { error: m.negative };
  if (milli > 25_000n) return { error: m.tooHigh };
  return { value: Number(milli) };
}

function checkTerm(text: string): FieldResult {
  const m = MESSAGES.term;
  const parsed = parseTerm(text);
  if (parsed.kind === "empty") return { error: m.empty };
  if (parsed.kind === "notANumber") return { error: m.notANumber };
  // "25.0" has no fraction left after parsing, so it counts as 25.
  if (parsed.value.fraction.length > 0) return { error: m.notWhole };
  const years = scaled(parsed.value, 0);
  if (years < 1n || years > 40n) return { error: m.range };
  return { value: Number(years) };
}

/**
 * Checks every field, so every message is returned at once. Never throws:
 * whatever was typed, the answer is either values or messages.
 */
export function validate(raw: RawInputs): Validation {
  const loan = checkLoanAmount(raw.loanAmount);
  const rate = checkInterestRate(raw.interestRate);
  const term = checkTerm(raw.term);

  // Built in screen order, so the first key is the first field to focus.
  const errors: Partial<Record<Field, string>> = {};
  if ("error" in loan) errors.loanAmount = loan.error;
  if ("error" in rate) errors.interestRate = rate.error;
  if ("error" in term) errors.term = term.error;

  if ("error" in loan || "error" in rate || "error" in term) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    inputs: {
      loanPence: loan.value,
      rateMilliPercent: rate.value,
      termYears: term.value,
      repaymentType: raw.repaymentType,
    },
  };
}
