import { describe, expect, it } from "vitest";
import { formatMoney } from "./format";

describe("S-14: every figure is written as money", () => {
  it('S-14: 1169.18 reads "£1,169.18", not "£1169.18" or "£1,169.2"', () => {
    const shown = formatMoney(116_918);
    expect(shown).toBe("£1,169.18");
    expect(shown).not.toBe("£1169.18");
    expect(shown).not.toBe("£1,169.2");
  });

  it('S-14: 0 reads "£0.00"', () => {
    expect(formatMoney(0)).toBe("£0.00");
  });

  it('S-14: a balance owed of 200000 reads "£200,000.00"', () => {
    expect(formatMoney(20_000_000)).toBe("£200,000.00");
  });

  it.each([
    [1, "£0.01"],
    [5, "£0.05"],
    [9, "£0.09"],
    [10, "£0.10"],
    [99, "£0.99"],
    [100, "£1.00"],
    [101, "£1.01"],
    [999, "£9.99"],
    [1_000, "£10.00"],
    [99_999, "£999.99"],
    [100_000, "£1,000.00"],
    [100_001, "£1,000.01"],
    [9_504, "£95.04"],
    [208, "£2.08"],
    [83_333, "£833.33"],
    [277_778, "£2,777.78"],
    [128_860, "£1,288.60"],
    [107_364, "£1,073.64"],
    [99_999_999, "£999,999.99"],
    [100_000_000, "£1,000,000.00"],
    [20_834_382, "£208,343.82"],
    [20_833_333, "£208,333.33"],
    [1_000_000_000, "£10,000,000.00"],
  ])("S-14: %i pence reads %s", (pence, shown) => {
    expect(formatMoney(pence)).toBe(shown);
  });

  it("S-14: it always starts with £, always has exactly two decimal places", () => {
    for (let pence = 0; pence <= 2_500; pence++) {
      expect(formatMoney(pence)).toMatch(/^£\d{1,3}(,\d{3})*\.\d{2}$/);
    }
    for (const pence of [123_456, 12_345_678, 987_654_321, 1_000_000_000]) {
      expect(formatMoney(pence)).toMatch(/^£\d{1,3}(,\d{3})*\.\d{2}$/);
    }
  });

  it("S-14: the pounds and pence read back to the same number of pence", () => {
    for (let pence = 0; pence <= 5_000; pence += 7) {
      const read = Number(formatMoney(pence).slice(1).replaceAll(",", "")) * 100;
      expect(Math.round(read)).toBe(pence);
    }
    for (const pence of [123_456_789, 999_999_999, 1_000_000_000]) {
      const read = Number(formatMoney(pence).slice(1).replaceAll(",", "")) * 100;
      expect(Math.round(read)).toBe(pence);
    }
  });

  it("S-14: commas fall every three digits from the right", () => {
    expect(formatMoney(100_000_00)).toBe("£100,000.00");
    expect(formatMoney(123_456_789)).toBe("£1,234,567.89");
    expect(formatMoney(10_00)).toBe("£10.00");
  });
});

describe("S-11: a broken figure can never be written", () => {
  it('S-11: it never contains "NaN", "Infinity", "-0.00" or a minus sign', () => {
    for (const pence of [0, 1, 99, 100, 20_834_382, 1_000_000_000]) {
      const shown = formatMoney(pence);
      expect(shown).not.toMatch(/NaN|Infinity|-/);
    }
  });

  it("S-11: zero is £0.00 and never -£0.00 or £-0.00", () => {
    expect(formatMoney(0)).toBe("£0.00");
    expect(formatMoney(-0)).toBe("£0.00");
  });

  it.each([-1, -100, 0.5, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "S-11: %s is not a number of pence the engine can produce, so it is refused rather than shown",
    (pence) => {
      expect(() => formatMoney(pence)).toThrow(RangeError);
    },
  );
});
