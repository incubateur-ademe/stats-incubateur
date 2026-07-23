"use client";

import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import { useSearchParams, useSelectedLayoutSegment } from "next/navigation";

import { type StartupGroupConfig } from "@/startup-types";

import { groupHref } from "./_stats/links";
import { type EnrichedStartup } from "./_stats/types";

interface NavigationProps {
  currentGroup: string | null;
  groups: StartupGroupConfig[];
  startups: EnrichedStartup[];
}

export const Navigation = ({ currentGroup, groups, startups }: NavigationProps) => {
  const segment = useSelectedLayoutSegment("default");

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

/**
 * useSearchParams impose une Suspense boundary (bailout CSR au prerender statique, ex: /_not-found).
 * On isole donc la lecture du param group ici; le fallback rend la nav sans etat actif de groupe.
 */
export const NavigationLive = (props: Omit<NavigationProps, "currentGroup">) => {
  const currentGroup = useSearchParams().get("group");
  return <Navigation {...props} currentGroup={currentGroup} />;
};
