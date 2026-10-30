import Constants from "expo-constants";

type Extra = { authUrl?: string; dataApiUrl?: string; vaultUrl?: string; authOrigin?: string };
const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing ${name} in app config; run \`neon env pull\` before building.`);
  return value.replace(/\/$/, "");
}

export const config = {
  authUrl: required(extra.authUrl, "NEON_AUTH_BASE_URL"),
  dataApiUrl: required(extra.dataApiUrl, "NEON_DATA_API_URL"),
  vaultUrl: required(extra.vaultUrl, "NEON_FUNCTION_VAULT_BASE_URL"),
  authOrigin: required(extra.authOrigin, "RELIC_AUTH_ORIGIN"),
};
