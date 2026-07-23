import { Container } from "@/dsfr";
import { DsfrPage } from "@/dsfr/layout/DsfrPage";
import { gistConfigClient } from "@/lib/db/gist/client";
import { fetchBetaStartup } from "@/lib/fetchBetaStartup";
import { SettingsConfigSchema } from "@/startup-types";

import { AdminConfigForm } from "../AdminConfigForm";

const AdminPage = async () => {
  const gistConfig = await gistConfigClient.getConfig();

  const initialConfig = { ...gistConfig, settings: SettingsConfigSchema.parse(gistConfig.settings ?? {}) };

  // Fetch les noms beta.gouv.fr pour toutes les startups en parallele
  const betaResults = await Promise.allSettled(
    gistConfig.startups.map(async s => {
      const beta = s.allowNoBeta ? null : await fetchBetaStartup(s.id);
      return [s.id, beta?.name ?? null] as const;
    }),
  );
  const betaNames: Record<string, string> = {};
  for (const r of betaResults) {
    if (r.status === "fulfilled" && r.value[1]) {
      betaNames[r.value[0]] = r.value[1];
    }
  }

  return (
    <DsfrPage>
      <Container fluid py="4w" px="2w">
        <h1>Configuration - Admin</h1>
        <AdminConfigForm initialConfig={initialConfig} initialBetaNames={betaNames} />
      </Container>
    </DsfrPage>
  );
};

export default AdminPage;
