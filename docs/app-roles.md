# App roles

Two roles. Both are borrowers using the calculator for themselves; the
difference between them is the product they are asking about, which changes
what the app must show them and what it must stop them from concluding.

Where a user story applies to both roles it says "As a borrower" and names
both role numbers.

## R-1 — Repayment borrower

A repayment borrower is someone looking at a capital-and-interest mortgage,
who already knows roughly how much they need to borrow and now needs to know
what it would cost them every month. They can enter a loan amount, an annual
interest rate, a term in years and a repayment type, choose Repayment, and
read back a single monthly payment figure, working entirely from the keyboard
and hearing the result or any error announced by a screen reader. They must
never see an invalid figure accepted, an empty space where a figure should be,
a result left on screen next to an error message, or an error message that
fails to name both the field and the fix.

## R-2 — Interest-only borrower

An interest-only borrower is someone looking at a mortgage where the monthly
payment covers interest alone and the whole capital falls due as a lump sum at
the end of the term, who cannot judge the deal from the monthly figure by
itself. They can enter the same four inputs, choose Interest only, and read
back the monthly payment together with the balance that will still be owed at
the end of the term. They must never be shown the monthly payment on its own,
because an interest-only payment without the balance owed beside it reads as
cheaper than a repayment mortgage when it is not.
