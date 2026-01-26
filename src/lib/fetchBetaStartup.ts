import { config } from "@/config";
import { type BetaGouvStartup } from "@/startup-types";

export const fetchBetaStartup = async (id: string) => {
  const res = await fetch(`${config.betaGouvUrl}/api/v3/startups/${id}.json`, {
    next: { revalidate: 3600 }, // 1 hour
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch startup data for id ${id}: ${res.statusText} (url: ${res.url})`);
  }
  return res.json() as Promise<BetaGouvStartup>;
};
