
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useArtworks } from '@/context/artworks-context';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Palette, Sparkles, Filter } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AppLayout } from '@/components/app-layout';

type FilterType = 'all' | 'canvas' | 'generated';

function GalleryContent() {
  const { artworks, deleteArtwork } = useArtworks();
  const [isClient, setIsClient] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredArtworks = artworks.filter(artwork => {
    if (filter === 'all') return true;
    return artwork.type === filter;
  });

  const getFilterText = (filter: FilterType) => {
    switch (filter) {
      case 'all': return 'All Artworks';
      case 'canvas': return 'Canvas Drawings';
      case 'generated': return 'Generated Images';
      default: return 'All Artworks';
    }
  };

  const handleDeleteArtwork = async (id: string) => {
    await deleteArtwork(id);
  };

  if (!isClient) {
    return (
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0 aspect-square bg-muted animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h1 className="text-2xl font-headline text-foreground">Your Gallery is Empty</h1>
        <p className="text-muted-foreground mt-2 max-w-md">Start creating on the canvas or generate an AI image to see your masterpieces here!</p>
        <div className="flex gap-4 mt-6">
          <Button asChild>
            <Link href="/">Go to Canvas</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/generate">Generate AI Image</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-headline">Gallery</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {getFilterText(filter)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilter('all')}>
              All Artworks ({artworks.length})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('canvas')}>
              <Palette className="h-4 w-4 mr-2" />
              Canvas Drawings ({artworks.filter(a => a.type === 'canvas').length})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('generated')}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generated Images ({artworks.filter(a => a.type === 'generated').length})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredArtworks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <p className="text-muted-foreground">No {filter === 'all' ? '' : filter} artworks found.</p>
          <Button asChild className="mt-4">
            <Link href={filter === 'generated' ? '/generate' : '/'}>
              Create {filter === 'generated' ? 'Generated Image' : 'Canvas Drawing'}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredArtworks.map((artwork) => (
            <Card key={artwork.id} className="overflow-hidden group shadow-md">
              <CardContent className="p-0 aspect-square relative">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="w-full h-full cursor-pointer">
                      <Image
                        src={artwork.imageUrl}
                        alt={artwork.prompt || 'Artwork'}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                      <div className="relative w-full h-[80vh] flex items-center justify-center pointer-events-none">
                          <img 
                              src={artwork.imageUrl} 
                              alt={artwork.prompt || 'Artwork'} 
                              className="max-w-full max-h-full object-contain rounded-md shadow-2xl pointer-events-auto"
                          />
                      </div>
                  </DialogContent>
                </Dialog>
                <Badge
                  className="absolute top-2 left-2 text-xs"
                  variant={artwork.type === 'canvas' ? 'default' : 'secondary'}
                >
                  {artwork.type === 'canvas' ? (
                    <>
                      <Palette className="h-3 w-3 mr-1" />
                      Canvas
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generated
                    </>
                  )}
                </Badge>
              </CardContent>
              <CardFooter className="p-2 flex justify-between items-center bg-background/80">
                <div className="text-xs text-muted-foreground">
                  {new Date(artwork.createdAt).toLocaleDateString()}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive">
                      <Trash2 size={16} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your artwork.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteArtwork(artwork.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <GalleryContent />
  )
}
