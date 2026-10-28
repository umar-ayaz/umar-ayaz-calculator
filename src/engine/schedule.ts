import { calculate, RATE_SCALE, roundHalfUp } from "./calculate";
import type { Inputs } from "./validate";

/** One monthly payment, all in whole pence. */
export type ScheduleRow = {
  /** Which payment this is, counting from 1. */
  month: number;
  paymentPence: number;
  /** The part of the payment that is interest. */
  interestPence: number;
  /** The part of the payment that repays the loan. */
  capitalPence: number;
  /** What is still owed after this payment. */
  balancePence: number;
};

const min = (a: bigint, b: bigint) => (a < b ? a : b);

/**
 * Every monthly payment of the loan, one row per month (S-17). It only takes
 * values that have passed validation, so it has no failure case.
 *
 * Each row starts from the previous row's balance (the loan, for the first):
 * the interest is charged on it, the payment pays that interest first, and
 * what is left of the payment repays the loan.
 *
 * Repayment: every payment is the monthly payment from `calculate`, except
 * the last. The payment is rounded to the penny once, so a run of identical
 * payments cannot clear the loan to exactly £0.00. The last payment is
 * therefore the balance still owed plus that month's interest, which makes the
 * loan clear exactly and makes the payments add up to the loan plus the
 * interest.
 *
 * A payment is never more than what is owed. The monthly payment is rounded
 * to the nearest penny, which can round up, and on a small loan over a long
 * term those pennies can clear the loan a month or more early. The payment
 * that clears it is then smaller than the others, and any rows after it are
 * £0.00, so the table still has one row for every month of the term and no
 * figure in it is ever negative.
 *
 * Interest only: the payment is the interest, so no capital is repaid and the
 * balance stays at the loan.
 */
export function schedule(inputs: Inputs): ScheduleRow[] {
  const rate = BigInt(inputs.rateMilliPercent);
  const months = inputs.termYears * 12;
  const monthly = BigInt(calculate(inputs).monthlyPence);
  const interestOnly = inputs.repaymentType === "interestOnly";

  const rows: ScheduleRow[] = [];
  let balance = BigInt(inputs.loanPence);
  for (let month = 1; month <= months; month++) {
    // Rounding rule: this month's interest is the opening balance at the
    // monthly rate, rounded half up to the penny, the same rule as the
    // payment in `calculate`. It is rounded here, on each month's own figure,
    // and the rounded figure is what the balance carries forward.
    const interest = roundHalfUp(balance * rate, RATE_SCALE);
    const owed = balance + interest;
    const payment = interestOnly ? monthly : month === months ? owed : min(monthly, owed);
    const capital = payment - interest;
    balance -= capital;
    rows.push({
      month,
      paymentPence: Number(payment),
      interestPence: Number(interest),
      capitalPence: Number(capital),
      balancePence: Number(balance),
    });
  }
  return rows;
}
