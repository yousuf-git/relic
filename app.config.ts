import type { ConfigContext, ExpoConfig } from "expo/config";

// Only public endpoint URLs reach the app bundle; secrets in .env never do.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  extra: {
    ...config.extra,
    authUrl: process.env.NEON_AUTH_BASE_URL,
    dataApiUrl: process.env.NEON_DATA_API_URL,
    vaultUrl: process.env.NEON_FUNCTION_VAULT_BASE_URL,
    authOrigin: process.env.RELIC_AUTH_ORIGIN ?? "https://yousuf-git.github.io",
  },
});
