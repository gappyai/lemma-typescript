# Lemma Gap Report

## What Lemma Is

From the Lemma skill and platform docs, Lemma is trying to be an AI operating system for business teams: each pod combines structured data, files, deterministic backend logic, workflows, agents, assistants, and a real operator desk around one bounded operating job.

This SDK repo is the desk-builder layer of that story, not the entire Lemma product:

- `lemma-sdk` gives the client and typed namespaces.
- `lemma-sdk/react` gives the headless hooks.
- the shadcn registry gives the stock operator UI blocks.

That means the right question is not "does this repo expose every platform capability directly?" It is "does this repo make it easy to build strong end-user desks for pods?"

## What Already Looks Strong

- The registry has a clear canonical center of gravity now: `lemma-records-view`, `lemma-detail-panel`, `lemma-record-form`, `lemma-document-workspace`, `lemma-assistant-experience`, `lemma-members`, `lemma-insights`, `lemma-status-flow`, and `lemma-action-surface`.
- The records lane is the strongest part of the product story. The consolidation into presets and multiple view modes is credible for Airtable, Linear, Jira, and CRM-style desks.
- The files/documents direction is much clearer than before. Treating pod files as first-class instead of reducing everything to record attachments is the right Lemma-specific differentiator.
- The hook surface is broader than the registry surface, which is good foundationally: the SDK already exposes assistants, agents, functions, workflows, records, files, membership, and auth.

## Where We Are Lacking

### 1. The repo’s scope needs to stay disciplined: this is the desk/frontend layer

After the clarification, the right frame is:

- `lemma-action-surface` already covers task/action consumption for end-user desks.
- end users usually do not need raw run-history consoles for functions or agents.
- this repo should not be criticized for not exposing the entire backend/control-plane story in the registry.

The real implication is narrower:

- when docs use the broader Lemma platform story, they need to keep reminding readers that this package is specifically the desk SDK + registry layer.
- any gap callout should be about missing end-user desk primitives, not missing internal platform/admin tooling.

Evidence:

- The repo defines itself as the headless SDK plus shadcn registry for stock UI blocks in [README.md](../README.md).
- The live registry already includes `lemma-action-surface` in [registry.json](../registry.json).

### 2. The public story is drifting from the live registry surface

The top-level docs do not fully match the shipped component set.

Most obvious example:

- The README says the registry ships 19 canonical blocks, but its summary table omits `lemma-action-surface`.
- The desk skill scaffold does include `@lemma/lemma-action-surface`, which means the skill view of Lemma and the README view of Lemma are already diverging.

Why this matters:

- When someone is trying to "understand what Lemma is," the top-level docs are supposed to give the cleanest answer.
- Documentation drift weakens confidence in the canonical surface and makes the system feel more in flux than it actually is.

Evidence:

- README registry summary in [README.md](../README.md) lists 19 blocks but does not include `lemma-action-surface`.
- The live manifest includes `lemma-action-surface` in [registry.json](../registry.json).
- The desk skill scaffold installs `@lemma/lemma-action-surface` in the external skill file `/Users/kapeed/.codex/skills/lemma/modules/lemma-desks/GUIDE.md`.

### 3. The shared host-app API contract is still incomplete

The standardization plan says surviving blocks should converge on a common contract: `appearance`, `density`, `radius`, `title`, `description`, `headerActions`, `className`, and shared empty/loading/error hooks or slots.

That convergence is only partial.

Concrete examples:

- `LemmaRecordForm` exposes styling props but not the broader title/description/header/action/state contract.
- `AssistantExperienceView` takes a controller-first API instead of the more common `client`/`podId`/resource-name shape.
- Several data blocks still own their loading and error UI without exposing the state slots the plan says should be standardized.

Why this matters:

- Every block that diverges raises composition cost inside real desks.
- The more special cases a desk builder has to remember, the weaker the "canonical primitive" story becomes.

Evidence:

