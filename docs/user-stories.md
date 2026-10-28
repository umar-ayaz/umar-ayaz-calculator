# User stories

Roles are defined in `app-roles.md`. Jobs are defined in
`jobs-to-be-done.md`. Story numbers are fixed and are referenced by the code
and the tests.

Scope frozen at four input fields, thirteen error messages, a monthly payment
figure, and a balance owed figure for interest only. Stories S-15 to S-21
record what was deliberately left out. S-22 is in scope and sits after S-14
rather than at the end, because the numbers are fixed but the order follows
meaning.

"Calculate" below means the person has asked for a result, either by
activating the Calculate control or by pressing Enter in any field. The
calculator never works out a result on its own; nothing is validated and
nothing is shown until the person asks.

---

## S-1 — Enter the four inputs

As a borrower, I want to enter the loan amount, the interest rate, the term
and the repayment type, so that I can describe the mortgage I am asking about.

Roles: R-1, R-2
Serves: J-1, J-6

Acceptance criteria

- Given the calculator is open, when it first loads, then exactly four inputs
  are present, labelled "Loan amount", "Annual interest rate", "Term" and
  "Repayment type".
- Given the calculator is open, when it first loads, then "Repayment type"
  offers "Repayment" and "Interest only", and "Repayment" is already selected.
- Given the calculator is open, when it first loads, then a "Calculate"
  control is present.
- Given the calculator is open, when it first loads, then no monthly payment
  figure and no error message is shown.
- Given the loan amount field, when I enter "£200,000", then the value is
  accepted as 200000.
- Given the loan amount field, when I enter "200,000.50", then the value is
  accepted as 200000.50.
- Given the interest rate field, when I enter "5%", then the value is accepted
  as 5.
- Given any of the three text fields, when I enter a value with leading or
  trailing spaces, then the spaces are ignored and the value is accepted.
- Given any of the three text fields, when I enter a value written with a
  non-ASCII minus sign such as "−5", then it is read as if an ordinary minus
  sign had been typed and gets exactly the message an ordinary minus sign
  would get, rather than being rejected as not a number. S-6, S-7 and S-8 say
  which message that is for each field.
- Given the loan amount field, when I look at it, then the "£" is shown as
  part of the field and does not have to be typed.
- Given the interest rate field, when I look at it, then the "%" is shown as
  part of the field and does not have to be typed.
- Given the term field, when I look at it, then "years" is shown as part of
  the field.

Status: Not implemented

---

## S-2 — See the monthly payment on a repayment mortgage

As a repayment borrower, I want one monthly payment figure for a loan repaid
as capital and interest, whether or not interest is charged, so that I can
tell whether it fits my monthly budget.

Roles: R-1
Serves: J-1, J-6

Acceptance criteria

- Given a loan amount of 200000, a rate of 5, a term of 25 and type
  "Repayment", when I calculate, then the monthly payment shown is £1,169.18.
- Given 1000, 25, 1 and "Repayment", when I calculate, then the monthly
  payment shown is £95.04.
- Given 10000000, 25, 40 and "Repayment", when I calculate, then the monthly
  payment shown is £208,343.82.
- Given 1000, 0.001, 40 and "Repayment", when I calculate, then the monthly
  payment shown is £2.08.
- Given any valid input with type "Repayment", when I calculate, then the
  monthly payment is the only figure shown.

Status: Not implemented

---

## S-3 — See both figures on an interest-only mortgage

As an interest-only borrower, I want the monthly payment and the balance I
will still owe at the end shown together, so that I can judge the deal on both
numbers rather than on the monthly one alone.

Roles: R-2
Serves: J-4, J-5

Acceptance criteria

- Given a loan amount of 200000, a rate of 5, a term of 25 and type "Interest
  only", when I calculate, then the monthly payment shown is £833.33 and the
  balance owed at the end of the term shown is £200,000.00.
