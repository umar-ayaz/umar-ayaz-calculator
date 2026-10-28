import { describe, expect, it } from "vitest";
import { calculate } from "./calculate";
import type { Inputs, RepaymentType } from "./validate";

/** Builds validated inputs from the figures as the stories write them. */
function inputs(
  loan: number,
  ratePercent: number,
  years: number,
  repaymentType: RepaymentType = "repayment",
): Inputs {
  return {
    loanPence: Math.round(loan * 100),
    rateMilliPercent: Math.round(ratePercent * 1000),
    termYears: years,
    repaymentType,
  };
}

function monthly(loan: number, rate: number, years: number, type: RepaymentType = "repayment") {
  return calculate(inputs(loan, rate, years, type)).monthlyPence;
}

/**
 * The ordinary floating-point formula, which is what a normal online
 * calculator runs. Used only to check ours against.
 */
function floatPence(i: Inputs): number {
  const p = i.loanPence / 100;
  const monthlyRate = i.rateMilliPercent / 1000 / 100 / 12;
  const months = i.termYears * 12;
  if (i.repaymentType === "interestOnly") return Math.round(p * monthlyRate * 100);
  if (monthlyRate === 0) return Math.round((p / months) * 100);
  const payment = (p * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  return Math.round(payment * 100);
}

/** A small seeded random generator, so the sweeps give the same cases every run. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInputs(random: () => number, type: RepaymentType): Inputs {
  return {
    loanPence: 100_000 + Math.floor(random() * (1_000_000_000 - 100_000 + 1)),
    rateMilliPercent: Math.floor(random() * 25_001),
    termYears: 1 + Math.floor(random() * 40),
    repaymentType: type,
  };
}

describe("S-2: monthly payment on a repayment mortgage", () => {
  it.each([
    { loan: 200_000, rate: 5, years: 25, pence: 116_918, shown: "£1,169.18" },
    { loan: 1_000, rate: 25, years: 1, pence: 9_504, shown: "£95.04" },
    { loan: 10_000_000, rate: 25, years: 40, pence: 20_834_382, shown: "£208,343.82" },
    { loan: 1_000, rate: 0.001, years: 40, pence: 208, shown: "£2.08" },
  ])("S-2: $loan at $rate% over $years years is $shown", ({ loan, rate, years, pence }) => {
    expect(monthly(loan, rate, years)).toBe(pence);
  });

  it("S-2: the repayment result holds the monthly payment and nothing else", () => {
    expect(calculate(inputs(200_000, 5, 25))).toEqual({
      type: "repayment",
      monthlyPence: 116_918,
    });
  });

  it("S-2: a repayment result has no balance owed", () => {
    expect(calculate(inputs(200_000, 5, 25))).not.toHaveProperty("balanceOwedPence");
  });
});

describe("S-3: both figures on an interest-only mortgage", () => {
  it("S-3: 200000 at 5% over 25 years is £833.33 a month with £200,000.00 owed", () => {
    expect(calculate(inputs(200_000, 5, 25, "interestOnly"))).toEqual({
      type: "interestOnly",
      monthlyPence: 83_333,
      balanceOwedPence: 20_000_000,
    });
  });

  it("S-3: the balance owed equals the loan entered, for any valid input", () => {
    const random = seeded(3);
    for (let n = 0; n < 500; n++) {
      const i = randomInputs(random, "interestOnly");
      const result = calculate(i);
      expect(result.type).toBe("interestOnly");
      if (result.type === "interestOnly") {
        expect(result.balanceOwedPence).toBe(i.loanPence);
      }
    }
  });

  it("S-3: the interest-only payment does not depend on the term", () => {
    expect(monthly(200_000, 5, 1, "interestOnly")).toBe(
      monthly(200_000, 5, 40, "interestOnly"),
    );
  });

  it("S-3: the interest-only payment is the loan times the monthly rate", () => {
    expect(monthly(120_000, 6, 10, "interestOnly")).toBe(60_000); // £600.00
    expect(monthly(1_000, 12, 5, "interestOnly")).toBe(1_000); // £10.00
    expect(monthly(10_000_000, 25, 40, "interestOnly")).toBe(20_833_333); // £208,333.33
  });
});

describe("S-4: a rate of 0% is a real rate", () => {
  it("S-4: 120000 at 0% over 10 years is £1,000.00", () => {
    expect(monthly(120_000, 0, 10)).toBe(100_000);
  });

  it("S-4: 100000 at 0% over 3 years is £2,777.78", () => {
    expect(monthly(100_000, 0, 3)).toBe(277_778);
  });

  it("S-4: 200000 at 0% interest only is £0.00 a month with £200,000.00 owed", () => {
    expect(calculate(inputs(200_000, 0, 25, "interestOnly"))).toEqual({
      type: "interestOnly",
      monthlyPence: 0,
      balanceOwedPence: 20_000_000,
    });
  });

  it("S-4: at 0% the payment is the loan divided by the months, with no division by zero", () => {
    const result = calculate(inputs(1_000, 0, 40));
    expect(Number.isFinite(result.monthlyPence)).toBe(true);
    expect(result.monthlyPence).toBe(208); // 100000 / 480 = 208.33
  });

  it("S-4: every combination of the extremes at 0% gives a real number", () => {
    for (const loan of [1_000, 10_000_000]) {
      for (const years of [1, 40]) {
        for (const type of ["repayment", "interestOnly"] as const) {
          const pence = monthly(loan, 0, years, type);
          expect(Number.isSafeInteger(pence)).toBe(true);
          expect(pence).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("S-4: the smallest non-zero rate is not treated as zero", () => {
    // 0.001% on £1,000 over 1 year: a payment above the 0% one of £83.33.
    expect(monthly(1_000, 0.001, 1)).toBeGreaterThanOrEqual(monthly(1_000, 0, 1));
    expect(monthly(10_000_000, 0.001, 40)).toBeGreaterThan(monthly(10_000_000, 0, 40));
  });
});

describe("S-5: changing a figure gives a new answer", () => {
  it("S-5: 200000 at 5% over 25 years is £1,169.18", () => {
    expect(monthly(200_000, 5, 25)).toBe(116_918);
  });

  it("S-5: changing the rate to 6 gives £1,288.60", () => {
    expect(monthly(200_000, 6, 25)).toBe(128_860);
  });

  it("S-5: changing the term to 30 gives £1,073.64", () => {
    expect(monthly(200_000, 5, 30)).toBe(107_364);
  });

  it("S-5: calculating does not remember an earlier calculation", () => {
    const first = monthly(200_000, 6, 25);
    monthly(1_000, 25, 1);
    expect(monthly(200_000, 6, 25)).toBe(first);
  });

  it("S-5: calculating does not change the inputs it was given", () => {
    const i = inputs(200_000, 5, 25);
    const copy = { ...i };
    calculate(i);
    expect(i).toEqual(copy);
  });
});

describe("rounding: to the nearest penny, half up, once, at the end", () => {
  it("S-2: £1,169.18 not £1,169.19, because the payment is not rounded up", () => {
    // The exact payment is 1169.180083...
    expect(monthly(200_000, 5, 25)).toBe(116_918);
  });

  it("S-3: an exact half penny rounds up: £6,000 at 0.001% interest only is 0.5p, so 1p", () => {
    expect(monthly(6_000, 0.001, 5, "interestOnly")).toBe(1);
  });

  it("S-3: an exact half penny rounds up: £18,000 at 0.001% interest only is 1.5p, so 2p", () => {
    expect(monthly(18_000, 0.001, 5, "interestOnly")).toBe(2);
  });

  it("S-3: just under a half penny rounds down", () => {
    // £5,999.99 at 0.001% is 0.4999991...p
    expect(monthly(5_999.99, 0.001, 5, "interestOnly")).toBe(0);
  });

  it("S-4: an exact half penny at 0% rounds up: £1,000.02 over 1 year is 8333.5p, so 8334p", () => {
    expect(monthly(1_000.02, 0, 1)).toBe(8_334);
  });

  it("S-4: just under a half penny at 0% rounds down: £1,000.01 over 1 year is 8333.4166p", () => {
    expect(monthly(1_000.01, 0, 1)).toBe(8_333);
  });

  it("S-4: just over a half penny at 0% rounds up: £1,000.03 over 1 year is 8333.5833p", () => {
    expect(monthly(1_000.03, 0, 1)).toBe(8_334);
  });

  it("S-11: where the floating-point formula is a penny out, ours is right", () => {
    // £8,531,383.41 at 0.096% over 1 year. The exact payment is
    // 71,131,836.500061 pence, which rounds up. Floating point lands on
    // 71,131,836.49999 and rounds down.
    const i = inputs(8_531_383.41, 0.096, 1);
    expect(i.loanPence).toBe(853_138_341);
    expect(calculate(i).monthlyPence).toBe(71_131_837);
    expect(floatPence(i)).toBe(71_131_836);
  });
});

describe("S-11: never a broken figure", () => {
  const loans = [1_000, 1_000.01, 123_456.78, 9_999_999.99, 10_000_000];
  const rates = [0, 0.001, 0.5, 5, 24.999, 25];
  const terms = [1, 2, 25, 39, 40];

  it("S-11: every combination of boundary inputs gives a whole, non-negative number of pence", () => {
    for (const loan of loans) {
      for (const rate of rates) {
        for (const years of terms) {
          for (const type of ["repayment", "interestOnly"] as const) {
            const result = calculate(inputs(loan, rate, years, type));
            expect(Number.isSafeInteger(result.monthlyPence)).toBe(true);
            expect(result.monthlyPence).toBeGreaterThanOrEqual(0);
            expect(Object.is(result.monthlyPence, -0)).toBe(false);
          }
        }
      }
    }
  });

  it("S-11: 10000000 at 25% over 40 years is £208,343.82, not Infinity or NaN", () => {
    const pence = monthly(10_000_000, 25, 40);
    expect(Number.isFinite(pence)).toBe(true);
    expect(pence).toBe(20_834_382);
  });

  it("S-11: 1000 at 0.001% over 40 years is £2.08, with no loss of precision", () => {
    expect(monthly(1_000, 0.001, 40)).toBe(208);
  });

  it("S-11: the sweep across the accepted ranges is always whole, finite and non-negative", () => {
    const random = seeded(11);
    for (let n = 0; n < 5_000; n++) {
      for (const type of ["repayment", "interestOnly"] as const) {
        const result = calculate(randomInputs(random, type));
        expect(Number.isSafeInteger(result.monthlyPence)).toBe(true);
        expect(result.monthlyPence).toBeGreaterThanOrEqual(0);
        if (result.type === "interestOnly") {
          expect(Number.isSafeInteger(result.balanceOwedPence)).toBe(true);
        }
      }
    }
  });

  it("S-11: a repayment payment is at least the interest-only payment on the same loan", () => {
    const random = seeded(12);
    for (let n = 0; n < 2_000; n++) {
      const i = randomInputs(random, "repayment");
      const interestOnly = calculate({ ...i, repaymentType: "interestOnly" });
      expect(calculate(i).monthlyPence).toBeGreaterThanOrEqual(interestOnly.monthlyPence);
    }
  });

  it("S-5: a higher rate never lowers the payment", () => {
    const random = seeded(13);
    for (let n = 0; n < 1_000; n++) {
      const i = randomInputs(random, "repayment");
      const higher = Math.min(25_000, i.rateMilliPercent + 1 + Math.floor(random() * 1_000));
      expect(calculate({ ...i, rateMilliPercent: higher }).monthlyPence).toBeGreaterThanOrEqual(
        calculate(i).monthlyPence,
      );
    }
  });

  it("S-5: a longer term never raises the payment", () => {
    const random = seeded(14);
    for (let n = 0; n < 1_000; n++) {
      const i = randomInputs(random, "repayment");
      const longer = Math.min(40, i.termYears + 1 + Math.floor(random() * 5));
      expect(calculate({ ...i, termYears: longer }).monthlyPence).toBeLessThanOrEqual(
        calculate(i).monthlyPence,
      );
    }
  });

  it("S-5: a bigger loan never lowers the payment", () => {
    const random = seeded(15);
    for (let n = 0; n < 1_000; n++) {
      const i = randomInputs(random, "repayment");
      const bigger = Math.min(1_000_000_000, i.loanPence + 1 + Math.floor(random() * 1_000_000));
      expect(calculate({ ...i, loanPence: bigger }).monthlyPence).toBeGreaterThanOrEqual(
        calculate(i).monthlyPence,
      );
    }
  });
});

describe("agreement with the ordinary formula", () => {
  it("S-2: every figure in the stories matches the floating-point formula", () => {
    for (const [loan, rate, years] of [
      [200_000, 5, 25],
      [1_000, 25, 1],
      [10_000_000, 25, 40],
      [1_000, 0.001, 40],
      [120_000, 0, 10],
      [100_000, 0, 3],
      [200_000, 6, 25],
      [200_000, 5, 30],
    ] as const) {
      const i = inputs(loan, rate, years);
      expect(calculate(i).monthlyPence).toBe(floatPence(i));
    }
  });

  it("S-11: across the accepted ranges we are never more than a penny from the ordinary formula", () => {
    const random = seeded(2026);
    for (let n = 0; n < 20_000; n++) {
      for (const type of ["repayment", "interestOnly"] as const) {
        const i = randomInputs(random, type);
        const difference = Math.abs(calculate(i).monthlyPence - floatPence(i));
        expect(difference).toBeLessThanOrEqual(1);
      }
    }
  });

  it("S-2: on repayment loans we match the ordinary formula almost always", () => {
    const random = seeded(7);
    let different = 0;
    const cases = 20_000;
    for (let n = 0; n < cases; n++) {
      const i = randomInputs(random, "repayment");
      if (calculate(i).monthlyPence !== floatPence(i)) different++;
    }
    expect(different).toBeLessThanOrEqual(2);
  });
});
