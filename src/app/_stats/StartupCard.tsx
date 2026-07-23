import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Card from "@codegouvfr/react-dsfr/Card";
import Tag from "@codegouvfr/react-dsfr/Tag";
import Tooltip from "@codegouvfr/react-dsfr/Tooltip";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getISOWeek, getISOWeekYear } from "date-fns";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

import { ClientAnimate } from "@/components/utils/ClientAnimate";
import { ClientOnly, useHasMounted } from "@/components/utils/ClientOnly";
import { Loader } from "@/components/utils/Loader";
import { Icon } from "@/dsfr";
import { Text } from "@/dsfr/base/Typography";

import { fetchStats } from "./action";
import { groupHref } from "./links";
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

/** Bouton de lien externe: cliquable si l'URL existe (beta ou surcharge), desactive sinon. */
const externalButton = (label: string, url: string | undefined): ButtonProps =>
  url
    ? {
        children: label,
        linkProps: { href: url, target: "_blank", rel: "noopener noreferrer" },
        priority: "tertiary",
      }
    : { children: label, disabled: true, priority: "tertiary" };

interface StartupCardProps {
  input: StatInput;
  onQuerySettled?: () => void;
  showTrend: boolean;
  startup: EnrichedStartup;
}

export function StartupCard({ input, onQuerySettled, showTrend, startup }: StartupCardProps) {
  const mounted = useHasMounted();

  const query = useQuery({
    // Ne pas fetch si la startup n'existe pas sur beta.gouv.fr
    enabled: !startup.betaNotFound,
    // garde les données précédentes pendant le refetch quand l'input change
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await fetchStats(startup.id, input);
      if (!res.ok) throw new Error(res.error ?? "Erreur lors de la récupération des données.");
      return res.data;
    },
    queryKey: ["stats", startup.id, input.periodicity, input.since ?? null],
  });

  // Notifier le parent quand la query se termine pour re-trier les cards
  const settled = !!startup.betaNotFound || (!query.isLoading && !query.isFetching);
  const prevSettled = useRef(false);
  useEffect(() => {
    if (settled && !prevSettled.current) {
      onQuerySettled?.();
    }
    prevSettled.current = settled;
  }, [settled, onQuerySettled]);

  const periodicity = input.periodicity;
  const rawErrorMsg = query.error?.message ?? "";

  // Sépare le message d'erreur du raw data (délimiteur ---RAW---)
  const rawIdx = rawErrorMsg.indexOf("\n---RAW---\n");
  const errorMsg = rawIdx === -1 ? rawErrorMsg : rawErrorMsg.slice(0, rawIdx);
  const rawData = rawIdx === -1 ? "" : rawErrorMsg.slice(rawIdx + "\n---RAW---\n".length);

  const cardContent = (
    <Card
      title={
        <div className="flex justify-between">
          <div className="flex flex-col gap-[0.5rem]">
            <div className="flex gap-[1rem]">
              {startup.name}
              {startup.betaNotFound && (
                <ClientOnly>
                  <Tooltip
                    title={`Startup "${startup.id}" introuvable sur beta.gouv.fr - l'identifiant a peut-être changé`}
                  >
                    <Icon icon="fr-icon-warning-fill" size="xl" color="text-mention-grey" />
                  </Tooltip>
                </ClientOnly>
              )}
            </div>
            {startup.tags.length > 0 && (
              <div className="flex flex-wrap gap-[0.25rem]">
                {startup.tags.map(tag => (
                  <Tag key={tag.id} small linkProps={{ href: groupHref(tag.id) }}>
                    {tag.name}
                  </Tag>
                ))}
              </div>
            )}
          </div>
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
      end={
        <ClientAnimate className={styles["startup-card--body"]}>
          {startup.betaNotFound ? (
            <Text color={fr.colors.decisions.text.mention.grey.default}>Startup introuvable sur beta.gouv.fr</Text>
          ) : !mounted || query.isLoading || query.isFetching || query.isRefetching ? (
            <Loader loading size="2em" />
          ) : query.isError ? (
            <div>
              <Text color={fr.colors.decisions.text.default.error.default}>{errorMsg}</Text>
              {rawData && (
                <Accordion label="Données brutes de la réponse">
                  <pre style={{ fontSize: "0.75rem", maxHeight: "12rem", overflow: "auto", whiteSpace: "pre-wrap" }}>
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
              nameBar={query.data.description ?? "North Star metric"}
              x={query.data.stats.map(stat => dateFormatter(stat.date, periodicity))}
              xTickInterval={TICK_INTERVALS[periodicity]}
              xName="Date"
              barId="north-star"
              lineId="variation"
              barAxisWidth={100}
              lineValueFormatter={value => `${value}%`}
              showLine={showTrend}
            />
          ) : (
            <Text variant="xl">Pas de données.</Text>
          )}
        </ClientAnimate>
      }
      footer={
        <ButtonsGroup
          alignment="right"
          buttonsSize="small"
          inlineLayoutWhen="always"
          isReverseOrder
          buttons={
            [
              {
                children: "Détails",
                linkProps: { href: `/${startup.id}` },
                priority: "secondary",
              },
              externalButton("Stats", startup.website),
              externalButton("Budget", startup.budgetUrl),
              externalButton("Mesure d'impact", startup.impactUrl),
            ] as [ButtonProps, ...ButtonProps[]]
          }
        />
      }
    />
  );

  if (startup.betaNotFound) {
    return <div className={styles["startup-card--not-found"]}>{cardContent}</div>;
  }

  return cardContent;
}
