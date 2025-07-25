import z from "zod";

export interface Stat {
  date: Date;
  /**
   * Valeur numérique de la stat demandée.
   * Mesure de la KPI.
   */
  value: number;
}

export type StatOuput = {
  description?: string;
  stats: Stat[];
};

export interface EnrichedStats {
  description?: string;
  stats: Array<
    Stat & {
      variation: number;
    }
  >;
}

const STAT_DAY_MAX = 180;
const STAT_MONTH_MAX = 24;
const STAT_WEEK_MAX = 52;
const STAT_YEAR_MAX = 3;

z.config(z.locales.fr());
const StatDay = z.object({
  periodicity: z.literal("day"),
  since: z
    .number()
    .min(1)
    .optional()
    .default(STAT_DAY_MAX)
    .refine(since => since <= STAT_DAY_MAX, {
      message: "Pour une périodicité journalière, la période ne peut pas dépasser 6 mois (180 jours).",
    }),
});
const StatMonth = z.object({
  periodicity: z.literal("month"),
  since: z
    .number()
    .min(1)
    .optional()
    .default(STAT_MONTH_MAX)
    .refine(since => since <= STAT_MONTH_MAX, {
      message: "Pour une périodicité mensuelle, la période ne peut pas dépasser 2 ans (24 mois).",
    }),
});
const StatWeek = z.object({
  periodicity: z.literal("week"),
  since: z
    .number()
    .min(1)
    .optional()
    .default(STAT_WEEK_MAX)
    .refine(since => since <= STAT_WEEK_MAX, {
      message: "Pour une périodicité hebdomadaire, la période ne peut pas dépasser 1 an (52 semaines).",
    }),
});
const StatYear = z.object({
  periodicity: z.literal("year"),
  since: z
    .number()
    .min(1)
    .optional()
    .default(STAT_YEAR_MAX)
    .refine(since => since <= STAT_YEAR_MAX, {
      message: "Pour une périodicité annuelle, la période ne peut pas dépasser 3 ans.",
    }),
});

export const statInputSchema = z.discriminatedUnion("periodicity", [StatDay, StatMonth, StatWeek, StatYear]);

export type StatInput = z.input<typeof statInputSchema>;
export type StatPeriodicity = StatInput["periodicity"];
