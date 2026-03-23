"use client";
"use no memo";

import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { startTransition, useEffect, useMemo, useState } from "react";
import { Controller, FormProvider, useFieldArray, useForm } from "react-hook-form";

import { ClientAnimate } from "@/components/utils/ClientAnimate";
import { Grid, GridCol, Icon } from "@/dsfr";
import { type FullConfig, FullConfigSchema } from "@/startup-types";

import { checkBetaStartup, saveConfig } from "./action";
import styles from "./AdminConfigForm.module.scss";
import { ConfigHistory } from "./ConfigHistory";
import { exportConfigToCsv, parseConfigFromCsv } from "./csv-utils";
import { GroupTagsEditor } from "./GroupTagsEditor";

interface Props {
  initialBetaNames?: Record<string, string>;
  initialConfig: FullConfig;
}

export const AdminConfigForm = ({ initialBetaNames = {}, initialConfig }: Props) => {
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

  useEffect(() => {
    void trigger();
  }, [trigger]);

  // Prevenir la fermeture accidentelle avec des modifications non sauvegardees
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const groupsFA = useFieldArray({ control, name: "groups" });
  const startupsFA = useFieldArray({ control, name: "startups" });

  // eslint-disable-next-line react-hooks/incompatible-library -- no memo directive used
  const watchedGroups = watch("groups");

  const [status, setStatus] = useState<{ text: string; type: "err" | "ok" } | null>(null);
  const [groupSearch, setGroupSearch] = useState("");
  const [startupSearch, setStartupSearch] = useState("");

  // Noms beta.gouv.fr (id -> nom). Initialise cote serveur, enrichi par lazy check.
  const [betaNames, setBetaNames] = useState<Record<string, string>>(initialBetaNames);
  const [betaNotFound, setBetaNotFound] = useState<Set<string>>(() => {
    // Les IDs presentes dans la config mais absentes de initialBetaNames sont introuvables
    const notFound = new Set<string>();
    for (const s of initialConfig.startups) {
      if (s.id && !(s.id in initialBetaNames)) notFound.add(s.id);
    }
    return notFound;
  });
  const [checkingBeta, setCheckingBeta] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedStartups, setExpandedStartups] = useState<Set<string>>(new Set());
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<number | null>(null);
  const [confirmDeleteStartup, setConfirmDeleteStartup] = useState<number | null>(null);

  // Auto-dismiss du status apres 5s pour les succes
  useEffect(() => {
    if (status?.type === "ok") {
      const t = setTimeout(() => setStatus(null), 5000);
      return () => clearTimeout(t);
    }
  }, [status]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleStartup = (id: string) => {
    setExpandedStartups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubmit = handleSubmit(async data => {
    setStatus(null);
    const res = await saveConfig(data);
    if (res.ok) {
      setStatus({ text: "Configuration sauvegardee", type: "ok" });
      startTransition(() => reset(data));
    } else {
      setStatus({ text: res.error || "Echec de la sauvegarde", type: "err" });
    }
  });

  const removeGroupAt = (index: number) => {
    const gid = getValues(`groups.${index}.id`);
    groupsFA.remove(index);
    setConfirmDeleteGroup(null);
    if (gid) {
      const startups = getValues("startups");
      startups?.forEach((_, si) => {
        const arr = getValues(`startups.${si}.groups`) || [];
        if (arr.includes(gid)) {
          setValue(
            `startups.${si}.groups`,
            arr.filter((x: string) => x !== gid),
            { shouldDirty: true, shouldValidate: true },
          );
        }
      });
    }
  };

  const removeStartupAt = (index: number) => {
    startupsFA.remove(index);
    setConfirmDeleteStartup(null);
  };

  const handleCheckBeta = async (startupId: string) => {
    if (!startupId) return;
    setCheckingBeta(startupId);
    const res = await checkBetaStartup(startupId);
    if (res.ok && res.data) {
      setBetaNames(prev => ({ ...prev, [startupId]: res.data.name }));
      setBetaNotFound(prev => {
        const next = new Set(prev);
        next.delete(startupId);
        return next;
      });
    } else if (!res.ok) {
      setBetaNames(prev => {
        const next = { ...prev };
        delete next[startupId];
        return next;
      });
      setBetaNotFound(prev => new Set([...prev, startupId]));
    }
    setCheckingBeta(null);
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
        setStatus({ text: "CSV importe. Verifiez et enregistrez.", type: "ok" });
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

  // Compteurs pour le filtre
  const filteredGroupCount = groupsFA.fields.filter((_, i) => {
    if (!groupSearch) return true;
    const g = watchedGroups[i];
    return (
      (g?.id ?? "").toLowerCase().includes(groupSearch.toLowerCase()) ||
      (g?.name ?? "").toLowerCase().includes(groupSearch.toLowerCase())
    );
  }).length;

  const filteredStartupCount = startupsFA.fields.filter((_, si) => {
    if (!startupSearch) return true;
    const s = getValues(`startups.${si}`);
    return (
      (s?.id ?? "").toLowerCase().includes(startupSearch.toLowerCase()) ||
      (s?.nameOverride ?? "").toLowerCase().includes(startupSearch.toLowerCase())
    );
  }).length;

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className={styles.root}>
        {/* Barre d'actions */}
        <div className={styles.actions}>
          <div className={styles.actionsLeft}>
            <button type="button" className="fr-btn fr-btn--tertiary fr-btn--sm" onClick={handleExportCsv}>
              Exporter CSV
            </button>
            <label className="fr-btn fr-btn--tertiary fr-btn--sm" style={{ cursor: "pointer" }}>
              Importer CSV
              <input type="file" accept=".csv" onChange={handleImportCsv} style={{ display: "none" }} />
            </label>
          </div>

          <div className={styles.actionsRight}>
            {isDirty && <span className={styles.dirtyBadge}>Modifications non sauvegardees</span>}
            <Button priority="secondary" disabled={isSubmitting || !isDirty} onClick={() => reset(initialConfig)}>
              Reinitialiser
            </Button>
            <Button priority="primary" type="submit" disabled={!isDirty || !isValid || isSubmitting}>
              {isSubmitting ? "Sauvegarde..." : "Enregistrer"}
            </Button>
          </div>

          {status && (
            <div
              className={`${styles.statusBar} fr-alert ${status.type === "ok" ? "fr-alert--success" : "fr-alert--error"}`}
            >
              <p>{status.text}</p>
            </div>
          )}
        </div>

        <div className={styles.columns}>
          {/* Colonne Groupes */}
          <section className={styles.col} aria-labelledby="col-groups-title">
            <div className={styles.colHeader}>
              <div className={styles.colHeaderTop}>
                <h2 id="col-groups-title" className="fr-h4 fr-mb-0">
                  Groupes{" "}
                  <Badge severity="info" small noIcon>
                    {groupSearch ? `${filteredGroupCount}/${groupsFA.fields.length}` : groupsFA.fields.length}
                  </Badge>
                </h2>
                <Button
                  priority="secondary"
                  size="small"
                  onClick={() => {
                    groupsFA.append({ description: "", enabled: true, id: "", name: "" });
                    // Auto-expand la nouvelle card
                    setTimeout(
                      () =>
                        setExpandedGroups(
                          prev => new Set([...prev, groupsFA.fields[groupsFA.fields.length - 1]?.id ?? ""]),
                        ),
                      50,
                    );
                  }}
                >
                  + Ajouter
                </Button>
              </div>
              {groupsFA.fields.length > 3 && (
                <div className={styles.colHeaderSearch}>
                  <Input
                    iconId="fr-icon-search-line"
                    label=""
                    nativeInputProps={{
                      onChange: e => setGroupSearch(e.target.value),
                      placeholder: "Filtrer...",
                      value: groupSearch,
                    }}
                  />
                </div>
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

                const isExpanded = expandedGroups.has(g.id);
                const displayName = gValues?.name || gValues?.id || "(nouveau)";
                const isGroupEnabled = gValues?.enabled !== false;

                return (
                  <div key={g.id} className={styles.card + " fr-background-alt--blue-france fr-radius-8"}>
                    <div className={styles.cardSummary}>
                      <div className={styles.cardSummaryLeft} onClick={() => toggleGroup(g.id)}>
                        {gValues?.id && <span className={styles.cardId}>{gValues.id}</span>}
                        <span className={styles.cardName}>{displayName}</span>
                      </div>
                      <div className={styles.cardSummaryRight}>
                        <Button
                          priority="tertiary no outline"
                          size="small"
                          iconId={isGroupEnabled ? "fr-icon-eye-line" : "fr-icon-eye-off-line"}
                          title={
                            isGroupEnabled ? "Active - cliquer pour desactiver" : "Desactive - cliquer pour activer"
                          }
                          onClick={e => {
                            e.stopPropagation();
                            setValue(`groups.${i}.enabled`, !isGroupEnabled, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          style={isGroupEnabled ? undefined : { opacity: 0.4 }}
                        />
                        <Icon
                          icon="fr-icon-arrow-down-s-line"
                          size="lg"
                          className={styles.cardChevron}
                          data-open={isExpanded}
                          onClick={() => toggleGroup(g.id)}
                        />
                      </div>
                    </div>

                    {isExpanded && (
                      <>
                        <Grid haveGutters className="fr-mt-2w">
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
                          <GridCol base={12}>
                            <Input
                              label="Description"
                              textArea
                              nativeTextAreaProps={{ ...register(`groups.${i}.description`) }}
                              state={errors?.groups?.[i]?.description ? "error" : "default"}
                              stateRelatedMessage={errors?.groups?.[i]?.description?.message}
                            />
                          </GridCol>
                        </Grid>
                        <div className={styles.cardFooter}>
                          {confirmDeleteGroup === i ? (
                            <>
                              <span className="fr-text--sm fr-mr-2w" style={{ alignSelf: "center" }}>
                                Supprimer ce groupe ?
                              </span>
                              <Button
                                priority="primary"
                                size="small"
                                className={styles.deleteBtn}
                                onClick={() => removeGroupAt(i)}
                              >
                                Confirmer
                              </Button>
                              <Button
                                priority="tertiary"
                                size="small"
                                className="fr-ml-1w"
                                onClick={() => setConfirmDeleteGroup(null)}
                              >
                                Annuler
                              </Button>
                            </>
                          ) : (
                            <Button
                              priority="tertiary no outline"
                              size="small"
                              className={styles.deleteBtn}
                              iconId="fr-icon-delete-line"
                              onClick={() => setConfirmDeleteGroup(i)}
                            >
                              Supprimer
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </ClientAnimate>
          </section>

          {/* Colonne Startups */}
          <section className={styles.col} aria-labelledby="col-startups-title">
            <div className={styles.colHeader}>
              <div className={styles.colHeaderTop}>
                <h2 id="col-startups-title" className="fr-h4 fr-mb-0">
                  Startups{" "}
                  <Badge severity="info" small noIcon>
                    {startupSearch ? `${filteredStartupCount}/${startupsFA.fields.length}` : startupsFA.fields.length}
                  </Badge>
                </h2>
                <Button
                  priority="secondary"
                  size="small"
                  onClick={() => startupsFA.append({ enabled: true, groups: [], id: "" })}
                >
                  + Ajouter
                </Button>
              </div>
              {startupsFA.fields.length > 3 && (
                <div className={styles.colHeaderSearch}>
                  <Input
                    iconId="fr-icon-search-line"
                    label=""
                    nativeInputProps={{
                      onChange: e => setStartupSearch(e.target.value),
                      placeholder: "Filtrer...",
                      value: startupSearch,
                    }}
                  />
                </div>
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

                const isExpanded = expandedStartups.has(s.id);
                const sid = sValues?.id ?? "";
                const betaName = betaNames[sid];
                const hasOverride = !!sValues?.nameOverride;
                const displayName = hasOverride
                  ? `${sValues.nameOverride} (surcharge)`
                  : (betaName ?? sid) || "(nouvelle)";
                const hasStatsUrl = !!sValues?.statsUrl;
                const isEnabled = sValues?.enabled !== false;

                return (
                  <div key={s.id} className={styles.card + " fr-background-alt--grey fr-radius-8"}>
                    <div className={styles.cardSummary}>
                      <div className={styles.cardSummaryLeft} onClick={() => toggleStartup(s.id)}>
                        {sid && <span className={styles.cardId}>{sid}</span>}
                        <span className={styles.cardName}>{displayName}</span>
                        {betaNotFound.has(sid) && (
                          <Badge severity="error" small noIcon>
                            Introuvable
                          </Badge>
                        )}
                        {hasStatsUrl && (
                          <Badge severity="success" small noIcon>
                            Stats
                          </Badge>
                        )}
                      </div>
                      <div className={styles.cardSummaryRight}>
                        <Button
                          priority="tertiary no outline"
                          size="small"
                          iconId={isEnabled ? "fr-icon-eye-line" : "fr-icon-eye-off-line"}
                          title={isEnabled ? "Active - cliquer pour desactiver" : "Desactivee - cliquer pour activer"}
                          onClick={e => {
                            e.stopPropagation();
                            setValue(`startups.${si}.enabled`, !isEnabled, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          style={isEnabled ? undefined : { opacity: 0.4 }}
                        />
                        <Icon
                          icon="fr-icon-arrow-down-s-line"
                          size="lg"
                          className={styles.cardChevron}
                          data-open={isExpanded}
                          onClick={() => toggleStartup(s.id)}
                        />
                      </div>
                    </div>

                    {isExpanded && (
                      <>
                        <Grid haveGutters className="fr-mt-2w">
                          <GridCol base={12} sm={6}>
                            <Input
                              label="ID"
                              nativeInputProps={{ ...register(`startups.${si}.id`) }}
                              state={errors?.startups?.[si]?.id ? "error" : "default"}
                              stateRelatedMessage={errors?.startups?.[si]?.id?.message}
                            />
                          </GridCol>
                          <GridCol base={12} sm={6}>
                            <Input
                              label="Nom"
                              nativeInputProps={{ ...register(`startups.${si}.nameOverride`) }}
                              state={errors?.startups?.[si]?.nameOverride ? "error" : "default"}
                              stateRelatedMessage={errors?.startups?.[si]?.nameOverride?.message}
                            />
                          </GridCol>
                          <GridCol base={12} sm={4}>
                            {betaName ? (
                              <div className="fr-text--sm fr-text-mention--grey">
                                Nom beta.gouv.fr : <strong>{betaName}</strong>
                              </div>
                            ) : sid ? (
                              <Button
                                priority="tertiary"
                                size="small"
                                iconId="fr-icon-search-line"
                                disabled={checkingBeta === sid}
                                onClick={() => void handleCheckBeta(sid)}
                              >
                                {checkingBeta === sid ? "Verification..." : "Verifier sur beta.gouv.fr"}
                              </Button>
                            ) : null}
                          </GridCol>
                          <GridCol base={12} sm={8}>
                            <Input
                              label="URL stats"
                              nativeInputProps={{
                                ...register(`startups.${si}.statsUrl`, {
                                  setValueAs: (v: string) => v?.trim() || undefined,
                                }),
                                placeholder: "https://...",
                                type: "url",
                              }}
                              state={errors?.startups?.[si]?.statsUrl ? "error" : "default"}
                              stateRelatedMessage={errors?.startups?.[si]?.statsUrl?.message}
                            />
                          </GridCol>
                          <GridCol base={12} sm={6}>
                            <Input
                              label="Site web"
                              nativeInputProps={{
                                ...register(`startups.${si}.websiteOverride`, {
                                  setValueAs: (v: string) => v?.trim() || undefined,
                                }),
                                placeholder: "https://...",
                                type: "url",
                              }}
                              state={errors?.startups?.[si]?.websiteOverride ? "error" : "default"}
                              stateRelatedMessage={errors?.startups?.[si]?.websiteOverride?.message}
                            />
                          </GridCol>
                          <GridCol base={12} sm={6}>
                            <Input
                              label="North star"
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
                        <div className={styles.cardFooter}>
                          {confirmDeleteStartup === si ? (
                            <>
                              <span className="fr-text--sm fr-mr-2w" style={{ alignSelf: "center" }}>
                                Supprimer cette startup ?
                              </span>
                              <Button
                                priority="primary"
                                size="small"
                                className={styles.deleteBtn}
                                onClick={() => removeStartupAt(si)}
                              >
                                Confirmer
                              </Button>
                              <Button
                                priority="tertiary"
                                size="small"
                                className="fr-ml-1w"
                                onClick={() => setConfirmDeleteStartup(null)}
                              >
                                Annuler
                              </Button>
                            </>
                          ) : (
                            <Button
                              priority="tertiary no outline"
                              size="small"
                              className={styles.deleteBtn}
                              iconId="fr-icon-delete-line"
                              onClick={() => setConfirmDeleteStartup(si)}
                            >
                              Supprimer
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </ClientAnimate>
          </section>
        </div>

        <ConfigHistory />
      </form>
    </FormProvider>
  );
};
