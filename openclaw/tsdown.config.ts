import { defineConfig } from "tsdown";

const env = {
  NODE_ENV: "production",
};

export default defineConfig([
  {
    entry: "src/index.ts",
    env,
    fixedExtension: false,
    platform: "node",
  },
  {
    entry: "src/entry.ts",
    env,
    fixedExtension: false,
    platform: "node",
  },
  {
    // Ensure this module is bundled as an entry so legacy CLI shims can resolve its exports.
    entry: "src/cli/daemon-cli.ts",
    env,
    fixedExtension: false,
    platform: "node",
  },
  {
    entry: "src/infra/warning-filter.ts",
    env,
    fixedExtension: false,
    platform: "node",
  },
  {
    entry: "src/plugin-sdk/index.ts",
    outDir: "dist/plugin-sdk",
    env,
    fixedExtension: false,
    platform: "node",
  },
  {
    entry: "src/plugin-sdk/account-id.ts",
    outDir: "dist/plugin-sdk",
    env,
    fixedExtension: false,
    platform: "node",
  },
  {
    entry: "src/extensionAPI.ts",
    env,
    fixedExtension: false,
    platform: "node",
  },
  {
    entry: ["src/hooks/bundled/*/handler.ts", "src/hooks/llm-slug-generator.ts"],
    env,
    fixedExtension: false,
    platform: "node",
  },
  {
    entry: "src/agents/skills/workspace.ts",
    outDir: "dist/agents/skills",
    env,
    fixedExtension: false,
    platform: "node",
  },
  {
    entry: "src/telegram/send.ts",
    outDir: "dist/telegram",
    env,
    fixedExtension: false,
    platform: "node",
  },
  {
    entry: "src/web/active-listener.ts",
    outDir: "dist/web",
    env,
    fixedExtension: false,
    platform: "node",
  },
  {
    entry: "src/web/outbound.ts",
    outDir: "dist/web",
    env,
    fixedExtension: false,
    platform: "node",
  },
]);