- Given type "Interest only", when a result is shown, then the monthly payment
  and the balance owed appear together, and the balance owed is labelled
  "Balance owed at the end of the term".
- Given any valid input with type "Interest only", when I calculate, then the
  balance owed equals the loan amount I entered.
- Given a result is shown for "Interest only", when I switch to "Repayment"
  and calculate, then the balance owed figure is removed from the screen.
- Given a result is shown for "Repayment", when I switch to "Interest only"
  and calculate, then the balance owed figure appears.

Status: Not implemented

---

## S-4 — Calculate at a 0% rate

As a borrower, I want a rate of 0% to be treated as a real rate, so that I can
work out an interest-free loan without the calculator refusing or breaking.

Roles: R-1, R-2
Serves: J-8

Acceptance criteria

- Given a rate of 0, when I calculate, then a monthly payment is shown and no
  error message is shown.
- Given 120000, 0, 10 and "Repayment", when I calculate, then the monthly
  payment shown is £1,000.00.
- Given 100000, 0, 3 and "Repayment", when I calculate, then the monthly
  payment shown is £2,777.78.
- Given 200000, 0, 25 and "Interest only", when I calculate, then the monthly
  payment shown is £0.00 and the balance owed at the end of the term shown is
  £200,000.00.
- Given a rate of 0, when I calculate, then the figure shown is never blank,
  "NaN" or "Infinity".

Status: Not implemented

---

## S-5 — Change a figure and get a new answer

As a borrower, I want to change any input and see the new monthly payment, so
that I can try a different rate or term without starting again.

Roles: R-1, R-2
Serves: J-2, J-3

Acceptance criteria

- Given 200000, 5, 25 and "Repayment" showing £1,169.18, when I change the
  rate to 6 and calculate, then the monthly payment shown is £1,288.60.
- Given 200000, 5, 25 and "Repayment" showing £1,169.18, when I change the
  term to 30 and calculate, then the monthly payment shown is £1,073.64.
- Given a result is shown, when I change a value and calculate, then the
  previous figure is replaced and never shown alongside the new one.
- Given a result is shown, when I change a value and do not calculate, then
  the figure is removed from the screen until I calculate again.

Status: Not implemented

---

## S-6 — Be told exactly what is wrong with the loan amount

As a borrower, I want to be told precisely what is wrong with the loan amount
I entered, so that I can fix it without guessing.

Roles: R-1, R-2
Serves: J-7

Acceptance criteria

- Given the loan amount is empty or contains only spaces, when I calculate,
  then the message shown is "Enter a loan amount."
- Given the loan amount is "abc", when I calculate, then the message shown is
  "Loan amount must be a number."
- Given the loan amount is "1e9", "--5" or "5.5.5", when I calculate, then the
  message shown is "Loan amount must be a number."
- Given the loan amount is "25 years" or any other value with a word in it,
  when I calculate, then the message shown is "Loan amount must be a number."
- Given the loan amount is "200000.555", when I calculate, then the message
  shown is "Loan amount can have at most 2 decimal places."
- Given the loan amount is "0", "-0", "-1", "999.99" or "10000001", when I
  calculate, then the message shown is:
  "Loan amount must be between £1,000 and £10,000,000."
- Given the loan amount is "−5" written with a non-ASCII minus sign, when I
  calculate, then it is read as -5 and the message shown is:
  "Loan amount must be between £1,000 and £10,000,000."
- Given the loan amount is "1000" or "10000000", when I calculate, then no
  message is shown for that field.
- Given the loan amount is empty and the other fields are also invalid, when I
  calculate, then the message for the loan amount is "Enter a loan amount."
  and not the range message.

Status: Not implemented

---

## S-7 — Be told exactly what is wrong with the interest rate

As a borrower, I want to be told precisely what is wrong with the interest
rate I entered, so that I can fix it without guessing.

Roles: R-1, R-2
Serves: J-7

