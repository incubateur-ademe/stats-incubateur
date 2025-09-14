import { type Metadata } from "next";

import { Container } from "@/dsfr";
import { DsfrPage } from "@/dsfr/layout/DsfrPage";
import { gistConfigClient } from "@/lib/db/gist/client";

import { GlobalForm } from "./_stats/GlobalForm";
import { orderAndEnrichStartups } from "./_stats/utils";
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

const Home = async () => {
  // TODO: use context inside client component instead of fetching again
  const { groups, startups } = await gistConfigClient.getConfig();

  const orderedStartups = await orderAndEnrichStartups(startups);

  // const request = pvLivraisonTable.select({
  //   view: "viw6wX4jpRH1BpSLw",
  // });

  // const pvs = await request.all();

  // console.log("============", pvs[0]._rawJson?.fields?.Intitulé);

  return (
    <DsfrPage>
      <Container py="4w" fluid px="4w">
        <h2>Statistiques des Startups de l'Incubateur</h2>
        <GlobalForm startups={orderedStartups} />
      </Container>
    </DsfrPage>
  );
};

export default Home;
