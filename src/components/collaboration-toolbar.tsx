'use client';

import React, { useState } from 'react';
import { useCollaboration } from '@/context/collaboration-context';
import { useMessaging } from '@/context/messaging-context';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Palette,
  LogOut,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  MoreVertical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface CollaborationToolbarProps {
  onStartCollaborativeSession?: (canvasName: string) => void;
}

export function CollaborationToolbar({ onStartCollaborativeSession }: CollaborationToolbarProps) {
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState('');
  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [discoverableCanvases, setDiscoverableCanvases] = useState<any[]>([]);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false);
  
  const {
    currentCanvas,
    isCollaborating,
    collaborators,
    createCollaborativeCanvas,
    joinCanvasByShareCode,
    getDiscoverableCanvases,
    leaveCollaborativeCanvas,
    isLoading,
  } = useCollaboration();
  
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleCreateCollaborativeCanvas = async () => {
    if (!newCanvasName.trim() || !currentUser) return;
    
    setIsCreatingCanvas(true);
    const canvasId = await createCollaborativeCanvas(newCanvasName.trim());
    
    if (canvasId && onStartCollaborativeSession) {
      onStartCollaborativeSession(newCanvasName.trim());
      setNewCanvasName('');
      setIsInviteSheetOpen(false);
    }
    setIsCreatingCanvas(false);
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    
    const success = await joinCanvasByShareCode(joinCode.trim());
    if (success) {
      setJoinCode('');
      setIsInviteSheetOpen(false);
      if (onStartCollaborativeSession) {
        onStartCollaborativeSession('Joined Canvas');
      }
    }
  };

  const handleDiscoverCanvases = async () => {
    setIsLoadingDiscovery(true);
    const canvases = await getDiscoverableCanvases();
    setDiscoverableCanvases(canvases);
    setIsLoadingDiscovery(false);
  };

  const handleJoinDiscoveredCanvas = async (shareCode: string) => {
    const success = await joinCanvasByShareCode(shareCode);
    if (success) {
      setIsInviteSheetOpen(false);
      if (onStartCollaborativeSession) {
        onStartCollaborativeSession('Joined Canvas');
      }
    }
  };

  const copyShareCode = async () => {
    if (!currentCanvas?.shareCode) return;
    
    try {
      await navigator.clipboard.writeText(currentCanvas.shareCode);
      toast({
        title: "Share Code Copied!",
        description: `Code "${currentCanvas.shareCode}" copied to clipboard`,
      });
    } catch (error) {
      console.error('Failed to copy share code:', error);
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!currentUser) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-2 bg-background border-b">
        {/* Collaboration Status */}
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          {isCollaborating && currentCanvas ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <span className="hidden md:inline">Collaborating: </span>{currentCanvas.name}
              </Badge>
              {currentCanvas.ownerId === currentUser.id && (
                <Crown className="h-3 w-3 text-yellow-500" />
              )}
              {currentCanvas.shareCode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyShareCode}
                  className="hidden md:flex text-xs px-2 h-6"
                >
                  Code: {currentCanvas.shareCode} 📋
                </Button>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Solo Mode</span>
          )}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Collaborators Display */}
        {isCollaborating && (
          <>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground hidden md:inline">
                {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-muted-foreground md:hidden">
                {collaborators.length}
              </span>
            </div>
            
            <div className="hidden md:flex -space-x-1">
              {collaborators.slice(0, 4).map((collaborator) => (
                <Tooltip key={collaborator.userId}>
                  <TooltipTrigger>
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(collaborator.userName)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-medium">{collaborator.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {collaborator.isOnline ? 'Online' : 'Offline'}
                      </p>
                      {collaborator.currentTool && (
                        <p className="text-xs">Using: {collaborator.currentTool}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
              {collaborators.length > 4 && (
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    +{collaborators.length - 4}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </>
        )}

        <div className="flex-1" />

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Mobile Actions Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Session Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setIsInviteSheetOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isCollaborating ? 'Share Session' : 'Join / Create'}
                </DropdownMenuItem>
                {isCollaborating && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={leaveCollaborativeCanvas}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Leave Session
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => setIsInviteSheetOpen(true)}
            >
              <UserPlus className="h-3 w-3" />
              {isCollaborating ? 'Share' : 'Join/Create'}
            </Button>

            {isCollaborating && (
              <Button
                variant="outline"
                size="sm"
                onClick={leaveCollaborativeCanvas}
                className="gap-1 text-destructive hover:text-destructive"
              >
                <LogOut className="h-3 w-3" />
                Leave
              </Button>
            )}
          </div>

          {/* Share/Join Sheet (Controlled by state) */}
          <Sheet open={isInviteSheetOpen} onOpenChange={setIsInviteSheetOpen}>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>
                  Collaborative Canvas
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-4 space-y-4">
                {/* Current Canvas Share */}
                {isCollaborating && currentCanvas && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Share This Canvas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={currentCanvas.shareCode}
                          readOnly
                          className="font-mono text-center text-lg font-bold"
                        />
                        <Button size="sm" onClick={copyShareCode}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Share this code with others so they can join your canvas!
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Create New Session */}
                {!isCollaborating && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Create New Canvas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        placeholder="Canvas name..."
                        value={newCanvasName}
                        onChange={(e) => setNewCanvasName(e.target.value)}
                        maxLength={50}
                      />
                      <Button 
                        onClick={handleCreateCollaborativeCanvas}
                        disabled={!newCanvasName.trim() || isCreatingCanvas}
                        className="w-full"
                        size="sm"
                      >
                        {isCreatingCanvas ? 'Creating...' : 'Create & Get Share Code'}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Join by Code */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Join Canvas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Enter 6-digit code..."
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="font-mono text-center text-lg"
                    />
                    <Button 
                      onClick={handleJoinByCode}
                      disabled={!joinCode.trim() || isLoading}
                      className="w-full"
                      size="sm"
                      >
                        {isLoading ? 'Joining...' : 'Join Canvas'}
                      </Button>
                    </CardContent>
                  </Card>
  
                  {/* Discover Public Canvases */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Discover Canvases</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        onClick={handleDiscoverCanvases}
                        disabled={isLoadingDiscovery}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        {isLoadingDiscovery ? 'Loading...' : 'Find Public Canvases'}
                      </Button>
                      
                      {discoverableCanvases.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {discoverableCanvases.map((canvas) => (
                            <div key={canvas.id} className="flex items-center gap-2 p-2 border rounded">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{canvas.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  by {canvas.ownerName} • {canvas.collaboratorsCount} users
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleJoinDiscoveredCanvas(canvas.shareCode)}
                                disabled={isLoading}
                              >
                                Join
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </SheetContent>
            </Sheet>
        </div>
      </div>
    </TooltipProvider>
  );
} 