Acceptance criteria

- Given the interest rate is empty or contains only spaces, when I calculate,
  then the message shown is "Enter an interest rate."
- Given the interest rate is "abc", when I calculate, then the message shown
  is "Interest rate must be a number."
- Given the interest rate is "5.1255", when I calculate, then the message
  shown is "Interest rate can have at most 3 decimal places."
- Given the interest rate is "-0.5", when I calculate, then the message shown
  is "Interest rate cannot be negative."
- Given the interest rate is "−0.5" written with a non-ASCII minus sign, when I
  calculate, then it is read as -0.5 and the message shown is
  "Interest rate cannot be negative."
- Given the interest rate is "25.001", when I calculate, then the message
  shown is "Interest rate must be 25% or less."
- Given the interest rate is "0", "25", "5.125" or "5%", when I calculate,
  then no message is shown for that field.
- Given the interest rate is "-0", when I calculate, then it is accepted as 0%
  and no message is shown for that field. A minus sign in front of a zero is
  not treated as intent to enter a negative rate.
- Given the interest rate is "5.1255" and also above 25, when I calculate,
  then the decimal places message is shown and not the range message.

Status: Not implemented

---

## S-8 — Be told exactly what is wrong with the term

As a borrower, I want to be told precisely what is wrong with the term I
entered, so that I can fix it without guessing.

Roles: R-1, R-2
Serves: J-7

Acceptance criteria

- Given the term is empty or contains only spaces, when I calculate, then the
  message shown is "Enter a term."
- Given the term is "abc", when I calculate, then the message shown is
  "Term must be a number."
- Given the term is "25.5", when I calculate, then the message shown is
  "Term must be a whole number of years."
- Given the term is "0", "-0", "-5" or "41", when I calculate, then the
  message shown is "Term must be between 1 and 40 years."
- Given the term is "−5" written with a non-ASCII minus sign, when I calculate,
  then it is read as -5 and the message shown is
  "Term must be between 1 and 40 years."
- Given the term is "25 years", when I calculate, then the message shown is
  "Term must be a number." The word is not tolerated.
- Given the term is "1" or "40", when I calculate, then no message is shown
  for that field.
- Given the term is "25.5" and also above 40, when I calculate, then the whole
  number message is shown and not the range message.

Status: Not implemented

---

## S-9 — Get no answer at all while anything is wrong

As a borrower, I want the calculator to withhold the answer entirely while any
input is wrong, so that I can never act on a half-finished figure.

Roles: R-1, R-2
Serves: J-7

Acceptance criteria

- Given one or more inputs are invalid, when I calculate, then no monthly
  payment and no balance owed figure is shown.
- Given the loan amount is "abc", the interest rate is empty and the term is
  "0", when I calculate, then all three messages are shown at the same time.
- Given more than one input is invalid, when I calculate, then each message is
  shown next to the field it belongs to.
- Given every input is valid, when I calculate, then no message is shown for
  any field.

Status: Not implemented

---

## S-10 — Never see an old answer

As a borrower, I want a previous answer cleared the moment I touch any input,
so that I never read a figure that no longer matches what is on the form.

Roles: R-1, R-2
Serves: J-7

Acceptance criteria

- Given a monthly payment is shown, when I edit the loan amount, the interest
  rate or the term, then the monthly payment and the balance owed are removed
  from the screen immediately, before I calculate again.
- Given a monthly payment is shown, when I change the repayment type, then the
  monthly payment and the balance owed are removed from the screen
  immediately, before I calculate again.
- Given a figure has been cleared by an edit, when I look at the screen, then
  no error message has been shown either. Editing clears the answer; it does
  not accuse me of anything.
- Given a figure has been cleared by an edit, when I calculate, then the new
  figure is shown.
- Given a monthly payment is shown, when I change an input to an invalid value
  and calculate, then no monthly payment is on screen and the error message is
  shown.
