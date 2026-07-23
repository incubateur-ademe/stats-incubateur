import Button, { type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/dsfr";
import { DsfrPage } from "@/dsfr/layout/DsfrPage";
import { gistConfigClient } from "@/lib/db/gist/client";
import { fetchBetaStartup } from "@/lib/fetchBetaStartup";
import { SettingsConfigSchema } from "@/startup-types";

import { betaFicheUrl, computeStartupTags, groupHref } from "../_stats/links";
import { sharedMetadata } from "../shared-metadata";
import { StartupDetail } from "./StartupDetail";

interface PageProps {
  params: Promise<{ startupId: string }>;
}

/** Bouton de lien externe: cliquable si l'URL existe (beta ou surcharge), desactive sinon. */
const externalButton = (label: string, url: string | undefined): ButtonProps =>
  url
    ? { children: label, linkProps: { href: url, target: "_blank" }, priority: "tertiary" }
    : { children: label, disabled: true, priority: "tertiary" };

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { startupId } = await params;
  const { startups } = await gistConfigClient.getConfig();
  const startup = startups.find(s => s.id === startupId);

  if (!startup) {
    return { title: "Startup introuvable" };
  }

  const betaStartup = await fetchBetaStartup(startupId);
  const name = betaStartup?.name ?? startup.nameOverride ?? startupId;
  const title = `${name} - Statistiques`;

  return {
    ...sharedMetadata,
    alternates: {
      canonical: `/${startupId}`,
    },
    openGraph: {
      ...sharedMetadata.openGraph,
      title,
      url: `/${startupId}`,
    },
    title,
  };
};

const StartupPage = async ({ params }: PageProps) => {
  const { startupId } = await params;
  const { groups, settings, startups } = await gistConfigClient.getConfig();
  const startup = startups.find(s => s.id === startupId);

  if (!startup) {
    notFound();
  }

  const betaStartup = await fetchBetaStartup(startupId);
  const name = betaStartup?.name ?? startup.nameOverride ?? startupId;
  const website = betaStartup?.link ?? startup.websiteOverride;

  const statsPageUrl = betaStartup?.stats_url ?? undefined;
  const impactUrl = betaStartup?.impact_url ?? startup.impactUrlOverride;
  const budgetUrl = betaStartup?.budget_url ?? startup.budgetUrlOverride;

  const tags = computeStartupTags(startup.groups ?? [], groups ?? []);
  const parsedSettings = SettingsConfigSchema.parse(settings ?? {});

  const externalButtons: [ButtonProps, ...ButtonProps[]] = [
    externalButton("Mesure d'impact", impactUrl),
    externalButton("Budget", budgetUrl),
    externalButton("Stats", statsPageUrl),
    {
      children: "Fiche beta.gouv.fr",
      linkProps: { href: betaFicheUrl(startupId), target: "_blank" },
      priority: "tertiary",
    },
  ];

  return (
    <DsfrPage>
      <Container py="4w" fluid px="4w">
        <Button priority="tertiary no outline" iconId="fr-icon-arrow-left-line" linkProps={{ href: "/" }}>
          Retour
        </Button>

        <h2 className="fr-mt-2w">{name}</h2>

        {tags.length > 0 && (
          <ul className="fr-tags-group fr-mt-1w">
            {tags.map(tag => (
              <li key={tag.id}>
                <Tag small linkProps={{ href: groupHref(tag.id) }}>
                  {tag.name}
                </Tag>
              </li>
            ))}
          </ul>
        )}

        {website && (
          <p>
            <a href={website} target="_blank" rel="noopener noreferrer" className="fr-link">
              {website}
            </a>
          </p>
        )}

        <ButtonsGroup
          inlineLayoutWhen="always"
          buttonsSize="small"
          buttonsEquisized={false}
          buttons={externalButtons}
        />

        <StartupDetail startupId={startupId} name={name} showTrend={parsedSettings.showTrend} />
      </Container>
    </DsfrPage>
  );
};

export default StartupPage;
