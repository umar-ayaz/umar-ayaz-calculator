# Architecture

Read this first. It says how the calculator is built and why. What the
calculator does is in `docs/user-stories.md`, and that file wins if the two
ever seem to disagree. Who it is for is in `docs/app-roles.md`.

## What it is

A mortgage repayment calculator that runs in the browser. You enter a loan
amount, a rate, a term and a repayment type, and it gives you the monthly
payment, plus the balance still owed at the end for an interest-only loan, and
a table of every monthly payment split into interest and capital, with what is
still owed after it. A panel beside the form explains how it works. It is for people checking what a loan would cost them each month: repayment
borrowers (R-1) and interest-only borrowers (R-2).

To run it, clone the repo, then `npm install` and `npm run dev`. Everything
else is in the README.

## No backend

The page is static files and nothing else. The calculation is arithmetic on
four numbers, and the calculator keeps nothing between visits (S-22), so a
server would have nothing to do. Leaving it out means there are no accounts,
no running costs, no server that can go down, and nowhere that someone's
financial figures could be sent or kept.

## Stack

| Choice | Why |
|---|---|
| TypeScript, `strict` on | The engine passes typed results around rather than throwing. The compiler checks that every caller handles the error case. |
| Plain DOM APIs | One form, four inputs, two outputs. The DOM covers that directly. |
| Plain CSS | One screen, a few dozen rules. |
| Vite | Dev server and production build with almost no configuration. Handles TypeScript out of the box. |
| Vitest | Uses Vite's setup, runs TypeScript tests directly, and is fast enough to run on every save. |
| `BigInt` for money maths | Built into JavaScript. Gives exact whole-number arithmetic. |
| Vercel | See Deploy. |

## Deliberately not used

- **React, Angular, Vue.** A framework earns its place when there is a lot
  of UI that changes in many ways. Here there is one form. A framework would
  add a runtime, a build step of its own and a second copy of the page's
  state, all to manage what a few DOM calls already handle.
- **Redux or any state library.** There is no state worth managing. Each
  calculation starts from what is in the form, and nothing is kept
  afterwards. The page is the only state, so nothing can drift from what is
  on screen.
- **A CSS framework (Tailwind, Bootstrap).** It would add a dependency or a
  build step to style one screen that a short stylesheet already covers.
- **A decimal library (decimal.js and similar).** `BigInt` already does
  exact arithmetic, so a library would add a dependency for nothing.

## Shape of the code

```
src/
  engine/   parse, validate, calculate,            pure, unit tested
            schedule, messages
  format.ts pence → "£1,169.18"                    pure, unit tested
  ui/       app.ts    reads the form, shows results, messages, focus
            table.ts  builds the month by month table
            panel.ts  the fixed explanation text
  style.css the stylesheet
  main.ts   starts the UI
```

Text from the form goes into the engine and comes back as either numbers or
the exact messages from the stories. `calculate` gives the monthly payment (and
the balance owed for interest only), and `schedule` gives one row for each
month: payment, interest, capital repaid and balance remaining. `format.ts`
writes those numbers as money, and `ui/` puts the result on the page.

**Why the engine is kept pure.** If a figure is ever wrong, the mistake is in
the engine, so that is the part that has to be provably right. With no DOM,
no formatting and no I/O, every number and every message in the stories can
be checked as a plain function call, in milliseconds and without a browser.
The UI is kept thin enough that checking it by hand is realistic.

## Decisions that are expensive to change

- **Money is held as whole numbers.** The loan is held in pence and the rate
  in thousandths of a percent, read straight from the text the person typed
  and never through floating point. Every type in the engine depends on this.
- **The interest convention.** The annual rate is divided by 12 and charged
  monthly, which is what lenders quote and what other calculators use.
  Changing it changes every expected figure in the stories.
- **Rounding.** The payment is worked out as an exact fraction and rounded
  half up to the penny, once, at the end. I checked this against the
  ordinary floating-point formula on 2,000,000 random inputs and they
  differed once, by a penny. The floating-point answer was the wrong one.
- **The month by month schedule.** Each month's interest is the opening
  balance at the monthly rate, rounded half up to the penny, and that rounded
  figure is carried forward. The monthly payment is rounded once, so on a
  repayment loan every payment is the monthly payment except the last, which
  is the balance still owed plus that month's interest, so the loan clears to
  exactly £0.00. That last payment can differ from the others, by a few
  pence on an ordinary loan and by much more on a long loan at a high rate. A
  payment is never more than what is owed: if the rounded payments clear the
  loan early, the clearing payment is smaller and the months after it show
  £0.00.
- **Story numbers and message text are fixed.** Tests cite S-numbers and
  assert the messages word for word. Renumbering a story or rewording a
  message means changing the tests too.
- **Static and stateless.** Adding a backend or any storage would undo the
  privacy promise in S-22 and the "clone it and run it" promise above.

## Testing

Vitest unit tests cover the engine and the formatter. Each test is named by
the story and criterion it proves. A sweep across all accepted inputs checks
that no result is ever negative, fractional or more than a penny away from
the ordinary formula. A second sweep checks every row of every schedule: whole,
non-negative pence, interest to the penny, the balance carried forward, the loan
cleared exactly, and the payments adding up to the loan plus the interest. The page itself is tested by hand against the stories.

## Deploy

Vercel, building from the GitHub repository on every push to `main`. Every
pull request gets its own preview URL. Vercel's build command runs the
typecheck and the tests before building, so a failing test stops a deploy.

Vercel was chosen over GitHub Pages for two reasons:

- Each pull request gets a preview without any setup.
- There is nothing to maintain in the repo for it, such as a workflow file.

It runs on Vercel's free Hobby plan, which is for non-commercial use. This
project is non-commercial. The cost is one more account, held by the
maintainer. Anyone running the calculator still needs nothing.
