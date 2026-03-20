'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

interface Artwork {
  id: string;
  imagePath: string;
  imageUrl: string; // URL to access the image via API
  prompt?: string;
  createdAt: string;
  type: 'canvas' | 'generated';
}

interface ArtworksContextType {
  artworks: Artwork[];
  addArtwork: (dataUrl: string, prompt?: string, type?: 'canvas' | 'generated') => Promise<void>;
  deleteArtwork: (id: string) => Promise<void>;
  artToEdit: string | null;
  setArtToEdit: (dataUrl: string | null) => void;
  clearArtToEdit: () => void;
  refreshArtworks: () => Promise<void>;
}

const ArtworksContext = createContext<ArtworksContextType | undefined>(undefined);

export const ArtworksProvider = ({ children }: { children: ReactNode }) => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [artToEdit, setArtToEditState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  // Load artworks from API
  const loadArtworks = async () => {
    try {
      const response = await fetch('/api/artworks');
      if (response.ok) {
        const data = await response.json();
        setArtworks(data.artworks || []);
      } else {
        console.error('Failed to load artworks');
      }
    } catch (error) {
      console.error('Error loading artworks:', error);
    }
    setIsLoaded(true);
  };

  // Load artworks on mount
  useEffect(() => {
    loadArtworks();
  }, []);

  const addArtwork = async (dataUrl: string, prompt?: string, type: 'canvas' | 'generated' = 'canvas') => {
    try {
      const response = await fetch('/api/artworks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataUrl,
          prompt,
          type,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setArtworks(prev => [data.artwork, ...prev]);
        toast({
          title: "Artwork Saved!",
          description: `Your ${type === 'canvas' ? 'drawing' : 'generated image'} has been saved permanently.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Save Failed",
          description: error.error || "Failed to save artwork.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving artwork:', error);
      toast({
        title: "Save Failed",
        description: "An unexpected error occurred while saving.",
        variant: "destructive",
      });
    }
  };

  const deleteArtwork = async (id: string) => {
    try {
      const response = await fetch(`/api/artworks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setArtworks(prev => prev.filter(artwork => artwork.id !== id));
        toast({
          title: "Artwork Deleted",
          description: "The artwork and its file have been permanently removed.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Delete Failed",
          description: error.error || "Failed to delete artwork.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting artwork:', error);
      toast({
        title: "Delete Failed",
        description: "An unexpected error occurred while deleting.",
        variant: "destructive",
      });
    }
  };

  const setArtToEdit = (dataUrl: string | null) => {
    setArtToEditState(dataUrl);
  };

  const clearArtToEdit = () => {
    setArtToEditState(null);
  };

  const refreshArtworks = async () => {
    await loadArtworks();
  };

  return (
    <ArtworksContext.Provider value={{ 
      artworks, 
      addArtwork, 
      deleteArtwork, 
      artToEdit, 
      setArtToEdit, 
      clearArtToEdit,
      refreshArtworks
    }}>
      {isLoaded ? children : null}
    </ArtworksContext.Provider>
  );
};

export const useArtworks = (): ArtworksContextType => {
  const context = useContext(ArtworksContext);
  if (!context) {
    throw new Error('useArtworks must be used within an ArtworksProvider');
  }
  return context;
};

export type { Artwork };
