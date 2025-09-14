import { inspect } from "util";

import { DsfrPage } from "@/dsfr/layout/DsfrPage";
import { gistConfigClient } from "@/lib/db/gist/client";

const AdminPage = async () => {
  const gistConfig = await gistConfigClient.getConfig();
  const history = await gistConfigClient.getHistory();
  console.log(inspect({ gistConfig, history }, true, 10, true));
  for (const rev of history) {
    if (!rev.version) continue;
    const revConfig = await gistConfigClient.readRevision(rev.version);
    console.log(`--- REV ${rev.version} @ ${rev.committed_at} ---`, revConfig);
  }

  return <DsfrPage>Admin Page</DsfrPage>;
};

export default AdminPage;
