import { describe, expect, it } from "vitest";
import { parseInterestRate, parseLoanAmount, parseTerm, type Parsed } from "./parse";

const MINUS = "−"; // U+2212 MINUS SIGN
const EN_DASH = "–"; // U+2013 EN DASH

function num(negative: boolean, whole: string, fraction = ""): Parsed {
  return { kind: "number", value: { negative, whole, fraction } };
}
const EMPTY: Parsed = { kind: "empty" };
const NOT_A_NUMBER: Parsed = { kind: "notANumber" };

const fields = [
  ["loan amount", parseLoanAmount],
  ["interest rate", parseInterestRate],
  ["term", parseTerm],
] as const;

describe("S-1: loan amount is read from what was typed", () => {
  it.each([
    ["£200,000", num(false, "200000")],
    ["200,000.50", num(false, "200000", "5")],
    ["200000", num(false, "200000")],
    ["1000", num(false, "1000")],
    ["£200,000.99", num(false, "200000", "99")],
  ])('S-1: "%s" is accepted', (text, expected) => {
    expect(parseLoanAmount(text)).toEqual(expected);
  });

  it("S-1: commas are ignored wherever they are, so 2,00,000 is 200000", () => {
    expect(parseLoanAmount("2,00,000")).toEqual(num(false, "200000"));
    expect(parseLoanAmount("2000,00")).toEqual(num(false, "200000"));
    expect(parseLoanAmount("£2,0,0,0,0,0")).toEqual(num(false, "200000"));
  });

  it("S-1: a £ at the start is accepted, with or without a space after it", () => {
    expect(parseLoanAmount("£5000")).toEqual(num(false, "5000"));
    expect(parseLoanAmount("£ 5000")).toEqual(num(false, "5000"));
  });

  it("S-1: a £ straight after a minus sign is accepted", () => {
    expect(parseLoanAmount("-£5000")).toEqual(num(true, "5000"));
    expect(parseLoanAmount("-£ 5000")).toEqual(num(true, "5000"));
    expect(parseLoanAmount(`${MINUS}£5000`)).toEqual(num(true, "5000"));
  });

  it("S-1: a minus sign after the £ is accepted", () => {
    expect(parseLoanAmount("£-5000")).toEqual(num(true, "5000"));
  });

  it.each(["200£000", "200000£", "£200,000£", "££5", "£-£5", "5£", "-5£"])(
    'S-1: a £ anywhere else, such as "%s", is not a number',
    (text) => {
      expect(parseLoanAmount(text)).toEqual(NOT_A_NUMBER);
    },
  );

  it("S-1: the loan amount does not accept a %", () => {
    expect(parseLoanAmount("5%")).toEqual(NOT_A_NUMBER);
  });

  it('S-1: a loan amount of only "£" is not a number, not empty', () => {
    expect(parseLoanAmount("£")).toEqual(NOT_A_NUMBER);
    expect(parseLoanAmount(" £ ")).toEqual(NOT_A_NUMBER);
  });

  it("S-1: a loan amount of only commas is not a number", () => {
    expect(parseLoanAmount(",")).toEqual(NOT_A_NUMBER);
    expect(parseLoanAmount("£,,,")).toEqual(NOT_A_NUMBER);
  });
});

describe("S-1: interest rate is read from what was typed", () => {
  it.each([
    ["5%", num(false, "5")],
    ["5", num(false, "5")],
    ["5.125", num(false, "5", "125")],
    ["0", num(false, "0")],
    ["25", num(false, "25")],
    ["5 %", num(false, "5")],
    [" 5% ", num(false, "5")],
    ["5.125%", num(false, "5", "125")],
  ])('S-1: "%s" is accepted', (text, expected) => {
    expect(parseInterestRate(text)).toEqual(expected);
  });

  it.each(["%5", "5%%", "%", "5%5", "%%", "5.%5"])(
    'S-1: a % anywhere but the end, such as "%s", is not a number',
    (text) => {
      expect(parseInterestRate(text)).toEqual(NOT_A_NUMBER);
    },
  );

  it('S-1: a rate of only "%" is not a number, not empty', () => {
    expect(parseInterestRate("%")).toEqual(NOT_A_NUMBER);
    expect(parseInterestRate(" % ")).toEqual(NOT_A_NUMBER);
  });

  it("S-1: a comma in the rate is not a number", () => {
    expect(parseInterestRate("5,5")).toEqual(NOT_A_NUMBER);
    expect(parseInterestRate("1,000")).toEqual(NOT_A_NUMBER);
    expect(parseInterestRate(",5")).toEqual(NOT_A_NUMBER);
  });

  it("S-1: the interest rate does not accept a £", () => {
    expect(parseInterestRate("£5")).toEqual(NOT_A_NUMBER);
  });
});

