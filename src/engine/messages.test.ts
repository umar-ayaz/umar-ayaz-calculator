import { describe, expect, it } from "vitest";
import { errorSummary, MESSAGES } from "./messages";

describe("errorSummary", () => {
  it("S-13: says '1 error' for one message", () => {
    expect(errorSummary([MESSAGES.term.empty])).toBe("1 error. Enter a term.");
  });

  it("S-13: says 'N errors' for more, in the order given", () => {
    expect(
      errorSummary([
        MESSAGES.loanAmount.notANumber,
        MESSAGES.interestRate.empty,
        MESSAGES.term.range,
      ]),
    ).toBe(
      "3 errors. Loan amount must be a number. Enter an interest rate. Term must be between 1 and 40 years.",
    );
  });
});
