import { config } from "@/config";
import { type BetaGouvStartup } from "@/startup-types";

export const fetchBetaStartup = async (id: string): Promise<BetaGouvStartup | null> => {
  const res = await fetch(`${config.betaGouvUrl}/api/v3/startups/${id}.json`, {
    next: { revalidate: 3600 }, // 1 hour
  });
  if (!res.ok) {
    console.warn(`[fetchBetaStartup] ${res.status} for "${id}" (url: ${res.url})`);
    return null;
  }
  return res.json() as Promise<BetaGouvStartup>;
};
