"use client";

import Select from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

import { Grid, GridCol } from "@/dsfr";
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

// ------------------ Composant carte (1 requête) ------------------

// ------------------ Forme globale ------------------

interface GlobalFormProps {
  startups: EnrichedStartup[];
}

export const GlobalForm = ({ startups }: GlobalFormProps) => {
  const methods = useForm<FormType>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: { periodicity: DEFAULT_PERIODICITY, since: undefined },
  });

  const {
    register,
    watch,
    formState: { errors },
    resetField,
    setValue,
  } = methods;

  const watchedPeriodicity = watch("periodicity");
  const watchedSince = watch("since"); // number | undefined

  // On "debounce" juste les valeurs du formulaire pour limiter les refetch
  const debouncedInput = useDebouncedValue<StatInput>({ periodicity: watchedPeriodicity, since: watchedSince }, 300);

  const gridBase = useMemo(() => (["year", "month"].includes(watchedPeriodicity) ? 6 : 12), [watchedPeriodicity]);

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

      <Grid haveGutters>
        {startups.map(s => (
          <GridCol base={gridBase} key={s.id} className={styles["startup-card"]}>
            <StartupCard startup={s} input={debouncedInput} />
          </GridCol>
        ))}
      </Grid>
    </>
  );
};
