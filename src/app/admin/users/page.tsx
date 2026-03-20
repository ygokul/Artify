'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/app-layout";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/admin/users');
                if (res.ok) setUsers(await res.json());
            } catch (error) {
                console.error("Failed to fetch users", error);
                toast({ title: "Error", description: "Failed to load users.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, [toast]);

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
            <div className="w-full max-w-[1600px] p-8 space-y-6">
                <div className="flex items-center justify-between">
                     <div>
                        <h1 className="text-3xl font-headline font-bold">User Management</h1>
                        <p className="text-muted-foreground">View and manage registered users.</p>
                     </div>
                </div>

                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Registered Users</CardTitle>
                            <CardDescription>Total Users: {users.length}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm text-left">
                                        <thead className="[&_tr]:border-b bg-muted/50">
                                            <tr className="border-b transition-colors data-[state=selected]:bg-muted">
                                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Name</th>
                                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Email</th>
                                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Role</th>
                                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {users.map((user) => (
                                                <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle font-medium">{user.name}</td>
                                                    <td className="p-4 align-middle">{user.email}</td>
                                                    <td className="p-4 align-middle"><Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge></td>
                                                    <td className="p-4 align-middle">{new Date(user.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                            {users.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-4 text-center text-muted-foreground">No users found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
            </div>
        </AppLayout>
    );
}
