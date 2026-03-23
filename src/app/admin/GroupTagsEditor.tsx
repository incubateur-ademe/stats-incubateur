"use client";
"use no memo";

import Input from "@codegouvfr/react-dsfr/Input";
import { type TagProps } from "@codegouvfr/react-dsfr/Tag";
import TagsGroup from "@codegouvfr/react-dsfr/TagsGroup";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import Autocomplete from "@mui/material/Autocomplete";
import { useMemo, useState } from "react";

interface GroupTagsEditorProps {
  label?: string;
  onChange: (ids: string[]) => void;
  options: Array<{ id: string; label: string }>;
  value: string[];
}

export function GroupTagsEditor({ label = "Ajouter un groupe", onChange, options, value }: GroupTagsEditorProps) {
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
                onKeyDown: e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const first = available[0];
                    if (first) addOne(first.id);
                  }
                },
                placeholder: params.inputProps.placeholder ?? "Rechercher un groupe...",
              }}
            />
          </div>
        )}
      />
    </div>
  );
}
