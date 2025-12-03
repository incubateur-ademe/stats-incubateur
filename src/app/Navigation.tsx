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
          isActive: !segment,
          linkProps: {
            href: "/",
          },
          text: "Global",
        },
        {
          isActive: startups.some(s => s.id === segment),
          menuLinks: startups
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
