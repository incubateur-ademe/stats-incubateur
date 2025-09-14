export interface StartupConfig {
  enabled?: boolean;
  groups: string[];
  id: string;
  northStarOverride?: string;
  statsUrl?: string;
}

export interface StartupGroupConfig {
  description?: string;
  enabled?: boolean;
  id: string;
  name: string;
}

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
  stats_url: string | null;
  techno: string[];
  usertypes: string[];
}
