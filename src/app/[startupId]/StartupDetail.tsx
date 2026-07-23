"use client";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Select from "@codegouvfr/react-dsfr/Select";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getISOWeek, getISOWeekYear } from "date-fns";
import dynamic from "next/dynamic";
import { useState } from "react";

import { Loader } from "@/components/utils/Loader";
import { Text } from "@/dsfr/base/Typography";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import { fetchStats } from "../_stats/action";
import { type StatInput } from "../_stats/types";

const MuiBarLineChart = dynamic(() => import("@/components/charts/MuiBarLineChart").then(m => m.MuiBarLineChart), {
  ssr: false,
});

// ------------------ utils & const ------------------

const DEFAULT_PERIODICITY: StatInput["periodicity"] = "month";

const SINCE_OPTIONS: Record<StatInput["periodicity"], Array<{ label: string; value: number }>> = {
  day: [
    { label: "1 jour", value: 1 },
    { label: "1 semaine", value: 7 },
    { label: "1 mois", value: 30 },
    { label: "3 mois", value: 90 },
    { label: "6 mois", value: 180 },
  ],
  month: [
    { label: "1 mois", value: 1 },
    { label: "6 mois", value: 6 },
    { label: "1 an", value: 12 },
    { label: "2 ans", value: 24 },
  ],
  week: [
    { label: "1 semaine", value: 1 },
    { label: "1 mois", value: 4 },
    { label: "3 mois", value: 12 },
    { label: "6 mois", value: 24 },
    { label: "1 an", value: 52 },
  ],
  year: [
    { label: "1 an", value: 1 },
    { label: "2 ans", value: 2 },
    { label: "3 ans", value: 3 },
  ],
};

const TICK_INTERVALS: Record<StatInput["periodicity"], number> = {
  day: 3,
  month: 2,
  week: 2,
  year: 1,
};

const FORMATERS = {
  day: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }),
  month: new Intl.DateTimeFormat("fr-FR", { month: "2-digit", year: "numeric" }),
  week: new Intl.DateTimeFormat("fr-FR"),
  year: new Intl.DateTimeFormat("fr-FR", { year: "numeric" }),
} as const;

const dateFormatter = (date: Date, periodicity: keyof typeof FORMATERS = DEFAULT_PERIODICITY) => {
  if (periodicity === "week") {
    const week = getISOWeek(date);
    const year = getISOWeekYear(date);
    return `Semaine ${week} (${year})`;
  }
  return FORMATERS[periodicity].format(date);
};

// ------------------ component ------------------

interface StartupDetailProps {
  name: string;
  showTrend: boolean;
  startupId: string;
}

export function StartupDetail({ name, showTrend, startupId }: StartupDetailProps) {
  const [periodicity, setPeriodicity] = useState<StatInput["periodicity"]>(DEFAULT_PERIODICITY);
  const [since, setSince] = useState<number | undefined>(undefined);

  const debouncedInput = useDebouncedValue<StatInput>({ periodicity, since }, 300);

  const query = useQuery({
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await fetchStats(startupId, debouncedInput);
      if (!res.ok) throw new Error(res.error ?? "Erreur lors de la recuperation des donnees.");
      return res.data;
    },
    queryKey: ["stats", startupId, debouncedInput.periodicity, debouncedInput.since ?? null],
  });

  const rawErrorMsg = query.error?.message ?? "";
  const rawIdx = rawErrorMsg.indexOf("\n---RAW---\n");
  const errorMsg = rawIdx === -1 ? rawErrorMsg : rawErrorMsg.slice(0, rawIdx);
  const rawData = rawIdx === -1 ? "" : rawErrorMsg.slice(rawIdx + "\n---RAW---\n".length);

  return (
    <div className="fr-mt-4w">
      <div className="flex gap-[2rem] flex-wrap fr-mb-4w">
        <Select
          nativeSelectProps={{
            onChange: e => {
              const newPeriodicity = e.target.value as StatInput["periodicity"];
              setPeriodicity(newPeriodicity);
              setSince(undefined);
            },
            value: periodicity,
          }}
          label="Periode"
        >
          <option value="day">Journaliere</option>
          <option value="week">Hebdomadaire</option>
          <option value="month">Mensuelle</option>
          <option value="year">Annuelle</option>
        </Select>

        <Select
          nativeSelectProps={{
            onChange: e => {
              const val = e.target.value;
              setSince(val ? parseInt(val, 10) : undefined);
            },
            value: since ?? "",
          }}
          label="Depuis"
        >
          <option disabled>Selectionnez une periode</option>
          <option value="">Toujours</option>
          {SINCE_OPTIONS[periodicity].map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div style={{ minHeight: "600px" }}>
        {query.isLoading || query.isFetching ? (
          <div className="flex items-center justify-center" style={{ height: "600px" }}>
            <Loader loading size="3em" />
          </div>
        ) : query.isError ? (
          <div>
            <Text variant="xl" className="fr-text-default--error">
              {errorMsg}
            </Text>
            {rawData && (
              <Accordion label="Donnees brutes de la reponse">
                <pre style={{ fontSize: "0.75rem", maxHeight: "20rem", overflow: "auto", whiteSpace: "pre-wrap" }}>
                  {rawData}
                </pre>
              </Accordion>
            )}
          </div>
        ) : query.data?.stats?.length ? (
          <MuiBarLineChart
            barData={query.data.stats.map(stat => stat.value)}
            lineData={query.data.stats.map(stat => stat.variation)}
            nameLine="Variation (%)"
            nameBar={query.data.description ?? `${name} - North Star metric`}
            x={query.data.stats.map(stat => dateFormatter(stat.date, periodicity))}
            xTickInterval={TICK_INTERVALS[periodicity]}
            xName="Date"
            barId="detail-north-star"
            lineId="detail-variation"
            barAxisWidth={100}
            lineValueFormatter={value => `${value}%`}
            showLine={showTrend}
            height={600}
          />
        ) : (
          <Text variant="xl">Pas de donnees.</Text>
        )}
      </div>
    </div>
  );
}
