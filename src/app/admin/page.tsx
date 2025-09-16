import { Container } from "@/dsfr";
import { DsfrPage } from "@/dsfr/layout/DsfrPage";
import { gistConfigClient } from "@/lib/db/gist/client";

import { AdminConfigForm } from "./AdminConfigForm";

const AdminPage = async () => {
  const gistConfig = await gistConfigClient.getConfig();

  return (
    <DsfrPage>
      <Container fluid py="4w" px="2w">
        <h1>Configuration – Admin</h1>
        <AdminConfigForm initialConfig={gistConfig} />
      </Container>
    </DsfrPage>
  );
};

export default AdminPage;
