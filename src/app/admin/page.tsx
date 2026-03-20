'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/components/app-layout";
import { useEffect, useState } from "react";
import { Loader2, Users, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ users: 0, activeContests: 0 });
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const responses = await Promise.all([
                    fetch('/api/admin/users'),
                    fetch('/api/admin/contests'),
                    fetch('/api/admin/submissions')
                ]);
                
                const [usersRes, contestsRes, submissionsRes] = responses;

                if (usersRes.ok && contestsRes.ok && submissionsRes.ok) {
                    const users = await usersRes.json();
                    const contests = await contestsRes.json();
                    const submissionsData = await submissionsRes.json();
                    
                    // Assuming contests is an array of objects
                    const active = Array.isArray(contests) ? contests.filter((c: any) => c.status === 'Ongoing').length : 0;
                    setStats({
                        users: Array.isArray(users) ? users.length : 0,
                        activeContests: active
                    });
                    setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
                }
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

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
                        <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back, Admin.</p>
                     </div>
                </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                         <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.users}</div>
                                <p className="text-xs text-muted-foreground">Registered accounts</p>
                            </CardContent>
                         </Card>

                         <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Contests</CardTitle>
                                <Trophy className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.activeContests}</div>
                                 <p className="text-xs text-muted-foreground">Currently ongoing</p>
                            </CardContent>
                         </Card>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-headline font-bold">Recent Submissions</h2>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">Image</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Artist</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contest</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-muted-foreground">No submissions yet.</td>
                                        </tr>
                                    ) : (
                                        submissions.map((sub: any) => (
                                            <tr key={sub._id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <div className="relative h-12 w-12 overflow-hidden rounded-md border cursor-pointer hover:opacity-80 transition-opacity">
                                                                <img src={sub.imageUrl} alt={sub.title} className="h-full w-full object-cover" />
                                                            </div>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                                                            <div className="relative w-full h-[80vh] flex items-center justify-center">
                                                                <img 
                                                                    src={sub.imageUrl} 
                                                                    alt={sub.title} 
                                                                    className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
                                                                />
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </td>
                                                <td className="p-4 align-middle font-medium">{sub.title}</td>
                                                <td className="p-4 align-middle">{sub.userName}</td>
                                                <td className="p-4 align-middle">{sub.contestId?.title || 'Unknown Contest'}</td>
                                                <td className="p-4 align-middle">{new Date(sub.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
            </div>
        </AppLayout>
    );
}
