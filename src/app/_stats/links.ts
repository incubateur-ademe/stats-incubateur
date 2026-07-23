import { type StartupGroupConfig } from "@/startup-types";

export interface StartupTag {
  id: string;
  name: string;
}

export const groupHref = (groupId: string): string => `/?group=${encodeURIComponent(groupId)}`;

export const betaFicheUrl = (startupId: string): string => `https://beta.gouv.fr/startups/${startupId}.html`;

export const computeStartupTags = (
  startupGroupIds: readonly string[],
  groups: readonly StartupGroupConfig[],
): StartupTag[] =>
  groups
    .filter(g => g.showAsTag && g.enabled !== false && startupGroupIds.includes(g.id))
    .map(g => ({ id: g.id, name: g.name }));
