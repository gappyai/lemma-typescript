#!/usr/bin/env node

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.argv[2];

if (!rootDir) {
  console.error("Usage: patch_generated_imports.mjs <generated-ts-root>");
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (full.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

function patchImports(source) {
  return source.replace(
    /from\s+['"](\.{1,2}\/[^'"\n]+)['"]/g,
    (match, specifier) => {
      if (specifier.endsWith(".js") || specifier.endsWith(".json")) {
        return match;
      }
      return match.replace(specifier, `${specifier}.js`);
    },
  );
}

function patchKnownGeneratorIssues(source, filePath) {
  let patched = source;

  if (filePath.endsWith("services/OrganizationsService.ts")) {
    patched = patched.replace(
      "import type { OrganizationInvitationStatus } from '../models/OrganizationInvitationStatus.js';",
      "import { OrganizationInvitationStatus } from '../models/OrganizationInvitationStatus.js';",
    );
    patched = patched.replaceAll(
      "status: OrganizationInvitationStatus = 'PENDING'",
      "status: OrganizationInvitationStatus = OrganizationInvitationStatus.PENDING",
    );
  }

  return patched;
}

let updated = 0;
for (const file of walk(rootDir)) {
  const before = readFileSync(file, "utf8");
  const after = patchKnownGeneratorIssues(patchImports(before), file);
  if (before !== after) {
    writeFileSync(file, after, "utf8");
    updated += 1;
  }
}

console.log(`Patched ESM imports in ${updated} generated files`);
