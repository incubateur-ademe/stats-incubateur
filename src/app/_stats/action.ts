"use server";

import z from "zod";

import { gistConfigClient } from "@/lib/db/gist/client";
import { type ServerActionResponse } from "@/utils/next";

import { type EnrichedStats, type StatInput, statInputSchema, type StatOuput } from "./types";

export const fetchStats = async (startupId: string, input: StatInput): Promise<ServerActionResponse<EnrichedStats>> => {
  const { startups } = await gistConfigClient.getConfig();
  const startup = startups.find(s => s.id === startupId);
  if (!startup) {
    return {
      error: `La startup ${startupId} n'existe pas.`,
      ok: false,
    };
  }

  const parsed = statInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: `Paramètres invalides: ${z.prettifyError(parsed.error)}`,
      ok: false,
    };
  }

  const { periodicity, since = 0 } = parsed.data;

  if (!startup.statsUrl) {
    console.warn(`La startup ${startupId} n'a pas d'URL de stats définie.`);
    return {
      data: {
        description: "",
        stats: [],
      },
      ok: true,
    };
  }

  const url = new URL(startup.statsUrl);
  url.searchParams.set("periodicity", periodicity);
  if (since > 0) {
    url.searchParams.set("since", since.toString());
  }
  const response = await fetch(url, {
    next: {
      revalidate: 60 * 60 * 8, // revalidate every 8 hours
    },
  });

  if (!response.ok) {
    console.warn(`Erreur lors de la récupération des stats pour ${startupId}:`, response.statusText);
    return {
      error: `Erreur lors de la récupération des stats pour ${startupId}: ${response.statusText}`,
      ok: false,
    };
  }

  const json = JSON.parse(await response.text(), function (key, value) {
    if (key == "date") {
      if (typeof value === "string") {
        return new Date(Date.parse(value));
      } else if (typeof value === "number") {
        return new Date(value * 1000);
      } else {
        return null;
      }
    }
    return value as unknown;
  }) as StatOuput;

  // set variation for each stat
  const stats = json.stats.map((stat, index) => {
    const previousValue = index > 0 ? json.stats[index - 1].value : null;
    const variation =
      previousValue !== null && previousValue !== 0 ? ((stat.value - previousValue) / previousValue) * 100 : 0;

    return {
      ...stat,
      variation,
    };
  });

  return {
    data: {
      description: json.description,
      stats,
    },
    ok: true,
  };
};
