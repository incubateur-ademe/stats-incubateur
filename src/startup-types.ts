export interface BetaGouvStartup {
  accessibility_status: string;
  active_members: string[];
  budget_url: string | null;
  contact: string;
  content: string;
  dashlord_url: string | null;
  expired_members: string[];
  id: string;
  impact_url: string | null;
  incubator: string;
  link: string;
  mission: string;
  mon_service_securise: boolean;
  name: string;
  phases: Array<{
    name: string;
    start: string; // ISO date
  }>;
  previous_members: string[];
  redirect_from: string | null;
  repository: string;
  screenshot: string;
  stats_url: string | null;
  techno: string[];
  usertypes: string[];
}

import z from "zod";

z.config(z.locales.fr());

export const StartupGroupConfigSchema = z.object({
  /** Optional description of the group */
  description: z
    .string()
    .optional()
    .transform(v => v?.trim() || undefined),
  /** Whether the group and its startups are enabled (visible in the UI) */
  enabled: z.boolean().optional(),
  /** Unique identifier of the group */
  id: z
    .string()
    .min(1, "L'id du groupe est requis.")
    .regex(/^[a-z0-9-._]+$/, "id: minuscules, chiffres, tirets, points, underscores"),
  /** Name of the group */
  name: z.string().min(1, "Le nom du groupe est requis"),
});

export const StartupConfigSchema = z.object({
  /** Whether the startup is enabled (visible in the UI) */
  enabled: z.boolean().optional(),
  /** Groups the startup belongs to (ids) */
  groups: z.array(z.string().min(1)).default([]),
  /** Unique identifier of the startup (matches the id on beta.gouv.fr). */
  id: z
    .string()
    .min(1, "L'id de la startup est requis.")
    .regex(/^[a-z0-9-._]+$/, "id: minuscules, chiffres, tirets, points, underscores"),
  /** Custom name to use instead of the one from beta.gouv.fr */
  nameOverride: z
    .string()
    .transform(v => v?.trim())
    .optional(),
  /** Custom north star description to use instead of the one from the startup own /api/stats route */
  northStarOverride: z
    .string()
    .transform(v => v?.trim())
    .optional(),
  /** URL to fetch stats from */
  statsUrl: z.url("URL invalide").optional(),
  /** Custom stats website to use instead of the one from beta.gouv.fr */
  websiteOverride: z.url("URL invalide").optional(),
});

export const FullConfigSchema = z
  .object({
    groups: z.array(StartupGroupConfigSchema),
    startups: z.array(StartupConfigSchema),
  })
  .check(ctx => {
    const input = ctx.value;
    const groupIds = input.groups.map(g => g.id);
    const startupIds = input.startups.map(s => s.id);
    const dup = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) !== i);
    const dupGroups = new Set(dup(groupIds));
    const dupStartups = new Set(dup(startupIds));

    // signale précisément les doublons (sur le champ "id")
    groupIds.forEach((id, i) => {
      if (dupGroups.has(id)) {
        ctx.issues.push({
          code: "custom",
          input,
          message: `ID de groupe dupliqué: "${id}"`,
          path: ["groups", i, "id"],
        });
      }
    });
    startupIds.forEach((id, i) => {
      if (dupStartups.has(id)) {
        ctx.issues.push({
          code: "custom",
          input,
          message: `ID de startup dupliqué: "${id}"`,
          path: ["startups", i, "id"],
        });
      }
    });

    // références de groupes valides
    const known = new Set(groupIds);
    input.startups.forEach((s, si) => {
      s.groups.forEach((gid, gi) => {
        if (!known.has(gid)) {
          ctx.issues.push({
            code: "custom",
            input,
            message: `Groupe "${gid}" introuvable`,
            path: ["startups", si, "groups", gi],
          });
        }
      });
    });
  });

export type FullConfig = z.infer<typeof FullConfigSchema>;
export type StartupConfig = z.infer<typeof StartupConfigSchema>;
export type StartupGroupConfig = z.infer<typeof StartupGroupConfigSchema>;
