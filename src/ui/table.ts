import type { ScheduleRow } from "../engine/schedule";
import { formatMoney } from "../format";

const HEADINGS = ["Month", "Payment", "Interest", "Capital repaid", "Balance remaining"];

function cell<K extends "th" | "td">(tag: K, text: string): HTMLTableCellElement {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

/** The month by month table (S-17): one row per payment, every row on the page. */
export function scheduleTable(rows: readonly ScheduleRow[]): HTMLTableElement {
  const table = document.createElement("table");
  table.createCaption().textContent = "Month by month payments";

  const headRow = table.createTHead().insertRow();
  for (const heading of HEADINGS) {
    const th = cell("th", heading);
    th.scope = "col";
    headRow.append(th);
  }

  const body = table.createTBody();
  for (const row of rows) {
    const tr = body.insertRow();
    const month = cell("th", String(row.month));
    month.scope = "row";
    tr.append(
      month,
      cell("td", formatMoney(row.paymentPence)),
      cell("td", formatMoney(row.interestPence)),
      cell("td", formatMoney(row.capitalPence)),
      cell("td", formatMoney(row.balancePence)),
    );
  }
  return table;
}
