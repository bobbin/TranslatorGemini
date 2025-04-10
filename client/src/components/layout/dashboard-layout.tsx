import React, { ReactNode } from "react";
import Sidebar from "./sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <main className="pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}