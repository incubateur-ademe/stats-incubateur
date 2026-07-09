import { cache } from "react";

import { gistConfigClient } from "@/lib/db/gist/client";
import { fetchBetaStartup } from "@/lib/fetchBetaStartup";
import { type StartupConfig } from "@/startup-types";

import { type EnrichedStartup } from "./types";

export const orderAndEnrichStartups = async (startups: StartupConfig[]): Promise<EnrichedStartup[]> => {
  const enabledStartups = startups.filter(s => s.enabled !== false);
  const results = await Promise.allSettled(
    enabledStartups.map(async s => {
      const betaStartup = await fetchBetaStartup(s.id);
      return {
        ...s,
        betaNotFound: !betaStartup,
        name: betaStartup?.name ?? s.nameOverride ?? s.id,
        website: betaStartup?.stats_url,
      } as EnrichedStartup;
    }),
  );

  return results
    .map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      // Fallback pour les rejections (erreur reseau, etc.) - on garde la startup avec un nom de repli
      const s = enabledStartups[i];
      return { ...s, betaNotFound: true, name: s.nameOverride ?? s.id, website: undefined };
    })
    .sort((a, b) => {
      // Startups non trouvées sur beta.gouv.fr en dernier
      if (a.betaNotFound && !b.betaNotFound) return 1;
      if (!a.betaNotFound && b.betaNotFound) return -1;
      // Puis celles avec statsUrl en premier
      if (a.statsUrl && !b.statsUrl) return -1;
      if (!a.statsUrl && b.statsUrl) return 1;
      return (a.nameOverride ?? a.name).localeCompare(b.nameOverride ?? b.name);
    });
};

/**
 * Per-request cached version of getConfig + orderAndEnrichStartups.
 * Deduplicates across layout.tsx and page.tsx within the same render.
 */
export const getOrderedStartups = cache(async (): Promise<EnrichedStartup[]> => {
  try {
    const { startups } = await gistConfigClient.getConfig();
    return orderAndEnrichStartups(startups);
  } catch (error) {
    console.error("[getOrderedStartups] Failed to fetch startup config:", error);
    return [];
  }
});
