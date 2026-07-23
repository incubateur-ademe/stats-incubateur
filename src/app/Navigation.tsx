"use client";

import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import { useSearchParams, useSelectedLayoutSegment } from "next/navigation";

import { type StartupGroupConfig } from "@/startup-types";

import { groupHref } from "./_stats/links";
import { type EnrichedStartup } from "./_stats/types";

interface NavigationProps {
  groups: StartupGroupConfig[];
  startups: EnrichedStartup[];
}
export const Navigation = ({ groups, startups }: NavigationProps) => {
  const segment = useSelectedLayoutSegment("default");
  const currentGroup = useSearchParams().get("group");

  return (
    <MainNavigation
      items={[
        {
          isActive: !segment && !currentGroup,
          linkProps: {
            href: "/",
          },
          text: "Global",
        },
        ...groups
          .filter(g => g.showInNav && g.enabled !== false)
          .map(g => ({
            isActive: currentGroup === g.id,
            linkProps: {
              href: groupHref(g.id),
            },
            text: g.name,
          })),
        {
          isActive: startups.some(s => s.id === segment),
          menuLinks: [...startups]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(s => ({
              isActive: segment === s.id,
              linkProps: {
                href: `/${s.id}`,
              },
              text: s.name,
            })),
          text: "Startups",
        },
      ]}
    />
  );
};