describe("S-1: term is read from what was typed", () => {
  it.each([
    ["25", num(false, "25")],
    ["1", num(false, "1")],
    ["40", num(false, "40")],
    ["  25  ", num(false, "25")],
  ])('S-1: "%s" is accepted', (text, expected) => {
    expect(parseTerm(text)).toEqual(expected);
  });

  it('S-1: "25.0" is read as 25, because only the value is judged', () => {
    expect(parseTerm("25.0")).toEqual(num(false, "25"));
    expect(parseTerm("25.000")).toEqual(num(false, "25"));
  });

  it('S-8: "25.5" keeps its fraction so the whole-number check can see it', () => {
    expect(parseTerm("25.5")).toEqual(num(false, "25", "5"));
  });

  it("S-1: a comma in the term is not a number", () => {
    expect(parseTerm("2,5")).toEqual(NOT_A_NUMBER);
    expect(parseTerm("1,0")).toEqual(NOT_A_NUMBER);
  });

  it('S-8: "25 years" is not a number, because the word is not tolerated', () => {
    expect(parseTerm("25 years")).toEqual(NOT_A_NUMBER);
    expect(parseTerm("25y")).toEqual(NOT_A_NUMBER);
  });

  it("S-1: the term does not accept a £ or a %", () => {
    expect(parseTerm("£25")).toEqual(NOT_A_NUMBER);
    expect(parseTerm("25%")).toEqual(NOT_A_NUMBER);
  });
});

describe.each(fields)("S-1: shared rules for the %s field", (_name, parse) => {
  it.each(["", " ", "   ", "\t", "\n", " \t\n "])(
    "S-1: %j is empty",
    (text) => {
      expect(parse(text)).toEqual(EMPTY);
    },
  );

  it("S-1: leading and trailing spaces are ignored", () => {
    expect(parse("  25  ")).toEqual(num(false, "25"));
    expect(parse("\t25\n")).toEqual(num(false, "25"));
  });

  it('S-1: a value with nothing before the point, ".5", is read as 0.5', () => {
    expect(parse(".5")).toEqual(num(false, "0", "5"));
    expect(parse("-.5")).toEqual(num(true, "0", "5"));
  });

  it('S-1: a value with nothing after the point, "5.", is read as 5', () => {
    expect(parse("5.")).toEqual(num(false, "5"));
    expect(parse("-5.")).toEqual(num(true, "5"));
  });

  it('S-1: zeros at the end of the decimal part are dropped, "0.50" is 0.5', () => {
    expect(parse("0.50")).toEqual(num(false, "0", "5"));
    expect(parse("5.000")).toEqual(num(false, "5"));
    expect(parse("0.00")).toEqual(num(false, "0"));
  });

  it("S-1: zeros at the start of the whole part are dropped", () => {
    expect(parse("007")).toEqual(num(false, "7"));
    expect(parse("000")).toEqual(num(false, "0"));
    expect(parse("00.5")).toEqual(num(false, "0", "5"));
  });

  it("S-1: an ordinary minus sign makes the value negative", () => {
    expect(parse("-5")).toEqual(num(true, "5"));
    expect(parse("-0.5")).toEqual(num(true, "0", "5"));
  });

  it("S-1: the minus sign U+2212 is read as an ordinary minus sign", () => {
    expect(parse(`${MINUS}5`)).toEqual(parse("-5"));
    expect(parse(`${MINUS}0.5`)).toEqual(parse("-0.5"));
    expect(parse(`${MINUS}5`)).toEqual(num(true, "5"));
  });

  it("S-1: an en dash is not a minus sign, so the value is not a number", () => {
    expect(parse(`${EN_DASH}5`)).toEqual(NOT_A_NUMBER);
    expect(parse(`${EN_DASH}0.5`)).toEqual(NOT_A_NUMBER);
  });

  it.each([
    "—", // em dash
    "‒", // figure dash
    "－", // full-width hyphen-minus
    "‐", // hyphen
  ])("S-1: only U+2212 is a minus sign, so %j is not a number", (dash) => {
    expect(parse(`${dash}5`)).toEqual(NOT_A_NUMBER);
  });

  it('S-1: a minus sign "-0" is read as negative zero', () => {
    expect(parse("-0")).toEqual(num(true, "0"));
    expect(parse(`${MINUS}0`)).toEqual(num(true, "0"));
  });

  it.each([
    "abc",
    "1e9",
    "1E9",
    "--5",
    "5.5.5",
    "5..5",
    "+5",
    "5-",
    "- 5",
    "0x10",
    "Infinity",
    "NaN",
    "-",
    ".",
    "-.",
    "5 5",
    "5a",
    "a5",
    "5.5a",
  ])("S-6/S-7/S-8: %j is not a number", (text) => {
    expect(parse(text)).toEqual(NOT_A_NUMBER);
  });

  it("S-1: digits from other scripts are not numbers", () => {
    expect(parse("٥")).toEqual(NOT_A_NUMBER); // Arabic-Indic five
    expect(parse("５")).toEqual(NOT_A_NUMBER); // full-width five
  });

  it("S-1: a very long run of digits is read without losing any of them", () => {
    const digits = "9".repeat(60);
    expect(parse(digits)).toEqual(num(false, digits));
    expect(parse(`0.${digits}`)).toEqual(num(false, "0", digits));
  });
});
