'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/app-layout";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Contest {
  _id: string;
  title: string;
  description: string;
  endsIn: string;
  status: 'Ongoing' | 'Completed';
}

export default function AdminContestsPage() {
    const { toast } = useToast();
    const [contests, setContests] = useState<Contest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('');

    useEffect(() => {
        const fetchContests = async () => {
            try {
                const res = await fetch('/api/admin/contests');
                if (res.ok) setContests(await res.json());
            } catch (error) {
                console.error("Failed to fetch contests", error);
                toast({ title: "Error", description: "Failed to load contests.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchContests();
    }, [toast]);

    const handleCreateContest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !duration) {
            toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
            return;
        }

        try {
            const res = await fetch('/api/admin/contests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    endsIn: `${duration} Days`,
                    status: 'Ongoing'
                })
            });

            if (res.ok) {
                const newContest = await res.json();
                setContests([newContest, ...contests]);
                toast({ title: "Success", description: "Contest created successfully." });
                setTitle('');
                setDescription('');
                setDuration('');
            } else {
                toast({ title: "Error", description: "Failed to create contest.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                 <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="w-full max-w-[1600px] p-8 space-y-8">
                 <div className="flex items-center justify-between">
                     <div>
                        <h1 className="text-3xl font-headline font-bold">Contest Management</h1>
                        <p className="text-muted-foreground">Create and manage art contests.</p>
                     </div>
                </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="shadow-md h-fit">
                            <CardHeader>
                                <CardTitle>Create New Contest</CardTitle>
                                <CardDescription>Launch a new challenge.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-4" onSubmit={handleCreateContest}>
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input id="title" placeholder="e.g. Cyberpunk City" value={title} onChange={(e) => setTitle(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Input id="description" placeholder="Description of the theme..." value={description} onChange={(e) => setDescription(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Duration (Days)</Label>
                                        <Input id="duration" type="number" placeholder="7" value={duration} onChange={(e) => setDuration(e.target.value)} />
                                    </div>
                                    <Button type="submit" className="w-full">Create Contest</Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="shadow-md">
                            <CardHeader>
                                <CardTitle>Active Contests</CardTitle>
                                <CardDescription>Currently running challenges.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                    {contests.map(contest => (
                                        <div key={contest._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="space-y-1">
                                                <p className="font-semibold">{contest.title}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{contest.description}</p>
                                            </div>
                                            <Badge variant={contest.status === 'Ongoing' ? 'default' : 'secondary'}>
                                                {contest.status}
                                            </Badge>
                                        </div>
                                    ))}
                                    {contests.length === 0 && (
                                         <p className="text-center text-muted-foreground py-8">No contests found.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
            </div>
        </AppLayout>
    );
}
