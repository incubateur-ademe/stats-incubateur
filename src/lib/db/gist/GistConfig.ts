import type OctokitTypes from "@octokit/openapi-types";
import { type Octokit } from "octokit";

import { type FullConfig } from "@/startup-types";

export type GistConfigClientOptions = {
  /** Nom du fichier dans le gist */
  filename: string;
  /** ID du Gist */
  gistId: string;
};

export interface GistConfig extends FullConfig {
  updatedAt?: string; // ISO date
  version: string; // SHA du commit
}

export class GistConfigClient {
  #octokit: Octokit;
  #gistId: string;
  #filename: string;

  constructor(octokit: Octokit, opts: GistConfigClientOptions) {
    this.#octokit = octokit;
    this.#gistId = opts.gistId;
    this.#filename = opts.filename;
  }

  /**
   * Met à jour (ou crée) le fichier de config dans le Gist.
   * NB: L’API "update a gist" ne supporte pas de message de commit personnalisé,
   * on peut toutefois mettre à jour la "description" du Gist si besoin.
   */
  public async updateConfig(config: FullConfig, description?: string): Promise<void> {
    const copy = { ...config } as Partial<GistConfig>;
    delete copy.updatedAt;
    delete copy.version;
    const content = JSON.stringify(copy, null, 2);
    await this.#octokit.rest.gists.update({
      gist_id: this.#gistId,
      description,
      files: { [this.#filename]: { content } },
    });
  }

  /** Récupère l’historique (liste des commits/révisions) du Gist. */
  public async getHistory(per_page = 30, page = 1): Promise<Array<OctokitTypes.components["schemas"]["gist-history"]>> {
    const { data } = await this.#octokit.rest.gists.listCommits({
      gist_id: this.#gistId,
      per_page,
      page,
    });
    return data.map(c => ({
      version: c.version,
      committed_at: c.committed_at,
      change_status: c.change_status,
      url: c.url,
    }));
  }

  /** Lit la config à une révision donnée (SHA). */
  public async readRevision(sha: string): Promise<GistConfig> {
    const { data } = await this.#octokit.rest.gists.getRevision({
      gist_id: this.#gistId,
      sha,
    });
    return { ...(await this.#readFileFromGist(data)), updatedAt: data.updated_at, version: sha };
  }

  /** Récupère la config actuelle (HEAD). */
  public async getConfig(): Promise<GistConfig> {
    const { data } = await this.#octokit.rest.gists.get({ gist_id: this.#gistId });
    return { ...(await this.#readFileFromGist(data)), updatedAt: data.updated_at, version: "HEAD" };
  }

  // -- Helpers --

  /** Extrait et retourne le contenu du fichier ciblé; gère le cas "truncated". */
  async #readFileFromGist(gist: OctokitTypes.components["schemas"]["gist-simple"]): Promise<GistConfig> {
    const file = gist.files?.[this.#filename];
    if (!file) {
      throw new Error(`Fichier '${this.#filename}' introuvable dans le gist ${this.#gistId}`);
    }

    // Si le contenu est tronqué, on retélécharge via raw_url (plein texte).
    let text: string;
    if (file.truncated && file.raw_url) {
      const response = await this.#octokit.request(`GET ${file.raw_url}`);
      text = typeof response.data === "string" ? response.data : String(response.data);
    } else if (typeof file.content === "string") {
      text = file.content;
    } else if (file.raw_url) {
      const response = await this.#octokit.request(`GET ${file.raw_url}`);
      text = typeof response.data === "string" ? response.data : String(response.data);
    } else {
      throw new Error("Impossible de lire le contenu (ni content, ni raw_url).");
    }

    return JSON.parse(text) as GistConfig;
  }
}
