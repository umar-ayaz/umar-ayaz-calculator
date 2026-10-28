import { describe, expect, it } from "vitest";
import { calculate } from "./calculate";
import { schedule } from "./schedule";
import type { Inputs, RepaymentType } from "./validate";

/** Inputs in the engine's units: pounds, percent and years as typed. */
function inputs(
  pounds: number,
  ratePercent: number,
  termYears: number,
  repaymentType: RepaymentType,
): Inputs {
  return {
    loanPence: Math.round(pounds * 100),
    rateMilliPercent: Math.round(ratePercent * 1000),
    termYears,
    repaymentType,
  };
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("S-17: number and order of rows", () => {
  it("has one row per month, numbered from 1", () => {
    const rows = schedule(inputs(200000, 5, 25, "repayment"));
    expect(rows).toHaveLength(300);
    expect(rows.map((r) => r.month)).toEqual(
      Array.from({ length: 300 }, (_, i) => i + 1),
    );
  });

  it("has 12 rows for a 1 year term and 480 for a 40 year term", () => {
    expect(schedule(inputs(1000, 25, 1, "repayment"))).toHaveLength(12);
    expect(schedule(inputs(1000, 25, 40, "interestOnly"))).toHaveLength(480);
  });
});

describe("S-17: repayment, 200000 at 5% over 25 years", () => {
  const rows = schedule(inputs(200000, 5, 25, "repayment"));

  it("first row is £1,169.18, £833.33, £335.85, £199,664.15", () => {
    expect(rows[0]).toEqual({
      month: 1,
      paymentPence: 116918,
      interestPence: 83333,
      capitalPence: 33585,
      balancePence: 19966415,
    });
  });

  it("last row is £1,169.20, £4.85, £1,164.35, £0.00", () => {
    expect(rows[299]).toEqual({
      month: 300,
      paymentPence: 116920,
      interestPence: 485,
      capitalPence: 116435,
      balancePence: 0,
    });
  });

  it("every payment except the last is the monthly payment of S-2", () => {
    const monthly = calculate(inputs(200000, 5, 25, "repayment")).monthlyPence;
    expect(rows.slice(0, -1).every((r) => r.paymentPence === monthly)).toBe(true);
  });

  it("payments add up to £350,754.02: the loan plus £150,754.02 interest", () => {
    expect(sum(rows.map((r) => r.paymentPence))).toBe(35075402);
    expect(sum(rows.map((r) => r.interestPence))).toBe(15075402);
  });
});

describe("S-17: repayment at 0%", () => {
  it("100000 over 3 years: 35 payments of £2,777.78 then £2,777.70", () => {
    const rows = schedule(inputs(100000, 0, 3, "repayment"));
    expect(rows).toHaveLength(36);
    expect(rows.slice(0, 35).every((r) => r.paymentPence === 277778)).toBe(true);
    expect(rows[35]?.paymentPence).toBe(277770);
    expect(rows.every((r) => r.interestPence === 0)).toBe(true);
    expect(rows[35]?.balancePence).toBe(0);
  });

  it("120000 over 10 years: 120 payments of £1,000.00, first balance £119,000.00", () => {
    const rows = schedule(inputs(120000, 0, 10, "repayment"));
    expect(rows).toHaveLength(120);
    expect(rows.every((r) => r.paymentPence === 100000)).toBe(true);
    expect(rows[0]?.balancePence).toBe(11900000);
    expect(rows[119]?.balancePence).toBe(0);
  });
});

describe("S-17: a loan cleared before the last month", () => {
  // £1,000 at 5% over 36 years has a monthly payment of £5.00, rounded up from
  // a little less. The extra pennies clear the loan in month 431.
  const rows = schedule(inputs(1000, 5, 36, "repayment"));

  it("never pays more than is owed: the clearing payment is smaller", () => {
    expect(rows[429]).toMatchObject({ paymentPence: 500, balancePence: 450 });
    expect(rows[430]).toEqual({
      month: 431,
      paymentPence: 452,
      interestPence: 2,
      capitalPence: 450,
      balancePence: 0,
    });
  });

  it("still has a row for every month, the rest at £0.00", () => {
    expect(rows).toHaveLength(432);
    expect(rows[431]).toEqual({
      month: 432,
      paymentPence: 0,
      interestPence: 0,
      capitalPence: 0,
      balancePence: 0,
    });
  });
});

describe("S-17: interest only", () => {
  it("200000 at 5% over 25 years: every row £833.33, £833.33, £0.00, £200,000.00", () => {
    const rows = schedule(inputs(200000, 5, 25, "interestOnly"));
    expect(rows).toHaveLength(300);
    for (const r of rows) {
      expect(r).toMatchObject({
        paymentPence: 83333,
        interestPence: 83333,
        capitalPence: 0,
        balancePence: 20000000,
      });
    }
  });

  it("200000 at 0% over 25 years: every row £0.00, £0.00, £0.00, £200,000.00", () => {
    const rows = schedule(inputs(200000, 0, 25, "interestOnly"));
    for (const r of rows) {
      expect(r).toMatchObject({
        paymentPence: 0,
        interestPence: 0,
        capitalPence: 0,
        balancePence: 20000000,
      });
    }
  });

  it("last balance is the balance owed at the end of the term in S-3", () => {
    const i = inputs(350000, 4.25, 30, "interestOnly");
    const outcome = calculate(i);
    if (outcome.type !== "interestOnly") throw new Error("wrong type");
    expect(schedule(i).at(-1)?.balancePence).toBe(outcome.balanceOwedPence);
  });
});

/** Everything wrong with a schedule, as plain strings. Empty means it is right. */
function problems(i: Inputs, rows: ReturnType<typeof schedule>): string[] {
  const found: string[] = [];
  const monthly = calculate(i).monthlyPence;
  if (rows.length !== i.termYears * 12) found.push("wrong number of rows");

  let before = i.loanPence;
  let cleared = false;
  for (const r of rows) {
    const figures = [r.paymentPence, r.interestPence, r.capitalPence, r.balancePence];
    if (!figures.every((v) => Number.isSafeInteger(v) && v >= 0)) {
      found.push(`month ${r.month}: a figure is negative or not whole pence`);
    }
    // Interest is the opening balance at the monthly rate, to the nearest penny.
    const exact = (before * i.rateMilliPercent) / 1_200_000;
    if (Math.abs(r.interestPence - exact) > 0.5) found.push(`month ${r.month}: interest`);
    if (r.capitalPence !== r.paymentPence - r.interestPence) found.push(`month ${r.month}: capital`);
    if (r.balancePence !== before - r.capitalPence) found.push(`month ${r.month}: balance`);
    before = r.balancePence;

    // A repayment is the monthly payment unless it is the one that clears the
    // loan, or a £0.00 row after that. Only the last month's payment can be
    // larger than the monthly payment.
    if (i.repaymentType === "repayment") {
      const last = r.month === rows.length;
      if (cleared && r.paymentPence !== 0) found.push(`month ${r.month}: paid after clearing`);
      else if (!cleared && r.balancePence > 0 && r.paymentPence !== monthly) {
        found.push(`month ${r.month}: not the monthly payment`);
      } else if (!cleared && r.balancePence === 0 && !last && r.paymentPence > monthly) {
        found.push(`month ${r.month}: clearing payment above the monthly payment`);
      }
      if (r.balancePence === 0) cleared = true;
    }
  }

  const paid = sum(rows.map((r) => r.paymentPence));
  const interest = sum(rows.map((r) => r.interestPence));
  if (i.repaymentType === "repayment") {
    if (rows.at(-1)?.balancePence !== 0) found.push("loan not cleared");
    if (paid !== i.loanPence + interest) found.push("payments differ from loan plus interest");
  } else {
    if (rows.at(-1)?.balancePence !== i.loanPence) found.push("balance moved");
    if (paid !== interest) found.push("payments differ from interest");
  }
  return found;
}

describe("S-17: how each row is worked out", () => {
  const loans = [1000, 1234.56, 200000, 9999999.99, 10000000];
  const rates = [0, 0.001, 1, 5, 5.125, 12.5, 25];
  const types: RepaymentType[] = ["repayment", "interestOnly"];

  it("holds for every term across a sweep of loans, rates and types", () => {
    const found: string[] = [];
    for (const type of types) {
      for (const loan of loans) {
        for (const rate of rates) {
          for (let years = 1; years <= 40; years++) {
            const i = inputs(loan, rate, years, type);
            for (const p of problems(i, schedule(i))) {
              found.push(`${type} ${loan} ${rate} ${years}: ${p}`);
            }
          }
        }
      }
    }
    expect(found).toEqual([]);
  });
});
