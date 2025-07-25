"use client";

import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import { useSelectedLayoutSegment } from "next/navigation";

import { STARTUPS } from "@/config";

export const Navigation = () => {
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
          isActive: STARTUPS.some(s => s.id === segment),
          menuLinks: STARTUPS.sort((a, b) => a.name.localeCompare(b.name)).map(s => ({
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
