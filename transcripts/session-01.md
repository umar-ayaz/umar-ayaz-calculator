 ▐▛███▛█   Claude Code v2.1.248
▝▜██████▀  Opus 5 · Claude Pro
  ▝▝ ▝▝    ~/Projects/umar-ayaz-calculator

  Get to finished work sooner with Opus 5.5. Update Claude Code to try it.
  +1 more · /status

❯ /model                                                                        
  ⎿  Set model to Opus 5 and saved as your default for new sessions

❯ I'm building a mortgage calculator that runs in the browser. Before I         
      decide what's in it, I want to understand the problem properly.           
                                                                                
  I'm not a mortgage specialist. Walk me through what one of these actually     
  has to do:                                                                    
                                                                                
  - What inputs real ones ask for, hte data needed for the calculator, and      
  which of them actually matter that predict the outcome                        
  - The maths behind a monthly repayment, and where interest-only differs       
  - What people typically misunderstand about the numbers                       
  - Where the maths gets awkward: and edge cases or no output for weird numbers 
  added                                                                         
  - What a basic one covers, and what the more serious ones add on top          
  - again a simple calculator I am building not a complex wone so keep it       
  simple                                                                        
                                                                                
  Don't recommend a scope and don't write code. Give me an idea and             
  I'll decide what I'm building.                                                

⏺ I'll verify the worked numbers before I quote them.

⏺ Bash(python3 -c "
      def M(P,ar,yrs):…)
  ⎿  P=200000 r=5.00% y=25: monthly=1,169.18 total=350,754 interest=150,754
     P=200000 r=5.00% y=30: monthly=1,073.64 total=386,512 interest=186,512
     P=200000 r=6.00% y=25: monthly=1,288.60 total=386,581 interest=186,581
     … +7 lines (ctrl+o to expand)

