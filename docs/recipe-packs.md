# Recipe Packs

Lemma recipe packs are the fast paths for common pod desk archetypes. Each pack is intentionally built from the canonical desk-layer primitives in this repo rather than from specialized one-off blocks.

This document focuses on the desk/frontend layer:

- real pod ids for live example pods
- the operator loop each pack is meant to support
- the canonical blocks that should shape the desk
- the minimal pod resources provisioned to make the recipe credible

## Provisioning

Provision or refresh the packs with:

```bash
node ./scripts/provision_recipe_packs.mjs
```

Use `--only <slug>` to target a subset, or `--org-id <org-id>` to pin the organization explicitly.

The script writes the current live pod map to [recipes/live-pods.json](../recipes/live-pods.json).

Actual desk recipe source packs live under [recipes/desks](../recipes/desks/README.md).

A runnable multi-recipe React example app now lives at [examples/recipe-packs](../examples/recipe-packs/README.md).

## Recipe Registry

| Recipe | Pod Name | Live Pod ID | Primary Loop |
| --- | --- | --- | --- |
| Inbox CRM | `inbox-crm` | `019da19b-e468-7546-b6e9-b5dbc1bf6aa9` | Triage inbound conversations, update deals, and move pipeline work without leaving the desk. |
| Issue Tracker | `recipe-issue-tracker` | `019daa51-1be6-71bc-ac34-7da96cd10c6a` | Scan issues, update status, and move work through delivery. |
| Triage Inbox | `recipe-triage-inbox` | `019daa51-6b9c-71d2-8a70-46da8604fc07` | Review new intake, classify urgency, and assign or escalate the item. |
| Approval Workflow | `recipe-approval-workflow` | `019daa51-8b1c-715e-ae6c-de43dd804e1d` | Review requests, record decisions, and track workflow runs. |
| Docs Workspace OS | `recipe-docs-workspace-os` | `019daa51-ae00-7387-9942-3f50ef6a9d06` | Browse page records, open pod files, and navigate internal knowledge. |
| Notion Copy | `recipe-notion-copy` | `019daa7d-7521-7239-bdc4-c4ecc9faf2f8` | Move between wiki documents, database-style tasks, search, files, and publish workflows. |
| Linear Copy | `recipe-linear-copy` | `019daa7d-ad11-7039-a95f-5443203c7083` | Triage issues, inspect projects and cycles, run planning flows, and review roadmap context. |

## Packs

### Inbox CRM

- Use when the operator starts from incoming conversations and needs deal context, actions, reminders, files, and assistant help in one shell.
- Primary blocks: `lemma-records-view`, `lemma-detail-panel`, `lemma-global-search`, `lemma-action-surface`, `lemma-assistant-experience`, `lemma-file-browser`, `lemma-insights`.
- Live backing pod: `019da19b-e468-7546-b6e9-b5dbc1bf6aa9`.

### Issue Tracker

- Use when the primary route is a high-throughput issue queue with clear status semantics and strong detail views.
- Primary blocks: `lemma-records-view`, `lemma-detail-panel`, `lemma-status-flow`, `lemma-comments`, `lemma-activity-feed`, `lemma-assistant-experience`.
- Live backing pod: `019daa51-1be6-71bc-ac34-7da96cd10c6a`.
- Provisioned resources: `issues` table, `/specs` folder, `issue-copilot` assistant.

### Triage Inbox

- Use when a team reviews mixed inbound work from email, Slack, forms, or manual intake.
- Primary blocks: `lemma-records-view`, `lemma-detail-panel`, `lemma-status-flow`, `lemma-global-search`, `lemma-action-surface`, `lemma-insights`.
- Live backing pod: `019daa51-6b9c-71d2-8a70-46da8604fc07`.
- Provisioned resources: `triage_items` table, `/intake-context` folder, `triage-assistant` assistant.

### Approval Workflow

- Use when the desk is centered on pending review items and the user needs both record detail and workflow-run visibility.
- Primary blocks: `lemma-records-view`, `lemma-detail-panel`, `lemma-status-flow`, `lemma-action-surface`, `lemma-workflow-runner`, `lemma-comments`.
- Live backing pod: `019daa51-8b1c-715e-ae6c-de43dd804e1d`.
- Provisioned resources: `approval_requests` table, `/approval-attachments` folder, `approval-decision` workflow.

### Docs Workspace OS

- Use when documents, files, hierarchy, and knowledge retrieval are the core interaction model.
- Primary blocks: `lemma-page-tree`, `lemma-document-workspace`, `lemma-file-browser`, `lemma-breadcrumbs`, `lemma-assistant-experience`.
- Live backing pod: `019daa51-ae00-7387-9942-3f50ef6a9d06`.
- Provisioned resources: pod file tree rooted at `/`, `knowledge-guide` assistant.

### Notion Copy

- Use when the product needs a connected workspace feel: wiki document navigation, database-style task views, pod files, search, assistant help, and a lightweight publish handoff.
- Primary blocks: `lemma-page-tree`, `lemma-document-workspace`, `lemma-records-view`, `lemma-global-search`, `lemma-file-browser`, `lemma-assistant-experience`, `lemma-action-surface`, `lemma-workflow-runner`.
- Live backing pod: `019daa7d-7521-7239-bdc4-c4ecc9faf2f8`.
- Provisioned resources: `workspace_tasks` table, pod file tree rooted at `/`, `notion-guide` assistant, `page-publish-review` workflow.

### Linear Copy

- Use when the desk should feel like a product delivery control room with issues, projects, cycles, roadmaps, planning flows, and assistant summaries.
- Primary blocks: `lemma-records-view`, `lemma-global-search`, `lemma-insights`, `lemma-file-browser`, `lemma-assistant-experience`, `lemma-action-surface`, `lemma-workflow-runner`.
- Live backing pod: `019daa7d-ad11-7039-a95f-5443203c7083`.
- Provisioned resources: `issues` table, `projects` table, `cycles` table, `/roadmaps` folder tree, `linear-pm` assistant, `cycle-planning` workflow.
