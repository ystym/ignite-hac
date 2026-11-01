import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getAIStatus } from "@/lib/env";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const status = getAIStatus();
  return (
    <AppShell mode={status.mode} model={status.model}>
      {children}
    </AppShell>
  );
}
