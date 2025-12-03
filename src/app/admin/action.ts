"use server";

import z from "zod";

import { gistConfigClient } from "@/lib/db/gist/client";
import { type FullConfig, FullConfigSchema } from "@/startup-types";
import { type ServerActionResponse } from "@/utils/next";

export const saveConfig = async (config: FullConfig): Promise<ServerActionResponse<void>> => {
  const result = FullConfigSchema.safeParse(config);

  if (!result.success) {
    return {
      error: z.flattenError(result.error).formErrors.join(", "),
      ok: false,
    };
  }

  await gistConfigClient.updateConfig(result.data);

  return {
    ok: true,
  };
};
