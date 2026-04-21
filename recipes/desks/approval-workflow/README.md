# Approval Workflow Desk

Live pod id: `019daa51-8b1c-715e-ae6c-de43dd804e1d`

Use this when reviewers need a queue of pending requests, clear decision paths, and workflow-run visibility in the same desk.

Backed resources:

- `approval_requests` table
- `/approval-attachments` folder
- `approval-decision` workflow

Primary blocks:

- `lemma-records-view`
- `lemma-detail-panel`
- `lemma-status-flow`
- `lemma-action-surface`
- `lemma-workflow-runner`
- `lemma-comments`

Copy [desk.tsx](./desk.tsx) into a desk scaffold and set `VITE_LEMMA_POD_ID` from [.env.example](./.env.example).
