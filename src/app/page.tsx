import Notice from "@codegouvfr/react-dsfr/Notice";
import { type Metadata } from "next";

import { Container } from "@/dsfr";
import { DsfrPage } from "@/dsfr/layout/DsfrPage";

import { GlobalForm } from "./_stats/GlobalForm";
import { getStatsBundle } from "./_stats/utils";
import { sharedMetadata } from "./shared-metadata";

const url = "/";

export const metadata: Metadata = {
  ...sharedMetadata,
  alternates: {
    canonical: url,
  },
  openGraph: {
    ...sharedMetadata.openGraph,
    url,
  },
};

const Home = async ({ searchParams }: { searchParams: Promise<{ group?: string }> }) => {
  const { group } = await searchParams;
  const { settings, startups } = await getStatsBundle();

  const filtered = group ? startups.filter(s => (s.groups ?? []).includes(group)) : startups;

  return (
    <DsfrPage>
      <Container py="4w" fluid px="4w">
        <h2>Statistiques des Startups de l'Incubateur</h2>
        {filtered.length === 0 ? (
          <Notice title="Aucune startup configuree pour le moment." />
        ) : (
          <GlobalForm startups={filtered} showTrend={settings.showTrend} defaultOrder={settings.defaultOrder} />
        )}
      </Container>
    </DsfrPage>
  );
};

export default Home;
