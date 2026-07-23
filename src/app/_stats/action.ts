"use server";

import z from "zod";

import { gistConfigClient } from "@/lib/db/gist/client";
import { type ServerActionResponse } from "@/utils/next";

import { type EnrichedStats, type Stat, type StatInput, statInputSchema, type StatOuput } from "./types";

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
    console.warn(`URL de stats: ${url.toString()}`);
    return {
      error: `Erreur lors de la récupération des stats pour ${startupId}: ${response.statusText}`,
      ok: false,
    };
  }

  const rawText = await response.text();

  let json: unknown;
  try {
    json = JSON.parse(rawText, function (key, value) {
      if (key == "date") {
        if (typeof value === "string") {
          return new Date(Date.parse(value));
        } else if (typeof value === "number") {
          // Certaines APIs renvoient des timestamps en secondes, d'autres en millisecondes.
          // Seuil 1e12: en dessous on suppose des secondes (a multiplier), au-dessus des ms.
          return new Date(value < 1e12 ? value * 1000 : value);
        } else {
          return null;
        }
      }
      return value as unknown;
    });
  } catch {
    return {
      error: `Réponse non-JSON pour ${startupId}.\n---RAW---\n${rawText.slice(0, 2000)}`,
      ok: false,
    };
  }

  const parsed2 = json as Partial<StatOuput> | null;
  if (!parsed2 || !Array.isArray(parsed2.stats)) {
    return {
      error: `Données malformées pour ${startupId} : le champ "stats" est absent ou invalide.\n---RAW---\n${JSON.stringify(json, null, 2).slice(0, 2000)}`,
      ok: false,
    };
  }

  // Filtrer les entries avec des dates invalides (null du JSON reviver)
  const validStats = parsed2.stats
    .filter((s): s is Stat => s.date instanceof Date && !isNaN(s.date.getTime()))
    // Certaines APIs renvoient les points dans le desordre (ou anti-chronologiques):
    // on force l'ordre chronologique, dont depend le calcul de variation ci-dessous.
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // set variation for each stat
  const stats = validStats.map((stat, index) => {
    const previousValue = index > 0 ? validStats[index - 1].value : null;
    const variation =
      previousValue !== null && previousValue !== 0 ? ((stat.value - previousValue) / previousValue) * 100 : 0;

    return {
      ...stat,
      variation,
    };
  });

  return {
    data: {
      description: parsed2.description,
      stats,
    },
    ok: true,
  };
};
