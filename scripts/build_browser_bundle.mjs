import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sdkDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cjsDir = path.join(sdkDir, ".bundle-tmp");
const entryAbsPath = path.join(cjsDir, "browser.js");
const outDir = path.join(sdkDir, "dist", "browser");
const outFile = path.join(outDir, "lemma-client.js");
const publicOutDir = path.join(sdkDir, "public");
const publicOutFile = path.join(publicOutDir, "lemma-client.js");

if (!existsSync(entryAbsPath)) {
  throw new Error(`Bundle entry not found at ${entryAbsPath}. Run 'tsc -p tsconfig.bundle.json' first.`);
}

const modules = new Map();

const toModuleId = (absPath) => `./${path.relative(cjsDir, absPath).replace(/\\/g, "/")}`;

const resolveLocalModule = (fromAbsPath, specifier) => {
  let resolved = path.resolve(path.dirname(fromAbsPath), specifier);
  if (!path.extname(resolved)) {
    resolved += ".js";
  }
  return resolved;
};

const collectModule = (absPath) => {
  if (modules.has(absPath)) {
    return;
  }

  const source = readFileSync(absPath, "utf-8");
  const dependencies = [];

  const rewritten = source.replace(/require\((['"])([^'"]+)\1\)/g, (fullMatch, quote, specifier) => {
    if (!specifier.startsWith(".")) {
      return fullMatch;
    }

    const depAbsPath = resolveLocalModule(absPath, specifier);
    dependencies.push(depAbsPath);
    return `require(${quote}${toModuleId(depAbsPath)}${quote})`;
  });

  modules.set(absPath, rewritten);
  for (const dependency of dependencies) {
    collectModule(dependency);
  }
};

collectModule(entryAbsPath);

const moduleEntries = Array.from(modules.entries())
  .map(([absPath, source]) => {
    const id = toModuleId(absPath);
    return `${JSON.stringify(id)}: function (module, exports, require) {\n${source}\n}`;
  })
  .join(",\n");

const entryModuleId = toModuleId(entryAbsPath);

const bundle = `(() => {
  const modules = {
${moduleEntries}
  };

  const moduleCache = {};
  const requireModule = (id) => {
    if (moduleCache[id]) {
      return moduleCache[id].exports;
    }
    const factory = modules[id];
    if (!factory) {
      throw new Error("Module not found: " + id);
    }
    const module = { exports: {} };
    moduleCache[id] = module;
    factory(module, module.exports, requireModule);
    return module.exports;
  };

  const entry = requireModule(${JSON.stringify(entryModuleId)});
  const globalScope = typeof window !== "undefined" ? window : globalThis;
  globalScope.LemmaClient = entry;
})();
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, bundle, "utf-8");
mkdirSync(publicOutDir, { recursive: true });
writeFileSync(publicOutFile, bundle, "utf-8");
console.log(`Built browser bundle at ${outFile}`);
console.log(`Updated committed browser bundle at ${publicOutFile}`);

rmSync(cjsDir, { recursive: true, force: true });