⏺ Verified. Here's the domain, not a scope.

  ---

  1. Inputs

  The three that do all the work

  The arithmetic of a mortgage payment needs exactly three numbers:

  ┌──────────────────┬──────────────────────┬──────────────────────────────┐
  │      Input       │     Also called      │             Note             │
  ├──────────────────┼──────────────────────┼──────────────────────────────┤
  │ Principal        │ loan amount, balance │ price − deposit              │
  ├──────────────────┼──────────────────────┼──────────────────────────────┤
  │ Annual interest  │ nominal rate,        │ the contractual rate, not    │
  │ rate             │ initial rate         │ APR                          │
  ├──────────────────┼──────────────────────┼──────────────────────────────┤
  │ Term             │ years (or months)    │ 25 is the UK default, 30 the │
  │                  │                      │  US one                      │
  └──────────────────┴──────────────────────┴──────────────────────────────┘

  Plus one switch — repayment vs interest-only — which changes the formula
  rather than a value in it.

  That's it. Every other input a real calculator asks for is one of three
  things:

  (a) A way of deriving one of the three. Property price + deposit → principal.
  Deposit → LTV (loan-to-value %), which is a presentation of the same fact.
  Fees → sometimes added to principal.

  (b) A cost that sits beside the payment, not inside it. Buildings/contents
  insurance, life cover, service charge, ground rent, maintenance. US
  calculators bundle property tax and homeowner's insurance into the headline
  figure and call it PITI (principal, interest, taxes, insurance) — plus PMI if
  LTV > 80%. UK ones almost never do. Either convention is defensible; mixing
  them silently is what misleads people.

  (c) Eligibility, which is a different tool entirely. Income, outgoings,
  dependents, employment type, credit history. These determine whether a lender 
  will give you the loan and at what rate — they have no effect on the repayment
  arithmetic. A tool that takes these is an affordability calculator.
  Conflating the two is the single most common design mistake in this space,
  because the two tools answer unrelated questions: "what would this loan cost
  me" vs "what loan would they let me have".

  Which inputs actually move the outcome

  Sensitivity, roughly:

  - Principal — perfectly linear. Double the loan, double the payment.
    Intuitive, so nobody gets it wrong.
  - Rate — near-linear over small ranges, and the coefficient is brutal. On
    £200k/25yr, +1% on the rate is +10% on the monthly payment (£1,169 →
    £1,289). People consistently underestimate this.
  - Term — strongly non-linear with sharp diminishing returns. 25 → 30 years
    saves £96/month (8%) and costs £35,758 in extra interest. Beyond ~30 years
    you're buying almost no payment relief for a lot of interest.
  - LTV — zero direct effect on the maths. Its real-world power is that it gates
    which rate tier you qualify for (80%, 85%, 90% are typical cliffs). A
    calculator with no rate table can only display LTV, not act on it.

  Data you need

  None. No rate feeds, no tax tables, no API. Three numbers and a formula.

  Worth knowing where that stops being true: the moment you want "what rate
  could I get?", stamp duty / transfer tax, or a real APRC comparison, you need
  reference data that goes stale and needs maintaining. That boundary is the
  difference between a tool that works forever offline and one that needs an
  owner.

  ---

  2. The maths

  Repayment (amortising)

  The standard annuity formula. Monthly payment M:

         P · r
  M = ─────────────
      1 − (1 + r)⁻ⁿ

  - P = principal
  - r = monthly rate = annual rate ÷ 12
  - n = number of monthly payments = years × 12

  You'll more often see it written as M = P·r(1+r)ⁿ / ((1+r)ⁿ − 1). They're
  algebraically identical — but the (1+r)⁻ⁿ form is the one you want in code,
  for reasons in §4.

  The derivation, because it makes the edge cases obvious: the payment is set so
  that the present value of n equal payments equals the loan. Each payment is
  discounted by (1+r) per month elapsed; summing that geometric series and
  solving for M gives the above. The −1 in the denominator is the
  geometric-series tail, and it's where the division-by-zero lives.

  The month-by-month schedule

  The formula gives you the payment. The amortisation schedule gives you
  everything else, and it's just three lines repeated:

  interest_k  = balance × r
  principal_k = M − interest_k
  balance     = balance − principal_k

  Run that n times and the balance lands on zero. Total interest = M × n − P.

  This loop is the ground truth. Any aggregate you display — total interest,
  balance at year 5, equity — should come from the schedule, not from a second
  closed-form shortcut, or the two will disagree by pennies and you'll be unable
  to say which is right.

  Rate conventions

  r = annual / 12 is the nominal convention. It's what lenders quote, what every
  mainstream calculator uses, and what people will check your output against.

  The mathematically "correct" effective conversion is r = (1 + annual)^(1/12) −
  1, which gives a slightly lower payment. Using it will make your tool
  disagree with every other tool on the internet. Pick nominal/12; say so
  somewhere.

  Separately: real lenders often accrue interest daily and debit monthly, so an
  actual statement differs from the textbook monthly schedule by small amounts
  that vary with month length. That's not an error in your maths — it's a
  different (and unknowable-without-the-lender) accrual basis.

  Interest-only

  M = P × r

  That's the whole thing. You pay the interest as it accrues; the balance never
  moves. At the end of the term the full P is due as a lump sum, and you need a
  credible plan for it (sale, endowment, pension, or refinance).

  Consequences worth internalising:

  - The payment is dramatically lower. £200k at 5%: £833/month vs £1,169 — 29%
    cheaper.
  - Total interest is higher, not lower — P × r × n = £250,000 vs £150,754,
    because the balance it's charged on never falls.
  - No equity accrues from payments at all. Only house-price movement changes
    your position, in either direction.
  - There's no schedule to compute. Every month is identical. This is why
    interest-only is trivial to add to a calculator and yet changes the shape of
    your output model (no amortisation table, a balloon figure to display).

  Part-and-part splits the principal between the two treatments and sums the
  payments. Easy arithmetic, but it means your engine takes two principals
  rather than one.

  ---

  3. What people misunderstand

  The early payments are almost entirely interest. £200k at 5%: the first
  payment is £1,169, of which £833 (71%) is interest and £336 touches the debt.
  Crossover to majority-principal happens around year 11. People are genuinely
  shocked by this, and it's the single most useful thing a calculator can show.

  Total cost vs monthly cost are different decisions. £200k at 5% over 25 years
  costs £150,754 in interest — you repay 1.75× what you borrowed. Over 30 years:
  £186,512. The longer term is cheaper every month and £36k more expensive
  overall. Neither is wrong; they answer different questions, and most
  calculators show only the monthly figure.

  A "small" rate difference isn't small. 4% vs 5% vs 6% on £200k/25yr: £1,056 /
  £1,169 / £1,289 a month, and £116,702 / £150,754 / £186,581 total. One
  percentage point ≈ £36,000. Rate-shopping has a much bigger payoff than people
  assume, and rate rises hurt much more.

  The quoted rate usually isn't the term rate. Most UK mortgages are a 2- or
  5-year fix that then reverts to the lender's standard variable rate, typically
  several points higher. A calculator that applies the initial rate for all 25
  years is showing a number that will never happen. This is the biggest honesty
  gap in simple calculators, and the main reason serious ones get complicated.

  APR / APRC is not the payment rate. APR folds fees into a single comparison
  figure. Your payment is computed on the contractual rate. Entering an APR
  produces a payment the lender will never charge.

  Overpayments are leveraged by timing, enormously. £100/month extra from day
  one on £200k/25yr saves far more than the same £100 from year 20, because
  early overpayments remove principal that would otherwise compound for two
  decades. The last year's overpayment saves almost nothing. People think of it
  as "paying off £X"; it's actually "removing £X of compounding".

  Deposit percentage isn't payment percentage. A 10% deposit doesn't make the
  payment 10% cheaper — it makes it 10% cheaper plus whatever the better LTV
  tier buys you in rate, which is often the larger effect.

  Total interest is a nominal number. £186,512 of interest paid over 30 years is
  not £186,512 of today's money. No mainstream calculator inflation-adjusts,
  and the figure reads scarier than it economically is.

  The payment is not the cost of owning. Insurance, maintenance, service
  charges, and tax can add 20–40% on top. A calculator that outputs a payment
  and calls it "your monthly cost" is understating things.

  ---

  4. Where the maths gets awkward

  Genuine mathematical singularities

  r = 0 (0% interest). The denominator 1 − (1+0)⁻ⁿ = 0. Division by zero →
  Infinity or NaN. The correct answer is obvious and must be branched
  explicitly: M = P / n. 0% is a real offer (family loans, promotional periods),
  not just a fuzz input.

  n = 0 (zero term). No payments exist. Mathematically undefined, not zero.

  P = 0. Payment is genuinely 0 — but check that your code returns 0 and not
  NaN.

  Negative rate. The formula happily evaluates for small negative r and returns
  a payment below P/n. It's not nonsense (negative-rate mortgages existed
  briefly in Denmark) but it is almost certainly a typo. The decision — reject
  or compute — is yours; the thing to avoid is computing it by accident and
  displaying it without comment.

  Floating-point traps

  Overflow in the textbook form. (1+r)ⁿ grows astronomically. At an absurd rate
  it exceeds the double-precision ceiling (~1.8×10³⁰⁸), both numerator and
  denominator become Infinity, and Infinity / Infinity = NaN. The 1 − (1+r)⁻ⁿ
  form can't do this: the term decays toward 0 instead of growing. Free
  immunity, just from how you write the expression.

  Precision loss at tiny rates. This one is reachable with realistic input. At r
  = 1e-9, (1+r) rounds to something that loses most of the exponent's
  significance, and (1+r)ⁿ − 1 catastrophically cancels — you're subtracting two
  nearly-equal numbers and keeping the noise. The fix is expm1 and log1p, which
  are designed for exactly this: (1+r)ⁿ − 1 = expm1(n · log1p(r)).

  Money in floats at all. 0.1 + 0.2 ≠ 0.3. Sum 300 monthly figures held as
  floats and your total is wrong in the pennies. The standard answer is integer
  minor units (pence/cents) everywhere, converting to display only at the edge.

  Rounding — the one that silently produces wrong totals

  The exact payment is almost always a repeating decimal (£1,169.1807…). Lenders
  round the payment to the penny, charge that fixed amount every month, and
  then adjust the final payment to clear whatever's left.

  This matters because the two obvious approaches disagree:

  - Round the payment, multiply by n → doesn't equal P + true interest.
  - Round each month's interest and sum → drifts from payment × n.

  A coherent rule, and the one real lenders follow: round the fixed payment
  once, amortise in integer minor units, and let the last payment absorb the 
  remainder (remaining balance + final month's interest). Then the schedule sums
  exactly to the totals you display, because the totals come from the schedule.
  The final payment being a few pence different from all the others is correct,
  not a bug — and it's worth showing rather than hiding.

  Input-layer awkwardness (where most real bugs live)

  Text fields hand you: "£200,000", "200k", "5%", "", "abc", "1e9", "-0", "5,5"
  (comma decimal), a Unicode minus sign, 40 digits, leading/trailing whitespace.
  Parsing is where "no output for weird numbers" is won or lost, and it's a
  separate problem from the arithmetic — which should be unable to receive a
  weird number in the first place.

  Also:

  - Deposit > price → negative principal. Possible to type, meaningless.
  - Non-integer terms — "25 years 6 months" = 306 months. Fine if your input is
    months; a trap if it's a float of years.
  - Fees added to the loan change P, so the payment is computed on more than you
    borrowed.
  - Absurd-but-valid combinations — £1 over 40 years, £10m over 1 year. The
    maths works; the output formatting and the schedule length may not.
  - Fractional months when solving backwards (e.g. "when will overpayments clear
    this?") — the answer is rarely a whole month, and you have to decide
    whether to round up with a partial final payment.

  The difficulty cliff

  Everything above is closed-form or a simple loop. Two things are a different
  class of problem:

  - Multi-stage schedules (fixed period then reversion rate, or a rate change
    mid-term) — you can't use one formula; you amortise stage 1, take the
    balance, and re-derive the payment for the remaining term at the new rate.
  - Solving for an unknown rate — a true APR/APRC is an internal rate of return.
    There's no closed form; it needs iterative root-finding (Newton–Raphson or
    bisection), with convergence and bracketing to get wrong.

  If a feature needs either of those, it isn't an increment on the simple engine
  — it's a new engine.

  ---

  5. Basic vs serious

  What a basic one covers

  Principal, rate, term, repayment-or-interest-only → monthly payment, total
  paid, total interest. Often a deposit field that derives the principal and
  shows LTV. Maybe a payment-split pie chart.

  This is the large majority of calculators on bank and broker sites. It's three
  numbers, one formula, and it answers the question most people actually arrive
  with.

  What the next tier adds

  - Amortisation schedule — the table or chart, year by year. Cheap to compute
    (you have the loop), and the highest-value addition by a distance, because
    it's what corrects the misunderstandings in §3.
  - Overpayment modelling — regular and/or lump sum, showing interest saved and
    term shortened.
  - Rate stress — "what if rates rise 1/2/3%", shown as a second payment figure.
  - Scenario comparison — two or three side by side, which is how people
    actually decide.
  - Solve-for — fix the monthly payment and derive the affordable price or the
    required term.

  What the serious ones add

  - Fixed period + reversion rate — the multi-stage schedule. Arguably the
    honesty fix, and the first thing that breaks the single-formula model.
  - Fees — arrangement/product fee, added to the loan or paid upfront, and the
    difference it makes.
  - True APRC — the root-finding problem.
  - Offset accounts — savings balance netted off the interest calculation each
    month.
  - Early repayment charges — tapering percentages that make overpayment advice
    conditional.
  - Lender affordability / stress testing — the separate eligibility tool, to
    regulator-ish rules.
  - Ancillary and transactional costs — stamp duty / transfer tax, legal,
    survey, insurance, service charge; PITI and PMI in the US model.
  - Remortgage break-even — does the new rate recover the switching fees before
    the next fix ends.
  - Buy-to-let specifics — rental yield, interest coverage ratio, the tax
    treatment of interest.
  - Equity projection — balance falling against an assumed house-price curve.
  - Inflation-adjusted real cost.

  The jump from tier one to tier two is mostly presentational — you already have
  the schedule. The jump to tier three is structural: multi-stage schedules,
  iterative solvers, and reference data with a maintenance burden.

  ---

  That's the terrain. I haven't picked anything out of it — your call. Happy to
  go deeper on any section, and if you want this as a reference page rather than
  terminal scrollback, say so and I'll put it up as an artifact.

✻ Brewed for 2m 30s · done Tuesday 18:02

※ recap: You wanted to understand mortgage calculators before deciding scope, so I walked through inputs, the repayment and interest-only maths, common misunderstandings, edge cases, and basic versus serious feature tiers. Next: you decide what you're building. (disable recaps in /config)

❯ Good, that's what i needed. I don't need more of the maths — take everything  
      in sections 1 and 4 as understood and carried forward.                    
      Take the decision or assumptions that you need to take to build a simple  
  mortgage calculator so we can collect minimal input and pitch the output back 
  to the user                                                                   
                                                                                
  Two things I want now.                                                        
                                                                                
  First, the input fields. The minimum set I need to collect from the person    
  using this For each field: what it's called on screen, what                   
  it accepts, what it must reject, and the exact message the person sees when   
  it's rejected.                                                                
                                                                                
  Second, a verification plan, I would need to test several cases where the     
  passing cases values input values and also the case is where we see the other 
  messages or the false value given where 0% rate can be tested because that    
  would be an case in case if we need to multiply by zero and everything or     
  each case is capable by a unit test are only by hand in the browser.          
   Thrid the negative rates we will have to check them as well where user input 
  something negative how are we going to handle them?                           
      being the obvious one — give me the options and your recommendation, and  
      leave the decision to me.                                                 
                                                                                
  Lay it out as a table I can work through. No code and no documents yet;       
  this is going to feed the user stories.                                       

⏺ Let me compute the exact expected figures under the rounding rule so the
  verification table has real numbers in it.

⏺ Bash(python3 -c "
      def sched(P, ar, yrs):…)
  ⎿  headline repayment: P=200000 r=5.000% y=25
       monthly 1,169.18 | final 1,169.20 | total paid 350,754.02 | total in
     terest 150,754.02
     … +28 lines (ctrl+o to expand)

⏺ Auto mode lets Claude handle permission prompts automatically — Claude
  checks each tool call for risky actions and prompt injection before 
  executing. Actions Claude identifies as safe are executed, while 
  actions Claude identifies as risky are blocked and Claude may try a 
  different approach. Ideal for long-running tasks. Claude can make 
  mistakes that allow harmful commands to run, it's recommended to only 
  use in isolated environments. Shift+Tab to change mode.

⏺ That last row surfaced something real — a negative final payment. Let me
  characterise it before I write it up.

⏺ Bash(python3 -c "
      def run(P, ar, yrs, verbose=False):…)
  ⎿  P=1000 r=0.1000% y=40: M=2.13 n=480 residual_if_run_full=-229  <-- bal
     ance clears at month 479 of 480
     P=1000 r=0.0100% y=40: M=2.09 n=480 residual_if_run_full=-127
     … +7 lines (ctrl+o to expand)

⏺ Decisions I've taken, so you can veto any of them before they harden into
  stories:

  #: A1
  Decision: Collect loan amount directly — no property price, no deposit, no LTV
  Why: One field instead of two plus a derivation, and LTV does nothing without
  a
  rate table
  Cheap to change later?: Yes — it's a parse/derive step in front of the same
  engine
  ────────────────────────────────────────
  #: A2
  Decision: Four fields: amount, rate, term, repayment type
  Why: The first three are the irreducible maths; repayment-vs-interest-only is
  one line of arithmetic and a 29% different answer, so omitting it makes the
  tool wrong for a lot of people rather than simpler
  Cheap to change later?: Yes
  ────────────────────────────────────────
  #: A3
  Decision: Nominal rate ÷ 12, monthly accrual
  Why: What lenders quote and what every other calculator does, so your output
  is
  checkable against theirs
  Cheap to change later?: No — changes every expected value
  ────────────────────────────────────────
  #: A4
  Decision: Term in whole years
  Why: Avoids the float-years trap; nobody shopping a mortgage needs 25.5
  Cheap to change later?: Yes
  ────────────────────────────────────────
  #: A5
  Decision: GBP only, £, en-GB formatting
  Why: No locale switching, no currency picker
  Cheap to change later?: Medium
  ────────────────────────────────────────
  #: A6
  Decision: Integer pence internally. Payment rounded once to the nearest penny;

  final payment clears the balance
  Why: The lender's own rule, and the only way the totals reconcile
  Cheap to change later?: No
  ────────────────────────────────────────
  #: A7
  Decision: Validate on submit; once a field has errored, re-validate it on
  change
  Why: Avoids shouting at someone mid-typing
  Cheap to change later?: Yes
  ────────────────────────────────────────
  #: A8
  Decision: No output at all while any field is invalid — stale results cleared
  Why: A stale number beside an error message is the worst failure mode here
  Cheap to change later?: Yes
  ────────────────────────────────────────
  #: A9
  Decision: Outputs: monthly payment, total paid, total interest (+ balance due
  at end, interest-only only). No amortisation table
  Why: Table is the highest-value next thing, not part of the minimum
  Cheap to change later?: Yes — additive
  ────────────────────────────────────────
  #: A10
  Decision: Ranges: amount £1,000–£10,000,000, rate 0–25%, term 1–40 years
  Why: Wide enough for any real case, narrow enough to keep the engine inside
  sane float territory
  Cheap to change later?: Yes — they're constants

  ---

  1. Input fields

  Table 1 — What each field is and what it accepts

  Field: Loan amount
  On screen: Loan amount (£ shown as a prefix, not typed)
  Control: single-line text, inputmode="decimal"
  Accepts: Digits with optional comma thousand separators and up to 2 decimal
  places. £1,000 – £10,000,000 inclusive. A leading £ is tolerated.
  Normalisation before validation: Trim whitespace, strip one leading £, strip
  commas
  ────────────────────────────────────────
  Field: Interest rate
  On screen: Annual interest rate (% shown as a suffix, not typed)
  Control: single-line text, inputmode="decimal"
  Accepts: Digits with up to 3 decimal places. 0 – 25 inclusive. 0 is valid. A
  trailing % is tolerated.
  Normalisation before validation: Trim whitespace, strip one trailing %
  ────────────────────────────────────────
  Field: Term
  On screen: Term (years shown as a suffix)
  Control: single-line text, inputmode="numeric"
  Accepts: Whole number, 1 – 40 inclusive
  Normalisation before validation: Trim whitespace
  ────────────────────────────────────────
  Field: Repayment type
  On screen: Repayment type — options Repayment / Interest only
  Control: two radios, Repayment pre-selected
  Accepts: One of the two
  Normalisation before validation: —

  Repayment type can't be invalid: it ships with a selection and has no empty
  state, so it has no error message.

  Table 2 — Rejections and the exact message

  Checked in the order listed, first match wins and stops. That order is part of
  the spec — it's what makes the error tests deterministic.

  ┌──────────┬───────┬───────────────────────────────┬─────────────────────┐
  │  Field   │ Order │           Condition           │  Exact message on   │
  │          │       │                               │       screen        │
  ├──────────┼───────┼───────────────────────────────┼─────────────────────┤
  │ Loan     │ 1     │ Empty or whitespace only      │ Enter a loan        │
  │ amount   │       │                               │ amount.             │
  ├──────────┼───────┼───────────────────────────────┼─────────────────────┤
  │          │       │ Not parseable as a number     │                     │
  │ Loan     │ 2     │ after normalisation (abc,     │ Loan amount must be │
  │ amount   │       │ 1e9, --5, 5.5.5, −5 with a    │  a number.          │
  │          │       │ Unicode minus, 5,5)           │                     │
  ├──────────┼───────┼───────────────────────────────┼─────────────────────┤
  │ Loan     │       │                               │ Loan amount can     │
  │ amount   │ 3     │ More than 2 decimal places    │ have at most 2      │
  │          │       │                               │ decimal places.     │
  ├──────────┼───────┼───────────────────────────────┼─────────────────────┤
  │ Loan     │       │ Below £1,000 or above         │ Loan amount must be │
  │ amount   │ 4     │ £10,000,000 — this is also    │  between £1,000 and │
  │          │       │ what catches 0 and negatives  │  £10,000,000.       │
  ├──────────┼───────┼───────────────────────────────┼─────────────────────┤
  │ Interest │ 1     │ Empty or whitespace only      │ Enter an interest   │
  │  rate    │       │                               │ rate.               │
  ├──────────┼───────┼───────────────────────────────┼─────────────────────┤
  │ Interest │ 2     │ Not parseable as a number     │ Interest rate must  │
  │  rate    │       │ after normalisation           │ be a number.        │
  ├──────────┼───────┼───────────────────────────────┼─────────────────────┤
  │ Interest │       │                               │ Interest rate can   │
  │  rate    │ 3     │ More than 3 decimal places    │ have at most 3      │
  │          │       │                               │ decimal places.     │
  ├──────────┼───────┼───────────────────────────────┼─────────────────────┤
  │ Interest │       │ Below 0 or above 25 — see §3, │ Interest rate must  │
  │  rate    │ 4     │  this is the negative-rate    │ be between 0% and   │
  │          │       │ decision                      │ 25%.                │
  ├──────────┼───────┼───────────────────────────────┼─────────────────────┤
  │ Term     │ 1     │ Empty or whitespace only      │ Enter a term.       │
  ├──────────┼───────┼───────────────────────────────┼─────────────────────┤
  │ Term     │ 2     │ Not parseable as a number     │ Term must be a      │
  │          │       │                               │ number.             │
  ├──────────┼───────┼───────────────────────────────┼─────────────────────┤
  │          │       │ Parses but isn't a whole      │ Term must be a      │
  │ Term     │ 3     │ number (25.5)                 │ whole number of     │
  │          │       │                               │ years.              │
  ├──────────┼───────┼───────────────────────────────┼─────────────────────┤
  │          │       │ Below 1 or above 40 — also    │ Term must be        │
  │ Term     │ 4     │ catches 0 and negatives       │ between 1 and 40    │
  │          │       │                               │ years.              │
  └──────────┴───────┴───────────────────────────────┴─────────────────────┘

  Twelve strings total. Each one names the field, so it still makes sense read
  aloud out of context by a screen reader.

  ---

  2. Verification plan

  Table 3 — Engine unit tests (pure, no DOM)

  Every figure below is computed under A6 (integer pence, payment rounded once,
  final payment clears the balance). I generated and reconciled them, so they're
  assertable as-is.

  ID: E1
  Case: Headline repayment
  Input: 200,000 / 5% / 25 / Repayment
  Expected: Monthly 1,169.18; total paid 350,754.02; total interest 150,754.02;
  first payment splits 833.33 interest / 335.85 principal; final payment
  1,169.20; closing balance 0
  Method: Unit
  ────────────────────────────────────────
  ID: E2
  Case: 0% rate, clean divide
  Input: 120,000 / 0% / 10 / Repayment
  Expected: Monthly 1,000.00; total 120,000.00; interest 0.00. No division by
  zero, no Infinity
  Method: Unit
  ────────────────────────────────────────
  ID: E3
  Case: 0% rate, awkward divide
  Input: 100,000 / 0% / 3 / Repayment
  Expected: Monthly 2,777.78; final payment 2,777.70; total exactly 100,000.00;
  interest 0.00
  Method: Unit
  ────────────────────────────────────────
  ID: E4
  Case: Interest-only
  Input: 200,000 / 5% / 25 / Interest only
  Expected: Monthly 833.33 every month; balance due at end 200,000.00; total
  interest 249,999.00 at the rounded payment vs 250,000.00 exact — decide which
   you display
  Method: Unit
  ────────────────────────────────────────
  ID: E5
  Case: 0% + interest-only
  Input: 200,000 / 0% / 25 / Interest only
  Expected: Monthly £0.00 (rendered, not blank); balance due 200,000.00;
  interest
  0.00
  Method: Unit
  ────────────────────────────────────────
  ID: E6
  Case: Lower boundary, high rate
  Input: 1,000 / 25% / 1 / Repayment
  Expected: Monthly 95.04; final 95.08; total 1,140.52; interest 140.52
  Method: Unit
  ────────────────────────────────────────
  ID: E7
  Case: All maxima — overflow probe
  Input: 10,000,000 / 25% / 40 / Repayment
  Expected: Monthly 208,343.82; interest 90,000,182.87. No NaN, no Infinity
  Method: Unit
  ────────────────────────────────────────
  ID: E8
  Case: Tiny rate, long term — precision probe
  Input: 1,000 / 0.001% / 40 / Repayment
  Expected: A sane payment near 2.09, not garbage from cancellation
  Method: Unit
  ────────────────────────────────────────
  ID: E9
  Case: Rounding drift, overpaid
  Input: 1,000 / 0.1% / 40 / Repayment
  Expected: Payment 2.13; the loan clears at month 479 of 480. Must not emit a
  negative final payment — this currently would be −0.16 on a naive
  implementation
  Method: Unit
  ────────────────────────────────────────
  ID: E10
  Case: Rounding drift, underpaid
  Input: 1,000 / 5% / 40 / Repayment
  Expected: Payment 4.82; £3.27 residual at month 480 that the final payment
  must
  absorb
  Method: Unit
  ────────────────────────────────────────
  ID: E11
  Case: Reconciliation invariant
  Input: every case above
  Expected: Sum of all payments == principal + total interest, exactly, in pence
  Method: Unit
  ────────────────────────────────────────
  ID: E12
  Case: Closing invariant
  Input: every repayment case
  Expected: Closing balance == 0 exactly; balance decreases monotonically; no
  month where interest exceeds the payment
  Method: Unit
  ────────────────────────────────────────
  ID: E13
  Case: Total-never-lies invariant
  Input: every case
  Expected: Displayed total interest == sum of the schedule's monthly interest,
  not payment × n − principal
  Method: Unit
  ────────────────────────────────────────
  ID: E14
  Case: No bad numbers, ever
  Input: randomised sweep across the whole accepted range
  Expected: Result is never NaN, Infinity, or negative (payment or interest)
  Method: Unit, property-style

  E9 and E10 are the two I'd put in front of any implementation first. They're
  not exotic input — they're ordinary input meeting the rounding rule, and they
  fail in opposite directions. E9 in particular produces a negative payment if
  the final payment is computed as "balance + interest" without checking whether
  the balance already cleared.

  Table 4 — Parse and validation unit tests

  ID: V1
  Field: Amount
  Input: £200,000
  Expected: Parses to 200000
  Method: Unit
  ────────────────────────────────────────
  ID: V2
  Field: Amount
  Input: 200000.50
  Expected: Parses to 200000.50
  Method: Unit
  ────────────────────────────────────────
  ID: V3
  Field: Amount
  Input:  200,000 
  Expected: Parses to 200000
  Method: Unit
  ────────────────────────────────────────
  ID: V4
  Field: Amount
  Input: `` (empty)
  Expected: Enter a loan amount.
  Method: Unit
  ────────────────────────────────────────
  ID: V5
  Field: Amount
  Input: abc / 1e9 / --5 / 5.5.5 / −5 (Unicode minus)
  Expected: Loan amount must be a number. — all five
  Method: Unit
  ────────────────────────────────────────
  ID: V6
  Field: Amount
  Input: 200000.555
  Expected: Loan amount can have at most 2 decimal places.
  Method: Unit
  ────────────────────────────────────────
  ID: V7
  Field: Amount
  Input: 0 / -1 / 999.99 / 10000001
  Expected: Loan amount must be between £1,000 and £10,000,000. — all four
  Method: Unit
  ────────────────────────────────────────
  ID: V8
  Field: Amount
  Input: 1000 / 10000000
  Expected: Both accepted — boundaries are inclusive
  Method: Unit
  ────────────────────────────────────────
  ID: V9
  Field: Rate
  Input: 0
  Expected: Accepted, parses to 0
  Method: Unit
  ────────────────────────────────────────
  ID: V10
  Field: Rate
  Input: 5.125 / 5% /  5 
  Expected: All accepted
  Method: Unit
  ────────────────────────────────────────
  ID: V11
  Field: Rate
  Input: `` (empty)
  Expected: Enter an interest rate.
  Method: Unit
  ────────────────────────────────────────
  ID: V12
  Field: Rate
  Input: 5.1255
  Expected: Interest rate can have at most 3 decimal places.
  Method: Unit
  ────────────────────────────────────────
  ID: V13
  Field: Rate
  Input: -0.5 / 25.001
  Expected: Interest rate must be between 0% and 25%.
  Method: Unit
  ────────────────────────────────────────
  ID: V14
  Field: Rate
  Input: 25
  Expected: Accepted
  Method: Unit
  ────────────────────────────────────────
  ID: V15
  Field: Term
  Input: 25
  Expected: Accepted
  Method: Unit
  ────────────────────────────────────────
  ID: V16
  Field: Term
  Input: `` (empty)
  Expected: Enter a term.
  Method: Unit
  ────────────────────────────────────────
  ID: V17
  Field: Term
  Input: abc
  Expected: Term must be a number.
  Method: Unit
  ────────────────────────────────────────
  ID: V18
  Field: Term
  Input: 25.5
  Expected: Term must be a whole number of years.
  Method: Unit
  ────────────────────────────────────────
  ID: V19
  Field: Term
  Input: 0 / -5 / 41
  Expected: Term must be between 1 and 40 years. — all three
  Method: Unit
  ────────────────────────────────────────
  ID: V20
  Field: Term
  Input: 1 / 40
  Expected: Both accepted
  Method: Unit
  ────────────────────────────────────────
  ID: V21
  Field: Precedence
  Input: Amount `` with range also violated
  Expected: Shows Enter a loan amount., not the range message
  Method: Unit
  ────────────────────────────────────────
  ID: V22
  Field: Precedence
  Input: Amount abc999999999
  Expected: Shows the number message, not the range message
  Method: Unit
  ────────────────────────────────────────
  ID: V23
  Field: All fields
  Input: Amount abc, rate ``, term 0
  Expected: All three messages returned together; result is a typed failure
  carrying three errors, not one
  Method: Unit

  Table 5 — By hand in the browser

  These need a real browser or a real screen reader. Some could be automated
  eventually; none should block on that.

  ┌─────┬───────────────┬────────────────────────────────────┬──────────────┐
  │ ID  │     Check     │      What you're looking for       │    Method    │
  ├─────┼───────────────┼────────────────────────────────────┼──────────────┤
  │     │ Keyboard      │ Tab reaches every field and the    │              │
  │ B1  │ only, no      │ radios in visual order; Enter      │ By hand      │
  │     │ mouse         │ submits; nothing is reachable only │              │
  │     │               │  by pointer                        │              │
  ├─────┼───────────────┼────────────────────────────────────┼──────────────┤
  │     │               │ The new monthly payment is         │ By hand,     │
  │ B2  │ Screen reader │ announced when results appear or   │ with         │
  │     │  — result     │ change (polite live region),       │ VoiceOver    │
  │     │               │ without re-reading the whole page  │              │
  ├─────┼───────────────┼────────────────────────────────────┼──────────────┤
  │     │ Screen reader │ Each message is announced and tied │ By hand,     │
  │ B3  │  — errors     │  to its field; focus lands on the  │ with         │
  │     │               │ first invalid field on submit      │ VoiceOver    │
  ├─────┼───────────────┼────────────────────────────────────┼──────────────┤
  │     │               │ Every message is programmatically  │              │
  │ B4  │ Error         │ linked to its input, and the       │ By hand +    │
  │     │ association   │ invalid state is exposed, not just │ inspector    │
  │     │               │  coloured red                      │              │
  ├─────┼───────────────┼────────────────────────────────────┼──────────────┤
  │     │               │ Valid input → results shown →      │              │
  │ B5  │ Stale output  │ break a field → results clear.     │ By hand      │
  │     │               │ Never an old number sitting beside │              │
  │     │               │  an error                          │              │
  ├─────┼───────────────┼────────────────────────────────────┼──────────────┤
  │     │ No bad        │ NaN, £NaN, Infinity, -0.00, or a   │              │
  │ B6  │ numbers on    │ blank where a figure should be —   │ By hand      │
  │     │ screen        │ in any state                       │              │
  ├─────┼───────────────┼────────────────────────────────────┼──────────────┤
  │     │               │ Switching to Interest only updates │              │
  │ B7  │ Repayment     │  the figures and makes the         │ By hand      │
  │     │ type toggle   │ balance-due line appear; switching │              │
  │     │               │  back removes it                   │              │
  ├─────┼───────────────┼────────────────────────────────────┼──────────────┤
  │ B8  │ Currency      │ £1,169.18 — separators present,    │ By hand      │
  │     │ formatting    │ always exactly 2 dp, never 1169.2  │              │
  ├─────┼───────────────┼────────────────────────────────────┼──────────────┤
  │     │               │ Paste £200,000.00 copied from a    │              │
  │ B9  │ Paste         │ bank page; paste a value with a    │ By hand      │
  │     │               │ non-breaking space                 │              │
  ├─────┼───────────────┼────────────────────────────────────┼──────────────┤
  │     │               │ Numeric keypad appears for all     │ By hand,     │
  │ B10 │ Mobile        │ three text fields; layout holds at │ device or    │
  │     │               │  320px                             │ emulator     │
  ├─────┼───────────────┼────────────────────────────────────┼──────────────┤
  │     │ Zoom /        │ Usable at 200% zoom; nothing       │              │
  │ B11 │ reduced       │ depends on animation               │ By hand      │
  │     │ motion        │                                    │              │
  ├─────┼───────────────┼────────────────────────────────────┼──────────────┤
  │     │               │ Reload behaviour is deliberate. My │              │
  │ B12 │ Reload        │  assumption under A8 is no         │ By hand      │
  │     │               │ persistence — form returns empty.  │              │
  │     │               │ Confirm that's what you want       │              │
  └─────┴───────────────┴────────────────────────────────────┴──────────────┘

  The split is clean: all the arithmetic and all twelve messages are
  unit-testable, and the browser list is purely about whether the thin DOM layer
  surfaces them correctly. If any browser check requires you to verify a
  number, something has leaked out of the engine.

  ---

  3. Negative interest rates

  Your call. Four options:

  Option: A — Reject via the range check
  Behaviour: -0.5 → Interest rate must be between 0% and 25%.
  Cost: Zero. The range check in Table 2 already does it
  What it gets you: One code path, one message, one test. Matches every
  mainstream calculator
  What it costs you: A negative-rate product can't be modelled. Nobody will
  notice
  ────────────────────────────────────────
  Option: B — Reject with a dedicated message
  Behaviour: -0.5 → Interest rate cannot be negative.; 25.001 → the range
  message
  Cost: One extra string, one extra check, one extra test
  What it gets you: The person is told precisely what's wrong, which matters
  most
  when it's a typo (-5 for 5)
  What it costs you: Two messages where one would do; a fifth row in the
  precedence order
  ────────────────────────────────────────
  Option: C — Accept and compute
  Behaviour: Formula handles small negative r; payment comes out below P ÷ n,
  total interest negative
  Cost: Real. New output states, new formatting, re-derived invariants
  What it gets you: Mathematically honest; no special case in the engine
  What it costs you: You must design and test "total interest: −£1,234", decide
  whether E12's monotonic-decrease invariant still holds, and re-bound the
  input (r ≤ −100% breaks the formula outright). And a typo'd -5 returns a
  confident, plausible, wrong answer instead of a correction
  ────────────────────────────────────────
  Option: D — Accept, compute, and warn
  Behaviour: As C plus a caution note
  Cost: C's cost plus warning copy and an ambiguous "is this an error or not"
  state
  What it gets you: Nothing A or B doesn't give you
  What it costs you: Worst ratio of the four

  My recommendation: A. Negative rates have no user for this tool, the range
  check you already need catches them for free, and the thing you're actually
  protecting against is a mistyped minus sign — which A handles correctly by
  refusing to compute. Take B instead if you'd rather the person read why rather
  than infer it from a range; it's one string and one test, and it's the only
  upgrade here I'd call worth considering. C is only right if modelling a
  negative-rate product is a goal, and for this tool it isn't.

  One thing to keep separate while you decide: E9's negative final payment is 
  not this problem. That one arises from valid, positive input hitting the
  penny-rounding rule, and it has to be handled whichever option you pick here.
  Don't let a "reject negatives" rule at the input layer give the impression the
  engine is covered.

✻ Worked for 3m 3s · done Tuesday 18:18

※ recap: You're scoping a simple browser mortgage calculator and I've handed you the four input fields with exact error messages, a verification plan, and negative-rate options. Next: pick negative-rate option A or B, then approve the assumptions so this can feed the user stories. (disable recaps in /config)

❯ Decisions: A1 to A8 and A10 are agreed.                                       
                                                                                
  A9 I am changing. No need off added functionalities                           
                                                                                
  All I care about is the right input fields to capture and output              
                                                                                
  Two rules matter more than features. Nothing wrong on screen: no invalid      
  values basically validation on the fields what it accepts, no                 
  empty space where a number should be, no old result next to an error. And     
  every message says what to fix and has to be clear to the user.               
                                                                                
  Out for now: overpayments, fixed period then reversion rate, comparison,      
  month by month detail, and working out the loan from price and deposit.       
                                                                                
  Tell me if anything here does not work.                                       

⏺ Three things don't work as stated, and one decision is still open.

  1. Interest-only with a payment-only output breaks your first rule

  This is the real problem. Interest-only on £200,000 at 5% shows £833.33/month
  — and if that's the only figure on screen, the screen is lying by omission.
  The £200,000 you still owe at the end is the single most important fact about
  that product, and it's invisible. Someone compares £833 against £1,169 and
  concludes interest-only is cheaper. It isn't; it costs £99,000 more.

  "Nothing wrong on screen" has to cover wrong-by-omission, or the rule doesn't
  do any work.

  Two ways out, and I'd take the first:

  - Keep one extra line, interest-only only: Balance still owed at the end of 
    the term — £200,000.00. One figure, no schedule, no arithmetic beyond
    echoing the loan amount back.
  - Drop interest-only from A2 and ship repayment only. Also coherent, and
    genuinely simpler — but then the tool silently gives the wrong answer to
    anyone on an interest-only mortgage rather than declining to answer.

  2. A9 as restated doesn't tell me which outputs to build

  "The right output" has two coherent readings and they produce different
  engines:

  ┌─────────┬────────────────────────┬──────────────────┬──────────────────┐
  │         │                        │    Needs an      │ Tests from Table │
  │         │         Shows          │    internal      │  3 that survive  │
  │         │                        │    schedule?     │                  │
  ├─────────┼────────────────────────┼──────────────────┼──────────────────┤
  │ Minimal │ Monthly payment only   │ No — one         │ E1–E8, E14       │
  │         │                        │ formula, done    │                  │
  ├─────────┼────────────────────────┼──────────────────┼──────────────────┤
  │ Basic   │ Monthly payment, total │ Yes              │ All of E1–E14    │
  │         │  paid, total interest  │                  │                  │
  └─────────┴────────────────────────┴──────────────────┴──────────────────┘

  Worth knowing before you pick: the minimal reading deletes an entire class of 
  bug. E9, E10, E11 and E13 all exist only because a total has to reconcile with
  a payment. No totals, no reconciliation, no penny drift, no negative final
  payment. Your instinct to cut is doing more for robustness here than it looks.

  The counterweight is that total interest is the number that corrects the
  misunderstanding people actually arrive with, and it costs one multiplication.
  My recommendation: Basic, because £150,754 of interest on a £200,000 loan is
  the output with the most value per unit of complexity in the whole tool — but
  Minimal is a defensible ship, and if you take it, say so and I'll build the
  engine without a schedule at all.

  3. If you show total interest, "total interest" needs a definition

  Two definitions, both reasonable, differing by pennies:

  - payment × months − loan — no schedule needed. On E1 that's £150,754.00.
  - Sum of each month's actual interest — needs the schedule. On E1 that's
    £150,754.02.

  The second is the true figure; the first is the cheap one. They disagree
  because the payment is rounded to the penny. You can't show both, and under
  "nothing wrong on screen" I'd rather you chose deliberately than discovered
  the 2p later. Pick the cheap one if you pick Minimal-plus-totals; pick the
  true one if the schedule exists anyway.

  Related trap if you go Basic and keep interest-only: "total paid" is ambiguous
  there — £249,999 of interest, or that plus the £200,000 balloon? I'd show
  total interest and balance owed, and not show "total paid" for interest-only
  at all.

  4. Still open: negative rates

  You didn't pick from §3. I need A, B, C or D before the rate field's messages
  are final — it changes whether there are twelve messages or thirteen. My
  recommendation stands at A (the 0–25% range check catches it for free), with B
  worth one extra string if you want a typo'd minus sign named explicitly.

  ---

  Everything else holds. A1 already excluded price-and-deposit, so your out-list
  doesn't conflict with anything agreed; month-by-month being out is consistent
  with A9 under either reading; the twelve messages in Table 2 each name the
  field and the fix, which satisfies your second rule as written. Tables 4 and 5
  are unaffected by any of the above.

  Give me answers on 1, 2, 3 and 4 and the field spec is frozen.

✻ Churned for 59s · done Tuesday 18:38

❯ for the 4th pick B as an option for rest pick 1 whichever makes the           
  calculator simpler                                                            

⏺ Bash(python3 -c "
      def M(P, ar, yrs):…)
  ⎿     200,000 @  5.0000% x 25y  ->      1,169.18
        120,000 @  0.0000% x 10y  ->      1,000.00
        100,000 @  0.0000% x  3y  ->      2,777.78
     … +8 lines (ctrl+o to expand)

⏺ Taken as: B on negatives, and the simpler option everywhere else. Here's what
  that freezes.

  Decisions

  #: 1
  Decision: Keep interest-only, add one line: Balance owed at the end of the 
  term, which is the loan amount echoed back
  Note: This is the one place I didn't take the strictly-simplest path. Simplest

  was dropping interest-only altogether — but that walks back A2 and makes the
  tool silently useless to a whole class of borrower, where this costs one
  echoed figure and no arithmetic. Say the word if you'd rather cut it.
  ────────────────────────────────────────
  #: 2
  Decision: Minimal output: monthly payment only. No total paid, no total
  interest, no schedule
  Note:
  ────────────────────────────────────────
  #: 3
  Decision: Moot. Picking Minimal dissolves it — with no total on screen,
  there's
  nothing to reconcile and no definition to choose
  Note:
  ────────────────────────────────────────
  #: 4
  Decision: Option B — negative rate gets its own message
  Note:

  Output, in full

  ┌──────────────┬──────────────────────────────────────────────────────────┐
  │  Repayment   │                        On screen                         │
  │     type     │                                                          │
  ├──────────────┼──────────────────────────────────────────────────────────┤
  │ Repayment    │ Monthly payment — £1,169.18                              │
  ├──────────────┼──────────────────────────────────────────────────────────┤
  │ Interest     │ Monthly payment — £833.33 <br> Balance owed at the end   │
  │ only         │ of the term — £200,000.00                                │
  └──────────────┴──────────────────────────────────────────────────────────┘

  Rounded to the nearest penny, always 2 dp. That's the entire output surface.

  Rate field messages, revised for B

  The combined range message splits in two. Order still matters; first match
  wins.

  ┌───────┬────────────────────────┬────────────────────────────────────────┐
  │ Order │       Condition        │             Exact message              │
  ├───────┼────────────────────────┼────────────────────────────────────────┤
  │ 1     │ Empty or whitespace    │ Enter an interest rate.                │
  │       │ only                   │                                        │
  ├───────┼────────────────────────┼────────────────────────────────────────┤
  │ 2     │ Not parseable as a     │ Interest rate must be a number.        │
  │       │ number                 │                                        │
  ├───────┼────────────────────────┼────────────────────────────────────────┤
  │ 3     │ More than 3 decimal    │ Interest rate can have at most 3       │
  │       │ places                 │ decimal places.                        │
  ├───────┼────────────────────────┼────────────────────────────────────────┤
  │ 4     │ Below 0                │ Interest rate cannot be negative.      │
  ├───────┼────────────────────────┼────────────────────────────────────────┤
  │ 5     │ Above 25               │ Interest rate must be 25% or less.     │
  └───────┴────────────────────────┴────────────────────────────────────────┘

  Thirteen messages total. Loan amount and term keep their combined range
  messages from Table 2 — a negative loan amount still gets Loan amount must be 
  between £1,000 and £10,000,000., which names the fix, so I haven't split those
  too. Flagging the slight inconsistency in case it bothers you; I don't think
  it's worth two more strings.

  What this does to the verification plan

  The engine collapses to one function: a rate-zero branch, an interest-only
  branch, and the annuity formula. Table 3 goes from fourteen cases to eight.

  ┌─────┬──────────────────────┬─────────────┬─────────────────────────────┐
  │ ID  │        Input         │  Expected   │         Also assert         │
  │     │                      │   monthly   │                             │
  ├─────┼──────────────────────┼─────────────┼─────────────────────────────┤
  │ E1  │ 200,000 / 5% / 25 /  │ 1,169.18    │                             │
  │     │ Repayment            │             │                             │
  ├─────┼──────────────────────┼─────────────┼─────────────────────────────┤
  │ E2  │ 120,000 / 0% / 10 /  │ 1,000.00    │ no division by zero         │
  │     │ Repayment            │             │                             │
  ├─────┼──────────────────────┼─────────────┼─────────────────────────────┤
  │ E3  │ 100,000 / 0% / 3 /   │ 2,777.78    │                             │
  │     │ Repayment            │             │                             │
  ├─────┼──────────────────────┼─────────────┼─────────────────────────────┤
  │ E4  │ 200,000 / 5% / 25 /  │ 833.33      │ balance owed 200,000.00     │
  │     │ Interest only        │             │                             │
  ├─────┼──────────────────────┼─────────────┼─────────────────────────────┤
  │     │ 200,000 / 0% / 25 /  │             │ renders as £0.00, not       │
  │ E5  │ Interest only        │ 0.00        │ blank; balance owed         │
  │     │                      │             │ 200,000.00                  │
  ├─────┼──────────────────────┼─────────────┼─────────────────────────────┤
  │ E6  │ 1,000 / 25% / 1 /    │ 95.04       │ lower amount boundary       │
  │     │ Repayment            │             │                             │
  ├─────┼──────────────────────┼─────────────┼─────────────────────────────┤
  │ E7  │ 10,000,000 / 25% /   │ 208,343.82  │ no NaN, no Infinity         │
  │     │ 40 / Repayment       │             │                             │
  ├─────┼──────────────────────┼─────────────┼─────────────────────────────┤
  │     │ 1,000 / 0.001% / 40  │             │ smallest non-zero rate the  │
  │ E8  │ / Repayment          │ 2.08        │ 3 dp rule allows; no        │
  │     │                      │             │ precision collapse          │
  ├─────┼──────────────────────┼─────────────┼─────────────────────────────┤
  │     │ randomised sweep     │             │ never NaN, Infinity,        │
  │ E14 │ across the accepted  │ —           │ negative, or -0.00          │
  │     │ ranges               │             │                             │
  └─────┴──────────────────────┴─────────────┴─────────────────────────────┘

  Deleted: E9, E10, E11, E12, E13. Penny drift, negative final payments, the
  reconciliation invariant, the schedule invariants — all of them existed only
  to make a total agree with a payment. No totals, no class of bug. That's the
  real win from cutting A9, and it's larger than it looked.

  Tables 4 and 5 are unchanged except: V13 splits into -0.5 → Interest rate 
  cannot be negative. and 25.001 → Interest rate must be 25% or less.; and B7
  now also checks that the balance-owed line appears and disappears with the
  toggle.

  ---

  Field spec is frozen: four inputs, two outputs, thirteen messages, eight
  engine cases. Nothing outstanding on my side. Ready to write the user stories
  when you are.

✻ Crunched for 1m 9s · done Tuesday 18:41

※ recap: We're specifying a simple browser mortgage calculator, and the input/output spec is now frozen: four inputs, two outputs, thirteen error messages, eight engine test cases. Next action is writing the numbered user stories in docs/user-stories.md. (disable recaps in /config)

❯ Now the three documents, in docs/. Use these formats exactly.                 
                                                                                
  1. docs/app-roles.md                                                          
     "A [role] is [who this person is and their situation]. They can [what      
     they see and do in the app]. They must never [what the app must            
     prevent]."                                                                 
     Two or three roles. Only real differences. If two roles use the app the    
     same way, make them one.                                                   
                                                                                
  2. docs/jobs-to-be-done.md                                                    
     "When [situation], I want to [motivation], so I can [expected              
     outcome]."                                                                 
     Each job names its role. A job is something the person needs to do even    
     if my app does not exist. So no job mentions the app, a screen or a        
     button.                                                                    
                                                                                
  3. docs/user-stories.md                                                       
     "As a [role], I want [capability], so that [benefit]."                     
     Each story names the job it serves, then its acceptance criteria, then     
     a status.                                                                  
     Criteria format: "Given [state], when [action], then [result]".            
     Use the frozen spec: four fields, the thirteen messages, monthly           
     payment, and balance owed for interest only.                               
     Cover the normal cases and the error cases: empty input, text input,       
     too many decimal places, a negative rate, a rate above 25, term out of     
     range, a term that is not a whole number, amount out of range, 0% rate,    
     and what the person sees after a result and after an error.                
     Status is Implemented or Not implemented. Everything is Not implemented    
     now.                                                                       
     Also add stories for what we cut, marked Not implemented: total            
     interest, total paid, the amortisation schedule, overpayments, fixed       
     period then reversion rate, comparison, and working out the loan from      
     price and deposit.                                                         
                                                                                
  Number them R-1, J-1, S-1. Keep the numbers fixed. The code and the tests     
  will use them.                                                                
                                                                                
  No code yet. If a decision is mine, ask me. List anything you are unsure      
  about at the end.                                                               ⎿  You've hit your session limit · resets 6:50pm (Europe/London)
     /upgrade or /usage-credits to finish what you’re working on.

