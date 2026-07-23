import { cache } from "react";

import { gistConfigClient } from "@/lib/db/gist/client";
import { fetchBetaStartup } from "@/lib/fetchBetaStartup";
import {
  type SettingsConfig,
  SettingsConfigSchema,
  type StartupConfig,
  type StartupGroupConfig,
} from "@/startup-types";

import { computeStartupTags } from "./links";
import { type EnrichedStartup } from "./types";

export const orderAndEnrichStartups = async (
  startups: StartupConfig[],
  groups: StartupGroupConfig[],
  settings: SettingsConfig,
): Promise<EnrichedStartup[]> => {
  const enabledStartups = startups.filter(s => s.enabled !== false);
  const indexById = new Map(enabledStartups.map((s, i) => [s.id, i]));

  const results = await Promise.allSettled(
    enabledStartups.map(async s => {
      const betaStartup = s.allowNoBeta ? null : await fetchBetaStartup(s.id);
      return {
        ...s,
        betaNotFound: !betaStartup && !s.allowNoBeta,
        budgetUrl: betaStartup?.budget_url ?? s.budgetUrlOverride,
        impactUrl: betaStartup?.impact_url ?? s.impactUrlOverride,
        name: betaStartup?.name ?? s.nameOverride ?? s.id,
        tags: computeStartupTags(s.groups ?? [], groups),
        website: betaStartup?.stats_url ?? undefined,
      };
    }),
  );

  return results
    .map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      // Fallback pour les rejections (erreur reseau, etc.) - on garde la startup avec un nom de repli
      const s = enabledStartups[i];
      return {
        ...s,
        betaNotFound: !s.allowNoBeta,
        budgetUrl: s.budgetUrlOverride,
        impactUrl: s.impactUrlOverride,
        name: s.nameOverride ?? s.id,
        tags: computeStartupTags(s.groups ?? [], groups),
        website: undefined,
      };
    })
    .sort((a, b) => {
      // Startups non trouvées sur beta.gouv.fr toujours en dernier
      if (a.betaNotFound && !b.betaNotFound) return 1;
      if (!a.betaNotFound && b.betaNotFound) return -1;

      if (settings.defaultOrder === "alpha") {
        return (a.nameOverride ?? a.name).localeCompare(b.nameOverride ?? b.name);
      }
      if (settings.defaultOrder === "config") {
        return (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0);
      }
      // stats-first (defaut): celles avec statsUrl en premier, puis alphabetique
      if (a.statsUrl && !b.statsUrl) return -1;
      if (!a.statsUrl && b.statsUrl) return 1;
      return (a.nameOverride ?? a.name).localeCompare(b.nameOverride ?? b.name);
    });
};

/**
 * Per-request cached version of getConfig + orderAndEnrichStartups.
 * Deduplicates across layout.tsx and page.tsx within the same render.
 * gistConfigClient.getConfig() fait un JSON.parse brut sans validation: settings
 * peut donc etre undefined dans le gist, d'ou le SettingsConfigSchema.parse(settings ?? {}).
 */
export const getStatsBundle = cache(
  async (): Promise<{ groups: StartupGroupConfig[]; settings: SettingsConfig; startups: EnrichedStartup[] }> => {
    try {
      const { groups, settings, startups } = await gistConfigClient.getConfig();
      const parsedSettings = SettingsConfigSchema.parse(settings ?? {});
      const enriched = await orderAndEnrichStartups(startups, groups ?? [], parsedSettings);
      return { groups: groups ?? [], settings: parsedSettings, startups: enriched };
    } catch (error) {
      console.error("[getStatsBundle] Failed to fetch startup config:", error);
      return { groups: [], settings: SettingsConfigSchema.parse({}), startups: [] };
    }
  },
);

export const getOrderedStartups = cache(async (): Promise<EnrichedStartup[]> => (await getStatsBundle()).startups);
