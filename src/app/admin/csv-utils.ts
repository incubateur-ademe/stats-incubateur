import { type FullConfig, type StartupConfig, type StartupGroupConfig } from "@/startup-types";

const GROUP_HEADERS = ["id", "name", "description", "enabled", "showInNav", "showAsTag"] as const;
const STARTUP_HEADERS = [
  "id",
  "nameOverride",
  "enabled",
  "statsUrl",
  "websiteOverride",
  "northStarOverride",
  "impactUrlOverride",
  "budgetUrlOverride",
  "allowNoBeta",
  "groups",
] as const;

const escapeCsv = (val: boolean | number | string | null | undefined): string => {
  const str = val === undefined || val === null ? "" : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportConfigToCsv = (config: FullConfig): string => {
  const lines: string[] = [];

  lines.push("## GROUPS");
  lines.push(GROUP_HEADERS.join(","));
  for (const g of config.groups) {
    lines.push(GROUP_HEADERS.map(h => escapeCsv(g[h])).join(","));
  }

  lines.push("");
  lines.push("## STARTUPS");
  lines.push(STARTUP_HEADERS.join(","));
  for (const s of config.startups) {
    lines.push(
      STARTUP_HEADERS.map(h => {
        if (h === "groups") return escapeCsv((s.groups ?? []).join(";"));
        return escapeCsv(s[h]);
      }).join(","),
    );
  }

  return lines.join("\n");
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

export const parseConfigFromCsv = (csv: string): Pick<FullConfig, "groups" | "startups"> => {
  const lines = csv.split("\n").map(l => l.trim());
  const groups: StartupGroupConfig[] = [];
  const startups: StartupConfig[] = [];

  let section: "groups" | "startups" | null = null;

  for (const line of lines) {
    if (!line) continue;
    if (line === "## GROUPS") {
      section = "groups";
      continue;
    }
    if (line === "## STARTUPS") {
      section = "startups";
      continue;
    }
    // Skip header rows
    if (line === GROUP_HEADERS.join(",") || line === STARTUP_HEADERS.join(",")) continue;

    const cols = parseCsvLine(line);

    if (section === "groups" && cols.length >= 2) {
      groups.push({
        description: cols[2] || undefined,
        enabled: cols[3] !== "false",
        id: cols[0],
        name: cols[1],
        showAsTag: cols[5] === "true" ? true : undefined,
        showInNav: cols[4] === "true" ? true : undefined,
      });
    }

    if (section === "startups" && cols.length >= 7 && cols[0]) {
      startups.push({
        allowNoBeta: cols[8] === "true" ? true : undefined,
        budgetUrlOverride: cols[7] || undefined,
        enabled: cols[2] !== "false",
        groups: cols[9] ? cols[9].split(";").filter(Boolean) : [],
        id: cols[0],
        impactUrlOverride: cols[6] || undefined,
        nameOverride: cols[1] || undefined,
        northStarOverride: cols[5] || undefined,
        statsUrl: cols[3] || undefined,
        websiteOverride: cols[4] || undefined,
      });
    }
  }

  return { groups, startups };
};
