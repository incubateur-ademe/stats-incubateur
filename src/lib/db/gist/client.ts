import { Octokit } from "octokit";

import { config } from "@/config";

import { GistConfigClient } from "./GistConfig";

export const gistConfigClient = new GistConfigClient(
  new Octokit({
    auth: config.gistConfig.token,
  }),
  {
    filename: config.gistConfig.filename,
    gistId: config.gistConfig.gistId,
  },
);
