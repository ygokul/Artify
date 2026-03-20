
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Eraser } from 'lucide-react';

const STORAGE_KEY = 'artify-notepad';

function NotepadContent() {
    const [notes, setNotes] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        try {
            const savedNotes = localStorage.getItem(STORAGE_KEY);
            if (savedNotes) {
                setNotes(savedNotes);
            }
        } catch (error) {
            console.error("Failed to load notes from localStorage", error);
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(STORAGE_KEY, notes);
            } catch (error) {
                console.error("Failed to save notes to localStorage", error);
            }
        }
    }, [notes, isLoaded]);

    const handleClear = () => {
        setNotes('');
        toast({
            title: "Notepad Cleared",
            description: "Your notes have been erased.",
        });
    }

    if (!isLoaded) {
        return (
            <div className="container mx-auto p-4 max-w-4xl">
                <Card className="h-[calc(100vh-100px)]">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <FileText className="text-primary" /> Notepad
                        </CardTitle>
                        <CardDescription>
                            A place for your thoughts, ideas, and prompts. Notes are saved automatically.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full h-full bg-muted animate-pulse rounded-md"></div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <Card className="h-[calc(100vh-100px)] flex flex-col">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <FileText className="text-primary" /> Notepad
                    </CardTitle>
                    <CardDescription>
                        A place for your thoughts, ideas, and prompts. Notes are saved automatically.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    <Textarea
                        placeholder="Start typing your notes here..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full h-full resize-none"
                    />
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={handleClear}>
                        <Eraser className="mr-2 h-4 w-4" /> Clear Notes
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}


export default function NotepadPage() {
    return (
        <NotepadContent />
    )
}
