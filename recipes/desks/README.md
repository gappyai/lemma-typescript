# Desk Recipes

These are actual desk-layer recipe source packs, not just pod metadata.

Each recipe contains:

- a real desk app skeleton in `desk.tsx`
- a `.env.example` with the live backing pod id
- a short README describing the operator loop and backing resources

They are meant to be copied into a Lemma desk scaffold after installing the referenced registry blocks locally under `src/components/lemma`.

Available desk recipes:

- [issue-tracker](./issue-tracker/README.md)
- [triage-inbox](./triage-inbox/README.md)
- [approval-workflow](./approval-workflow/README.md)
- [docs-workspace-os](./docs-workspace-os/README.md)

For the CRM lane, the live routed desk already exists at [examples/inbox-crm](../../examples/inbox-crm).
