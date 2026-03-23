import Button from "@codegouvfr/react-dsfr/Button";
import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/dsfr";
import { DsfrPage } from "@/dsfr/layout/DsfrPage";
import { gistConfigClient } from "@/lib/db/gist/client";
import { fetchBetaStartup } from "@/lib/fetchBetaStartup";

import { sharedMetadata } from "../shared-metadata";
import { StartupDetail } from "./StartupDetail";

interface PageProps {
  params: Promise<{ startupId: string }>;
}

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
  const { startups } = await gistConfigClient.getConfig();
  const startup = startups.find(s => s.id === startupId);

  if (!startup) {
    notFound();
  }

  const betaStartup = await fetchBetaStartup(startupId);
  const name = betaStartup?.name ?? startup.nameOverride ?? startupId;
  const website = betaStartup?.link ?? startup.websiteOverride;

  return (
    <DsfrPage>
      <Container py="4w" fluid px="4w">
        <Button priority="tertiary no outline" iconId="fr-icon-arrow-left-line" linkProps={{ href: "/" }}>
          Retour
        </Button>

        <h2 className="fr-mt-2w">{name}</h2>

        {website && (
          <p>
            <a href={website} target="_blank" rel="noopener noreferrer" className="fr-link">
              {website}
            </a>
          </p>
        )}

        <StartupDetail startupId={startupId} name={name} />
      </Container>
    </DsfrPage>
  );
};

export default StartupPage;
