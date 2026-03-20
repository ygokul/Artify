
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Palette, Sparkles, LayoutGrid, Trophy, Github, LogIn, UserPlus, LogOut, FileText, User, MessageCircle, BookOpen } from 'lucide-react';
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/context/auth-context';
import { useMessaging } from '@/context/messaging-context';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessagingPanel } from './messaging-panel';

const mainLinks = [
  { href: '/', label: 'Canvas', icon: Palette },
  { href: '/generate', label: 'Generate', icon: Sparkles },
  { href: '/gallery', label: 'Gallery', icon: LayoutGrid },
  { href: '/blogs', label: 'Blogs', icon: BookOpen },
  { href: '/contests', label: 'Contests', icon: Trophy },
  { href: '/notepad', label: 'Notepad', icon: FileText },
];

const authLinks = [
    { href: '/login', label: 'Login', icon: LogIn },
    { href: '/register', label: 'Register', icon: UserPlus },
]

export function SidebarNav() {
  const pathname = usePathname();
  const { isLoggedIn, currentUser, logout } = useAuth();
  const { conversations, onlineUsers, setIsPollingEnabled } = useMessaging();
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  
  // Effect to toggle polling
  useEffect(() => {
    setIsPollingEnabled(isMessagingOpen);
  }, [isMessagingOpen, setIsPollingEnabled]);
  
  const isLinkActive = (href: string) => {
    return pathname === href;
  }

  const totalUnreadMessages = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <>
      <SidebarHeader>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/" className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                        <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17 4.5L7 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                <span className="font-headline text-xl font-semibold">Artify</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">Artify Canvas</TooltipContent>
        </Tooltip>
      </SidebarHeader>
      <SidebarMenu>
        {mainLinks.map((link) => (
          <SidebarMenuItem key={link.href}>
            <Link href={link.href} className="w-full">
              <SidebarMenuButton isActive={isLinkActive(link.href)} tooltip={link.label}>
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
        
        {/* Messaging Button - Only show when logged in */}
        {isLoggedIn && (
          <SidebarMenuItem>
            <Sheet open={isMessagingOpen} onOpenChange={setIsMessagingOpen}>
              <SheetTrigger asChild>
                <SidebarMenuButton tooltip="Messages">
                  <div className="relative">
                    <MessageCircle className="h-5 w-5" />
                    {totalUnreadMessages > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                      >
                        {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                      </Badge>
                    )}
                  </div>
                  <span>Messages</span>
                  {onlineUsers.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {onlineUsers.length}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <MessagingPanel onClose={() => setIsMessagingOpen(false)} />
              </SheetContent>
            </Sheet>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
      <SidebarFooter className="mt-auto">
        <Separator className="my-2" />
        <SidebarMenu>
            {!isLoggedIn ? authLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
                <Link href={link.href} className="w-full">
                <SidebarMenuButton isActive={pathname === link.href} tooltip={link.label}>
                    <link.icon className="h-5 w-5" />
                    <span>{link.label}</span>
                </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            )) : (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={`Logged in as ${currentUser?.name}`}>
                    <User className="h-5 w-5" />
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">{currentUser?.name}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">{currentUser?.email}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={logout} tooltip="Logout">
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
        </SidebarMenu>
        <Separator className="my-2" />
        
      </SidebarFooter>
    </>
  );
}
