"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Card from "@codegouvfr/react-dsfr/Card";
import Select from "@codegouvfr/react-dsfr/Select";
import Tooltip from "@codegouvfr/react-dsfr/Tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import { getISOWeek, getISOWeekYear } from "date-fns";
import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

import { MuiBarLineChart } from "@/components/charts/MuiBarLineChart";
import { ClientOnly } from "@/components/utils/ClientOnly";
import { Loader } from "@/components/utils/Loader";
import { Grid, GridCol, Icon } from "@/dsfr";
import { Text } from "@/dsfr/base/Typography";
import { type StartupConfig } from "@/startup-types";

import { fetchStats } from "./action";
import styles from "./GlobalForm.module.scss";
import { type EnrichedStats, type StatInput, statInputSchema } from "./types";

interface StartupConfigWihData extends StartupConfig {
  data?: EnrichedStats;
}

interface GlobalFormProps {
  startups: StartupConfig[];
}

const FORMATERS = {
  day: new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }),
  month: new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "2-digit",
  }),
  week: new Intl.DateTimeFormat("fr-FR"),
  year: new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
  }),
};

const DEFAULT_PERIODICITY: StatInput["periodicity"] = "month";

const dateFormatter = (date: Date, periodicity: keyof typeof FORMATERS = DEFAULT_PERIODICITY) => {
  if (periodicity === "week") {
    const week = getISOWeek(date);
    const year = getISOWeekYear(date);
    return `Semaine ${week} (${year})`;
  }
  return FORMATERS[periodicity].format(date);
};

z.config(z.locales.fr());
const formSchema = statInputSchema;
type FormType = StatInput;

const SINCE_OPTIONS: Record<FormType["periodicity"], Array<{ label: string; value: number }>> = {
  day: [
    { value: 1, label: "1 jour" },
    { value: 7, label: "1 semaine" },
    { value: 30, label: "1 mois" },
    { value: 90, label: "3 mois" },
    { value: 180, label: "6 mois" },
  ],
  month: [
    { value: 1, label: "1 mois" },
    { value: 6, label: "6 mois" },
    { value: 12, label: "1 an" },
    { value: 24, label: "2 ans" },
  ],
  week: [
    { value: 1, label: "1 semaine" },
    { value: 4, label: "1 mois" },
    { value: 12, label: "3 mois" },
    { value: 24, label: "6 mois" },
    { value: 52, label: "1 an" },
  ],
  year: [
    { value: 1, label: "1 an" },
    { value: 2, label: "2 ans" },
    { value: 3, label: "3 ans" },
  ],
};

const TICK_INTERVALS: Record<FormType["periodicity"], number> = {
  day: 3,
  month: 2,
  week: 2,
  year: 1,
};

