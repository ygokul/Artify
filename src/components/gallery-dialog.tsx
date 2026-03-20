
'use client';

import { useArtworks } from '@/context/artworks-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Image from 'next/image';
import { Artwork } from '@/context/artworks-context';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface GalleryDialogProps {
  children: React.ReactNode;
  onSelect: (artwork: Artwork) => void;
}

export function GalleryDialog({ children, onSelect }: GalleryDialogProps) {
  const { artworks } = useArtworks();
  const [open, setOpen] = useState(false);

  const handleSelect = (artwork: Artwork) => {
    onSelect(artwork);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Artwork</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-2">
          {artworks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No artworks found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {artworks.map((artwork) => (
                <div 
                  key={artwork.id} 
                  className="cursor-pointer group relative aspect-square border rounded-md overflow-hidden hover:ring-2 ring-primary transition-all"
                  onClick={() => handleSelect(artwork)}
                >
                  <Image
                    src={artwork.imageUrl}
                    alt={artwork.prompt || 'Artwork'}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
