import { calculate } from "../engine/calculate";
import { errorSummary } from "../engine/messages";
import { schedule } from "../engine/schedule";
import { validate, type Field, type RawInputs } from "../engine/validate";
import { formatMoney } from "../format";
import { scheduleTable } from "./table";

const FIELDS: { field: Field; label: string; prefix?: string; suffix?: string }[] = [
  { field: "loanAmount", label: "Loan amount", prefix: "£" },
  { field: "interestRate", label: "Annual interest rate", suffix: "%" },
  { field: "term", label: "Term", suffix: "years" },
];

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function textField(
  field: Field,
  label: string,
  prefix?: string,
  suffix?: string,
): { row: HTMLElement; input: HTMLInputElement; error: HTMLElement } {
  const input = el("input", {
    id: field,
    name: field,
    type: "text",
    inputMode: "decimal",
    autocomplete: "off",
  });
  const error = el("p", { id: `${field}-error`, className: "error" });
  // The message is read as part of the field (S-13). It is empty until there
  // is something to say, and an empty description reads as nothing.
  input.setAttribute("aria-describedby", error.id);
  const affix = (text: string) => {
    const span = el("span", { className: "affix" }, text);
    span.setAttribute("aria-hidden", "true");
    return span;
  };
  const box = el("div", { className: "box" });
  if (prefix) box.append(affix(prefix));
  box.append(input);
  if (suffix) box.append(affix(suffix));
  const row = el("div", { className: "field" }, el("label", { htmlFor: field }, label), box, error);
  return { row, input, error };
}

/** Builds the page inside `root` and wires it up. Holds no calculation logic. */
export function mount(root: HTMLElement): void {
  const inputs = {} as Record<Field, HTMLInputElement>;
  const errors = {} as Record<Field, HTMLElement>;
  // autocomplete="off" on the form stops a browser putting typed values back
  // after a reload (S-22).
  const form = el("form", { noValidate: true, autocomplete: "off" });

  for (const { field, label, prefix, suffix } of FIELDS) {
    const parts = textField(field, label, prefix, suffix);
    inputs[field] = parts.input;
    errors[field] = parts.error;
    form.append(parts.row);
  }

  // defaultChecked sets the checked attribute, which is what a form reset
  // returns to. Setting only the checked property would leave nothing
  // selected after a reset.
  const radio = (value: string, text: string, defaultChecked: boolean) =>
    el(
      "label",
      { className: "radio" },
      el("input", { type: "radio", name: "repaymentType", value, defaultChecked }),
      text,
    );
  form.append(
    el(
      "fieldset",
      {},
      el("legend", {}, "Repayment type"),
      radio("repayment", "Repayment", true),
      radio("interestOnly", "Interest only", false),
    ),
    el("button", { type: "submit" }, "Calculate"),
  );

  // The headline figures are a polite live region, so a new payment is read
  // out on its own (S-13). The table sits outside it so it is not read out.
  const result = el("div", { className: "result" });
  result.setAttribute("role", "status");
  result.setAttribute("aria-atomic", "true");
  const tableHost = el("div", { className: "table-host" });
  // Heard, not seen (S-13): the summary of every error message.
  const summary = el("div", { className: "visually-hidden" });
  summary.setAttribute("role", "alert");

  root.append(
    el("h1", {}, "Mortgage calculator"),
    el("section", {}, form, result, summary),
    tableHost,
  );

  // The summary is set a moment after it is cleared, so a screen reader sees
  // it change and reads identical text again on a repeated Calculate (S-13).
  // The timer is cancelled by any clear, so a late summary can never appear
  // after the person has edited the form.
  let summaryTimer: number | undefined;

  function clearResult(): void {
    window.clearTimeout(summaryTimer);
    result.replaceChildren();
    tableHost.replaceChildren();
    summary.replaceChildren();
  }

  function clearError(field: Field): void {
    errors[field].textContent = "";
    inputs[field].removeAttribute("aria-invalid");
  }

  function readForm(): RawInputs {
    const type = new FormData(form).get("repaymentType");
    return {
      loanAmount: inputs.loanAmount.value,
      interestRate: inputs.interestRate.value,
      term: inputs.term.value,
      repaymentType: type === "interestOnly" ? "interestOnly" : "repayment",
    };
  }

  function figure(label: string, pence: number): HTMLElement {
    return el("p", {}, `${label} `, el("strong", {}, formatMoney(pence)));
  }

  // Any change to the form, text or repayment type, removes the figures at
  // once, and an edited field loses its own message. Nothing is checked until
  // Calculate (S-5, S-10).
  form.addEventListener("input", (event) => {
    clearResult();
    const edited = FIELDS.find(({ field }) => field === (event.target as HTMLElement).id);
    if (edited) clearError(edited.field);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearResult();
    const checked = validate(readForm());

    if (!checked.ok) {
      const messages: string[] = [];
      let first: HTMLInputElement | undefined;
      for (const { field } of FIELDS) {
        const message = checked.errors[field];
        if (message === undefined) {
          clearError(field);
          continue;
        }
        errors[field].textContent = message;
        inputs[field].setAttribute("aria-invalid", "true");
        messages.push(message);
        first ??= inputs[field];
      }
      const text = errorSummary(messages);
      summaryTimer = window.setTimeout(() => {
        summary.textContent = text;
      }, 50);
      first?.focus();
      return;
    }

    for (const { field } of FIELDS) clearError(field);
    const outcome = calculate(checked.inputs);
    result.append(figure("Monthly payment", outcome.monthlyPence));
    if (outcome.type === "interestOnly") {
      result.append(figure("Balance owed at the end of the term", outcome.balanceOwedPence));
    }
    tableHost.append(scheduleTable(schedule(checked.inputs)));
  });
}
