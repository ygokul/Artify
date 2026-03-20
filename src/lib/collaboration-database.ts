import { connectToDatabase } from './mongodb';
import CollaborativeCanvas, { ICollaborativeCanvas, ICollaborator } from './models/CollaborativeCanvas';
import CanvasInvitation, { ICanvasInvitation } from './models/CanvasInvitation';
import User from './models/User';

interface CollaborativeCanvas {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  collaborators: CanvasCollaborator[];
  actions: CanvasAction[];
  lastUpdate: string;
  isActive: boolean;
  canvasData?: any; // Store canvas state/image data
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

interface CanvasAction {
  id: string;
  type: 'draw' | 'clear' | 'undo' | 'redo';
  userId: string;
  userName: string;
  timestamp: string;
  data: any;
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

// Ensure MongoDB collaboration database connection
export async function ensureCollaborationDatabase(): Promise<void> {
  await connectToDatabase();
}

// Generate a simple 6-digit share code
function generateShareCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create canvas with share code
export async function createCanvas(
  name: string,
  ownerId: string,
  ownerName: string,
  initialData?: any
): Promise<CollaborativeCanvas | null> {
  try {
    await connectToDatabase();
    
    // Try to get the owner's email from the User collection
    let ownerEmail = '';
    try {
      const owner = await User.findById(ownerId).lean();
      if (owner) {
        ownerEmail = owner.email;
      }
    } catch (emailError) {
      console.log('Could not fetch owner email, proceeding without it');
    }
    
    // Generate unique share code
    let shareCode = generateShareCode();
    let attempts = 0;
    while (attempts < 10) {
      const existingCanvas = await CollaborativeCanvas.findOne({ shareCode }).lean();
      if (!existingCanvas) break;
      shareCode = generateShareCode();
      attempts++;
    }
    
    const canvas = new CollaborativeCanvas({
      name,
      ownerId,
      ownerName,
      shareCode,
      collaborators: [{
        userId: ownerId,
        userName: ownerName,
        email: ownerEmail,
        joinedAt: new Date(),
        isOnline: true,
      }],
      actions: initialData ? [initialData] : [],
      isActive: true,
      isPublic: true
    });

    const savedCanvas = await canvas.save();
    console.log(`Canvas created successfully with share code: ${shareCode}`);
    
    return {
      id: savedCanvas._id.toString(),
      name: savedCanvas.name,
      ownerId: savedCanvas.ownerId,
      ownerName: savedCanvas.ownerName,
      shareCode: savedCanvas.shareCode,
      collaborators: savedCanvas.collaborators.map((collab: any) => ({
        userId: collab.userId,
        userName: collab.userName,
        email: collab.email,
        joinedAt: collab.joinedAt.toISOString(),
        isOnline: collab.isOnline,
        currentTool: collab.currentTool || 'brush',
        cursorX: collab.cursorX || 0,
        cursorY: collab.cursorY || 0,
        lastActivity: collab.lastActivity?.toISOString() || new Date().toISOString()
      })),
      actions: savedCanvas.actions || [],
      lastUpdate: savedCanvas.lastUpdate.toISOString(),
      isActive: savedCanvas.isActive
    };
  } catch (error) {
    console.error('Error creating canvas in MongoDB:', error);
    return null;
  }
}

// Find canvas by share code
export async function findCanvasByShareCode(shareCode: string): Promise<CollaborativeCanvas | null> {
  try {
    await connectToDatabase();
    
    const canvas = await CollaborativeCanvas.findOne({ 
      shareCode: shareCode.toUpperCase(),
      isActive: true 
    }).lean();
    
    if (!canvas) return null;
    
    return {
      id: canvas._id.toString(),
      name: canvas.name,
      ownerId: canvas.ownerId,
      ownerName: canvas.ownerName,
      shareCode: canvas.shareCode,
      collaborators: canvas.collaborators.map((collab: any) => ({
        userId: collab.userId,
        userName: collab.userName,
        email: collab.email,
        joinedAt: collab.joinedAt.toISOString(),
        isOnline: collab.isOnline,
        currentTool: collab.currentTool || 'brush',
        cursorX: collab.cursorX || 0,
        cursorY: collab.cursorY || 0,
        lastActivity: collab.lastActivity?.toISOString() || new Date().toISOString()
      })),
      actions: canvas.actions || [],
      lastUpdate: canvas.lastUpdate.toISOString(),
      isActive: canvas.isActive
    };
  } catch (error) {
    console.error('Error finding canvas by share code:', error);
    return null;
  }
}

// Get all public canvases (for discovery)
export async function getPublicCanvases(): Promise<CollaborativeCanvas[]> {
  try {
    await connectToDatabase();
    
    const canvases = await CollaborativeCanvas.find({ 
      isActive: true,
      isPublic: true 
    })
    .sort({ lastUpdate: -1 })
    .limit(20)
    .lean();
    
    return canvases.map((canvas: any) => ({
      id: canvas._id.toString(),
      name: canvas.name,
      ownerId: canvas.ownerId,
      ownerName: canvas.ownerName,
      shareCode: canvas.shareCode,
      collaborators: canvas.collaborators.map((collab: any) => ({
        userId: collab.userId,
        userName: collab.userName,
        email: collab.email,
        joinedAt: collab.joinedAt.toISOString(),
        isOnline: collab.isOnline,
        currentTool: collab.currentTool || 'brush',
        cursorX: collab.cursorX || 0,
        cursorY: collab.cursorY || 0,
        lastActivity: collab.lastActivity?.toISOString() || new Date().toISOString()
      })),
      actions: canvas.actions || [],
      lastUpdate: canvas.lastUpdate.toISOString(),
      isActive: canvas.isActive
    }));
  } catch (error) {
    console.error('Error getting public canvases:', error);
    return [];
  }
}

// Simple join canvas function
export async function joinCanvasByCode(
  shareCode: string,
  userId: string,
  userName: string
): Promise<CollaborativeCanvas | null> {
  try {
    await connectToDatabase();
    
    const canvas = await CollaborativeCanvas.findOne({ 
      shareCode: shareCode.toUpperCase(),
      isActive: true 
    });
    
    if (!canvas) return null;
    
    // Check if user is already a collaborator
    const existingCollaborator = canvas.collaborators.find(
      (collab: any) => collab.userId === userId
    );
    
    if (!existingCollaborator) {
      // Get user email
      let userEmail = '';
      try {
        const user = await User.findById(userId).lean();
        if (user) {
          userEmail = user.email;
        }
      } catch (emailError) {
        console.log('Could not fetch user email');
      }
      
      // Add user as collaborator
      canvas.collaborators.push({
        userId,
        userName,
        email: userEmail,
        joinedAt: new Date(),
        isOnline: true,
        currentTool: 'brush',
        cursorX: 0,
        cursorY: 0,
        lastActivity: new Date()
      });
    } else {
      // Update existing collaborator to online
      existingCollaborator.isOnline = true;
      existingCollaborator.lastActivity = new Date();
    }
    
    canvas.lastUpdate = new Date();
    await canvas.save();
    
    return {
      id: canvas._id.toString(),
      name: canvas.name,
      ownerId: canvas.ownerId,
      ownerName: canvas.ownerName,
      shareCode: canvas.shareCode,
      collaborators: canvas.collaborators.map((collab: any) => ({
        userId: collab.userId,
        userName: collab.userName,
        email: collab.email,
        joinedAt: collab.joinedAt.toISOString(),
        isOnline: collab.isOnline,
        currentTool: collab.currentTool || 'brush',
        cursorX: collab.cursorX || 0,
        cursorY: collab.cursorY || 0,
        lastActivity: collab.lastActivity?.toISOString() || new Date().toISOString()
      })),
      actions: canvas.actions || [],
      lastUpdate: canvas.lastUpdate.toISOString(),
      isActive: canvas.isActive
    };
  } catch (error) {
    console.error('Error joining canvas by code:', error);
    return null;
  }
}

// Get canvas by ID from MongoDB
export async function getCanvasById(canvasId: string): Promise<CollaborativeCanvas | null> {
  try {
    await connectToDatabase();
    const canvas = await CollaborativeCanvas.findById(canvasId).lean();
    
    if (!canvas) return null;
    
    return {
      id: canvas._id.toString(),
      name: canvas.name,
      ownerId: canvas.ownerId,
      ownerName: canvas.ownerName,
      collaborators: canvas.collaborators.map(collab => ({
        userId: collab.userId,
        userName: collab.userName,
        email: collab.email,
        joinedAt: collab.joinedAt.toISOString(),
        isOnline: collab.isOnline
      })),
      actions: canvas.actions,
      lastUpdate: canvas.lastUpdate.toISOString(),
      isActive: canvas.isActive
    };
  } catch (error) {
    console.error('Error getting canvas by ID from MongoDB:', error);
    return null;
  }
}

// Update canvas in MongoDB
export async function updateCanvas(canvasId: string, updates: Partial<CollaborativeCanvas>): Promise<boolean> {
  try {
    await connectToDatabase();
    
    const updateData: any = { ...updates };
    if (updateData.collaborators) {
      updateData.collaborators = updateData.collaborators.map((collab: CanvasCollaborator) => ({
        ...collab,
        joinedAt: new Date(collab.joinedAt)
      }));
    }
    updateData.lastUpdate = new Date();
    
    const result = await CollaborativeCanvas.findByIdAndUpdate(canvasId, updateData);
    return !!result;
  } catch (error) {
    console.error('Error updating canvas in MongoDB:', error);
    return false;
  }
}

// Add collaborator to canvas in MongoDB
export async function addCollaboratorToCanvas(
  canvasId: string,
  userId: string,
  userName: string,
  userEmail: string
): Promise<boolean> {
  try {
    await connectToDatabase();
    
    const canvas = await CollaborativeCanvas.findById(canvasId);
    if (!canvas) return false;

    // Check if already a collaborator
    const existingCollaborator = canvas.collaborators.find(c => c.userId === userId);
    if (existingCollaborator) {
      // Update online status
      existingCollaborator.isOnline = true;
      await canvas.save();
      return true;
    }

    // Add new collaborator
    const newCollaborator = {
      userId,
      userName,
      email: userEmail,
      joinedAt: new Date(),
      isOnline: true,
    };

    canvas.collaborators.push(newCollaborator);
    canvas.lastUpdate = new Date();
    await canvas.save();
    return true;
  } catch (error) {
    console.error('Error adding collaborator to canvas in MongoDB:', error);
    return false;
  }
}

// Remove collaborator from canvas in MongoDB
export async function removeCollaboratorFromCanvas(canvasId: string, userId: string): Promise<boolean> {
  try {
    await connectToDatabase();
    
    const result = await CollaborativeCanvas.findByIdAndUpdate(
      canvasId,
      {
        $pull: { collaborators: { userId } },
        $set: { lastUpdate: new Date() }
      }
    );
    
    return !!result;
  } catch (error) {
    console.error('Error removing collaborator from canvas in MongoDB:', error);
    return false;
  }
}

// Update collaborator status in MongoDB
export async function updateCollaboratorStatus(
  canvasId: string,
  userId: string,
  updates: Partial<CanvasCollaborator>
): Promise<boolean> {
  try {
    await connectToDatabase();
    
    const updateFields: any = {};
    Object.keys(updates).forEach(key => {
      updateFields[`collaborators.$.${key}`] = (updates as any)[key];
    });
    updateFields['lastUpdate'] = new Date();
    
    const result = await CollaborativeCanvas.findOneAndUpdate(
      { _id: canvasId, 'collaborators.userId': userId },
      { $set: updateFields }
    );
    
    return !!result;
  } catch (error) {
    console.error('Error updating collaborator status in MongoDB:', error);
    return false;
  }
}

// Add canvas action to MongoDB
export async function addCanvasAction(canvasId: string, action: Omit<CanvasAction, 'id' | 'timestamp'>): Promise<CanvasAction | null> {
  try {
    await connectToDatabase();
    
    const newAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...action,
      timestamp: new Date().toISOString(),
    };

    const result = await CollaborativeCanvas.findByIdAndUpdate(
      canvasId,
      {
        $push: { actions: { $each: [newAction], $slice: -1000 } }, // Keep only last 1000 actions
        $set: { lastUpdate: new Date() }
      },
      { new: true }
    );
    
    return result ? newAction : null;
  } catch (error) {
    console.error('Error adding canvas action to MongoDB:', error);
    return null;
  }
}

// Get canvas actions from MongoDB
export async function getCanvasActions(canvasId: string, since?: string): Promise<CanvasAction[]> {
  try {
    await connectToDatabase();
    
    const canvas = await CollaborativeCanvas.findById(canvasId).lean();
    if (!canvas) return [];

    if (since) {
      const sinceTimestamp = new Date(since).getTime();
      return canvas.actions.filter(action => 
        new Date(action.timestamp).getTime() > sinceTimestamp
      );
    }

    return canvas.actions;
  } catch (error) {
    console.error('Error getting canvas actions from MongoDB:', error);
    return [];
  }
}

// Get all invitations from MongoDB
export async function getAllInvitations(): Promise<CanvasInvitation[]> {
  try {
    await connectToDatabase();
    const invitations = await CanvasInvitation.find({}).lean();
    
    return invitations.map(inv => ({
      id: inv._id.toString(),
      canvasId: inv.canvasId,
      canvasName: inv.canvasName,
      fromUserId: inv.inviterId,
      fromUserName: inv.inviterName,
      toUserId: inv.inviteeId,
      toUserName: inv.inviteeName,
      status: inv.status,
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.respondedAt ? inv.respondedAt.toISOString() : ''
    }));
  } catch (error) {
    console.error('Error reading invitations from MongoDB:', error);
    return [];
  }
}

// Create invitation in MongoDB
export async function createInvitation(
  canvasId: string,
  canvasName: string,
  fromUserId: string,
  fromUserName: string,
  toUserId: string,
  toUserName: string
): Promise<CanvasInvitation | null> {
  try {
    await connectToDatabase();
    
    console.log('Creating invitation with params:', {
      canvasId, canvasName, fromUserId, fromUserName, toUserId, toUserName
    });
    
    // Check if invitation already exists and is pending
    const existingInvitation = await CanvasInvitation.findOne({
      canvasId,
      inviteeId: toUserId,
      status: 'pending'
    }).lean();
    
    if (existingInvitation) {
      console.log('Found existing invitation:', existingInvitation._id);
      return {
        id: existingInvitation._id.toString(),
        canvasId: existingInvitation.canvasId,
        canvasName: existingInvitation.canvasName,
        fromUserId: existingInvitation.inviterId,
        fromUserName: existingInvitation.inviterName,
        toUserId: existingInvitation.inviteeId,
        toUserName: existingInvitation.inviteeName,
        status: existingInvitation.status,
        createdAt: existingInvitation.createdAt.toISOString(),
        expiresAt: ''
      };
    }

    // Try to get the invitee's email from the User collection
    let inviteeEmail = '';
    try {
      console.log('Fetching user email for ID:', toUserId);
      
      // Try to find by MongoDB ObjectId first, then by the old string ID format
      let invitee = null;
      if (toUserId.match(/^[0-9a-fA-F]{24}$/)) {
        // Valid MongoDB ObjectId
        invitee = await User.findById(toUserId).lean();
      }
      
      // If not found and not a valid ObjectId, try finding by the old ID format
      if (!invitee) {
        invitee = await User.findOne({ 
          $or: [
            { _id: toUserId },
            { id: toUserId } // In case there's still an 'id' field
          ]
        }).lean();
      }
      
      if (invitee) {
        inviteeEmail = invitee.email;
        console.log('Found user email:', inviteeEmail);
      } else {
        console.log('User not found for ID:', toUserId);
      }
    } catch (emailError) {
      console.log('Error fetching invitee email:', emailError);
    }

    console.log('Creating new invitation...');
    const invitation = new CanvasInvitation({
      canvasId,
      canvasName,
      inviterId: fromUserId,
      inviterName: fromUserName,
      inviteeId: toUserId,
      inviteeName: toUserName,
      inviteeEmail: inviteeEmail, // Use the fetched email or empty string
      status: 'pending'
    });

    const savedInvitation = await invitation.save();
    console.log('Invitation created successfully:', savedInvitation._id);
    
    return {
      id: savedInvitation._id.toString(),
      canvasId: savedInvitation.canvasId,
      canvasName: savedInvitation.canvasName,
      fromUserId: savedInvitation.inviterId,
      fromUserName: savedInvitation.inviterName,
      toUserId: savedInvitation.inviteeId,
      toUserName: savedInvitation.inviteeName,
      status: savedInvitation.status,
      createdAt: savedInvitation.createdAt.toISOString(),
      expiresAt: ''
    };
  } catch (error) {
    console.error('Error creating invitation in MongoDB:', error);
    return null;
  }
}

// Update invitation status in MongoDB
export async function updateInvitationStatus(invitationId: string, status: CanvasInvitation['status']): Promise<boolean> {
  try {
    await connectToDatabase();
    
    const updateData: any = { status };
    if (status !== 'pending') {
      updateData.respondedAt = new Date();
    }
    
    const result = await CanvasInvitation.findByIdAndUpdate(invitationId, updateData);
    return !!result;
  } catch (error) {
    console.error('Error updating invitation status in MongoDB:', error);
    return false;
  }
}

// Get invitation by ID from MongoDB
export async function getInvitationById(invitationId: string): Promise<CanvasInvitation | null> {
  try {
    await connectToDatabase();
    const invitation = await CanvasInvitation.findById(invitationId).lean();
    
    if (!invitation) return null;
    
    return {
      id: invitation._id.toString(),
      canvasId: invitation.canvasId,
      canvasName: invitation.canvasName,
      fromUserId: invitation.inviterId,
      fromUserName: invitation.inviterName,
      toUserId: invitation.inviteeId,
      toUserName: invitation.inviteeName,
      status: invitation.status,
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.respondedAt ? invitation.respondedAt.toISOString() : ''
    };
  } catch (error) {
    console.error('Error getting invitation by ID from MongoDB:', error);
    return null;
  }
}

// Get user invitations from MongoDB
export async function getUserInvitations(userId: string): Promise<{
  sent: CanvasInvitation[];
  received: CanvasInvitation[];
}> {
  try {
    await connectToDatabase();
    
    const [sentInvitations, receivedInvitations] = await Promise.all([
      CanvasInvitation.find({ inviterId: userId }).lean(),
      CanvasInvitation.find({ inviteeId: userId, status: 'pending' }).lean()
    ]);
    
    return {
      sent: sentInvitations.map(inv => ({
        id: inv._id.toString(),
        canvasId: inv.canvasId,
        canvasName: inv.canvasName,
        fromUserId: inv.inviterId,
        fromUserName: inv.inviterName,
        toUserId: inv.inviteeId,
        toUserName: inv.inviteeName,
        status: inv.status,
        createdAt: inv.createdAt.toISOString(),
        expiresAt: inv.respondedAt ? inv.respondedAt.toISOString() : ''
      })),
      received: receivedInvitations.map(inv => ({
        id: inv._id.toString(),
        canvasId: inv.canvasId,
        canvasName: inv.canvasName,
        fromUserId: inv.inviterId,
        fromUserName: inv.inviterName,
        toUserId: inv.inviteeId,
        toUserName: inv.inviteeName,
        status: inv.status,
        createdAt: inv.createdAt.toISOString(),
        expiresAt: inv.respondedAt ? inv.respondedAt.toISOString() : ''
      }))
    };
  } catch (error) {
    console.error('Error getting user invitations from MongoDB:', error);
    return { sent: [], received: [] };
  }
}

// Get user collaborative canvases from MongoDB
export async function getUserCollaborativeCanvases(userId: string): Promise<CollaborativeCanvas[]> {
  try {
    await connectToDatabase();
    
    const canvases = await CollaborativeCanvas.find({
      isActive: true,
      'collaborators.userId': userId
    }).lean();
    
    return canvases.map(canvas => ({
      id: canvas._id.toString(),
      name: canvas.name,
      ownerId: canvas.ownerId,
      ownerName: canvas.ownerName,
      shareCode: canvas.shareCode || '', // Add shareCode field
      collaborators: canvas.collaborators.map(collab => ({
        userId: collab.userId,
        userName: collab.userName,
        email: collab.email,
        joinedAt: collab.joinedAt.toISOString(),
        isOnline: collab.isOnline,
        currentTool: collab.currentTool || 'brush',
        cursorX: collab.cursorX || 0,
        cursorY: collab.cursorY || 0,
        lastActivity: collab.lastActivity?.toISOString() || new Date().toISOString()
      })),
      actions: canvas.actions || [],
      lastUpdate: canvas.lastUpdate.toISOString(),
      isActive: canvas.isActive
    }));
  } catch (error) {
    console.error('Error getting user collaborative canvases from MongoDB:', error);
    return [];
  }
}

// Clean up inactive canvases in MongoDB
export async function cleanupInactiveCanvases(): Promise<void> {
  try {
    await connectToDatabase();
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    await CollaborativeCanvas.updateMany(
      {
        'collaborators.isOnline': false,
        lastUpdate: { $lt: cutoffTime }
      },
      {
        $set: { isActive: false }
      }
    );
  } catch (error) {
    console.error('Error cleaning up inactive canvases in MongoDB:', error);
  }
} 