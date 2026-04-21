# Recipe Packs Example App

Runnable React app that renders the live desk recipes against the provisioned Lemma pods.

## Run

```bash
npm install
npm run dev
```

## Backing Pods

- Issue Tracker: `019daa51-1be6-71bc-ac34-7da96cd10c6a`
- Triage Inbox: `019daa51-6b9c-71d2-8a70-46da8604fc07`
- Approval Workflow: `019daa51-8b1c-715e-ae6c-de43dd804e1d`
- Docs Workspace OS: `019daa51-ae00-7387-9942-3f50ef6a9d06`
- Notion Copy: `019daa7d-7521-7239-bdc4-c4ecc9faf2f8`
- Linear Copy: `019daa7d-ad11-7039-a95f-5443203c7083`

The app reuses the local component stack from `examples/inbox-crm/src` through the `@` alias so it stays aligned with the current canonical registry install target.
The shared Lemma and shadcn component source is copied locally into this app so it builds standalone without depending on the sibling app's TypeScript environment.
