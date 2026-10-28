---
name: raise-pr
description: Run the checks, then raise a small pull request for the work just finished on a branch
argument-hint: [optional: the story numbers or a short description]
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep
---

# Raise PR — mortgage calculator

Run when a chunk of work is finished and ready to go into `main`. It is run by
hand each time, never automatically. Work goes into `main` in small pieces: one
story, or one step of the build plan, per pull request.

Run every step in order. Do not skip one. If a step fails, stop there and say
which step and why. Never report a step as passed when it was skipped.

## Step 1 — Check where you are

```bash
git branch --show-current
git status --short
git fetch origin
git log origin/main..HEAD --oneline
```

- Stop if the branch is `main`. Work is raised from a branch.
- Stop if `git status` shows anything uncommitted. Commit it or revert it. Do
  not carry stray edits into a pull request.
- Stop if there are no commits ahead of `origin/main`.

## Step 2 — Check the chunk is small and covered

```bash
git diff origin/main..HEAD --stat
```

- Every commit should be one logical change, with a message that says what and
  why.
- Everything that adds behaviour should implement a numbered story in
  `docs/user-stories.md`. Setup and deployment have no story. If something is
  neither, stop and tell the owner.
- If the diff is large or mixes unrelated work, say so and ask whether to split
  it before going on.

## Step 3 — Run the checks

```bash
npm run typecheck
npm test
npm run build
```

State the real numbers: test files and tests passed. If anything fails, stop.
Do not push a branch that fails its own checks.

## Step 4 — Rebase on main

```bash
git rebase origin/main
```

Resolve any conflicts, then continue the rebase. If it was not a no-op, run
Step 3 again.

## Step 5 — Push

```bash
git push -u origin HEAD
```

If the push is rejected because the branch was rebased, use
`git push --force-with-lease`. Never force-push `main`.

## Step 6 — Raise the pull request

Title: plain words, what the change does. No prefixes.

Body, in this shape:

```
# What?
One plain line per thing this changes.

# Stories
S-1, S-6 ... (or "None: project setup")

# What to check
Specific things to try or read. Say what changed, not that it works.
```

Rules for the body:

- Say what changed and what to check. Never say that something works.
- Name the stories by number.
- Plain language, short. No padding, no marketing words.
- Anything the owner must decide goes under `# What to check` as a question.

Create it with `gh pr create --base main --title "..." --body "..."`, passing
the body through a heredoc so the line breaks survive.

## Step 7 — Hand it back

Output the pull request URL so it can be clicked. If `.github/workflows/`
exists, also report the real state of the first run with `gh pr checks`.

Do not merge. The owner reviews and merges.
