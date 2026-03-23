"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Loader } from "@/components/utils/Loader";

import { type GistHistoryEntry, getConfigHistory, restoreConfigRevision } from "./action";

export function ConfigHistory() {
  const router = useRouter();
  const [history, setHistory] = useState<GistHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmSha, setConfirmSha] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await getConfigHistory();
    if (res.ok && res.data) {
      setHistory(res.data);
      setLoaded(true);
    } else if (!res.ok) {
      setError(res.error);
    }
    setLoading(false);
  };

  const restore = async (sha: string) => {
    setRestoring(true);
    setError("");
    const res = await restoreConfigRevision(sha);
    if (res.ok) {
      setConfirmSha(null);
      router.refresh();
    } else {
      setError(res.error);
    }
    setRestoring(false);
  };

  if (!loaded) {
    return (
      <div className="fr-mt-2w">
        <Button priority="tertiary" onClick={() => void load()} disabled={loading}>
          {loading ? "Chargement..." : "Voir l'historique"}
        </Button>
      </div>
    );
  }

  return (
    <div className="fr-mt-2w">
      <h3 className="fr-h6">Historique des modifications</h3>

      {error && <Alert severity="error" title={error} description="" small className="fr-mb-2w" />}

      {loading ? (
        <Loader loading size="1.5em" />
      ) : history.length === 0 ? (
        <p className="fr-text-mention--grey">Aucun historique disponible.</p>
      ) : (
        <ul className="fr-raw-list">
          {history.map(entry => {
            const sha = entry.version ?? "";
            const isConfirming = confirmSha === sha;
            return (
              <li
                key={sha}
                className="fr-py-1w fr-px-2w fr-mb-1w"
                style={{
                  background: fr.colors.decisions.background.alt.grey.default,
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <strong>{sha.slice(0, 7)}</strong>
                  {entry.committed_at && (
                    <span className="fr-ml-2w fr-text-mention--grey">
                      {format(new Date(entry.committed_at), "dd MMM yyyy HH:mm", { locale: frLocale })}
                    </span>
                  )}
                  {entry.change_status && (
                    <span className="fr-ml-2w fr-text--xs">
                      +{entry.change_status.additions ?? 0} / -{entry.change_status.deletions ?? 0}
                    </span>
                  )}
                </div>
                <div>
                  {isConfirming ? (
                    <>
                      <Button size="small" priority="primary" onClick={() => void restore(sha)} disabled={restoring}>
                        {restoring ? "Restauration..." : "Confirmer"}
                      </Button>
                      <Button
                        size="small"
                        priority="tertiary"
                        onClick={() => setConfirmSha(null)}
                        className="fr-ml-1w"
                        disabled={restoring}
                      >
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <Button size="small" priority="tertiary" onClick={() => setConfirmSha(sha)}>
                      Restaurer
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
