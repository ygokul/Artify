'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Trophy, LogOut } from 'lucide-react';
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Separator } from '@/components/ui/separator';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/contests', label: 'Contests', icon: Trophy },
];

export function AdminSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isLinkActive = (href: string) => {
    if (!pathname) return false;
    // Exact match for admin root, startsWith for sub-pages
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  const handleLogout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  return (
    <>
      <SidebarHeader>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/admin" className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                         <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                         <path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                <span className="font-headline text-xl font-semibold">Admin</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">Admin Portal</TooltipContent>
        </Tooltip>
      </SidebarHeader>
      <SidebarMenu>
        {adminLinks.map((link) => (
          <SidebarMenuItem key={link.href}>
            <Link href={link.href} className="w-full">
              <SidebarMenuButton isActive={isLinkActive(link.href)} tooltip={link.label}>
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      
      <SidebarFooter className="mt-auto">
        <Separator className="my-2" />
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
