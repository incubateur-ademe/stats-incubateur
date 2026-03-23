"use client";
"use no memo";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { startTransition, useEffect, useMemo, useState } from "react";
import { Controller, FormProvider, useFieldArray, useForm } from "react-hook-form";

import { ClientAnimate } from "@/components/utils/ClientAnimate";
import { Grid, GridCol } from "@/dsfr";
import { type FullConfig, FullConfigSchema } from "@/startup-types";

import { saveConfig } from "./action";
import styles from "./AdminConfigForm.module.scss";
import { ConfigHistory } from "./ConfigHistory";
import { exportConfigToCsv, parseConfigFromCsv } from "./csv-utils";
import { GroupTagsEditor } from "./GroupTagsEditor";

interface Props {
  initialConfig: FullConfig;
}

export const AdminConfigForm = ({ initialConfig }: Props) => {
  const methods = useForm<FullConfig>({
    defaultValues: initialConfig,
    mode: "onChange",
    resolver: standardSchemaResolver(FullConfigSchema),
  });

  const {
    control,
    formState: { errors, isDirty, isSubmitting, isValid },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    trigger,
    watch,
  } = methods;

  // Valider au montage pour afficher les erreurs de la config initiale
  useEffect(() => {
    void trigger();
  }, [trigger]);

  const groupsFA = useFieldArray({ control, name: "groups" });
  const startupsFA = useFieldArray({ control, name: "startups" });
  // eslint-disable-next-line react-hooks/incompatible-library -- no memo directive used
  const watchedGroups = watch("groups");

  const [status, setStatus] = useState<{ text: string; type: "err" | "ok" } | null>(null);
  const [groupSearch, setGroupSearch] = useState("");
  const [startupSearch, setStartupSearch] = useState("");

  const onSubmit = handleSubmit(async data => {
    setStatus(null);
    const res = await saveConfig(data);
    if (res.ok) {
      setStatus({ text: "Configuration sauvegardée ✅", type: "ok" });
      startTransition(() => reset(data)); // reset du dirty state
    } else {
      setStatus({ text: res.error || "Échec de la sauvegarde", type: "err" });
    }
  });

  const removeGroupAt = (index: number) => {
    const gid = getValues(`groups.${index}.id`);
    groupsFA.remove(index);
    if (gid) {
      const startups = getValues("startups");
      startups?.forEach((_, si) => {
        const arr = getValues(`startups.${si}.groups`) || [];
        if (arr.includes(gid)) {
          setValue(
            `startups.${si}.groups`,
            arr.filter((x: string) => x !== gid),
            {
              shouldDirty: true,
              shouldValidate: true,
            },
          );
        }
      });
    }
  };

  const removeStartupAt = (index: number) => {
    startupsFA.remove(index);
  };

  const handleExportCsv = () => {
    const csv = exportConfigToCsv(getValues());
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config-startups.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseConfigFromCsv(reader.result as string);
        reset(parsed, { keepDirty: false });
        setStatus({ text: "CSV importe avec succes. Verifiez et enregistrez.", type: "ok" });
      } catch {
        setStatus({ text: "Erreur lors du parsing du fichier CSV.", type: "err" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const groupOptions = useMemo(
    () =>
      watchedGroups
        .map((g, i) => ({
          id: g?.id ?? "",
          label: g?.name || g?.id || `Groupe ${i + 1}`,
        }))
        .filter(o => o.id),
    [watchedGroups],
  );
  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className={styles.root}>
        {/* <ReactHookFormDebug /> */}
        <div className={styles.actions}>
          <ButtonsGroup
            alignment="right"
            inlineLayoutWhen="always"
            buttons={[
              {
                children: "Reinitialiser",
                disabled: isSubmitting,
                onClick: () => reset(initialConfig),
                priority: "secondary",
              },
              {
                children: isSubmitting ? "Sauvegarde en cours..." : "Enregistrer",
                disabled: !isDirty || !isValid || isSubmitting,
                priority: "primary",
                type: "submit",
              },
            ]}
          />
          {status && (
            <div className={`fr-alert ${status.type === "ok" ? "fr-alert--success" : "fr-alert--error"} fr-mt-2w`}>
              <p>{status.text}</p>
            </div>
          )}
          <div className="fr-mt-1w" style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="fr-btn fr-btn--tertiary fr-btn--sm" onClick={handleExportCsv}>
              Exporter CSV
            </button>
            <label className="fr-btn fr-btn--tertiary fr-btn--sm" style={{ cursor: "pointer" }}>
              Importer CSV
              <input type="file" accept=".csv" onChange={handleImportCsv} style={{ display: "none" }} />
            </label>
          </div>
          <ConfigHistory />
        </div>

        <div className={styles.columns}>
          <section className={styles.col} aria-labelledby="col-groups-title">
            <div className={styles.colHeader}>
              <h2 id="col-groups-title" className="fr-h4 fr-mb-0">
                Groupes
              </h2>
              <ButtonsGroup
                inlineLayoutWhen="always"
                buttons={[
                  {
                    children: "Ajouter un groupe",
                    onClick: () => groupsFA.append({ description: "", enabled: true, id: "", name: "" }),
                    priority: "secondary",
                  },
                ]}
              />
              {groupsFA.fields.length > 3 && (
                <Input
                  iconId="fr-icon-search-line"
                  label=""
                  nativeInputProps={{
                    onChange: e => setGroupSearch(e.target.value),
                    placeholder: "Filtrer les groupes...",
                    value: groupSearch,
                  }}
                />
              )}
            </div>

            <ClientAnimate className={styles.scroll}>
              {groupsFA.fields.length === 0 && <p className="fr-text-mention--grey">Aucun groupe.</p>}

              {groupsFA.fields.map((g, i) => {
                const gValues = watchedGroups[i];
                if (
                  groupSearch &&
                  !(gValues?.id ?? "").toLowerCase().includes(groupSearch.toLowerCase()) &&
                  !(gValues?.name ?? "").toLowerCase().includes(groupSearch.toLowerCase())
                ) {
                  return null;
                }
                return (
                  <div key={g.id} className={styles.card + " fr-background-alt--blue-france fr-radius-8"}>
                    <Grid haveGutters>
                      <GridCol base={12} sm={6}>
                        <Input
                          label="ID"
                          nativeInputProps={{ ...register(`groups.${i}.id`) }}
                          state={errors?.groups?.[i]?.id ? "error" : "default"}
                          stateRelatedMessage={errors?.groups?.[i]?.id?.message}
                        />
                      </GridCol>
                      <GridCol base={12} sm={6}>
                        <Input
                          label="Nom"
                          nativeInputProps={{ ...register(`groups.${i}.name`) }}
                          state={errors?.groups?.[i]?.name ? "error" : "default"}
                          stateRelatedMessage={errors?.groups?.[i]?.name?.message}
                        />
                      </GridCol>
                      <GridCol base={12} sm={9}>
                        <Input
                          label="Description (optionnelle)"
                          textArea
                          nativeTextAreaProps={{ ...register(`groups.${i}.description`) }}
                          state={errors?.groups?.[i]?.description ? "error" : "default"}
                          stateRelatedMessage={errors?.groups?.[i]?.description?.message}
                        />
                      </GridCol>
                      <GridCol base={12} sm={3}>
                        <Checkbox
                          options={[
                            {
                              label: "Activé",
                              nativeInputProps: { ...register(`groups.${i}.enabled`) },
                            },
                          ]}
                        />
                      </GridCol>
                    </Grid>
                    <div className="fr-mt-2w">
                      <ButtonsGroup
                        inlineLayoutWhen="always"
                        buttons={[
                          {
                            children: "Supprimer",
                            onClick: () => removeGroupAt(i),
                            priority: "tertiary",
                          },
                        ]}
                      />
                    </div>
                  </div>
                );
              })}
            </ClientAnimate>
          </section>

          <section className={styles.col} aria-labelledby="col-startups-title">
            <div className={styles.colHeader}>
              <h2 id="col-startups-title" className="fr-h4 fr-mb-0">
                Startups
              </h2>
              <ButtonsGroup
                inlineLayoutWhen="always"
                buttons={[
                  {
                    children: "Ajouter une startup",
                    onClick: () => startupsFA.append({ enabled: true, groups: [], id: "" }),
                    priority: "secondary",
                  },
                ]}
              />
              {startupsFA.fields.length > 3 && (
                <Input
                  iconId="fr-icon-search-line"
                  label=""
                  nativeInputProps={{
                    onChange: e => setStartupSearch(e.target.value),
                    placeholder: "Filtrer les startups...",
                    value: startupSearch,
                  }}
                />
              )}
            </div>

            <ClientAnimate className={styles.scroll}>
              {startupsFA.fields.length === 0 && <p className="fr-text-mention--grey">Aucune startup.</p>}

              {startupsFA.fields.map((s, si) => {
                const sValues = getValues(`startups.${si}`);
                if (
                  startupSearch &&
                  !(sValues?.id ?? "").toLowerCase().includes(startupSearch.toLowerCase()) &&
                  !(sValues?.nameOverride ?? "").toLowerCase().includes(startupSearch.toLowerCase())
                ) {
                  return null;
                }
                return (
                  <div key={s.id} className={styles.card + " fr-background-alt--grey fr-radius-8"}>
                    <Grid haveGutters>
                      <GridCol base={12} sm={4}>
                        <Input
                          label="ID"
                          nativeInputProps={{ ...register(`startups.${si}.id`) }}
                          state={errors?.startups?.[si]?.id ? "error" : "default"}
                          stateRelatedMessage={errors?.startups?.[si]?.id?.message}
                        />
                      </GridCol>
                      <GridCol base={12} sm={4}>
                        <Input
                          label="Nom custom (nameOverride)"
                          nativeInputProps={{ ...register(`startups.${si}.nameOverride`) }}
                          state={errors?.startups?.[si]?.nameOverride ? "error" : "default"}
                          stateRelatedMessage={errors?.startups?.[si]?.nameOverride?.message}
                        />
                      </GridCol>
                      <GridCol base={12} sm={4}>
                        <Checkbox
                          options={[
                            {
                              label: "Activée",
                              nativeInputProps: { ...register(`startups.${si}.enabled`) },
                            },
                          ]}
                        />
                      </GridCol>

                      <GridCol base={12} sm={6}>
                        <Input
                          label="URL stats (statsUrl)"
                          nativeInputProps={{
                            ...register(`startups.${si}.statsUrl`, {
                              setValueAs: (v: string) => v?.trim() || undefined,
                            }),
                            placeholder: "https://…",
                            type: "url",
                          }}
                          state={errors?.startups?.[si]?.statsUrl ? "error" : "default"}
                          stateRelatedMessage={errors?.startups?.[si]?.statsUrl?.message}
                        />
                      </GridCol>
                      <GridCol base={12} sm={6}>
                        <Input
                          label="Site custom (websiteOverride)"
                          nativeInputProps={{
                            ...register(`startups.${si}.websiteOverride`, {
                              setValueAs: (v: string) => v?.trim() || undefined,
                            }),
                            placeholder: "https://…",
                            type: "url",
                          }}
                          state={errors?.startups?.[si]?.websiteOverride ? "error" : "default"}
                          stateRelatedMessage={errors?.startups?.[si]?.websiteOverride?.message}
                        />
                      </GridCol>

                      <GridCol base={12}>
                        <Input
                          label="North star custom (northStarOverride)"
                          nativeInputProps={{ ...register(`startups.${si}.northStarOverride`) }}
                          state={errors?.startups?.[si]?.northStarOverride ? "error" : "default"}
                          stateRelatedMessage={errors?.startups?.[si]?.northStarOverride?.message}
                        />
                      </GridCol>

                      <GridCol base={12}>
                        <Controller
                          control={control}
                          name={`startups.${si}.groups`}
                          render={({ field }) => (
                            <GroupTagsEditor
                              value={field.value ?? []}
                              onChange={field.onChange}
                              options={groupOptions}
                            />
                          )}
                        />
                        {errors?.startups?.[si]?.groups && (
                          <p className="fr-error-text">{errors?.startups?.[si]?.groups?.message}</p>
                        )}
                      </GridCol>
                    </Grid>
                    <div className="fr-mt-2w">
                      <ButtonsGroup
                        inlineLayoutWhen="always"
                        buttons={[
                          {
                            children: "Supprimer",
                            onClick: () => removeStartupAt(si),
                            priority: "tertiary",
                          },
                        ]}
                      />
                    </div>
                  </div>
                );
              })}
            </ClientAnimate>
          </section>
        </div>
      </form>
    </FormProvider>
  );
};
