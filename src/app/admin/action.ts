"use server";

import { cookies } from "next/headers";
import z from "zod";

import { gistConfigClient } from "@/lib/db/gist/client";
import { fetchBetaStartup } from "@/lib/fetchBetaStartup";
import { type FullConfig, FullConfigSchema } from "@/startup-types";
import { type ServerActionResponse } from "@/utils/next";

import { isAuthCookieExpired } from "./cookies";

const parseOctokitError = (error: unknown): string => {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    switch (status) {
      case 401:
        return "Token GitHub expire ou invalide.";
      case 403:
        return "Acces refuse au Gist (quota depasse ou permissions insuffisantes).";
      case 404:
        return "Gist de configuration introuvable (ID incorrect ?).";
      case 422:
        return "Donnees rejetees par GitHub.";
    }
  }
  return "Erreur lors de la communication avec GitHub.";
};

const assertAuth = async (): Promise<{ error: string; ok: false } | null> => {
  if (isAuthCookieExpired(await cookies())) {
    return { error: "Non autorise.", ok: false };
  }
  return null;
};

export const saveConfig = async (config: FullConfig): Promise<ServerActionResponse<void>> => {
  const denied = await assertAuth();
  if (denied) return denied;

  const result = FullConfigSchema.safeParse(config);

  if (!result.success) {
    return {
      error: z.flattenError(result.error).formErrors.join(", "),
      ok: false,
    };
  }

  try {
    await gistConfigClient.updateConfig(result.data);
  } catch (error) {
    console.error("[saveConfig] Gist update failed:", error);
    return {
      error: parseOctokitError(error),
      ok: false,
    };
  }

  return {
    ok: true,
  };
};

export interface GistHistoryEntry {
  change_status: { additions?: number; deletions?: number; total?: number } | null | undefined;
  committed_at: string | null | undefined;
  version: string | null | undefined;
}

export const getConfigHistory = async (page = 1): Promise<ServerActionResponse<GistHistoryEntry[]>> => {
  const denied = await assertAuth();
  if (denied) return denied;

  try {
    const history = await gistConfigClient.getHistory(20, page);
    return {
      data: history.map(h => ({
        change_status: h.change_status,
        committed_at: h.committed_at,
        version: h.version,
      })),
      ok: true,
    };
  } catch (error) {
    return { error: parseOctokitError(error), ok: false };
  }
};

/** Verifie si une startup existe sur beta.gouv.fr et retourne son nom. */
export const checkBetaStartup = async (id: string): Promise<ServerActionResponse<{ name: string }>> => {
  if (!id) return { error: "ID vide.", ok: false };
  const startup = await fetchBetaStartup(id);
  if (!startup) return { error: `Startup "${id}" introuvable sur beta.gouv.fr.`, ok: false };
  return { data: { name: startup.name }, ok: true };
};

export const restoreConfigRevision = async (sha: string): Promise<ServerActionResponse<void>> => {
  const denied = await assertAuth();
  if (denied) return denied;

  try {
    const config = await gistConfigClient.readRevision(sha);
    await gistConfigClient.updateConfig(config, `Restauration de la revision ${sha.slice(0, 7)}`);
    return { ok: true };
  } catch (error) {
    console.error("[restoreConfigRevision] failed:", error);
    return { error: parseOctokitError(error), ok: false };
  }
};
