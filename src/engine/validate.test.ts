import { describe, expect, it } from "vitest";
import { MESSAGES } from "./messages";
import { validate, type Field, type RawInputs } from "./validate";

const MINUS = "−"; // U+2212 MINUS SIGN
const EN_DASH = "–"; // U+2013 EN DASH

const GOOD: RawInputs = {
  loanAmount: "200000",
  interestRate: "5",
  term: "25",
  repaymentType: "repayment",
};

/** The message a field gets when only that field is changed, or undefined. */
function errorFor(field: Field, text: string): string | undefined {
  const result = validate({ ...GOOD, [field]: text });
  return result.ok ? undefined : result.errors[field];
}

/** The values the engine receives when only one field is changed. */
function acceptedWith(field: Field, text: string) {
  const result = validate({ ...GOOD, [field]: text });
  if (!result.ok) {
    throw new Error(`"${text}" was rejected: ${JSON.stringify(result.errors)}`);
  }
  return result.inputs;
}

describe("the thirteen messages, word for word", () => {
  it("S-6: loan amount messages", () => {
    expect(MESSAGES.loanAmount.empty).toBe("Enter a loan amount.");
    expect(MESSAGES.loanAmount.notANumber).toBe("Loan amount must be a number.");
    expect(MESSAGES.loanAmount.decimals).toBe(
      "Loan amount can have at most 2 decimal places.",
    );
    expect(MESSAGES.loanAmount.range).toBe(
      "Loan amount must be between £1,000 and £10,000,000.",
    );
  });

  it("S-7: interest rate messages", () => {
    expect(MESSAGES.interestRate.empty).toBe("Enter an interest rate.");
    expect(MESSAGES.interestRate.notANumber).toBe("Interest rate must be a number.");
    expect(MESSAGES.interestRate.decimals).toBe(
      "Interest rate can have at most 3 decimal places.",
    );
    expect(MESSAGES.interestRate.negative).toBe("Interest rate cannot be negative.");
    expect(MESSAGES.interestRate.tooHigh).toBe("Interest rate must be 25% or less.");
  });

  it("S-8: term messages", () => {
    expect(MESSAGES.term.empty).toBe("Enter a term.");
    expect(MESSAGES.term.notANumber).toBe("Term must be a number.");
    expect(MESSAGES.term.notWhole).toBe("Term must be a whole number of years.");
    expect(MESSAGES.term.range).toBe("Term must be between 1 and 40 years.");
  });

  it("S-6/S-7/S-8: there are exactly thirteen, all different", () => {
    const all = [
      ...Object.values(MESSAGES.loanAmount),
      ...Object.values(MESSAGES.interestRate),
      ...Object.values(MESSAGES.term),
    ];
    expect(all).toHaveLength(13);
    expect(new Set(all).size).toBe(13);
  });

  it("S-13: every message names the field it belongs to", () => {
    for (const m of Object.values(MESSAGES.loanAmount)) expect(m).toMatch(/loan amount/i);
    for (const m of Object.values(MESSAGES.interestRate)) expect(m).toMatch(/interest rate/i);
    for (const m of Object.values(MESSAGES.term)) expect(m).toMatch(/term/i);
  });
});

