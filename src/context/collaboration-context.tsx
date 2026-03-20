'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useAuth } from './auth-context';
import { useToast } from '@/hooks/use-toast';

interface CanvasAction {
  id: string;
  type: 'draw' | 'clear' | 'undo' | 'redo';
  userId: string;
  userName: string;
  timestamp: string;
  data: any; // Drawing data, coordinates, etc.
}

interface CollaborativeCanvas {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  collaborators: CanvasCollaborator[];
  actions: CanvasAction[];
  lastUpdate: string;
  isActive: boolean;
  shareCode?: string; // Optional because legacy canvases might not have it immediately
}

interface CanvasCollaborator {
  userId: string;
  userName: string;
  email: string;
  joinedAt: string;
  isOnline: boolean;
  cursor?: { x: number; y: number };
  currentTool?: string;
}

interface CanvasInvitation {
  id: string;
  canvasId: string;
  canvasName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

interface CollaborationContextType {
  // State
  currentCanvas: CollaborativeCanvas | null;
  currentCanvasActions: CanvasAction[];
  collaborators: CanvasCollaborator[];
  receivedInvitations: CanvasInvitation[];
  sentInvitations: CanvasInvitation[];
  isCollaborating: boolean;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;
  socketConnected: boolean; // Kept for API compatibility, always false for Polling

  // Canvas management
  createCollaborativeCanvas: (name: string) => Promise<string | null>;
  joinCollaborativeCanvas: (canvasId: string) => Promise<boolean>;
  leaveCollaborativeCanvas: () => Promise<void>;

  // Invitations
  sendCanvasInvitation: (canvasId: string, canvasName: string, toUserId: string, toUserName: string) => Promise<boolean>;
  acceptInvitation: (invitationId: string) => Promise<boolean>;
  declineInvitation: (invitationId: string) => Promise<boolean>;

  // Real-time actions
  broadcastCanvasAction: (action: {
    type: string;
    data: any;
  }) => Promise<void>;
  updateCursorPosition: (x: number, y: number) => Promise<void>;
  setCurrentTool: (tool: string) => Promise<void>;

  // Data refresh
  refreshCollaborationData: () => Promise<void>;

