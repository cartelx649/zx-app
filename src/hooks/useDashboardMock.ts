import { useMemo } from "react";
import { mockDashboard } from "@/lib/mock-dashboard";
import type { DashboardMock } from "@/lib/types/dashboard";

export function useDashboardMock(): DashboardMock {
  return useMemo(() => mockDashboard, []);
}