- Given an error message is shown, when I look anywhere on the screen, then no
  monthly payment or balance owed figure is visible.
- Given an error message is shown, when I correct the field and calculate,
  then the message is removed and the new figure is shown.
- Given an error message is shown for a field, when I change that field to
  another invalid value, then the message updates to the one matching the new
  value.

Status: Not implemented

---

## S-11 — Never see a broken figure

As a borrower, I want every figure on screen to be a real number, so that I
can trust what I am reading.

Roles: R-1, R-2
Serves: J-6, J-7

Acceptance criteria

- Given any combination of inputs the calculator accepts, when a result is
  shown, then it never contains "NaN", "Infinity", "-0.00", a minus sign, or
  an empty space where a figure should be.
- Given 10000000, 25, 40 and "Repayment", when I calculate, then £208,343.82
  is shown rather than "Infinity" or "NaN".
- Given 1000, 0.001, 40 and "Repayment", when I calculate, then £2.08 is shown
  rather than a figure with lost precision.
- Given any result, when I read it, then no figure is partially computed or
  left over from a previous calculation.

Status: Not implemented

---

## S-12 — Use the whole calculator from the keyboard

As a borrower, I want to complete the calculation without a mouse, so that I
can use it however I normally work.

Roles: R-1, R-2
Serves: J-1, J-4

Acceptance criteria

- Given the calculator is open, when I press Tab repeatedly, then focus
  reaches all four inputs and the Calculate control in the order they appear
  on screen.
- Given focus is in any field, when I press Enter, then the calculator
  attempts to calculate.
- Given focus is on the repayment type, when I use the arrow keys, then I can
  select "Repayment" or "Interest only".
- Given I calculate with an invalid input, when the messages appear, then
  focus moves to the first field with a message.
- Given the calculator is open, when I use the keyboard only, then nothing is
  reachable by pointer alone.

Status: Not implemented

---

## S-13 — Hear the result and any error

As a borrower, I want the result and any error read out, so that I can use the
calculator with a screen reader.

Roles: R-1, R-2
Serves: J-1, J-4, J-7

Acceptance criteria

- Given I am using a screen reader, when a monthly payment appears or changes,
  then it is announced without the whole page being read again.
- Given I am using a screen reader, when an error message appears, then it is
  announced.
- Given an error message is shown, when I move focus to that field, then the
  message is read as part of the field.
- Given a field has an error message, when a screen reader reads it, then the
  field is reported as invalid and not only shown in a different colour.
- Given an error message is read out of context, when I hear it, then it names
  the field it belongs to.

Status: Not implemented

---

## S-14 — Read every figure as money

As a borrower, I want figures written the way money is written, so that I can
read them at a glance.

Roles: R-1, R-2
Serves: J-1, J-6

Acceptance criteria

- Given a figure is shown, when I read it, then it has a "£" prefix, thousands
  separated by commas, and exactly two decimal places.
- Given a monthly payment of 1169.18, when it is shown, then it reads
  "£1,169.18" and not "£1169.18" or "£1,169.2".
- Given a monthly payment of 0, when it is shown, then it reads "£0.00".
- Given a balance owed of 200000, when it is shown, then it reads
  "£200,000.00".

Status: Not implemented

---

## S-22 — Start clean every time

As a borrower, I want the calculator to open empty every time, so that I am
never working from figures left behind by a previous visit.

Roles: R-1, R-2
Serves: J-7

Acceptance criteria

- Given I have calculated a monthly payment, when I reload the page, then all
  four inputs are back to their starting state and "Repayment" is selected.
- Given I have calculated a monthly payment, when I reload the page, then no
  monthly payment, no balance owed and no error message is shown.
- Given I have entered values, when I close the page and open it again, then
  nothing I typed has been kept.
- Given the calculator is used, when it is finished with, then nothing is
  written to the browser or to any server.

Status: Not implemented

---

# Out of scope

