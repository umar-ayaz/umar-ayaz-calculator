// The thirteen error messages. They are specified word for word in S-6, S-7
// and S-8 and nowhere else in the code may a message be written out.
export const MESSAGES = {
  loanAmount: {
    empty: "Enter a loan amount.",
    notANumber: "Loan amount must be a number.",
    decimals: "Loan amount can have at most 2 decimal places.",
    range: "Loan amount must be between £1,000 and £10,000,000.",
  },
  interestRate: {
    empty: "Enter an interest rate.",
    notANumber: "Interest rate must be a number.",
    decimals: "Interest rate can have at most 3 decimal places.",
    negative: "Interest rate cannot be negative.",
    tooHigh: "Interest rate must be 25% or less.",
  },
  term: {
    empty: "Enter a term.",
    notANumber: "Term must be a number.",
    notWhole: "Term must be a whole number of years.",
    range: "Term must be between 1 and 40 years.",
  },
} as const;

/**
 * The summary read out to a screen reader when a calculation is refused
 * (S-13): the count, then every message in the order given, for example
 * "3 errors. Loan amount must be a number. Enter an interest rate. …".
 */
export function errorSummary(messages: readonly string[]): string {
  const count = messages.length;
  const noun = count === 1 ? "error" : "errors";
  return `${count} ${noun}. ${messages.join(" ")}`;
}
