'use client';

import { Sidebar, SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/sidebar-nav';
import { Button } from './ui/button';

import { usePathname } from 'next/navigation';
import { AdminSidebarNav } from '@/components/admin-sidebar-nav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Hide sidebar on admin login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const isAdminPath = pathname?.startsWith('/admin') ?? false;

  return (
    <SidebarProvider>
        <Sidebar className="h-full border-r" collapsible="icon">
          {isAdminPath ? <AdminSidebarNav /> : <SidebarNav />}
        </Sidebar>
        <SidebarInset className="max-w-full">
            <header className="p-2 md:hidden flex items-center gap-2 border-b">
                <SidebarTrigger asChild>
                    <Button variant="ghost" size="icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg></Button>
                </SidebarTrigger>
                <h1 className="text-lg font-headline font-semibold">Artify</h1>
            </header>
          {children}
        </SidebarInset>
    </SidebarProvider>
  );
}
