# Mortgage calculator

A mortgage repayment calculator that runs in the browser. You enter a loan
amount, an annual interest rate, a term in years and a repayment type
(Repayment or Interest only). It shows the monthly payment, the balance still
owed at the end of the term for an interest-only loan, and a table of every
monthly payment split into interest and capital with what is still owed after
it. A panel beside the form explains how it works.

It needs no backend, no accounts, no API keys and no paid services. Nothing you
type is sent anywhere or stored.

## Who it is for

Borrowers checking what a loan would cost them each month, in two roles:

- **Repayment borrowers** (a capital-and-interest mortgage, or an interest-free
  loan such as one from family), who want to know the monthly cost.
- **Interest-only borrowers**, who need to see the monthly payment together with
  the balance still owed at the end, so the lower payment is not mistaken for a
  cheaper deal.

The roles are defined in [`docs/app-roles.md`](docs/app-roles.md) and the jobs
they are trying to do in [`docs/jobs-to-be-done.md`](docs/jobs-to-be-done.md).

## Why a mortgage calculator

I wanted to learn more about how a mortgage calculator works, and to keep it as
simple as I could while still tackling an interesting problem.

## What you need to run it

- **Node.js 22 or later.** `package.json` requires `>=22` and `.nvmrc` pins
  `22`. It has been run on Node 26.7.0.
- **npm**, which comes with Node. It has been run with npm 11.19.0.
- **A web browser.**

No accounts, keys or paid services are needed. The dependencies are
TypeScript, Vite and Vitest, and `npm install` fetches them.

## Run it

```bash
npm install
npm run dev
```

Vite prints the address and does not open the browser for you. By default it is
**http://localhost:5173/**. If that port is taken, Vite uses the next free one
and prints it.

## Run the tests

```bash
npm test
```

Passing looks like this (the counts grow as tests are added; these are the
numbers at the time of writing):

```
 Test Files  6 passed (6)
      Tests  417 passed (417)
```

Anything failing is listed above that summary and the command exits with an
error.

The tests are Vitest unit tests for the calculation engine (`src/engine/`) and
the money formatter (`src/format.ts`). There are **no automated tests for the
page itself**; the page is checked by hand against the stories.

Other commands:

| Command | What it does |
|---|---|
| `npm run typecheck` | Runs the TypeScript compiler without writing files |
| `npm run build` | Runs the typecheck, then the tests, then builds into `dist/` |
| `npm run preview` | Serves the built `dist/` locally |

## No CI workflow

This repository has **no CI workflow**. There is no `.github/workflows/`, so
nothing runs automatically on a push or a pull request. The typecheck and the
tests only run when someone runs them.

`npm run build` runs the typecheck, then the tests, then the build, and stops at
the first one that fails. So a build gates on the tests, but only where
`npm run build` is actually run.

Vercel is the planned host ([`docs/architecture.md`](docs/architecture.md)). It
is set up outside this repo, and how it is set up is not recorded here yet.
For a failing test to stop a deploy, Vercel's build command has to be
`npm run build`; nothing in the repo enforces that.

## What is in the repo

| Path | What it is |
|---|---|
| `docs/` | The documents that say what the app is and why it is built this way (below) |
| `src/engine/` | The calculation engine: parse, validate, calculate, schedule and the error messages. Pure code with no DOM, formatting or I/O |
| `src/format.ts` | Writes whole pence as money, for example `£1,169.18` |
| `src/ui/` | The page: reads the form, shows results and messages, builds the table and the explanation panel |
| `transcripts/` | Transcripts of the AI sessions that built this (below) |
| `CLAUDE.md` | The standing instructions for the AI tool working on the repo |
| `.claude/skills/raise-pr/` | A project skill that checks and raises a pull request |
| `.gitignore` | Keeps `node_modules/`, `dist/` and `.DS_Store` out of git |

### The `docs/` folder

- [`user-stories.md`](docs/user-stories.md): the spec. Every change implements a
  numbered story, and the tests cite the story numbers. Each story has a
  **Status** line saying what has been built and what has been seen working.
- [`architecture.md`](docs/architecture.md): how it is built and why, and the
  decisions that are expensive to change.
- [`app-roles.md`](docs/app-roles.md): the two roles above.
- [`jobs-to-be-done.md`](docs/jobs-to-be-done.md): what the people in those
  roles need to do.

### The `transcripts/` folder

`session-01.md` and `session-02.md` are transcripts of the first two AI
sessions on this project. They are kept as a record of how the decisions were
made.

## How it was built, and the AI tools used

It was built with **Claude Code**, Anthropic's command-line AI tool, which was
the only AI tool used. The models shown in the transcripts are Opus 5
(session 1), and Opus 5.5 and Sonnet 5.5 (session 2).

The working rule is in `CLAUDE.md`: the owner owns the spec and the testing, and
the AI owns the implementation. The AI does not write app code until the
approach is agreed, and every change has to implement a numbered story.

## Assumptions and what is not implemented

The assumptions behind the figures are written down, not hidden in the code:

- The annual rate is divided by 12 and charged monthly.
- The monthly payment is rounded half up to the penny, once. In the table each
  month's interest is rounded the same way, and on a repayment loan the last
  payment is the balance still owed plus that month's interest, so the loan
  clears to exactly £0.00. That last payment can differ from the others.
- Accepted inputs are a loan of £1,000 to £10,000,000, a rate of 0% to 25% with
  up to 3 decimal places, and a whole-number term of 1 to 40 years. Negative
  rates are not accepted.
- Money is in pounds sterling.
- Nothing is kept between visits.

These and the reasons for them are in [`docs/architecture.md`](docs/architecture.md)
and [`docs/user-stories.md`](docs/user-stories.md).

**What is not implemented** is also in [`docs/user-stories.md`](docs/user-stories.md):

- Stories S-15, S-16 and S-18 to S-21 are recorded under "Out of scope" and are
  not built: total interest, total amount paid, overpayments, a fixed period
  then a reversion rate, comparing two mortgages, and working the loan out from
  price and deposit.
- The **Status** line under each story says what is built and what has been
  seen working. Some stories are built but not fully checked: for example the
  screen reader announcements (S-13) have not been checked with a screen reader,
  and the reload behaviour (S-22) has not been checked in Firefox.
