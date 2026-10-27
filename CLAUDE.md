# Mortgage calculator — project instructions

## What this is
A mortgage repayment calculator that runs in the browser. No backend, no
accounts, no API keys, no paid services. Someone should be able to clone this,
run two commands, and use it.

## How we work
I own the spec and the testing. You own the implementation.

- `docs/user-stories.md` is the spec. Every change implements a numbered story.
  If a change isn't covered by a story, stop and tell me instead of inventing
  scope.
- Don't write app code until we've agreed the approach.
- If something is my call, ask. Don't guess, and don't quietly work around a
  constraint you disagree with — say you disagree.
- Never tell me something works. Tell me what you changed and what I should
  check.
- One logical change per commit. The message says what and why.

## Standards
- TypeScript, strict. No UI framework, no state library.
- The calculation engine is pure — no DOM, no formatting, no I/O — and unit
  tested exhaustively.
- The DOM layer is thin and holds no calculation logic.
- Money is handled so rounding can't produce a wrong total. Comment the
  rounding rule where it's applied.
- Invalid input returns a typed result. Never throw to the user. Never display
  NaN, Infinity, or a half-computed number.
- Error messages match the acceptance criteria wording exactly.
- Works entirely from the keyboard. Results and errors are announced to a
  screen reader.
