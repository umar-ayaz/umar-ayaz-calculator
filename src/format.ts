/**
 * Writes whole pence as money: a "£", commas between the thousands and
 * exactly two decimal places, so 116918 is "£1,169.18".
 *
 * Done with plain string handling rather than Intl, so the output is the same
 * in every browser and in the tests whatever the locale.
 *
 * The engine only ever produces whole, non-negative pence. Anything else is a
 * bug upstream, and it is refused here rather than shown as a figure that
 * looks plausible but is wrong.
 */
export function formatMoney(pence: number): string {
  if (!Number.isSafeInteger(pence) || pence < 0) {
    throw new RangeError(`Not a whole, non-negative number of pence: ${pence}`);
  }
  const digits = String(pence).padStart(3, "0");
  const pounds = digits.slice(0, -2).replace(/\B(?=(\d{3})+$)/g, ",");
  return `£${pounds}.${digits.slice(-2)}`;
}