  // Discovery
  joinCanvasByShareCode: (shareCode: string) => Promise<boolean>;
  getDiscoverableCanvases: () => Promise<any[]>;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const CollaborationProvider = ({ children }: { children: ReactNode }) => {
  const [collaborativeCanvases, setCollaborativeCanvases] = useState<CollaborativeCanvas[]>([]);
  const [currentCanvas, setCurrentCanvas] = useState<CollaborativeCanvas | null>(null);
  const [currentCanvasActions, setCurrentCanvasActions] = useState<CanvasAction[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<CanvasInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<CanvasInvitation[]>([]);
  const [collaborators, setCollaborators] = useState<CanvasCollaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Action Queue for robust syncing
  const actionQueueRef = useRef<any[]>([]);
  const isProcessingQueueRef = useRef(false);

  const isCollaborating = currentCanvas !== null;

  const { currentUser, isLoggedIn } = useAuth();
  const { toast } = useToast();

  // Polling for updates
  useEffect(() => {
    if (!currentCanvas || !isLoggedIn) return;

    const pollInterval = setInterval(async () => {
      try {
        // 1. Fetch latest actions
        const actionsResponse = await fetch(`/api/collaboration/canvas/actions?canvasId=${currentCanvas.id}`);
        if (actionsResponse.ok) {
          const data = await actionsResponse.json();
          if (data.actions) {
            // Only update if we have new actions to avoid re-renders
            setCurrentCanvasActions(prev => {
              if (prev.length !== data.actions.length) return data.actions;
              return prev;
            });
          }
        }

        // 2. Fetch collaborators (cursors/presence)
        // This endpoint might need to be adjusted or created if not existing, 
        // but typically presence is part of the canvas object or a separate endpoint
        // For now, we'll assume the main collaboration data refresh handles this or we add a specific one
        // If needed, we can call refreshCollaborationData() periodically but that might be heavy.
        // Let's stick to actions for now as the critical part.

      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [currentCanvas, isLoggedIn]);


  // Load canvas actions (Initial Load)
  const loadCanvasActions = useCallback(async (): Promise<void> => {
    if (!currentCanvas) {
      setCurrentCanvasActions([]);
      return;
    }

    try {
      const response = await fetch(`/api/collaboration/canvas/actions?canvasId=${currentCanvas.id}`, { method: 'GET' });

      if (response.ok) {
        const data = await response.json();
        if (data.actions) {
          setCurrentCanvasActions(data.actions);
        }
      }
    } catch (error) {
      console.error('Error loading canvas actions:', error);
    }
  }, [currentCanvas]);

  // Load collaboration data
  const loadCollaborationData = useCallback(async (): Promise<void> => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/collaboration?userId=${currentUser.id}`);

      if (response.ok) {
        const data = await response.json();
        setSentInvitations(data.sentInvitations || []);
        setReceivedInvitations(data.receivedInvitations || []);
        setCollaborativeCanvases(data.userCanvases || []);

        if (data.currentCanvas) {
          setCurrentCanvas(data.currentCanvas);
          setCollaborators(data.currentCanvas.collaborators || []);
          setCurrentCanvasActions([]);
        } else {
          setCurrentCanvas(null);
          setCollaborators([]);
          setCurrentCanvasActions([]);
        }
      } else {
        setError('Failed to load collaboration data');
      }
    } catch (error) {
      console.error('Error loading collaboration data:', error);
      setError('Failed to load collaboration data');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Combined refresh function
  const refreshCollaborationData = useCallback(async (): Promise<void> => {
    await loadCollaborationData();
    await loadCanvasActions();
  }, [loadCollaborationData, loadCanvasActions]);

  // Initial data load
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      loadCollaborationData();
    }
  }, [isLoggedIn, currentUser, loadCollaborationData]);

  // Load actions when canvas changes
  useEffect(() => {
    if (currentCanvas) {
      loadCanvasActions();
    }
  }, [currentCanvas, loadCanvasActions]);

  // Process Action Queue
  const processActionQueue = async () => {
    if (isProcessingQueueRef.current || actionQueueRef.current.length === 0 || !currentCanvas || !currentUser) return;

    isProcessingQueueRef.current = true;
    setIsSyncing(true);

    const action = actionQueueRef.current[0]; // Peek

    try {
      const response = await fetch('/api/collaboration/canvas/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvasId: currentCanvas.id,
          type: action.type,
          data: action.data,
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: new Date().toISOString(),
          id: crypto.randomUUID()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync action');
      }

      // Success: Remove from queue
      actionQueueRef.current.shift();

      // If more actions, continue processing
      if (actionQueueRef.current.length > 0) {
        setTimeout(processActionQueue, 50); // Small delay to prevent flooding
      } else {
        setIsSyncing(false);
        isProcessingQueueRef.current = false;
      }

    } catch (error) {
      console.error('Error processing action queue:', error);
      // Retry logic could be added here (e.g., wait and retry, or drop after N attempts)
      // For now, we'll just pause and retry on next trigger or user action
      setIsSyncing(false);
      isProcessingQueueRef.current = false;

      toast({
        title: "Sync Error",
        description: "Failed to sync changes. Retrying...",
        variant: "destructive",
      });
    }
  };

  // Create a new collaborative canvas
  const createCollaborativeCanvas = async (name: string, initialData?: any): Promise<string | null> => {
    if (!currentUser) return null;

    try {
      setIsLoading(true);
      const response = await fetch('/api/collaboration/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          ownerId: currentUser.id,
          ownerName: currentUser.name,
          initialData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newCanvas = data.canvas;
        setCurrentCanvas(newCanvas);
        setCollaborators([{
          userId: currentUser.id,
          userName: currentUser.name,
          email: currentUser.email,
          joinedAt: new Date().toISOString(),
          isOnline: true,
        }]);

        toast({
          title: "Collaborative canvas created",
          description: `${name} is ready for collaboration`,
        });

        return newCanvas.id;
      } else {
        throw new Error('Failed to create collaborative canvas');
      }
    } catch (error) {
      console.error('Error creating collaborative canvas:', error);
      setError('Failed to create collaborative canvas');
      toast({
        title: "Error",
        description: "Failed to create collaborative canvas",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Join an existing collaborative canvas
  const joinCollaborativeCanvas = async (canvasId: string): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      setIsLoading(true);
      const response = await fetch('/api/collaboration/canvas/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvasId,
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentCanvas(data.canvas);
        setCollaborators(data.canvas.collaborators || []);

        toast({
          title: "Joined collaborative canvas",
          description: `You're now collaborating on ${data.canvas.name}`,
        });

        return true;
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to join canvas",
          description: errorData.error || "Unknown error occurred",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error joining collaborative canvas:', error);
      setError('Failed to join collaborative canvas');
      toast({
        title: "Error",
        description: "Failed to join collaborative canvas",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Leave the current collaborative canvas
  const leaveCollaborativeCanvas = async (): Promise<void> => {
    if (!currentUser || !currentCanvas) return;

    try {
      await fetch('/api/collaboration/canvas/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvasId: currentCanvas.id,
          userId: currentUser.id,
        }),
      });

      setCurrentCanvas(null);
      setCollaborators([]);
      setCurrentCanvasActions([]);

      toast({
        title: "Left collaborative canvas",
        description: "You've left the collaborative session",
      });
    } catch (error) {
      console.error('Error leaving collaborative canvas:', error);
    }
  };

  // Send canvas invitation through messaging system
  const sendCanvasInvitation = async (
    canvasId: string,
    canvasName: string,
    toUserId: string,
    toUserName: string
  ): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const response = await fetch('/api/collaboration/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvasId,
          canvasName,
          fromUserId: currentUser.id,
          fromUserName: currentUser.name,
          toUserId,
          toUserName,
        }),
      });

      if (response.ok) {
        await refreshCollaborationData();
        toast({
          title: "Invitation sent",
          description: `Canvas invitation sent to ${toUserName}`,
        });
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(`Failed to send invitation: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: `Failed to send invitation`,
        variant: "destructive",
      });
      return false;
    }
  };

  // Accept canvas invitation
  const acceptInvitation = async (invitationId: string): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const response = await fetch('/api/collaboration/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          userId: currentUser.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const joinSuccess = await joinCollaborativeCanvas(data.canvasId);

        if (joinSuccess) {
          await refreshCollaborationData();
          toast({
            title: "Invitation accepted!",
            description: `Successfully joined "${data.canvasName}"`,
          });
          return true;
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to accept invitation",
          description: errorData.error,
          variant: "destructive",
        });
      }
      return false;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive",
      });
      return false;
    }
  };

  // Decline canvas invitation
  const declineInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/collaboration/invite/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });

      if (response.ok) {
        await refreshCollaborationData();
        toast({
          title: "Invitation declined",
          description: "Canvas invitation declined",
        });
        return true;
      }
      throw new Error('Failed to decline invitation');
    } catch (error) {
      console.error('Error declining invitation:', error);
      return false;
    }
  };

  // Broadcast canvas action (drawing, clear, undo, redo)
  const broadcastCanvasAction = async (action: {
    type: string;
    data: any;
  }): Promise<void> => {
    if (!currentUser || !currentCanvas) return;

    // Add to queue
    actionQueueRef.current.push(action);

    // Trigger processing
    if (!isProcessingQueueRef.current) {
      processActionQueue();
    }
  };

  // Update cursor position
  const updateCursorPosition = async (x: number, y: number): Promise<void> => {
    // For polling, we might want to debounce this or just skip it to avoid spamming the server
    // Or implement a simpler "last known position" update
    // For now, we'll just log it or do a very lightweight update if needed
    // But typically cursor tracking in polling is very laggy and not worth the bandwidth
    return;
  };

  // Set current tool
  const setCurrentTool = async (tool: string): Promise<void> => {
    // Similar to cursor, maybe just update user status occasionally
    return;
  };

  // Join canvas by share code
  const joinCanvasByShareCode = async (shareCode: string): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      setIsLoading(true);

      const response = await fetch('/api/collaboration/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareCode: shareCode.toUpperCase(),
          userId: currentUser.id,
          userName: currentUser.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentCanvas(data.canvas);
        setCollaborators(data.canvas.collaborators || []);
        setCurrentCanvasActions(data.canvas.actions || []);

        toast({
          title: "Joined Canvas!",
          description: `Successfully joined "${data.canvas.name}"`,
        });

        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join canvas');
      }
    } catch (error) {
      console.error('Error joining canvas by share code:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join canvas",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Get public canvases for discovery
  const getDiscoverableCanvases = async (): Promise<any[]> => {
    try {
      const response = await fetch('/api/collaboration/discover');

      if (response.ok) {
        const data = await response.json();
        return data.canvases || [];
      } else {
        console.error('Failed to fetch discoverable canvases');
        return [];
      }
    } catch (error) {
      console.error('Error fetching discoverable canvases:', error);
      return [];
    }
  };

  return (
    <CollaborationContext.Provider
      value={{
        currentCanvas,
        currentCanvasActions,
        collaborators,
        receivedInvitations,
        sentInvitations,
        isCollaborating,
        isLoading,
        error,
        isSyncing,
        socketConnected: false, // Always false for polling
        createCollaborativeCanvas,
        joinCollaborativeCanvas,
        joinCanvasByShareCode,
        getDiscoverableCanvases,
        leaveCollaborativeCanvas,
        sendCanvasInvitation,
        acceptInvitation,
        declineInvitation,
        broadcastCanvasAction,
        updateCursorPosition,
        setCurrentTool,
        refreshCollaborationData,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

export type { CollaborativeCanvas, CanvasCollaborator, CanvasInvitation, CanvasAction };