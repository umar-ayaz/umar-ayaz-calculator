import type { Inputs } from "./validate";

export type Calculation =
  | { type: "repayment"; monthlyPence: number }
  | { type: "interestOnly"; monthlyPence: number; balanceOwedPence: number };

// The monthly rate is the annual rate divided by 12. The rate arrives in
// thousandths of a percent (r), so the monthly rate is r / (1000 * 100 * 12),
// which is r / 1,200,000. Keeping it as that fraction, rather than as a
// decimal, is what lets everything below be done in exact whole numbers.
const RATE_SCALE = 1_200_000n;

/**
 * Rounding rule: round half up to the nearest penny, once, on the final
 * figure and nowhere else. `numerator / denominator` is the exact payment in
 * pence; adding half the denominator before an integer division rounds an
 * exact half penny up. Nothing is rounded before this point, and the payment
 * is never rounded up just to make sure the loan is cleared.
 */
function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (2n * numerator + denominator) / (2n * denominator);
}

/**
 * Works out the monthly payment, and for an interest-only loan the balance
 * still owed at the end. It only takes values that have passed validation, so
 * it has no failure case, and it returns whole pence that are never negative.
 *
 * With P the loan in pence, r the rate in thousandths of a percent, i the
 * monthly rate (r / 1,200,000) and n the number of months:
 *
 *   repayment, rate above 0   P * i / (1 - (1 + i)^-n)
 *   repayment, rate 0         P / n
 *   interest only             P * i, and P is still owed at the end
 *
 * The first one is rearranged into a single fraction of whole numbers, with
 * A = 1,200,000 + r:
 *
 *   P * r * A^n / (1,200,000 * (A^n - 1,200,000^n))
 *
 * and worked out exactly with BigInt, so there is no approximation to explain.
 */
export function calculate(inputs: Inputs): Calculation {
  const loan = BigInt(inputs.loanPence);
  const rate = BigInt(inputs.rateMilliPercent);
  const months = BigInt(inputs.termYears * 12);

  if (inputs.repaymentType === "interestOnly") {
    return {
      type: "interestOnly",
      monthlyPence: Number(roundHalfUp(loan * rate, RATE_SCALE)),
      balanceOwedPence: inputs.loanPence,
    };
  }

  // A rate of 0 is a real rate. The general formula would divide by zero
  // here, so it has its own branch.
  if (rate === 0n) {
    return { type: "repayment", monthlyPence: Number(roundHalfUp(loan, months)) };
  }

  const growth = (RATE_SCALE + rate) ** months;
  const base = RATE_SCALE ** months;
  const monthlyPence = roundHalfUp(loan * rate * growth, RATE_SCALE * (growth - base));
  return { type: "repayment", monthlyPence: Number(monthlyPence) };
}
