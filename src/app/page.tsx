import { type Metadata } from "next";

import { STARTUPS } from "@/config";
import { Container } from "@/dsfr";
import { DsfrPage } from "@/dsfr/layout/DsfrPage";

import { GlobalForm } from "./_stats/GlobalForm";
import { sharedMetadata } from "./shared-metadata";

const url = "/";

export const metadata: Metadata = {
  ...sharedMetadata,
  openGraph: {
    ...sharedMetadata.openGraph,
    url,
  },
  alternates: {
    canonical: url,
  },
};

const startupOrdered = STARTUPS.sort((a, b) => {
  // Sort to have the ones with statsUrl at the beginning
  if (a.statsUrl && !b.statsUrl) return -1;
  if (!a.statsUrl && b.statsUrl) return 1;
  return a.name.localeCompare(b.name);
}).map(s => {
  return {
    id: s.id,
    name: s.name,
    website: s.website,
  };
});

const Home = () => {
  return (
    <DsfrPage>
      <Container py="4w" fluid px="4w">
        <h2>Statistiques des Startups de l'Incubateur</h2>
        <GlobalForm startups={startupOrdered} />
      </Container>
    </DsfrPage>
  );
};

export default Home;
