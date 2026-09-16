---
name: grounded-coding-workflow
description: 'Use for repository coding, debugging, and bug-fix tasks that need disciplined local investigation, minimal edits, and focused validation. Triggers include fixing a failing behavior, implementing a requested change, investigating a test failure, or reviewing a nearby code path.'
argument-hint: 'Describe the behavior, failure, or requested change and its nearest file, symbol, or command.'
user-invocable: true
disable-model-invocation: false
---

# Grounded Coding Workflow

## Purpose

Turn a coding request into a verified, narrowly scoped change. Preserve existing behavior outside the requested surface and keep investigation proportional to the risk.

## Procedure

1. **Anchor the task.** Start from the most concrete available anchor: a named file, symbol, failing behavior, failing command, test, or nearby implementation. If none is provided, perform one targeted search to find it.
2. **Route locally.** Read only the owning abstraction and the nearest relevant test, call site, or implementation. If the anchor only forwards or registers behavior, follow one hop to the code that computes or mutates it.
3. **Form a hypothesis.** Before editing, state one falsifiable explanation for the behavior and one cheap check that could disconfirm it. Stop searching once these are clear.
4. **Choose the smallest testable edit.** Prefer the existing abstraction, helper, API, and style. Preserve public interfaces unless the request requires a contract change. Avoid unrelated cleanup.
5. **Edit directly.** Make a focused change in the smallest possible file set. Add or update a focused test when the behavior is not already covered or the change has meaningful regression risk.
6. **Validate immediately.** The first action after the substantive edit must be the cheapest executable check that can falsify the hypothesis: a behavior-scoped command, focused test, or narrow lint/typecheck. Do not resume broad exploration before this check.
7. **Iterate within the slice.** If validation exposes a local defect, repair it and rerun the same check. If it disproves the hypothesis, take one nearby hop to the more direct controller, revise the hypothesis, and make the smallest next edit.
8. **Finish with evidence.** Run at least one post-edit executable validation whenever available. Report the changed files, the validation performed, and any remaining test gaps or unrelated failures. Do not commit unless explicitly requested.

## Decision Rules

- If several paths look plausible, select the path with the strongest nearby evidence and the most discriminating cheap check.
- If no focused executable check exists, use a narrow compile, lint, or typecheck; use the diff only as a last resort.
- If the first validation is ambiguous, perform one nearby read or neighboring test/call-site check, then choose local repair or a one-hop reroute.
- If unrelated worktree changes appear, leave them intact and work around them unless they block the requested change.
- If a third repair attempt in the same file still fails, stop and report the blocker rather than widening the change without evidence.

## Completion Checklist

- The behavior has a concrete anchor and an identified controlling path.
- The pre-edit hypothesis and disconfirming check were explicit.
- The edit is minimal and consistent with local patterns.
- A focused executable validation passed, or its failure is clearly reported.
- No unrelated files or user changes were reverted.
- The final report names relevant files and remaining risks succinctly.