describe("S-6: loan amount", () => {
  it.each(["", " ", "   ", "\t"])("S-6: %j gets 'Enter a loan amount.'", (text) => {
    expect(errorFor("loanAmount", text)).toBe("Enter a loan amount.");
  });

  it.each(["abc", "1e9", "--5", "5.5.5", "25 years", "25 years old", "£", "£abc", "200£000"])(
    "S-6: %j gets 'Loan amount must be a number.'",
    (text) => {
      expect(errorFor("loanAmount", text)).toBe("Loan amount must be a number.");
    },
  );

  it.each(["200000.555", "1000.001", "£5000.123", "5000.1234567"])(
    "S-6: %j gets the decimal places message",
    (text) => {
      expect(errorFor("loanAmount", text)).toBe(
        "Loan amount can have at most 2 decimal places.",
      );
    },
  );

  it.each([
    "0",
    "-0",
    "-1",
    "999.99",
    "10000001",
    "10000000.01",
    "0.50",
    "-1000",
    "999",
    "1",
    "99999999999999999999",
  ])("S-6: %j gets the range message", (text) => {
    expect(errorFor("loanAmount", text)).toBe(
      "Loan amount must be between £1,000 and £10,000,000.",
    );
  });

  it("S-6: a minus sign written as U+2212 gets the range message", () => {
    expect(errorFor("loanAmount", `${MINUS}5`)).toBe(
      "Loan amount must be between £1,000 and £10,000,000.",
    );
  });

  it("S-6: a minus sign written as U+2212 gets the same message as an ordinary one", () => {
    for (const text of ["5", "0", "1000", "0.555", "abc"]) {
      expect(errorFor("loanAmount", `${MINUS}${text}`)).toBe(
        errorFor("loanAmount", `-${text}`),
      );
    }
  });

  it("S-1: an en dash is not a minus sign, so '–5' is not a number", () => {
    expect(errorFor("loanAmount", `${EN_DASH}5`)).toBe("Loan amount must be a number.");
  });

  it.each([
    ["1000", 100_000],
    ["10000000", 1_000_000_000],
    ["£1,000", 100_000],
    ["£10,000,000", 1_000_000_000],
    ["1000.00", 100_000],
    ["10000000.00", 1_000_000_000],
    ["1000.01", 100_001],
    ["9999999.99", 999_999_999],
  ])("S-6: %j is on or inside the boundary and is accepted as %i pence", (text, pence) => {
    expect(errorFor("loanAmount", text)).toBeUndefined();
    expect(acceptedWith("loanAmount", text).loanPence).toBe(pence);
  });

  it("S-1: £200,000 is accepted as 200000", () => {
    expect(acceptedWith("loanAmount", "£200,000").loanPence).toBe(20_000_000);
  });

  it("S-1: 200,000.50 is accepted as 200000.50", () => {
    expect(acceptedWith("loanAmount", "200,000.50").loanPence).toBe(20_000_050);
  });

  it("S-1: 2,00,000 is accepted as 200000", () => {
    expect(acceptedWith("loanAmount", "2,00,000").loanPence).toBe(20_000_000);
  });

  it("S-1: leading and trailing spaces are ignored", () => {
    expect(acceptedWith("loanAmount", "  200000  ").loanPence).toBe(20_000_000);
  });

  it("S-1: '200000.500' is accepted, because trailing zeros are not decimal places", () => {
    expect(errorFor("loanAmount", "200000.500")).toBeUndefined();
    expect(acceptedWith("loanAmount", "200000.500").loanPence).toBe(20_000_050);
  });

  it("S-1: a loan amount of '1000.' is accepted as 1000", () => {
    expect(acceptedWith("loanAmount", "1000.").loanPence).toBe(100_000);
  });

  it("S-6: the order is empty, not a number, decimal places, range", () => {
    // Too many decimals AND out of range: decimals wins.
    expect(errorFor("loanAmount", "0.555")).toBe(
      "Loan amount can have at most 2 decimal places.",
    );
    expect(errorFor("loanAmount", "-5.555")).toBe(
      "Loan amount can have at most 2 decimal places.",
    );
    expect(errorFor("loanAmount", "99999999.999")).toBe(
      "Loan amount can have at most 2 decimal places.",
    );
  });

  it("S-6: an empty loan amount gets the empty message, not the range message, when the others are invalid", () => {
    const result = validate({
      loanAmount: "",
      interestRate: "abc",
      term: "0",
      repaymentType: "repayment",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.loanAmount).toBe("Enter a loan amount.");
  });
});

describe("S-7: interest rate", () => {
  it.each(["", " ", "   ", "\t"])("S-7: %j gets 'Enter an interest rate.'", (text) => {
    expect(errorFor("interestRate", text)).toBe("Enter an interest rate.");
  });

  it.each(["abc", "1e1", "5,5", "%", "%5", "£5", "5 percent", "--5"])(
    "S-7: %j gets 'Interest rate must be a number.'",
    (text) => {
      expect(errorFor("interestRate", text)).toBe("Interest rate must be a number.");
    },
  );

  it.each(["5.1255", "0.0001", "25.0001", "1.2345%", "-0.0001"])(
    "S-7: %j gets the decimal places message",
    (text) => {
      expect(errorFor("interestRate", text)).toBe(
        "Interest rate can have at most 3 decimal places.",
      );
    },
  );

  it.each(["-0.5", "-1", "-25", "-0.001", "-100"])(
    "S-7: %j gets 'Interest rate cannot be negative.'",
    (text) => {
      expect(errorFor("interestRate", text)).toBe("Interest rate cannot be negative.");
    },
  );

  it("S-7: '−0.5' written with U+2212 is read as -0.5 and gets the negative message", () => {
    expect(errorFor("interestRate", `${MINUS}0.5`)).toBe(
      "Interest rate cannot be negative.",
    );
  });

  it("S-7: a minus sign written as U+2212 gets the same message as an ordinary one", () => {
    for (const text of ["0.5", "5", "30", "5.1255", "abc", "0"]) {
      expect(errorFor("interestRate", `${MINUS}${text}`)).toBe(
        errorFor("interestRate", `-${text}`),
      );
    }
  });

  it("S-1: an en dash is not a minus sign, so '–0.5' is not a number", () => {
    expect(errorFor("interestRate", `${EN_DASH}0.5`)).toBe(
      "Interest rate must be a number.",
    );
  });

  it.each(["25.001", "26", "100", "25.5", "1000000"])(
    "S-7: %j gets 'Interest rate must be 25% or less.'",
    (text) => {
      expect(errorFor("interestRate", text)).toBe("Interest rate must be 25% or less.");
    },
  );

  it.each([
    ["0", 0],
    ["25", 25_000],
    ["5.125", 5_125],
    ["5%", 5_000],
    ["0.001", 1],
    ["24.999", 24_999],
    ["25.000", 25_000],
    ["5.1250", 5_125],
    [".5", 500],
    ["5.", 5_000],
    ["0.0", 0],
    [" 5 % ", 5_000],
  ])("S-7: %j is accepted as %i thousandths of a percent", (text, milli) => {
    expect(errorFor("interestRate", text)).toBeUndefined();
    expect(acceptedWith("interestRate", text).rateMilliPercent).toBe(milli);
  });

  it("S-7: '-0' is accepted as 0%, because a minus before a zero is not a negative rate", () => {
    expect(errorFor("interestRate", "-0")).toBeUndefined();
    expect(acceptedWith("interestRate", "-0").rateMilliPercent).toBe(0);
  });

  it("S-7: '-0.0', '−0' and '-0%' are also accepted as 0%", () => {
    for (const text of ["-0.0", `${MINUS}0`, "-0%", "-0.000"]) {
      expect(errorFor("interestRate", text)).toBeUndefined();
      expect(acceptedWith("interestRate", text).rateMilliPercent).toBe(0);
    }
  });

  it("S-7: decimal places win over the range check", () => {
    expect(errorFor("interestRate", "25.5555")).toBe(
      "Interest rate can have at most 3 decimal places.",
    );
    expect(errorFor("interestRate", "99.9999")).toBe(
      "Interest rate can have at most 3 decimal places.",
    );
  });

  it("S-7: '-0.5555' gets the decimal places message and not the negative message", () => {
    expect(errorFor("interestRate", "-0.5555")).toBe(
      "Interest rate can have at most 3 decimal places.",
    );
  });

  it("S-7: '-26' is far outside the range but gets the negative message", () => {
    expect(errorFor("interestRate", "-26")).toBe("Interest rate cannot be negative.");
  });

  it("S-7: the order is empty, not a number, decimal places, negative, above 25", () => {
    expect(errorFor("interestRate", "")).toBe(MESSAGES.interestRate.empty);
    expect(errorFor("interestRate", "x")).toBe(MESSAGES.interestRate.notANumber);
    expect(errorFor("interestRate", "-1.2345")).toBe(MESSAGES.interestRate.decimals);
    expect(errorFor("interestRate", "-1")).toBe(MESSAGES.interestRate.negative);
    expect(errorFor("interestRate", "26")).toBe(MESSAGES.interestRate.tooHigh);
  });
});

describe("S-8: term", () => {
  it.each(["", " ", "   ", "\t"])("S-8: %j gets 'Enter a term.'", (text) => {
    expect(errorFor("term", text)).toBe("Enter a term.");
  });

  it.each(["abc", "25 years", "2,5", "£25", "25%", "1e1", "--5", "25y"])(
    "S-8: %j gets 'Term must be a number.'",
    (text) => {
      expect(errorFor("term", text)).toBe("Term must be a number.");
    },
  );

  it.each(["25.5", "0.5", "1.1", "40.5", "41.5", "-2.5", "0.001"])(
    "S-8: %j gets 'Term must be a whole number of years.'",
    (text) => {
      expect(errorFor("term", text)).toBe("Term must be a whole number of years.");
    },
  );

  it.each(["0", "-0", "-5", "41", "100", "-1", "41.0", "0.0", "99999999999999999999"])(
    "S-8: %j gets 'Term must be between 1 and 40 years.'",
    (text) => {
      expect(errorFor("term", text)).toBe("Term must be between 1 and 40 years.");
    },
  );

  it("S-8: '−5' written with U+2212 is read as -5 and gets the range message", () => {
    expect(errorFor("term", `${MINUS}5`)).toBe("Term must be between 1 and 40 years.");
  });

  it("S-8: a minus sign written as U+2212 gets the same message as an ordinary one", () => {
    for (const text of ["5", "0", "25.5", "abc", "41"]) {
      expect(errorFor("term", `${MINUS}${text}`)).toBe(errorFor("term", `-${text}`));
    }
  });

  it("S-1: an en dash is not a minus sign, so '–5' is not a number", () => {
    expect(errorFor("term", `${EN_DASH}5`)).toBe("Term must be a number.");
  });

  it("S-8: '25.5' and also above 40, '41.5', get the whole number message and not the range message", () => {
    expect(errorFor("term", "41.5")).toBe("Term must be a whole number of years.");
    expect(errorFor("term", "100.5")).toBe("Term must be a whole number of years.");
  });

  it.each([1, 2, 10, 25, 30, 39, 40])("S-8: %i is accepted", (years) => {
    expect(errorFor("term", String(years))).toBeUndefined();
    expect(acceptedWith("term", String(years)).termYears).toBe(years);
  });

  it("S-1: '25.0' is accepted as 25, because only the value is judged", () => {
    expect(errorFor("term", "25.0")).toBeUndefined();
    expect(acceptedWith("term", "25.0").termYears).toBe(25);
    expect(acceptedWith("term", "25.000").termYears).toBe(25);
  });

  it("S-1: '25.' is accepted as 25", () => {
    expect(acceptedWith("term", "25.").termYears).toBe(25);
  });

  it("S-1: leading and trailing spaces and leading zeros are ignored", () => {
    expect(acceptedWith("term", "  25  ").termYears).toBe(25);
    expect(acceptedWith("term", "025").termYears).toBe(25);
  });

  it("S-8: the order is empty, not a number, not whole, range", () => {
    expect(errorFor("term", "")).toBe(MESSAGES.term.empty);
    expect(errorFor("term", "x")).toBe(MESSAGES.term.notANumber);
    expect(errorFor("term", "41.5")).toBe(MESSAGES.term.notWhole);
    expect(errorFor("term", "41")).toBe(MESSAGES.term.range);
  });
});

describe("S-9: all the messages at once", () => {
  it("S-9: 'abc', empty and '0' give all three messages together", () => {
    const result = validate({
      loanAmount: "abc",
      interestRate: "",
      term: "0",
      repaymentType: "repayment",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual({
        loanAmount: "Loan amount must be a number.",
        interestRate: "Enter an interest rate.",
        term: "Term must be between 1 and 40 years.",
      });
    }
  });

  it("S-9: each message is filed under the field it belongs to", () => {
    const result = validate({
      loanAmount: "",
      interestRate: "26",
      term: "25.5",
      repaymentType: "interestOnly",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.loanAmount).toBe(MESSAGES.loanAmount.empty);
      expect(result.errors.interestRate).toBe(MESSAGES.interestRate.tooHigh);
      expect(result.errors.term).toBe(MESSAGES.term.notWhole);
    }
  });

  it("S-9: one bad field gives one message and no others", () => {
    const result = validate({ ...GOOD, term: "0" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(["term"]);
  });

  it("S-9: when every input is valid there are no messages at all", () => {
    const result = validate(GOOD);
    expect(result.ok).toBe(true);
    expect(result).not.toHaveProperty("errors");
  });

  it("S-9: an invalid result carries no values to calculate from", () => {
    const result = validate({ ...GOOD, loanAmount: "abc" });
    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty("inputs");
  });

  it("S-13: messages come back in screen order, loan amount, rate, term", () => {
    const result = validate({
      loanAmount: "",
      interestRate: "",
      term: "",
      repaymentType: "repayment",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(["loanAmount", "interestRate", "term"]);
  });
});

describe("S-1: the repayment type", () => {
  it("S-1: the repayment type is passed through for Repayment", () => {
    expect(acceptedWith("loanAmount", "200000").repaymentType).toBe("repayment");
  });

  it("S-1: the repayment type is passed through for Interest only", () => {
    const result = validate({ ...GOOD, repaymentType: "interestOnly" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.inputs.repaymentType).toBe("interestOnly");
  });

  it("S-9: the repayment type never produces a message", () => {
    const result = validate({
      loanAmount: "x",
      interestRate: "x",
      term: "x",
      repaymentType: "interestOnly",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).not.toContain("repaymentType");
  });
});

describe("S-4: a rate of 0 is a real rate", () => {
  it("S-4: a rate of 0 passes validation with no message", () => {
    const result = validate({ ...GOOD, interestRate: "0" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.inputs.rateMilliPercent).toBe(0);
  });

  it("S-4: 0, 0.0, 0.000, 0% and -0 are all the same accepted rate", () => {
    for (const text of ["0", "0.0", "0.000", "0%", "-0", ".0", "0."]) {
      expect(acceptedWith("interestRate", text).rateMilliPercent).toBe(0);
    }
  });
});

describe("whole-input behaviour", () => {
  it("S-1: all the values arrive as whole numbers", () => {
    const result = validate({
      loanAmount: "£123,456.78",
      interestRate: "4.375%",
      term: "30",
      repaymentType: "repayment",
    });
    expect(result).toEqual({
      ok: true,
      inputs: {
        loanPence: 12_345_678,
        rateMilliPercent: 4_375,
        termYears: 30,
        repaymentType: "repayment",
      },
    });
  });

  it("S-11: no accepted input ever yields a fractional or non-finite value", () => {
    const samples = [
      ["1000", "0", "1"],
      ["10000000", "25", "40"],
      ["1000.01", "0.001", "1"],
      ["9999999.99", "24.999", "40"],
    ] as const;
    for (const [loanAmount, interestRate, term] of samples) {
      const result = validate({ loanAmount, interestRate, term, repaymentType: "repayment" });
      expect(result.ok).toBe(true);
      if (result.ok) {
        for (const n of [
          result.inputs.loanPence,
          result.inputs.rateMilliPercent,
          result.inputs.termYears,
        ]) {
          expect(Number.isSafeInteger(n)).toBe(true);
        }
      }
    }
  });

  it("S-6/S-7/S-8: validating never throws, whatever is typed", () => {
    const awkward = [
      "",
      " ",
      "\u0000",
      "💷",
      "9".repeat(5000),
      "0.".padEnd(5000, "0"),
      "-".repeat(1000),
      "£".repeat(100),
      "﻿5",
      "5​",
      "NaN",
      "__proto__",
      "constructor",
    ];
    for (const text of awkward) {
      for (const field of ["loanAmount", "interestRate", "term"] as const) {
        expect(() => validate({ ...GOOD, [field]: text })).not.toThrow();
      }
    }
  });
});
