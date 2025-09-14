import { ensureApiEnvVar, ensureNextEnvVar } from "@/utils/os";
import { isTruthy } from "@/utils/string";

export const config = {
  brand: {
    name: "Statistiques Incubateur ADEME",
    tagline: "Statistiques des startups incubés par l'ADEME",
    ministry: ensureNextEnvVar(process.env.NEXT_PUBLIC_BRAND_MINISTRY, "République\nFrançaise"),
    operator: {
      enable: ensureNextEnvVar(process.env.NEXT_PUBLIC_BRAND_OPERATOR_ENABLE, isTruthy, true),
      logo: {
        imgUrl: ensureNextEnvVar(process.env.NEXT_PUBLIC_BRAND_OPERATOR_LOGO_URL, "/img/Incubateur-with-bg.png"),
        alt: ensureNextEnvVar(process.env.NEXT_PUBLIC_BRAND_OPERATOR_LOGO_ALT, "ADEME"),
        orientation: ensureNextEnvVar<"horizontal" | "vertical">(
          process.env.NEXT_PUBLIC_BRAND_OPERATOR_LOGO_ORIENTATION,
          "horizontal",
        ),
      },
    },
  },
  env: ensureApiEnvVar<"dev" | "prod" | "review" | "staging">(process.env.APP_ENV, "dev"),
  maintenance: ensureApiEnvVar(process.env.MAINTENANCE_MODE, isTruthy, false),
  host: ensureNextEnvVar(process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000"),
  get rootDomain() {
    return this.host.replace(/^(https?:\/\/)?(www\.)?/, "");
  },
  appVersion: ensureNextEnvVar(process.env.NEXT_PUBLIC_APP_VERSION, "dev"),
  appVersionCommit: ensureNextEnvVar(process.env.NEXT_PUBLIC_APP_VERSION_COMMIT, "unknown"),
  repositoryUrl: ensureNextEnvVar(
    process.env.NEXT_PUBLIC_REPOSITORY_URL,
    "https://github.com/incubateur-ademe/stats-incubateur",
  ),
  airtable: {
    apiKey: ensureApiEnvVar(process.env.AIRTABLE_API_KEY, ""),
    baseId: ensureApiEnvVar(process.env.AIRTABLE_BASE_ID, ""),
  },
  gistConfig: {
    token: ensureApiEnvVar(process.env.GIST_CONFIG_TOKEN, ""),
    gistId: ensureApiEnvVar(process.env.GIST_CONFIG_ID, ""),
    filename: ensureApiEnvVar(process.env.GIST_CONFIG_FILENAME, "stats-incubateur-ademe.config.json"),
  },
  betaGouvUrl: ensureApiEnvVar(process.env.BETA_GOUV_URL, "https://beta.gouv.fr"),
} as const;
