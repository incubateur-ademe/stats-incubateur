import { fr } from "@codegouvfr/react-dsfr";
import { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Card from "@codegouvfr/react-dsfr/Card";
import Tooltip from "@codegouvfr/react-dsfr/Tooltip";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getISOWeek, getISOWeekYear } from "date-fns";
import dynamic from "next/dynamic";

import { ClientAnimate } from "@/components/utils/ClientAnimate";
import { ClientOnly, useHasMounted } from "@/components/utils/ClientOnly";
import { Loader } from "@/components/utils/Loader";
import { Icon } from "@/dsfr";
import { Text } from "@/dsfr/base/Typography";

import { fetchStats } from "./action";
import styles from "./StartupCard.module.scss";
import { type EnrichedStartup, type StatInput } from "./types";

const MuiBarLineChart = dynamic(() => import("@/components/charts/MuiBarLineChart").then(m => m.MuiBarLineChart), {
  ssr: false,
});

// ------------------ utils & const ------------------

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

const DEFAULT_PERIODICITY: StatInput["periodicity"] = "month";

const dateFormatter = (date: Date, periodicity: keyof typeof FORMATERS = DEFAULT_PERIODICITY) => {
  if (periodicity === "week") {
    const week = getISOWeek(date);
    const year = getISOWeekYear(date);
    return `Semaine ${week} (${year})`;
  }
  return FORMATERS[periodicity].format(date);
};

interface StartupCardProps {
  input: StatInput;
  startup: EnrichedStartup;
}

export function StartupCard({ input, startup }: StartupCardProps) {
  const mounted = useHasMounted();

  const query = useQuery({
    // garde les données précédentes pendant le refetch quand l'input change
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await fetchStats(startup.id, input);
      if (!res.ok) throw new Error(res.error || "Erreur lors de la récupération des données.");
      return res.data;
    },
    queryKey: ["stats", startup.id, input.periodicity, input.since ?? null],
  });

  const periodicity = input.periodicity;
  const errorMsg = query.error?.message ?? "";

  return (
    <Card
      title={
        <div className="flex justify-between">
          <div className="flex gap-[1rem]">{startup.name}</div>
          {!!errorMsg && (
            <ClientOnly>
              <Tooltip title={errorMsg}>
                <Icon icon="fr-icon-error-warning-fill" size="xl" color="text-default-error" />
              </Tooltip>
            </ClientOnly>
          )}
        </div>
      }
      titleAs="h3"
      shadow
      horizontal
      size="large"
      footer={
        <ButtonsGroup
          alignment="right"
          buttonsEquisized
          inlineLayoutWhen="always"
          isReverseOrder
          buttons={[
            {
              children: "Détails",
              linkProps: { href: `/${startup.id}` },
              priority: "secondary",
            },
            ...((startup.website
              ? [
                  {
                    children: "Site",
                    linkProps: { href: startup.website, target: "_blank" },
                    priority: "tertiary",
                  },
                ]
              : []) as ButtonProps[]),
          ]}
        />
      }
      desc={
        <ClientAnimate as="span" className={styles["startup-card--body"]}>
          {!mounted || query.isLoading || query.isFetching || query.isRefetching ? (
            <Loader loading size="2em" />
          ) : query.isError ? (
            <Text inline color={fr.colors.decisions.text.default.error.default}>
              {errorMsg}
            </Text>
          ) : query.data?.stats?.length ? (
            <MuiBarLineChart
              barData={query.data.stats.map(stat => stat.value)}
              lineData={query.data.stats.map(stat => stat.variation)}
              nameLine="Variation (%)"
              nameBar={query.data.description ?? "North Star metric"}
              x={query.data.stats.map(stat => dateFormatter(stat.date, periodicity))}
              xTickInterval={TICK_INTERVALS[periodicity]}
              xName="Date"
              barId="north-star"
              lineId="variation"
              barAxisWidth={100}
              lineValueFormatter={value => `${value}%`}
            />
          ) : (
            <Text inline variant="xl">
              Pas de données.
            </Text>
          )}
        </ClientAnimate>
      }
    />
  );
}
