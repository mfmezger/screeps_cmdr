const fs = require("node:fs");
const path = require("node:path");
const { ScreepsAPI } = require("screeps-api");

const server = process.env.SCREEPS_SERVER || "main";
const branch = process.env.SCREEPS_BRANCH || "default";
const entryFile = process.env.SCREEPS_ENTRY || "dist/main.js";
const moduleName = process.env.SCREEPS_MODULE || "main";

async function main() {
  const entryPath = path.resolve(process.cwd(), entryFile);

  if (!fs.existsSync(entryPath)) {
    throw new Error(`Build output not found: ${entryPath}. Run npm run build first.`);
  }

  const code = fs.readFileSync(entryPath, "utf8");
  const api = await ScreepsAPI.fromConfig(server);
  const result = await api.code.set(branch, {
    [moduleName]: code
  });

  if (!result || result.ok !== 1) {
    throw new Error(`Screeps upload failed: ${JSON.stringify(result)}`);
  }

  console.log(`Uploaded ${entryFile} as module "${moduleName}" to ${server}/${branch}.`);
}

main().catch(error => {
  console.error(error.message || error);
  process.exitCode = 1;
});