- Shared API goals are described in [docs/registry-standardization-plan.md](./registry-standardization-plan.md).
- `LemmaRecordFormProps` in [registry/default/lemma-record-form/components/lemma-record-form.tsx](../registry/default/lemma-record-form/components/lemma-record-form.tsx) does not expose the same host-shell controls many other blocks do.
- `AssistantExperienceViewProps` in [registry/default/lemma-assistant-experience/components/assistant-experience.tsx](../registry/default/lemma-assistant-experience/components/assistant-experience.tsx) is intentionally controller-shaped rather than resource-shaped.
- `LemmaPageTreeProps` and `LemmaActivityFeedProps` in [registry/default/lemma-page-tree/components/lemma-page-tree.tsx](../registry/default/lemma-page-tree/components/lemma-page-tree.tsx) and [registry/default/lemma-activity-feed/components/lemma-activity-feed.tsx](../registry/default/lemma-activity-feed/components/lemma-activity-feed.tsx) still expose a narrower host contract than the standardization target.

### 4. The document lane is promising, but it is not yet Notion/Coda-grade

This is the biggest product gap if the ambition is "AI operating system for business teams" rather than just "records app with chat."

The current repo already knows this. The TODO file explicitly calls out what is still missing:

- real slash-command search
- keyboard insertion and block transforms
- anchored comments
- stronger backlinks
- richer file/document composition
- export semantics for markdown/html/plain text
- better file workspace layouts such as bulk actions, stronger tree layouts, and split panes

Why this matters:

- The docs position files and documents as a first-class Lemma differentiator.
- Until the document lane feels native and collaborative, the Notion/Coda side of the product story is still aspirational.

Evidence:

- Direction is defined in [docs/document-system-direction.md](./document-system-direction.md).
- Remaining gaps are explicitly tracked in [docs/registry-todo.md](./registry-todo.md).

### 5. Member and access management still stops short of a full real-world admin flow

The repo now supports member listing, role updates, removal, and add-from-organization, which is solid. But it still cannot do the most common real-world thing cleanly: invite someone who is not already in the organization pool.

Why this matters:

- Pods are collaborative operating systems.
- If membership is central to ownership, routing, assignees, approvals, and access, then invite flows are not edge functionality.

Evidence:

- The README and hooks guide both note that direct email-to-pod invite is not yet exposed in the checked-in client surface in [README.md](../README.md) and [docs/hooks-guide.md](./hooks-guide.md).
- The outstanding members TODO is tracked in [docs/registry-todo.md](./registry-todo.md).

### 6. We still lack recipe-level acceleration for the main desk archetypes

The registry cleanly argues that specialized blocks should be removed and replaced by recipes/templates built from canonical primitives. That is the right product decision.

But the second half of that promise is not here yet.

What is still thin:

- issue tracker recipe
- CRM workspace recipe
- triage inbox recipe
- approval workflow recipe
- docs/workspace OS recipe

Why this matters:

- Canonical primitives are necessary, but not sufficient.
- Most teams do not just need parts; they need fast paths for proven operator loops.
- Without recipe packs, users still have to invent the composition patterns themselves.

Evidence:

- The plan explicitly says workflow-specific blocks should become presets, recipes, or templates in [docs/registry-standardization-plan.md](./registry-standardization-plan.md).
- Recipe/example packs are still listed under "Later" in [docs/registry-todo.md](./registry-todo.md).
- The repo currently points to a single canonical example desk rather than a family of archetypes.

### 7. Verification is behind the ambition level of the canonical surface

The registry blocks are getting more central and more complex, but the repo still has no tests.

Why this matters:

- Once a few blocks become "the canonical way" to build desks, regressions in them become product regressions, not just component bugs.
- This is especially risky for records, forms, actions, document editing, and membership flows where behavior is not purely presentational.

Evidence:

- The repo instructions explicitly say there are no tests currently in [AGENTS.md](../AGENTS.md).

## Priority Order

If we want the biggest improvement in the shortest path, the priority order should be:

1. Finish the doc/story cleanup: make README, registry manifest, skills, and examples tell the exact same desk-layer product story.
2. Push the shared block API convergence harder so composition gets cheaper across the board.
3. Invest in the document lane until it genuinely feels like a first-class collaborative workspace, not just a richer preview/editor.
4. Finish membership onboarding with direct invite flows.
5. Add recipe packs for the core operator archetypes.
6. Add regression coverage for the canonical blocks.

## Bottom Line

Lemma is already becoming a strong operator-app toolkit. Judged correctly as the desk/frontend layer, the biggest remaining gaps are:

- making documents/files feel native enough to carry real work
- giving builders repeatable archetypes instead of only primitives
- making the public story, skill story, and shipped surface line up perfectly

That is the gap between "good registry of components" and "great desk-building kit for real pod frontends."
