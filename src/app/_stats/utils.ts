import { cache } from "react";

import { gistConfigClient } from "@/lib/db/gist/client";
import { fetchBetaStartup } from "@/lib/fetchBetaStartup";
import { type StartupConfig } from "@/startup-types";

import { type EnrichedStartup } from "./types";

export const orderAndEnrichStartups = async (startups: StartupConfig[]): Promise<EnrichedStartup[]> =>
  (
    await Promise.all(
      startups.map(async s => {
        const betaStartup = await fetchBetaStartup(s.id);
        return {
          ...s,
          name: betaStartup.name,
          website: betaStartup.stats_url,
        } as EnrichedStartup;
      }),
    )
  ).sort((a, b) => {
    // Sort to have the ones with statsUrl at the beginning
    if (a.statsUrl && !b.statsUrl) return -1;
    if (!a.statsUrl && b.statsUrl) return 1;
    return (a.nameOverride ?? a.name).localeCompare(b.nameOverride ?? b.name);
  });

/**
 * Per-request cached version of getConfig + orderAndEnrichStartups.
 * Deduplicates across layout.tsx and page.tsx within the same render.
 */
export const getOrderedStartups = cache(async () => {
  const { startups } = await gistConfigClient.getConfig();
  return orderAndEnrichStartups(startups);
});
