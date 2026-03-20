import { connectToDatabase } from './mongodb';
import User, { IUser } from './models/User';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: string;
}

// Connect to MongoDB database
export async function ensureDatabaseExists(): Promise<void> {
  await connectToDatabase();
}

// Get all users from MongoDB
export async function getUsers(): Promise<User[]> {
  try {
    await connectToDatabase();
    const users = await User.find({}).lean() as any[];
    
    return users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role || 'user',
      createdAt: user.createdAt.toISOString()
    }));
  } catch (error) {
    console.error('Error reading users from MongoDB:', error);
    return [];
  }
}

// Find user by email in MongoDB
export async function findUserByEmail(email: string): Promise<User | undefined> {
  try {
    await connectToDatabase();
    const user = await User.findOne({ email }).lean() as any;
    
    if (!user) return undefined;
    
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role || 'user',
      createdAt: user.createdAt.toISOString()
    };
  } catch (error) {
    console.error('Error finding user by email in MongoDB:', error);
    return undefined;
  }
}

// Add new user to MongoDB
export async function addUser(userData: Omit<User, 'id'>): Promise<boolean> {
  try {
    await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return false;
    }
    
    const user = new User({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'user',
      createdAt: new Date(userData.createdAt)
    });
    
    await user.save();
    return true;
  } catch (error) {
    console.error('Error adding user to MongoDB:', error);
    return false;
  }
}

// Authenticate user with MongoDB
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    await connectToDatabase();
    const user = await User.findOne({ email, password }).lean() as any;
    
    if (!user) return null;
    
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role || 'user',
      createdAt: user.createdAt.toISOString()
    };
  } catch (error) {
    console.error('Error authenticating user with MongoDB:', error);
    return null;
  }
} 