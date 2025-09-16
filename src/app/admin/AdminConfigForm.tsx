"use client";

import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { type TagProps } from "@codegouvfr/react-dsfr/Tag";
import TagsGroup from "@codegouvfr/react-dsfr/TagsGroup";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import Autocomplete from "@mui/material/Autocomplete";
import { startTransition, useMemo, useState } from "react";
import { Controller, FormProvider, useFieldArray, useForm } from "react-hook-form";

import { ClientAnimate } from "@/components/utils/ClientAnimate";
import { Grid, GridCol } from "@/dsfr";
import { type FullConfig, FullConfigSchema } from "@/startup-types";

import { saveConfig } from "./action";
import styles from "./AdminConfigForm.module.scss";

type Props = {
  initialConfig: FullConfig;
};

type GroupTagsEditorProps = {
  label?: string;
  onChange: (ids: string[]) => void;
  options: Array<{ id: string; label: string }>;
  value: string[];
};

function GroupTagsEditor({ value, onChange, options, label = "Ajouter un groupe" }: GroupTagsEditorProps) {
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(options.map(o => [o.id, o.label])), [options]);

  const available = useMemo(
    () =>
      options.filter(
        o =>
          !value.includes(o.id) &&
          (o.id.toLowerCase().includes(query.toLowerCase()) ||
            (o.label ?? "").toLowerCase().includes(query.toLowerCase())),
      ),
    [options, value, query],
  );

  const addMany = (ids: string[]) => {
    if (!ids.length) return;
    const next = [...new Set([...value, ...ids.filter(id => byId.has(id))])];
    if (next.length !== value.length) onChange(next);
    setQuery("");
  };

  const addOne = (gid: string | null) => {
    if (!gid) return;
    if (!byId.has(gid) || value.includes(gid)) return;
    onChange([...value, gid]);
    setQuery("");
  };

  const remove = (gid: string) => onChange(value.filter(v => v !== gid));

  return (
    <div>
      <div className="fr-mb-1w">
        {value.length === 0 ? (
          <span className="fr-text-mention--grey">Aucun groupe</span>
        ) : (
          <TagsGroup
            smallTags
            tags={
              value.map<TagProps>(gid => ({
                children: byId.get(gid) ?? gid,
                dismissible: true,
                nativeButtonProps: { onClick: () => remove(gid), title: "Retirer ce groupe" },
              })) as [TagProps, ...TagProps[]]
            }
          />
        )}
      </div>

      <Autocomplete
        multiple
        disableCloseOnSelect
        disablePortal
        autoHighlight
        options={available}
        getOptionLabel={o => `${o.id}`}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        value={[]}
        inputValue={query}
        onInputChange={(_, v) => setQuery(v ?? "")}
        onChange={(_, newValue) => addMany(newValue.map(o => o.id))}
        filterSelectedOptions
        slotProps={{ listbox: { style: { maxHeight: 240 } } }}
        renderInput={params => (
          <div ref={params.InputProps.ref}>
            <Input
              iconId="fr-icon-search-line"
              label={label}
              className={cx(params.inputProps.className)}
              nativeInputProps={{
                ...params.inputProps,
                placeholder: params.inputProps.placeholder ?? "Rechercher un groupe…",
                onKeyDown: e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const first = available[0];
                    if (first) addOne(first.id);
                  }
                },
              }}
            />
          </div>
        )}
      />
    </div>
  );
}

export const AdminConfigForm = ({ initialConfig }: Props) => {
  const methods = useForm<FullConfig>({
    resolver: standardSchemaResolver(FullConfigSchema),
    mode: "onChange",
    defaultValues: initialConfig,
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    watch,
    formState: { errors, isDirty, isValid },
  } = methods;

  const groupsFA = useFieldArray({ control, name: "groups" });
  const startupsFA = useFieldArray({ control, name: "startups" });
  const watchedGroups = watch("groups");

  const [status, setStatus] = useState<{ text: string; type: "err" | "ok" } | null>(null);

  const onSubmit = handleSubmit(async data => {
    setStatus(null);
    const res = await saveConfig(data);
    if (res.ok) {
      setStatus({ type: "ok", text: "Configuration sauvegardée ✅" });
      startTransition(() => reset(data)); // reset du dirty state
    } else {
      setStatus({ type: "err", text: res.error || "Échec de la sauvegarde" });
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
              { children: "Réinitialiser", priority: "secondary", onClick: () => reset(initialConfig) },
              { children: "Enregistrer", priority: "primary", type: "submit", disabled: !isDirty || !isValid },
            ]}
          />
          {status && (
            <div className={`fr-alert ${status.type === "ok" ? "fr-alert--success" : "fr-alert--error"} fr-mt-2w`}>
              <p>{status.text}</p>
            </div>
          )}
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
                    onClick: () => groupsFA.append({ id: "", name: "", enabled: true, description: "" }),
                    priority: "secondary",
                  },
                ]}
              />
            </div>

            <ClientAnimate className={styles.scroll}>
              {groupsFA.fields.length === 0 && <p className="fr-text-mention--grey">Aucun groupe.</p>}

              {groupsFA.fields.map((g, i) => (
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
              ))}
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
                    onClick: () => startupsFA.append({ id: "", groups: [], enabled: true }),
                    priority: "secondary",
                  },
                ]}
              />
            </div>

            <ClientAnimate className={styles.scroll}>
              {startupsFA.fields.length === 0 && <p className="fr-text-mention--grey">Aucune startup.</p>}

              {startupsFA.fields.map((s, si) => (
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
                          type: "url",
                          placeholder: "https://…",
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
                          type: "url",
                          placeholder: "https://…",
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
                          <GroupTagsEditor value={field.value || []} onChange={field.onChange} options={groupOptions} />
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
              ))}
            </ClientAnimate>
          </section>
        </div>
      </form>
    </FormProvider>
  );
};
