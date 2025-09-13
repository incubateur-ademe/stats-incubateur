import { ensureApiEnvVar, ensureNextEnvVar } from "@/utils/os";
import { isTruthy } from "@/utils/string";

import { type StartupConfig } from "./startup-types";

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
} as const;

// const mockServer = "https://escargot-notable-lamb.ngrok-free.app";
const mockServer = "http://localhost:8000";

// TODO: transform this into a json file
export const STARTUPS: StartupConfig[] = [
  // {
  //   id: "budget-incubateur",
  //   name: "Budget (interne)",
  //   statsUrl: `${mockServer}/budget-incubateur/api/stats`,
  // },
  // {
  //   id: "pages-legales-faciles",
  //   name: "Pages Légales Faciles (interne)",
  //   statsUrl: `${mockServer}/pages-legales-faciles/api/stats`,
  // },
  // {
  //   id: "roadmaps-faciles",
  //   name: "Roadmaps Faciles (interne)",
  //   statsUrl: `${mockServer}/roadmaps-faciles/api/stats`,
  // },
  {
    id: "benefriches",
    name: "Bénéfriches",
    // statsUrl: `${mockServer}/benefriches/api/stats`,
    website: "https://benefriches.fr/statistiques",
    groups: ["friches", "b2b"],
  },
  {
    id: "impact.co2",
    name: "Impact CO2",
    // statsUrl: `${mockServer}/impact-co2/api/stats`,
    statsUrl: `https://impactco2.fr/api/stats`,
    website: "https://impactco2.fr/stats",
    groups: ["citoyens", "b2b2c", "entreprises"],
  },
  {
    id: "nosgestesclimat",
    name: "Nos Gestes Climat",
    // statsUrl: `${mockServer}/nos-gestes-climat/api/stats`,
    // statsUrl: "https://server.nosgestesclimat.fr/api/stats",
    statsUrl: "https://server.preprod.nosgestesclimat.fr/stats/v1/northstar",
    website: "https://nosgestesclimat.fr/stats",
    groups: ["citoyens", "b2c"],
  },
  {
    id: "chauffage-urbain",
    name: "France Chaleur Urbaine",
    // statsUrl: `${mockServer}/france-chaleur-urbaine/api/stats`,
    website: "https://france-chaleur-urbaine.beta.gouv.fr/stats",
    groups: ["energie-logement", "b2b"],
  },
  {
    id: "plusfraichemaville",
    name: "Plus Fraîche ma Ville",
    // statsUrl: `${mockServer}/plus-fraiche-ma-ville/api/stats`,
    statsUrl: "https://plusfraichemaville.fr/api/stats",
    website: "https://plusfraichemaville.fr/stats",
    groups: ["collectivites"],
  },
  {
    id: "territoires-en-transitions",
    name: "Territoires en Transitions",
    // statsUrl: `${mockServer}/territoires-en-transitions/api/stats`,
    website: "https://www.territoiresentransitions.fr/stats",
    groups: ["collectivites"],
  },
  {
    id: "transition-ecologique-des-entreprises",
    name: "Transition Écologique des Entreprises",
    // statsUrl: `${mockServer}/transition-ecologique-des-entreprises/api/stats`,
    website: "https://mission-transition-ecologique.beta.gouv.fr/stats",
    groups: ["entreprises", "b2b"],
  },
  {
    id: "carte-verte",
    name: "Carte Verte",
    // statsUrl: `${mockServer}/carte-verte/api/stats`,
    website: "https://carte-verte.beta.gouv.fr/stats",
    groups: ["consomation", "b2c"],
  },
  {
    id: "longuevieauxobjets",
    name: "Longue Vie aux Objets",
    // statsUrl: `${mockServer}/longue-vie-aux-objets/api/stats`,
    website: "https://longuevieauxobjets.ademe.fr/stats/",
    groups: ["consomation", "b2c"],
  },
  {
    id: "mutafriches",
    name: "Mutafriches",
    // statsUrl: `${mockServer}/mutafriches/api/stats`,
    groups: ["friches", "b2b"],
  },
  {
    id: "pacoupa",
    name: "Pacoupa",
    // statsUrl: `${mockServer}/pacoupa/api/stats`,
    statsUrl: "https://pacoupa.ademe.fr/api/stats",
    website: "https://pacoupa.ademe.fr/stats",
    groups: ["energie-logement", "b2c"],
  },
  {
    id: "tacct",
    name: "Facili-TACCT",
    // statsUrl: `${mockServer}/facili-tacct/api/stats`,
    statsUrl: "http://facili-tacct.beta.gouv.fr/api/stats",
    website: "http://facili-tacct.beta.gouv.fr/stats",
    groups: ["collectivites", "adaptation", "b2b"],
  },
  {
    id: "plus-frais-au-travail",
    name: "Plus Frais au Travail",
    // statsUrl: `${mockServer}/plus-frais-au-travail/api/stats`,
    website: "https://plusfraisautravail.beta.gouv.fr/stats",
    groups: ["entreprises", "b2b"],
  },
  {
    id: "ecobalyse",
    name: "Ecobalyse",
    // statsUrl: `${mockServer}/plus-frais-au-travail/api/stats`,
    website: "https://ecobalyse.beta.gouv.fr/stats",
    groups: ["consomation", "b2b2c"],
  },
];
