"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Select from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

import { ClientAnimate } from "@/components/utils/ClientAnimate";
import { GridCol } from "@/dsfr";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import styles from "./GlobalForm.module.scss";
import { StartupCard } from "./StartupCard";
import { type EnrichedStartup, type StatInput, statInputSchema, type StatPeriodicity } from "./types";

z.config(z.locales.fr());
const formSchema = statInputSchema;
type FormType = StatInput;

const DEFAULT_PERIODICITY: StatInput["periodicity"] = "month";

const SINCE_OPTIONS: Record<FormType["periodicity"], Array<{ label: string; value: number }>> = {
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

// ------------------ Composant carte (1 requête) ------------------

// ------------------ Forme globale ------------------

interface GlobalFormProps {
  defaultOrder: "alpha" | "config" | "stats-first";
  showTrend: boolean;
  startups: EnrichedStartup[];
}

export const GlobalForm = ({ defaultOrder, showTrend, startups }: GlobalFormProps) => {
  const queryClient = useQueryClient();

  const methods = useForm<FormType>({
    defaultValues: { periodicity: DEFAULT_PERIODICITY, since: undefined },
    mode: "onChange",
    resolver: zodResolver(formSchema),
  });

  const {
    formState: { errors },
    register,
    resetField,
    setValue,
    watch,
  } = methods;

  const watchedPeriodicity = watch("periodicity");
  const watchedSince = watch("since"); // number | undefined

  // On "debounce" juste les valeurs du formulaire pour limiter les refetch
  const debouncedInput = useDebouncedValue<StatInput>({ periodicity: watchedPeriodicity, since: watchedSince }, 300);

  const gridBase = useMemo(() => (["year", "month"].includes(watchedPeriodicity) ? 6 : 12), [watchedPeriodicity]);

  // Compteur pour forcer le re-tri quand une query se termine
  const [settledCount, setSettledCount] = useState(0);

  // Tri dynamique : les cards avec données en cache passent en premier.
  // Uniquement pour l'ordre "stats-first" ; sinon l'ordre serveur (alpha/config) fait foi.
  const sortedStartups = useMemo(() => {
    if (defaultOrder !== "stats-first") return startups;

    const hasData = (s: EnrichedStartup) => {
      const data = queryClient.getQueryData<{ stats?: unknown[] }>([
        "stats",
        s.id,
        debouncedInput.periodicity,
        debouncedInput.since ?? null,
      ]);
      return !!data?.stats?.length;
    };

    return [...startups].sort((a, b) => {
      const aHasData = hasData(a);
      const bHasData = hasData(b);
      if (aHasData && !bHasData) return -1;
      if (!aHasData && bHasData) return 1;
      return 0; // Conserver l'ordre serveur (statsUrl first, puis alpha) comme secondaire
    });
    // settledCount force le recalcul quand une query se termine
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startups, debouncedInput, queryClient, settledCount, defaultOrder]);

  const onQuerySettled = useCallback(() => setSettledCount(c => c + 1), []);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initializedFromURL = useRef(false);

  // 1) Au montage: lire la query et initialiser le formulaire
  useEffect(() => {
    if (initializedFromURL.current) return;

    const qpPeriodicity = searchParams.get("periodicity");
    const qpSinceRaw = searchParams.get("since");

    // valeurs candidates depuis l’URL
    const candidatePeriodicity = (["day", "week", "month", "year"] as const).includes(qpPeriodicity as StatPeriodicity)
      ? (qpPeriodicity as FormType["periodicity"])
      : DEFAULT_PERIODICITY;

    const candidateSince =
      qpSinceRaw !== null && qpSinceRaw !== ""
        ? Number.isNaN(parseInt(qpSinceRaw, 10))
          ? undefined
          : parseInt(qpSinceRaw, 10)
        : undefined;

    // on applique seulement si ça diffère du form courant
    const needSetPeriodicity = candidatePeriodicity !== methods.getValues("periodicity");
    const needSetSince = candidateSince !== methods.getValues("since");

    if (needSetPeriodicity) setValue("periodicity", candidatePeriodicity, { shouldValidate: true });
    if (needSetSince) setValue("since", candidateSince, { shouldValidate: true });

    initializedFromURL.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setValue]);

  // 2) À chaque changement du form: pousser l’URL (sans historiques multiples, sans scroll)
  useEffect(() => {
    if (!initializedFromURL.current) return; // attendre l'init depuis l’URL

    const params = new URLSearchParams();

    // Preserver le filtre de groupe pose par la navigation (sinon router.replace l'ecraserait)
    const group = searchParams.get("group");
    if (group) {
      params.set("group", group);
    }

    // n’inclure QUE les non-défauts
    if (watchedPeriodicity !== DEFAULT_PERIODICITY) {
      params.set("periodicity", watchedPeriodicity);
    }
    if (watchedSince !== undefined && watchedSince !== null && `${watchedSince}`.length > 0) {
      params.set("since", String(watchedSince));
    }

    const nextSearch = params.toString();
    const currentSearch = searchParams.toString();

    // éviter les navigations inutiles
    if (nextSearch === currentSearch) return;

    const nextUrl = nextSearch ? `${pathname}?${nextSearch}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [watchedPeriodicity, watchedSince, pathname, router, searchParams]);

  return (
    <>
      <FormProvider {...methods}>
        <form className={styles.form}>
          <Select
            state={errors?.periodicity ? "error" : "default"}
            stateRelatedMessage={errors?.periodicity?.message}
            nativeSelectProps={{
              defaultValue: DEFAULT_PERIODICITY,
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
              defaultValue: "",
              ...register("since", { setValueAs: (v?: string) => (v ? parseInt(v) : void 0) }),
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

      <ClientAnimate className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        {sortedStartups.map(s => (
          <GridCol base={gridBase} key={s.id} className={styles["startup-card"]}>
            <StartupCard startup={s} input={debouncedInput} onQuerySettled={onQuerySettled} showTrend={showTrend} />
          </GridCol>
        ))}
      </ClientAnimate>
    </>
  );
};