⏺ Usage limit reached · continuing automatically at 6:50pm · esc or type
  to cancel

✻ Baked for 1s · done Tuesday 18:47

❯ continue                                                                      

⏺ Bash(ls -a && echo '--- docs ---' && ls docs 2>/dev/null || echo 'no docs dir'
      python3 -c "…)
  ⎿  .
     ..
     .ai-home
     … +10 lines (ctrl+o to expand)

⏺ docs/ exists and is empty. Writing the three files.

  Read 3 files (ctrl+o to expand)

⏺ Bash(cd /Users/muhammadiqbal/Projects/umar-ayaz-calculator
      echo '=== the thirteen messages, as they appear in the stories ==='…)
  ⎿  === the thirteen messages, as they appear in the stories ===
     "Enter a loan amount."
     "Enter a term."
     … +14 lines (ctrl+o to expand)

⏺ Three messages got line-wrapped in the markdown. Since the code and tests will
  match these literally, each should sit unbroken on one line. Let me find and
  fix them.

⏺ Bash(cd /Users/muhammadiqbal/Projects/umar-ayaz-calculator
      python3 - <<'PY'…)
  ⎿  present in flattened text:
       OK    Enter a loan amount.
       OK    Loan amount must be a number.
     … +16 lines (ctrl+o to expand)

⏺ Bash(cd /Users/muhammadiqbal/Projects/umar-ayaz-calculator
      grep -n -B1 -A1 'amount must be between\|^  must be a number\|must be a
      whole number' docs/user-stories.md)
  ⎿  174-- Given the loan amount is "0", "-1", "999.99" or "10000001", when
      I
     175:  calculate, then the message shown is "Loan amount must be betwee
     … +11 lines (ctrl+o to expand)

⏺ Bash(cd /Users/muhammadiqbal/Projects/umar-ayaz-calculator
      python3 - <<'PY'…)
  ⎿  unbroken on one line: 13 of 13
     still broken: none

⏺ Three files written. 2 roles, 8 jobs, 21 stories, all Not implemented. All
  thirteen messages appear verbatim and each now sits unbroken on a single line
  so the tests can match them literally.

  ┌─────────────────────────┬────────────────────────────────────────────────┐
  │          File           │                    Contents                    │
  ├─────────────────────────┼────────────────────────────────────────────────┤
  │ docs/app-roles.md       │ R-1 Repayment borrower, R-2 Interest-only      │
  │                         │ borrower                                       │
  ├─────────────────────────┼────────────────────────────────────────────────┤
  │ docs/jobs-to-be-done.md │ J-1 to J-8, each naming its role, none         │
  │                         │ mentioning the app                             │
  ├─────────────────────────┼────────────────────────────────────────────────┤
  │ docs/user-stories.md    │ S-1 to S-14 in scope, S-15 to S-21 cut         │
  └─────────────────────────┴────────────────────────────────────────────────┘

  Story map:

  - S-1 four inputs and what they accept · S-2 monthly payment, repayment · S-3
    monthly payment plus balance owed, interest-only · S-4 0% rate · S-5 change
    and recalculate
  - S-6/S-7/S-8 the thirteen messages, grouped by field, including precedence
  - S-9 no answer while anything is wrong · S-10 no old result beside an error ·
    S-11 never a broken figure · S-12 keyboard · S-13 screen reader · S-14
    money formatting
  - S-15 total interest · S-16 total paid · S-17 month by month · S-18
    overpayments · S-19 fixed then reversion · S-20 comparison · S-21 loan from
    price and deposit

  I went with two roles rather than three. The only real behavioural difference
  the app encodes is the product type — it shows interest-only borrowers a
  second figure and has a different thing to protect them from. Everything else
  (keyboard use, screen reader use, checking a broker's figures) is the same
  person doing the same thing, so folding those in was the honest call.

  Not committed — you didn't ask.

  Things that are your call

  1. How a calculation is triggered — this one blocks. I wrote the stories
  around a Calculate control plus Enter, because A7 said "validate on submit"
  and submit implies something to submit to. The alternative is recalculating
  live as you type. It changes the wording of S-1, S-5, S-9, S-10 and S-12.
  Which?

  2. A real conflict I hit between S-5 and your "no old result" rule. The last
  criterion in S-5 says that if you change a value and don't calculate, the
  figure on screen stays as it was. That means a correct-but-stale figure can
  sit beside an edited field. Strictly, your rule only forbids a result beside
  an error — but "£1,169.18" sitting next to a rate you've just changed to 6 is
  arguably the same category of wrong. Three ways to go: leave it (as written
  now), clear the result the instant any field is edited, or go
  live-recalculation and the problem disappears. Related to question 1, and I'd
  rather you decided than have me pick.

  3. A non-ASCII minus sign. −5 in the loan amount currently gets "Loan amount
  must be a number." — correct, since our normalisation only strips £ and
  commas, so it genuinely doesn't parse. But someone who typed what looks like
  minus five reads that message as nonsense. Leave it, or normalise − to - so it
  falls through to the range message instead?

  4. -0 in the rate field. It parses to 0, which is not below zero, so it's
  accepted as 0%. Reasonable, slightly odd. Accept, or treat the minus sign as
  intent and show "Interest rate cannot be negative."?

  5. The on-screen label "Balance owed at the end of the term." It isn't one of
  the thirteen messages, but it's fixed user-facing text and S-3 asserts it
  exactly. Confirm the wording or give me yours.

  6. No story for reload. My earlier assumption was no persistence — reload
  gives you an empty form. There's no story covering it, so it's currently
  unspecified rather than decided. Want S-22, or leave it out?

  7. Term accepts digits only. 25 years typed into the field gets "Term must be
  a number." Same question as 3: tolerate the word, or not?

  Nothing else is open on my side. Answer 1 and 2 and the stories are final.

✻ Brewed for 4m 27s · done Tuesday 18:54

※ recap: You're specifying a simple browser mortgage calculator, and I've just written docs/app-roles.md, jobs-to-be-done.md and user-stories.md from the frozen spec. Next: answer whether a Calculate button or live recalculation triggers results, and whether editing a field clears the old figure.

❯ /export                                                                       
  ⎿  Export cancelled

※ recap: Goal is a simple browser mortgage calculator; I've written the three spec docs in docs/ (2 roles, 8 jobs, 21 stories, all Not implemented). Next: you answer whether calculation is triggered by a Calculate button or live as you type.

❯ Answers.                                                                      
                                                                                
  1. Calculate button, plus Enter from any field. Validation stays on submit.   
  2. Clear the result as soon as any field is edited. The person presses        
     Calculate again. No stale figure on screen, even a correct one.            
  3. Normalise the Unicode minus to a normal minus, so -5 gets the range        
     message instead of "must be a number".                                     
  4. Accept -0 as 0%. Add a criterion so it is recorded as a decision.          
  5. "Balance owed at the end of the term" is confirmed.                        
  6. Add S-22: reload gives an empty form. Nothing is saved.                    
  7. Leave it. "25 years" in the term field gets "Term must be a number."       
                                                                                
  Update the stories for 1, 2, 3, 4 and 6. Tell me which story numbers          
  changed. Keep all existing numbers fixed.                                     

⏺ Bash(cd /Users/muhammadiqbal/Projects/umar-ayaz-calculator
      sed -n '1,20p;22,55p' docs/user-stories.md)
  ⎿  # User stories

     Roles are defined in `app-roles.md`. Jobs are defined in
     … +51 lines (ctrl+o to expand)

⏺ Bash(cd /Users/muhammadiqbal/Projects/umar-ayaz-calculator
      python3 - <<'PY'…)
  ⎿  S-1, S-5 and the preamble updated

⏺ Bash(cd /Users/muhammadiqbal/Projects/umar-ayaz-calculator
      sed -n '/^## S-10/,/^Status/p' docs/user-stories.md)
  ⎿  ## S-10 — Never see an old answer next to an error

     As a borrower, I want a previous answer cleared the moment an input be
     … +23 lines (ctrl+o to expand)

⏺ Bash(cd /Users/muhammadiqbal/Projects/umar-ayaz-calculator
      python3 - <<'PY'…)  ⎿  S-6, S-7, S-8 updated

⏺ Bash(cd /Users/muhammadiqbal/Projects/umar-ayaz-calculator
      python3 - <<'PY'…)
  ⎿  S-10 updated, S-22 added

⏺ Bash(cd /Users/muhammadiqbal/Projects/umar-ayaz-calculator
      python3 - <<'PY'…)
  ⎿  13 messages unbroken on one line: True
     stories: 22
     order: S-1 S-2 S-3 S-4 S-5 S-6 S-7 S-8 S-9 S-10 S-11 S-12 S-13 S-14 S-
     … +5 lines (ctrl+o to expand)

⏺ Updated. Seven stories changed, one added.

  Story: Preamble
  What changed: "Calculate" now states explicitly that nothing is validated or
  shown until the person asks. Notes that S-22 sits after S-14 because numbers
  are fixed but order follows meaning
  Answer: 1, 6
  ────────────────────────────────────────
  Story: S-1
  What changed: Added a criterion that a "Calculate" control is present on load.

  Added a criterion that a non-ASCII minus in any of the three text fields is
  read as an ordinary minus
  Answer: 1, 3
  ────────────────────────────────────────
  Story: S-5
  What changed: The stale-figure criterion is inverted. Was: changing a value
  without calculating leaves the old figure up. Now: the figure is removed
  until you calculate again
  Answer: 2
  ────────────────────────────────────────
  Story: S-6
  What changed: −5 removed from the "must be a number" list and given its own
  criterion landing on the range message. -0 added to the range list. Added a
  criterion that a value containing a word gets "Loan amount must be a number."
  Answer: 3, 4, 7
  ────────────────────────────────────────
  Story: S-7
  What changed: Added a criterion for −0.5 with a non-ASCII minus reaching
  "Interest rate cannot be negative." Added a criterion that -0 is accepted as
  0%, stating in the criterion that a minus before a zero is not read as intent
   to enter a negative rate
  Answer: 3, 4
  ────────────────────────────────────────
  Story: S-8
  What changed: -0 added to the range list. Added a criterion for −5 with a
  non-ASCII minus reaching the range message. Added a criterion that "25 years"
   gets "Term must be a number."
  Answer: 3, 4, 7
  ────────────────────────────────────────
  Story: S-10
  What changed: Retitled from "Never see an old answer next to an error" to
  "Never see an old answer", and broadened. Now covers clearing on edit of any
  text field and on changing the repayment type, plus a criterion that an edit
  clears the figure without raising an error — clearing is not an accusation
  Answer: 2
  ────────────────────────────────────────
  Story: S-22
  What changed: New. Reload and reopen give an empty form, "Repayment" selected,

  nothing kept, nothing written to the browser or a server
  Answer: 6

  S-12 needed no change — it already had Enter submitting from any field and the
  Calculate control in the tab order.

  Two notes on how I read your answers:

  - Answer 3 applied to all three fields, not just the amount. You phrased it
    for the loan amount, but leaving the rate and term rejecting −0.5 and −5 as
    "not a number" while the amount accepts them would be an inconsistency a
    tester would file as a bug. Say if you want it narrowed to the amount only.
  - Answer 7 was "leave it", so behaviour is unchanged — but I added an explicit
    criterion in S-6 and S-8 recording that 25 years gets "Term must be a
    number." Same reasoning as answer 4: a decision not to do something is worth
    a criterion, otherwise it reads as an oversight later. Tell me if that's
    noise and I'll drop those two.

  Counts hold: 22 stories, no duplicate numbers, all Not implemented, all
  thirteen messages still present verbatim and unbroken on a single line. Still
  uncommitted.

✻ Worked for 1m 44s · done 13:10