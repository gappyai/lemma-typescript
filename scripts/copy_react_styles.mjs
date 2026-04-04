import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(rootDir, "src/react/styles.css");
const destinationPath = resolve(rootDir, "dist/react/styles.css");

await mkdir(dirname(destinationPath), { recursive: true });
await copyFile(sourcePath, destinationPath);
