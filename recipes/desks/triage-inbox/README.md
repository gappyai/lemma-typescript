# Triage Inbox Desk

Live pod id: `019daa51-6b9c-71d2-8a70-46da8604fc07`

Use this when operators work from a shared intake queue and need to classify, assign, and escalate new items quickly.

Backed resources:

- `triage_items` table
- `/intake-context` folder
- `triage-assistant` assistant

Primary blocks:

- `lemma-records-view`
- `lemma-detail-panel`
- `lemma-status-flow`
- `lemma-global-search`
- `lemma-action-surface`
- `lemma-insights`

Copy [desk.tsx](./desk.tsx) into a desk scaffold and set `VITE_LEMMA_POD_ID` from [.env.example](./.env.example).
