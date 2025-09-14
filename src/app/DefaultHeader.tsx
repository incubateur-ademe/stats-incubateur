import Badge from "@codegouvfr/react-dsfr/Badge";
import Header from "@codegouvfr/react-dsfr/Header";

import { Brand } from "@/components/Brand";
import { config } from "@/config";
import { gistConfigClient } from "@/lib/db/gist/client";

import { orderAndEnrichStartups } from "./_stats/utils";
import { Navigation } from "./Navigation";

export const DefaultHeader = async () => (
  <Header
    navigation={
      config.maintenance ? null : (
        <Navigation startups={await orderAndEnrichStartups((await gistConfigClient.getConfig()).startups)} />
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