export const GlobalForm = ({ startups }: GlobalFormProps) => {
  const [startupWithData, setStartupWithData] = useState<StartupConfigWihData[]>(startups);
  const [startupLoadings, setStartupLoadings] = useState<boolean[]>(Array(startups.length).fill(true));
  const [startupErrors, setStartupErrors] = useState<string[]>(Array(startups.length).fill(""));

  const allStartupIds = useMemo(() => startups.map(s => s.id), [startups]);

  const loadStartupData = useCallback(
    async (startup: StartupConfigWihData, index: number, input: StatInput): Promise<StartupConfigWihData> => {
      console.log(`Loading data for startup: ${startup.id}`);

      try {
        const response = await fetchStats(startup.id, input);
        if (!response.ok) {
          console.warn(`Error fetching stats for ${startup.id}:`, response.error);
          setStartupErrors(prev => {
            const newErrors = [...prev];
            newErrors[index] = response.error || "Erreur lors de la récupération des données.";
            return newErrors;
          });
          return { ...startup };
        }

        setStartupErrors(prev => {
          const newErrors = [...prev];
          newErrors[index] = "";
          return newErrors;
        });

        return { ...startup, data: response.data };
      } catch (error) {
        console.warn(`Error fetching stats for ${startup.id}:`, error);
        setStartupErrors(prev => {
          const newErrors = [...prev];
          newErrors[index] = "Erreur lors de la récupération des données.";
          return newErrors;
        });
        return { ...startup };
      }
    },
    [setStartupErrors],
  );

  const fetchStartups = useCallback(
    async (ids: string[] = allStartupIds, input: StatInput) => {
      const startupIndexes = ids
        .map(id => startups.findIndex(s => s.id === id))
        .filter(index => index !== -1)
        .sort();
      setStartupLoadings(prev => {
        const newLoadings = [...prev];
        for (const index of startupIndexes) {
          newLoadings[index] = true;
        }
        return newLoadings;
      });

      const filteredStartupWithData = startupIndexes.map(index => ({
        ...startups[index],
      }));

      const promises = filteredStartupWithData.map((s, i) =>
        loadStartupData(s, i, input).then(updated => ({ index: i, updated })),
      );

      const results = await Promise.all(promises);

      setStartupWithData(prev => {
        const updated = [...prev];
        for (const { index, updated: updatedStartup } of results) {
          updated[index] = updatedStartup;
          setStartupLoadings(prev => {
            const newLoadings = [...prev];
            newLoadings[index] = false;
            return newLoadings;
          });
        }
        return updated;
      });
    },
    [allStartupIds, loadStartupData, startups],
  );

  const methods = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      periodicity: DEFAULT_PERIODICITY,
    },
  });

  const {
    register,
    watch,
    trigger,
    getValues,
    resetField,
    formState: { errors },
  } = methods;

  const watchedPeriodicity = watch("periodicity");
  const watchedSince = watch("since");

  useEffect(() => {
    void fetchStartups(allStartupIds, { periodicity: watchedPeriodicity, since: watchedSince });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ton fetch de données
  const fetchFn = async (data: FormType) => {
    console.log("Fetching data with:", data);
    await fetchStartups(allStartupIds, data);
  };

  // Débounce du fetchFn
  const debouncedFetch = useMemo(() => debounce(fetchFn, 300), []);

  useEffect(() => {
    const run = async () => {
      const isValid = await trigger();
      if (isValid) {
        const values = getValues();
        await debouncedFetch(values);
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedPeriodicity, watchedSince]);

  return (
    <>
      <FormProvider {...methods}>
        {/* <ReactHookFormDebug /> */}
        <form className={styles.form}>
          <Select
            state={errors?.periodicity ? "error" : "default"}
            stateRelatedMessage={errors?.periodicity?.message}
            nativeSelectProps={{
              ...register("periodicity", {
                deps: ["since"],
                onChange: () => resetField("since"),
              }),
            }}
            label="Période"
          >
            <option value="day">Journalière</option>
            <option value="week">Hebdomadaire</option>
            <option value="month">Mensuelle</option>
            <option value="year">Annuelle</option>
          </Select>
          <Select
            state={errors?.since ? "error" : "default"}
            stateRelatedMessage={errors?.since?.message}
            nativeSelectProps={{
              ...register("since", {
                setValueAs: (v?: string) => (v ? parseInt(v) : void 0),
              }),
            }}
            label="Depuis"
          >
            <option disabled>Sélectionnez une période</option>
            <option value="">Toujours</option>
            {SINCE_OPTIONS[watchedPeriodicity].map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </form>
      </FormProvider>
      <Grid haveGutters>
        {startups.map((startup, idx) => {
          const s = startupWithData.find(d => d.id === startup.id);
          if (!s) {
            console.warn(`No data found for startup: ${startup.id}`);
            return null;
          }
          return (
            <GridCol
              base={["year", "month"].includes(watchedPeriodicity) ? 6 : 12}
              key={s.id}
              className={styles["startup-card"]}
            >
              <Card
                title={
                  <div className="flex justify-between">
                    <div className="flex gap-[1rem]">{s.name}</div>
                    {startupErrors[idx] && (
                      <ClientOnly>
                        <Tooltip title={startupErrors[idx]}>
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
                        linkProps: {
                          href: `/${s.id}`,
                        },
                        children: "Détails",
                        priority: "secondary",
                      },
                      ...((s.website
                        ? [
                            {
                              linkProps: {
                                href: s.website,
                                target: "_blank",
                              },
                              children: "Site",
                              priority: "tertiary",
                            },
                          ]
                        : []) as ButtonProps[]),
                    ]}
                  />
                }
                desc={
                  <span className={styles["startup-card--body"]}>
                    {startupLoadings[idx] ? (
                      <Loader loading size="2em" />
                    ) : startupErrors[idx] ? (
                      <Text inline color={fr.colors.decisions.text.default.error.default}>
                        {startupErrors[idx]}
                      </Text>
                    ) : s.data?.stats?.length ? (
                      <MuiBarLineChart
                        barData={s.data.stats.map(stat => stat.value)}
                        lineData={s.data.stats.map(stat => stat.variation)}
                        nameLine="Variation (%)"
                        nameBar={s.data.description ?? "North Star metric"}
                        x={s.data.stats.map(stat => dateFormatter(stat.date, watchedPeriodicity))}
                        xTickInterval={TICK_INTERVALS[watchedPeriodicity]}
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
                  </span>
                }
              />
            </GridCol>
          );
        })}
      </Grid>
    </>
  );
};
