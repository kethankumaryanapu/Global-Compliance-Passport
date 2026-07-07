import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';

export default function StartupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Shared Dashboard Sidebar */}
      <Suspense fallback={<div className="w-64 bg-card/60 dark:bg-zinc-950/60 border-r border-border/40 h-screen shrink-0" />}>
        <Sidebar />
      </Suspense>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 relative radial-glow">
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
