import Badge from "@codegouvfr/react-dsfr/Badge";
import Header from "@codegouvfr/react-dsfr/Header";
import { Suspense } from "react";

import { Brand } from "@/components/Brand";
import { config } from "@/config";
import { type StartupGroupConfig } from "@/startup-types";

import { type EnrichedStartup } from "./_stats/types";
import { Navigation, NavigationLive } from "./Navigation";

interface DefaultHeaderProps {
  groups: StartupGroupConfig[];
  startups: EnrichedStartup[];
}

export const DefaultHeader = ({ groups, startups }: DefaultHeaderProps) => (
  <Header
    navigation={
      config.maintenance ? null : (
        <Suspense fallback={<Navigation currentGroup={null} startups={startups} groups={groups} />}>
          <NavigationLive startups={startups} groups={groups} />
        </Suspense>
      )
    }
    brandTop={<Brand />}
    homeLinkProps={{
      href: "/",
      title: `Accueil - ${config.brand.name}`,
    }}
    serviceTitle={
      <>
        {config.brand.name}
        &nbsp;
        <Badge as="span" noIcon severity="warning">
          Alpha
        </Badge>
        {config.maintenance && (
          <Badge as="span" noIcon severity="warning">
            Maintenance
          </Badge>
        )}
      </>
    }
    serviceTagline={config.brand.tagline}
    operatorLogo={config.brand.operator.enable ? config.brand.operator.logo : undefined}
    classes={{
      operator: "shimmer custom-operator-logo",
    }}
  />
);
