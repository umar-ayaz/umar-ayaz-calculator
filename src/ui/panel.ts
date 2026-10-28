/**
 * The explanation beside the calculator (S-23). Fixed text: the figures in the
 * examples are written out here and never change with the form. They match the
 * figures in S-2, S-3 and S-4.
 */
export function explanationPanel(): HTMLElement {
  const panel = document.createElement("aside");
  panel.className = "panel";
  panel.setAttribute("aria-labelledby", "panel-heading");
  panel.innerHTML = `
    <h2 id="panel-heading">How it works</h2>
    <p>This calculator works out your monthly mortgage payment from the loan
    amount, the annual interest rate, the term in years and the repayment type.
    Fill in the four fields and press Calculate.</p>

    <h3>Repayment</h3>
    <p>Each payment covers the interest and also pays off part of the loan, so
    nothing is owed at the end of the term.</p>

    <h3>Interest only</h3>
    <p>Each payment covers the interest alone, so the whole loan is still owed
    at the end of the term.</p>

    <h3>The simplest example</h3>
    <p>£120,000 at 0% over 10 years with Repayment is <strong>£1,000.00</strong>
    a month, because £120,000 shared over 120 months is £1,000.00 each.</p>

    <h3>Comparing the two</h3>
    <p>£200,000 at 5% over 25 years:</p>
    <ul>
      <li>Repayment is <strong>£1,169.18</strong> a month, with nothing owed at
      the end.</li>
      <li>Interest only is <strong>£833.33</strong> a month, with
      <strong>£200,000.00</strong> still owed at the end.</li>
    </ul>

    <h3>The month by month table</h3>
    <p>After you calculate, a table lists every monthly payment:</p>
    <dl>
      <dt>Month</dt><dd>Which payment it is.</dd>
      <dt>Payment</dt><dd>What you pay that month.</dd>
      <dt>Interest</dt><dd>The part of the payment that is interest.</dd>
      <dt>Capital repaid</dt><dd>The part that pays off the loan.</dd>
      <dt>Balance remaining</dt><dd>What you still owe after that payment.</dd>
    </dl>
    <p>With Repayment, the last payment can differ from the others so that the
    loan clears exactly.</p>
  `;
  return panel;
}
