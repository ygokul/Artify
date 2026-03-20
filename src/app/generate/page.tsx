
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { Sparkles, Save, Brush } from 'lucide-react';
import { generateImageAction } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useArtworks } from '@/context/artworks-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppLayout } from '@/components/app-layout';

const initialState = {
  image: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Generating...' : <><Sparkles className="mr-2 h-4 w-4" /> Generate Image</>}
    </Button>
  );
}

function GenerateContent() {
  const [state, formAction] = useFormState(generateImageAction, initialState);
  const [prompt, setPrompt] = useState('');
  const { addArtwork, setArtToEdit } = useArtworks();
  const router = useRouter();

  const handleSaveToGallery = async () => {
    if (state.image) {
      await addArtwork(state.image, prompt, 'generated');
    }
  };

  const handleEditInCanvas = () => {
    if (state.image) {
      setArtToEdit(state.image);
      router.push('/');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-primary" /> AI Image Generation
          </CardTitle>
          <CardDescription>
            Describe the image you want to create. The more descriptive you are, the better the result.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={formAction} className="space-y-4">
            <Textarea
              name="prompt"
              placeholder="e.g., A futuristic cityscape at sunset, with flying cars and neon lights, in a photorealistic style."
              rows={4}
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <SubmitButton />
          </form>

          {state.error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6">
            <h3 className="font-headline text-lg mb-2">Generated Image</h3>
            <div className="aspect-square w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
              {useFormStatus().pending ? (
                <Skeleton className="w-full h-full" />
              ) : state.image ? (
                <Image src={state.image} alt={prompt || 'Generated image'} width={512} height={512} className="object-contain w-full h-full" />
              ) : (
                <div className="text-muted-foreground p-8 text-center">Your generated image will appear here.</div>
              )}
            </div>
          </div>

          {state.image && !useFormStatus().pending && (
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button onClick={handleSaveToGallery} className="flex-1">
                <Save className="mr-2 h-4 w-4" /> Save to Gallery
              </Button>
              <Button onClick={handleEditInCanvas} variant="secondary" className="flex-1">
                <Brush className="mr-2 h-4 w-4" /> Edit in Canvas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <GenerateContent />
  )
}
