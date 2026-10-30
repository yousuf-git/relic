import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Declare your Neon services here
  auth: true,
  dataApi: true,
  buckets: {
    media: { access: "private" },
  },
  functions: {
    vault: { name: "Relic vault", source: "./functions/vault/index.ts" },
  },
  triggers: {
    "nightly-purge": { type: "schedule", function: "vault", cron: "30 21 * * *", functionPath: "/cron/purge" },
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: "7d" };
    }
    // Existing branch: no changes
    return {};
  },
});
