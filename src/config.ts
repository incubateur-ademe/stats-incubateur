import { ensureApiEnvVar, ensureNextEnvVar } from "@/utils/os";
import { isTruthy } from "@/utils/string";

export const config = {
  admin: {
    login: ensureApiEnvVar(process.env.ADMIN_LOGIN, ""),
    password: ensureApiEnvVar(process.env.ADMIN_PASSWORD, ""),
  },
  airtable: {
    apiKey: ensureApiEnvVar(process.env.AIRTABLE_API_KEY, ""),
    baseId: ensureApiEnvVar(process.env.AIRTABLE_BASE_ID, ""),
  },
  appVersion: ensureNextEnvVar(process.env.NEXT_PUBLIC_APP_VERSION, "dev"),
  appVersionCommit: ensureNextEnvVar(process.env.NEXT_PUBLIC_APP_VERSION_COMMIT, "unknown"),
  betaGouvUrl: ensureApiEnvVar(process.env.BETA_GOUV_URL, "https://beta.gouv.fr"),
  brand: {
    ministry: ensureNextEnvVar(process.env.NEXT_PUBLIC_BRAND_MINISTRY, "République\nFrançaise"),
    name: "Statistiques Incubateur ADEME",
    operator: {
      enable: ensureNextEnvVar(process.env.NEXT_PUBLIC_BRAND_OPERATOR_ENABLE, isTruthy, true),
      logo: {
        alt: ensureNextEnvVar(process.env.NEXT_PUBLIC_BRAND_OPERATOR_LOGO_ALT, "ADEME"),
        imgUrl: ensureNextEnvVar(process.env.NEXT_PUBLIC_BRAND_OPERATOR_LOGO_URL, "/img/Incubateur-with-bg.png"),
        orientation: ensureNextEnvVar<"horizontal" | "vertical">(
          process.env.NEXT_PUBLIC_BRAND_OPERATOR_LOGO_ORIENTATION,
          "horizontal",
        ),
      },
    },
    tagline: "Statistiques des startups incubés par l'ADEME",
  },
  env: ensureApiEnvVar<"dev" | "prod" | "review" | "staging">(process.env.APP_ENV, "dev"),
  gistConfig: {
    filename: ensureApiEnvVar(process.env.GIST_CONFIG_FILENAME, "stats-incubateur-ademe.config.json"),
    gistId: ensureApiEnvVar(process.env.GIST_CONFIG_ID, ""),
    token: ensureApiEnvVar(process.env.GIST_CONFIG_TOKEN, ""),
  },
  host: ensureNextEnvVar(process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000"),
  maintenance: ensureApiEnvVar(process.env.MAINTENANCE_MODE, isTruthy, false),
  repositoryUrl: ensureNextEnvVar(
    process.env.NEXT_PUBLIC_REPOSITORY_URL,
    "https://github.com/incubateur-ademe/stats-incubateur",
  ),
  get rootDomain() {
    return this.host.replace(/^(https?:\/\/)?(www\.)?/, "");
  },
} as const;
