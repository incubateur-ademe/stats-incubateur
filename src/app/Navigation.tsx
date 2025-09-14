"use client";

import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import { useSelectedLayoutSegment } from "next/navigation";

import { type EnrichedStartup } from "./_stats/types";

interface NavigationProps {
  startups: EnrichedStartup[];
}
export const Navigation = ({ startups }: NavigationProps) => {
  const segment = useSelectedLayoutSegment("default");

  return (
    <MainNavigation
      items={[
        {
          text: "Global",
          linkProps: {
            href: "/",
          },
          isActive: !segment,
        },
        {
          isActive: startups.some(s => s.id === segment),
          menuLinks: startups
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(s => ({
              text: s.name,
              linkProps: {
                href: `/${s.id}`,
              },
              isActive: segment === s.id,
            })),
          text: "Startups",
        },
      ]}
    />
  );
};
