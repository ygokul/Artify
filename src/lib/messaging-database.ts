import { connectToDatabase } from './mongodb';
import Message, { IMessage } from './models/Message';
import UserStatus, { IUserStatus } from './models/UserStatus';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface UserStatus {
  userId: string;
  userName: string;
  email: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

export interface Conversation {
  participantId: string;
  participantName: string;
  participantEmail: string;
  lastMessage?: Message;
  unreadCount: number;
  status: 'online' | 'offline';
}

// Ensure MongoDB database connection
export async function ensureMessagingDatabaseExists(): Promise<void> {
  await connectToDatabase();
}

// Get all messages from MongoDB
export async function getAllMessages(): Promise<Message[]> {
  try {
    await connectToDatabase();
    const messages = await Message.find({}).lean();
    
    return messages.map(msg => ({
      id: msg._id.toString(),
      senderId: msg.senderId,
      senderName: msg.senderName,
      receiverId: msg.receiverId,
      receiverName: msg.receiverName,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      read: msg.read
    }));
  } catch (error) {
    console.error('Error reading messages from MongoDB:', error);
    return [];
  }
}

// Add message to MongoDB
export async function addMessage(messageData: Omit<Message, 'id' | 'timestamp' | 'read'>): Promise<Message | null> {
  try {
    await connectToDatabase();
    
    const message = new Message({
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      receiverId: messageData.receiverId,
      receiverName: messageData.receiverName,
      content: messageData.content
    });
    
    const savedMessage = await message.save();
    
    return {
      id: savedMessage._id.toString(),
      senderId: savedMessage.senderId,
      senderName: savedMessage.senderName,
      receiverId: savedMessage.receiverId,
      receiverName: savedMessage.receiverName,
      content: savedMessage.content,
      timestamp: savedMessage.timestamp.toISOString(),
      read: savedMessage.read
    };
  } catch (error) {
    console.error('Error adding message to MongoDB:', error);
    return null;
  }
}

// Get messages between users from MongoDB
export async function getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
  try {
    await connectToDatabase();
    
    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    }).sort({ timestamp: 1 }).lean();
    
    return messages.map(msg => ({
      id: msg._id.toString(),
      senderId: msg.senderId,
      senderName: msg.senderName,
      receiverId: msg.receiverId,
      receiverName: msg.receiverName,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      read: msg.read
    }));
  } catch (error) {
    console.error('Error getting messages between users from MongoDB:', error);
    return [];
  }
}

// Mark messages as read in MongoDB
export async function markMessagesAsRead(senderId: string, receiverId: string): Promise<boolean> {
  try {
    await connectToDatabase();
    
    await Message.updateMany(
      { senderId, receiverId, read: false },
      { $set: { read: true } }
    );
    
    return true;
  } catch (error) {
    console.error('Error marking messages as read in MongoDB:', error);
    return false;
  }
}

// Get all user statuses from MongoDB
export async function getAllUserStatuses(): Promise<UserStatus[]> {
  try {
    await connectToDatabase();
    const statuses = await UserStatus.find({}).lean();
    
    return statuses.map(status => ({
      userId: status.userId,
      userName: status.userName,
      email: status.email,
      status: status.status,
      lastSeen: status.lastSeen.toISOString()
    }));
  } catch (error) {
    console.error('Error reading user statuses from MongoDB:', error);
    return [];
  }
}

// Update user status in MongoDB
export async function updateUserStatus(userId: string, userName: string, email: string, status: 'online' | 'offline'): Promise<boolean> {
  try {
    await connectToDatabase();
    
    await UserStatus.findOneAndUpdate(
      { userId },
      {
        userId,
        userName,
        email,
        status,
        lastSeen: new Date()
      },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Error updating user status in MongoDB:', error);
    return false;
  }
}

// Get user status from MongoDB
export async function getUserStatus(userId: string): Promise<UserStatus | null> {
  try {
    await connectToDatabase();
    const status = await UserStatus.findOne({ userId }).lean();
    
    if (!status) return null;
    
    return {
      userId: status.userId,
      userName: status.userName,
      email: status.email,
      status: status.status,
      lastSeen: status.lastSeen.toISOString()
    };
  } catch (error) {
    console.error('Error getting user status from MongoDB:', error);
    return null;
  }
}

// Get online users from MongoDB
export async function getOnlineUsers(): Promise<UserStatus[]> {
  try {
    await connectToDatabase();
    const statuses = await UserStatus.find({ status: 'online' }).lean();
    
    return statuses.map(status => ({
      userId: status.userId,
      userName: status.userName,
      email: status.email,
      status: status.status,
      lastSeen: status.lastSeen.toISOString()
    }));
  } catch (error) {
    console.error('Error getting online users from MongoDB:', error);
    return [];
  }
}

// Get user conversations from MongoDB
export async function getUserConversations(currentUserId: string): Promise<Conversation[]> {
  try {
    await connectToDatabase();
    
    // Aggregate to get conversations with latest message and unread count
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: currentUserId },
            { receiverId: currentUserId }
          ]
        }
      },
      {
        $addFields: {
          participantId: {
            $cond: {
              if: { $eq: ['$senderId', currentUserId] },
              then: '$receiverId',
              else: '$senderId'
            }
          },
          participantName: {
            $cond: {
              if: { $eq: ['$senderId', currentUserId] },
              then: '$receiverName',
              else: '$senderName'
            }
          }
        }
      },
      {
        $group: {
          _id: '$participantId',
          participantName: { $first: '$participantName' },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ['$receiverId', currentUserId] },
                    { $eq: ['$read', false] }
                  ]
                },
                then: 1,
                else: 0
              }
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.timestamp': -1 }
      }
    ]);

    const userStatuses = await getAllUserStatuses();
    
    return conversations.map(conv => {
      const participantStatus = userStatuses.find(s => s.userId === conv._id);
      return {
        participantId: conv._id,
        participantName: conv.participantName,
        participantEmail: participantStatus?.email || '',
        lastMessage: conv.lastMessage ? {
          id: conv.lastMessage._id.toString(),
          senderId: conv.lastMessage.senderId,
          senderName: conv.lastMessage.senderName,
          receiverId: conv.lastMessage.receiverId,
          receiverName: conv.lastMessage.receiverName,
          content: conv.lastMessage.content,
          timestamp: conv.lastMessage.timestamp.toISOString(),
          read: conv.lastMessage.read
        } : undefined,
        unreadCount: conv.unreadCount,
        status: participantStatus?.status || 'offline'
      };
    });
  } catch (error) {
    console.error('Error getting user conversations from MongoDB:', error);
    return [];
  }
}

// Clean up old offline users in MongoDB (users offline for more than 5 minutes)
export async function cleanupOfflineUsers(): Promise<number> {
  try {
    await connectToDatabase();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const result = await UserStatus.updateMany(
      {
        status: 'online',
        lastSeen: { $lt: fiveMinutesAgo }
      },
      {
        $set: { status: 'offline' }
      }
    );
    
    return result.modifiedCount;
  } catch (error) {
    console.error('Error cleaning up offline users in MongoDB:', error);
    return 0;
  }
} 