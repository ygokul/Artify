'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Contest {
  title: string;
  description: string;
  endsIn: string;
  status: 'Ongoing' | 'Ended';
  winner?: string;
}

interface ContestsContextType {
  contests: Contest[];
  addContest: (contest: Omit<Contest, 'winner' | 'status'> & { status: 'Ongoing' }) => void;
}

const ContestsContext = createContext<ContestsContextType | undefined>(undefined);

const STORAGE_KEY = 'artify-contests';

const defaultContests: Contest[] = [
    {
      title: "Futuristic Worlds",
      description: "Create a scene from a world 500 years in the future. Let your imagination run wild!",
      endsIn: "3 Days",
      status: "Ongoing",
    },
    {
      title: "Abstract Emotions",
      description: "Express a powerful emotion using only abstract shapes and colors.",
      endsIn: "10 Days",
      status: "Ongoing",
    },
    {
      title: "Enchanted Forest",
      description: "Illustrate a magical forest filled with mythical creatures and glowing flora.",
      status: "Ended",
      winner: "Artisan_Alex",
    },
  ];

export const ContestsProvider = ({ children }: { children: ReactNode }) => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedContests = localStorage.getItem(STORAGE_KEY);
      if (storedContests) {
        setContests(JSON.parse(storedContests));
      } else {
        setContests(defaultContests);
      }
    } catch (error) {
      console.error("Failed to load contests from localStorage", error);
      setContests(defaultContests);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(contests));
      } catch (error) {
        console.error("Failed to save contests to localStorage", error);
      }
    }
  }, [contests, isLoaded]);

  const addContest = (contest: Omit<Contest, 'winner' | 'status'> & { status: 'Ongoing' }) => {
    const newContest: Contest = {
      ...contest,
    };
    setContests(prev => [newContest, ...prev]);
  };

  return (
    <ContestsContext.Provider value={{ contests, addContest }}>
      {isLoaded ? children : null}
    </ContestsContext.Provider>
  );
};

export const useContests = (): ContestsContextType => {
  const context = useContext(ContestsContext);
  if (!context) {
    throw new Error('useContests must be used within a ContestsProvider');
  }
  return context;
};

export type { Contest };
