# App roles

Two roles. Both are borrowers using the calculator for themselves; the
difference between them is the product they are asking about, which changes
what the app must show them and what it must stop them from concluding.

Where a user story applies to both roles it says "As a borrower" and names
both role numbers.

## R-1 — Repayment borrower

A repayment borrower is someone looking at a loan repaid as capital and
interest, whether or not interest is charged: a capital-and-interest mortgage,
or an interest-free loan such as one from family. Each monthly payment pays
down the capital along with any interest, so nothing is owed once the term
ends. They already know roughly how much they need to borrow and now need to
know what it would cost them every month. They can enter a loan amount, an
annual interest rate, a term in years and a repayment type, choose Repayment,
and read back a single monthly payment figure, working entirely from the
keyboard and hearing the result or any error announced by a screen reader.
They must never be refused a monthly payment because the rate is 0%, because
an interest-free loan is still a loan they have to repay. They must never be
shown a balance owed at the end of the term, because on a repayment loan the
last payment clears the debt, and a balance beside the monthly figure would
suggest capital is left to find.

## R-2 — Interest-only borrower

An interest-only borrower is someone looking at a mortgage where the monthly
payment covers interest alone and the whole capital falls due as a lump sum at
the end of the term, who cannot judge the deal from the monthly figure by
itself. They can enter the same four inputs, choose Interest only, and read
back the monthly payment together with the balance that will still be owed at
the end of the term. They must never be shown the monthly payment on its own,
because an interest-only payment without the balance owed beside it reads as
cheaper than a repayment mortgage when it is not.
