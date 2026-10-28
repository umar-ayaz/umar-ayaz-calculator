import { calculate } from "../engine/calculate";
import { validate, type Field, type RawInputs } from "../engine/validate";
import { formatMoney } from "../format";

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

/** Builds the form inside `root` and wires it up. Holds no calculation logic. */
export function mount(root: HTMLElement): void {
  const inputs = {} as Record<Field, HTMLInputElement>;
  const errors = {} as Record<Field, HTMLElement>;
  const form = el("form", { noValidate: true });

  for (const { field, label, prefix, suffix } of FIELDS) {
    const parts = textField(field, label, prefix, suffix);
    inputs[field] = parts.input;
    errors[field] = parts.error;
    form.append(parts.row);
  }

  const radio = (value: string, text: string, checked: boolean) =>
    el(
      "label",
      { className: "radio" },
      el("input", { type: "radio", name: "repaymentType", value, checked }),
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

  const result = el("div", { className: "result" });
  root.append(el("h1", {}, "Mortgage calculator"), form, result);

  function figure(label: string, pence: number): HTMLElement {
    return el("p", {}, `${label} `, el("strong", {}, formatMoney(pence)));
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const raw: RawInputs = {
      loanAmount: inputs.loanAmount.value,
      interestRate: inputs.interestRate.value,
      term: inputs.term.value,
      repaymentType: form.querySelector<HTMLInputElement>("input[name=repaymentType]:checked")!
        .value as RawInputs["repaymentType"],
    };

    result.replaceChildren();
    const checked = validate(raw);
    for (const { field } of FIELDS) {
      errors[field].textContent = checked.ok ? "" : (checked.errors[field] ?? "");
    }
    if (!checked.ok) return;

    const outcome = calculate(checked.inputs);
    result.append(figure("Monthly payment", outcome.monthlyPence));
    if (outcome.type === "interestOnly") {
      result.append(figure("Balance owed at the end of the term", outcome.balanceOwedPence));
    }
  });
}