The stories below were considered and deliberately left out of the frozen
scope. They are recorded so the decision is not lost and so the numbering
stays stable if any of them is picked up later.

---

## S-15 — Total interest over the term

As a borrower, I want to see the total interest I would pay over the whole
term, so that I can see what the loan costs me rather than only what it costs
me each month.

Roles: R-1, R-2
Serves: J-6

Acceptance criteria

- Given 200000, 5, 25 and "Repayment", when I calculate, then the total
  interest shown is £150,754.02.
- Given a rate of 0, when I calculate, then the total interest shown is £0.00.
- Given the total interest is shown, when it is compared against the month by
  month figures, then the two agree to the penny.

Status: Not implemented

---

## S-16 — Total amount paid over the term

As a borrower, I want to see the total amount I would pay over the whole term,
so that I can see the full cost of the loan in one figure.

Roles: R-1
Serves: J-6

Acceptance criteria

- Given 200000, 5, 25 and "Repayment", when I calculate, then the total paid
  shown is £350,754.02.
- Given type "Interest only", when I calculate, then it is unambiguous whether
  the total paid includes the balance owed at the end.

Status: Not implemented

---

## S-17 — Month by month breakdown

As a borrower, I want to see what each monthly payment is made up of, so that
I can see how little of an early payment reduces the debt.

Roles: R-1
Serves: J-6

Acceptance criteria

- Given 200000, 5, 25 and "Repayment", when I view the breakdown, then the
  first payment is shown as £833.33 interest and £335.85 capital.
- Given a breakdown is shown, when I read the last row, then the closing
  balance is exactly £0.00.
- Given a breakdown is shown, when the payments are added up, then they equal
  the loan amount plus the total interest exactly.

Status: Not implemented

---

## S-18 — Overpayments

As a borrower, I want to add a regular or one-off overpayment, so that I can
see how much interest it saves and how much sooner the loan ends.

Roles: R-1
Serves: J-3

Acceptance criteria

- Given a valid mortgage and a monthly overpayment, when I calculate, then the
  interest saved and the revised end date are shown.
- Given an overpayment large enough to clear the loan early, when I calculate,
  then the final month is shown as a partial payment and never as a negative
  one.

Status: Not implemented

---

## S-19 — Fixed period then reversion rate

As a borrower, I want to enter an initial fixed rate and the rate it reverts
to, so that I can see what my payment becomes when the fixed period ends.

Roles: R-1, R-2
Serves: J-2

Acceptance criteria

- Given an initial rate, a fixed period in years and a reversion rate, when I
  calculate, then a monthly payment is shown for the fixed period and a second
  one for the remainder of the term.
- Given the fixed period ends, when the second payment is worked out, then it
  is based on the balance outstanding at that point and the remaining term.
- Given a fixed period longer than the term, when I calculate, then I am told
  what to fix.

Status: Not implemented

---

## S-20 — Compare two mortgages side by side

As a borrower, I want to see two sets of figures next to each other, so that I
can choose between two quotes without writing them down.

Roles: R-1, R-2
Serves: J-2, J-5

Acceptance criteria

- Given two valid sets of inputs, when I calculate, then both monthly payments
  are shown together and clearly attributed to their own inputs.
- Given one of the two sets is invalid, when I calculate, then the valid set
  still shows its figure and the invalid one shows its messages.

Status: Not implemented

---

## S-21 — Work the loan out from price and deposit

As a borrower, I want to enter the property price and my deposit instead of
the loan amount, so that I can use the figures I actually have.

Roles: R-1, R-2
Serves: J-1

Acceptance criteria

- Given a property price and a deposit, when I calculate, then the loan amount
  used is the price less the deposit.
- Given a deposit larger than the price, when I calculate, then I am told what
  to fix and no figure is shown.
- Given a price and a deposit, when I calculate, then the loan to value
  percentage is shown.

Status: Not implemented
