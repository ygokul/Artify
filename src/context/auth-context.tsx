'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'artify-auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  // Load auth state from sessionStorage
  useEffect(() => {
    try {
      const storedAuth = sessionStorage.getItem(AUTH_KEY);
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        setIsLoggedIn(authData.isLoggedIn);
        setCurrentUser(authData.currentUser);
      }
    } catch (error) {
      console.error("Failed to load auth status from sessionStorage", error);
    }
    setIsLoaded(true);
  }, []);

  // Save auth state to sessionStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        const authData = {
          isLoggedIn,
          currentUser
        };
        sessionStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      } catch (error) {
        console.error("Failed to save auth status to sessionStorage", error);
      }
    }
  }, [isLoggedIn, currentUser, isLoaded]);

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        return true;
      } else {
        console.error('Registration failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        return true;
      } else {
        console.error('Login failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, currentUser, login, logout, register }}>
      {isLoaded ? children : null}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
