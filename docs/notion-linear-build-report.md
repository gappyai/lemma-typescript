# Notion And Linear Build Report

This pass added two new live recipe pods and routed React examples for them:

- Notion Copy: `019daa7d-7521-7239-bdc4-c4ecc9faf2f8`
- Linear Copy: `019daa7d-ad11-7039-a95f-5443203c7083`

They now render in [examples/recipe-packs](../examples/recipe-packs/README.md) and are backed by real Lemma resources rather than static mocks.

## What Was Difficult Overall

### 1. The hardest part was not provisioning data. It was composing multiple registry blocks into one coherent product loop.

Notion and Linear both depend on tightly coordinated workspace state:

- the active page drives the editor, side navigation, breadcrumbs, files, and assistant context
- the active issue drives project, cycle, comments, history, assistant, and planning actions

Today our blocks are strong as standalone surfaces, but weak as a coordinated system. We can place `lemma-page-tree`, `lemma-document-workspace`, `lemma-file-browser`, `lemma-records-view`, `lemma-action-surface`, and `lemma-assistant-experience` on one page, but we still have to fake most of the product-level orchestration between them in layout and route code.

### 2. Notion-style document/database blending is still awkward.

Notion is not just "docs plus a table." It is one connected workspace where pages, databases, templates, mentions, and linked views feel native to each other. We could get close on:

- page tree
- document workspace
- file browsing
- search
- assistant sidecar
- workflow-backed publish handoff

But we could not cleanly express several real Notion behaviors with the current desk primitives:

- one selected page driving all adjacent surfaces
- database views embedded as first-class blocks inside docs
- saved views, filters, and property customizations with a Notion-like feel
- block-level authoring semantics, linked databases, mentions, and template actions

### 3. Linear-style planning needs richer product-delivery primitives than generic records alone.

Generic `lemma-records-view` got us a long way for issues, projects, and cycles. The gap showed up in the connections between them:

- issue detail does not naturally pull project and cycle context into one cohesive surface
- planning views are still assembled from multiple generic blocks rather than a delivery-native shell
- roadmap files, cycle runs, issue queue, and assistant all need custom page composition to feel like one desk

We can build a credible Linear-like desk, but it takes a lot of glue code to make it feel deliberate.

### 4. Provisioning is still mostly create-only and table-centric.

The current recipe provisioning flow worked, but it exposed several limitations:

- it can create tables, assistants, workflows, folders, and records, but it does not seed files
- it does not upsert table schemas or assistant/workflow definitions when the recipe evolves
- it does not provision functions or agents, which limits how "end to end" a recipe can become
- relational sample data is still mostly modeled with plain text references instead of stronger reusable relation helpers

That forced the Notion and Linear replicas to stay more "credible desk demos" than "full product twins."

### 5. Verification is still manual-heavy.

Both builds passed, and the live pods were verified through CLI resource checks, but there is still no realistic acceptance harness for:

- route-by-route smoke testing
- workflow launch and resume checks in the browser
- assistant interaction checks
- layout regression coverage for registry-heavy pages

That makes ambitious recipe work slower and riskier than it should be.

## How To Improve The Registry

### 1. Add coordinated workspace controllers, not just isolated surfaces.

The biggest missing piece is a shared controller layer for desk composition. We need product-level primitives such as:

- page tree + document workspace + file browser controllers that share active selection
- issue queue + detail + related project/cycle context controllers
- assistant sidecar patterns that can inherit the active record/page/file automatically

Without this, every serious desk becomes a custom orchestration exercise.

### 2. Add first-class Notion-style workspace blocks.

The current blocks are close, but not enough for a real Notion-shaped product. We likely need:

- a connected wiki shell block
- a database view block with saved views, visible-property controls, and embedded-page usage
- a linked-content block for page relations, mentions, backlinks, and related docs
- a publish/review shell pattern for docs

### 3. Add first-class Linear-style delivery blocks.

For Linear-like desks, the generic primitives should be complemented by delivery-native ones:

- issue detail shell with status, project, cycle, assignee, comments, and activity in one composition
- project and cycle overview blocks
- roadmap and planning workspace patterns
- a richer status/transition lane for issue and project flows

### 4. Improve responsiveness and panel ergonomics for embedded assistants and insights.

The earlier recipe layouts struggled because assistants and charts become weak quickly when they are placed into narrow rails. Some registry blocks still assume they can own a large uninterrupted panel. We need:

- better minimum-size guidance and responsive behavior
- clearer sidecar vs full-panel display modes
- easier patterns for stacking assistant, insights, and workflow runner surfaces without layout fighting

## How To Improve The SDK

### 1. Add higher-level composition hooks.

The SDK is strong at individual resource access, but weaker at cross-surface coordination. Useful additions would be:

- shared selection controllers for records/pages/files
- route-aware state helpers for queue-detail flows
- helpers for syncing search selection into detail panels or document surfaces
- richer related-record and relation-label hooks for multi-table product UIs

### 2. Add stronger document and file workflow helpers.

For Notion-like products, we need simpler ways to connect:

- page records to file-backed documents
- active page state to file loading
- file metadata, preview, and edit state in one hook family

Right now those connections are possible, but not ergonomic.

### 3. Add workflow and assistant launch helpers that understand desk context.

Starting a workflow or assistant session often requires repeating pod, entity, and surrounding context manually. The SDK should make it easy to launch:

- "start this workflow for the current issue"
- "open assistant with the current page preloaded"
- "continue the latest run tied to this entity"

Those are common desk moves.

### 4. Add better recipe/provisioning support around idempotent live environments.

The repo-level provisioner should grow into a better companion for the SDK:

- file seeding support
- schema drift detection and safe updates
- assistant/workflow/function upserts
- richer sample-data helpers for related tables
- one verification command that proves a recipe is truly runnable

## Bottom Line

The good news is that Lemma is already strong enough to produce believable Notion-like and Linear-like desk experiences with live pods, real data, assistants, and workflows.

The limiting factor is no longer "can we render a block." The limiting factor is whether the registry and SDK can express coordinated product systems without a lot of custom glue. That is the main improvement frontier.
