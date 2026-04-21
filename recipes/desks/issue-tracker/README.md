# Issue Tracker Desk

Live pod id: `019daa51-1be6-71bc-ac34-7da96cd10c6a`

Use this when the operator starts from an issue queue, needs strong status semantics, and wants assistant help close to the work.

Backed resources:

- `issues` table
- `/specs` folder
- `issue-copilot` assistant

Primary blocks:

- `lemma-records-view`
- `lemma-detail-panel`
- `lemma-status-flow`
- `lemma-comments`
- `lemma-activity-feed`
- `lemma-assistant-experience`

Copy [desk.tsx](./desk.tsx) into a desk scaffold and set `VITE_LEMMA_POD_ID` from [.env.example](./.env.example).
