"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { AppSidebar, MobileNav } from "@/components/app-sidebar";
import { WorkbenchView } from "@/components/views/workbench-view";
import { ProjectsView } from "@/components/views/projects-view";
import { ProjectDetail } from "@/components/views/project/project-detail";
import { ReportsView } from "@/components/views/reports-view";
import { SettingsView } from "@/components/views/settings-view";
import { MessagesView } from "@/components/views/messages-view";
import { DocumentsView } from "@/components/views/documents-view";
import { useAppStore } from "@/lib/store";
import { ProjectWizard } from "@/components/views/project/project-wizard";

export default function Home() {
  const { view, selectedProjectId } = useAppStore();
  const [wizardOpen, setWizardOpen] = useState(false);

  const showProjectDetail = view === "projects" && selectedProjectId;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <MobileNav />
        <main className="flex-1 overflow-y-auto">
          {view === "workbench" && <WorkbenchView />}
          {view === "projects" && !showProjectDetail && <ProjectsView />}
          {showProjectDetail && <ProjectDetail />}
          {view === "messages" && <MessagesView />}
          {view === "documents" && <DocumentsView />}
          {view === "reports" && <ReportsView />}
          {view === "settings" && <SettingsView />}
        </main>
      </div>
      <footer className="sticky bottom-0 z-30 mt-auto border-t bg-card px-4 py-2.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-bold text-foreground">Civilic</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            اتصال برقرار
          </span>
          <span>© ۱۴۰۴ — سیوان تدبیر تجارت</span>
        </div>
      </footer>
      <ProjectWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
