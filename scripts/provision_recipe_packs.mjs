import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { RECIPE_PACKS, recipePackBySlug } from "../recipes/recipe-packs.mjs";

const { values } = parseArgs({
  options: {
    "org-id": { type: "string" },
    only: { type: "string", multiple: true },
  },
  allowPositionals: false,
});

function runLemma(args, { expectJson = false } = {}) {
  const output = execFileSync("lemma", args, {
    cwd: resolve(process.cwd()),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return expectJson ? JSON.parse(output) : output;
}

function tryLemma(args) {
  try {
    return { ok: true, output: runLemma(args) };
  } catch (error) {
    const stdout = typeof error?.stdout === "string" ? error.stdout : "";
    const stderr = typeof error?.stderr === "string" ? error.stderr : "";
    return {
      ok: false,
      error: error instanceof Error ? error : new Error(String(error)),
      stdout,
      stderr,
    };
  }
}

function writePayload(tempRoot, name, payload) {
  const path = join(tempRoot, `${name}.json`);
  writeFileSync(path, JSON.stringify(payload, null, 2));
  return path;
}

function detectOrgId() {
  if (values["org-id"]) return values["org-id"];
  const organizations = runLemma(["organization", "list"], { expectJson: true });
  const first = organizations.items?.[0];
  if (!first?.id) {
    throw new Error("No organization available. Pass --org-id explicitly.");
  }
  return first.id;
}

function detectTargetRecipes() {
  if (!values.only?.length) return RECIPE_PACKS;
  return values.only.map((slug) => {
    const recipe = recipePackBySlug(slug);
    if (!recipe) {
      throw new Error(`Unknown recipe slug: ${slug}`);
    }
    return recipe;
  });
}

function ensurePod(orgId, recipe) {
  const pods = runLemma(["pod", "list"], { expectJson: true });
  const existing = pods.items?.find((item) => item.name === recipe.podName);
  if (existing?.id) return existing;
  runLemma([
    "pod",
    "create",
    recipe.podName,
    "--org-id",
    orgId,
    "--description",
    recipe.description,
  ]);
  const refreshed = runLemma(["pod", "list"], { expectJson: true });
  const created = refreshed.items?.find((item) => item.name === recipe.podName);
  if (!created?.id) {
    throw new Error(`Unable to resolve pod after create: ${recipe.podName}`);
  }
  return created;
}

function ensureFolders(podId, recipe) {
  for (const folder of recipe.folders ?? []) {
    const result = tryLemma([
      "file",
      "folder-create",
      folder.path,
      "--pod-id",
      podId,
      "--description",
      folder.description,
    ]);
    if (!result.ok) {
      const message = `${result.error.message}\n${result.stdout}\n${result.stderr}`.toLowerCase();
      if (!message.includes("already exists") && !message.includes("datastore_conflict")) {
        throw result.error;
      }
    }
  }
}

function ensureTables(tempRoot, podId, recipe) {
  const current = runLemma(["table", "list", "--pod-id", podId], { expectJson: true });
  const existing = new Set((current.items ?? []).map((table) => table.name));
  for (const table of recipe.tables ?? []) {
    if (existing.has(table.name)) continue;
    const payloadFile = writePayload(tempRoot, `${recipe.slug}-${table.name}`, table);
    runLemma(["table", "create", "--pod-id", podId, "--payload-file", payloadFile]);
  }
}

function ensureAssistants(tempRoot, podId, recipe) {
  if (!recipe.assistants?.length) return;
  const current = runLemma(["assistant", "list", "--pod-id", podId], { expectJson: true });
  const existing = new Set((current.items ?? []).map((assistant) => assistant.name));
  for (const assistant of recipe.assistants) {
    if (existing.has(assistant.name)) continue;
    const payloadFile = writePayload(tempRoot, `${recipe.slug}-${assistant.name}`, assistant);
    runLemma(["assistant", "create", "--pod-id", podId, "--payload-file", payloadFile]);
  }
}

function ensureAgents(tempRoot, podId, recipe) {
  if (!recipe.agents?.length) return;
  const current = runLemma(["agent", "list", "--pod-id", podId], { expectJson: true });
  const existing = new Set((current.items ?? []).map((agent) => agent.name));
  for (const agent of recipe.agents) {
    if (existing.has(agent.name)) continue;
    const payloadFile = writePayload(tempRoot, `${recipe.slug}-${agent.name}`, agent);
    runLemma(["agent", "create", "--pod-id", podId, "--payload-file", payloadFile]);
  }
}

function ensureWorkflows(tempRoot, podId, recipe) {
  if (!recipe.workflows?.length) return;
  const current = runLemma(["workflow", "list", "--pod-id", podId], { expectJson: true });
  const existing = new Set((current.items ?? []).map((workflow) => workflow.name));
  for (const workflow of recipe.workflows) {
    if (!existing.has(workflow.name)) {
      const createPayloadFile = writePayload(tempRoot, `${recipe.slug}-${workflow.name}-create`, workflow.create);
      runLemma(["workflow", "create", "--pod-id", podId, "--payload-file", createPayloadFile]);
    }
    const graphPayloadFile = writePayload(tempRoot, `${recipe.slug}-${workflow.name}-graph`, workflow.graph);
    runLemma([
      "workflow",
      "graph-update",
      workflow.name,
      "--pod-id",
      podId,
      "--payload-file",
      graphPayloadFile,
    ]);
  }
}

function seedTable(tempRoot, podId, tableName, rows) {
  if (!rows?.length) return;
  const listing = runLemma(["record", "list", tableName, "--pod-id", podId, "--limit", "5"], {
    expectJson: true,
  });
  if ((listing.items ?? []).length > 0) return;
  rows.forEach((row, index) => {
    const payloadFile = writePayload(tempRoot, `${tableName}-seed-${index + 1}`, { data: row });
    runLemma(["record", "create", tableName, "--pod-id", podId, "--payload-file", payloadFile]);
  });
}

function seedRecipe(tempRoot, podId, recipe) {
  if (!recipe.seed) return;
  Object.entries(recipe.seed).forEach(([tableName, rows]) => {
    seedTable(tempRoot, podId, tableName, rows);
  });
}

function writeLivePodMap(results) {
  const outDir = resolve("recipes");
  const outFile = join(outDir, "live-pods.json");
  mkdirSync(outDir, { recursive: true });
  const existing = existsSync(outFile)
    ? JSON.parse(readFileSync(outFile, "utf8"))
    : { recipes: [] };
  const merged = new Map((existing.recipes ?? []).map((recipe) => [recipe.slug, recipe]));
  results.forEach((recipe) => {
    merged.set(recipe.slug, recipe);
  });
  writeFileSync(
    outFile,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        recipes: Array.from(merged.values()).sort((left, right) => left.slug.localeCompare(right.slug)),
      },
      null,
      2,
    ),
  );
}

function main() {
  const orgId = detectOrgId();
  const tempRoot = mkdtempSync(join(tmpdir(), "lemma-recipe-packs-"));
  const results = [];

  try {
    for (const recipe of detectTargetRecipes()) {
      const pod = ensurePod(orgId, recipe);
      if (recipe.provision) {
        ensureFolders(pod.id, recipe);
        ensureTables(tempRoot, pod.id, recipe);
        ensureAssistants(tempRoot, pod.id, recipe);
        ensureAgents(tempRoot, pod.id, recipe);
        ensureWorkflows(tempRoot, pod.id, recipe);
        seedRecipe(tempRoot, pod.id, recipe);
      }
      results.push({
        slug: recipe.slug,
        title: recipe.title,
        pod_name: recipe.podName,
        pod_id: pod.id,
        description: recipe.description,
      });
      process.stdout.write(`${recipe.slug}: ${pod.id}\n`);
    }
    writeLivePodMap(results);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

main();
