'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";


export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.role === 'admin') {
                    // Store user/token - for simplicity using localStorage as in existing context potentially
                    // But here just relying on the fact that we might need a context update.
                    // For now, let's just assume we store it or the context picks it up.
                    // Given the existing codebase uses context, we might need to update it, 
                    // but usually login endpoint returns the user.
                    
                    // Simple local storage for now to persist "admin" state if needed, 
                    // though real auth should be more robust.
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('role', data.role);
                    
                    toast({
                        title: "Admin Login Successful",
                        description: "Welcome back, Admin.",
                    });
                    router.push('/admin');
                } else {
                    toast({
                        title: "Access Denied",
                        description: "You do not have administrative privileges.",
                        variant: "destructive",
                    });
                }
            } else {
                toast({
                    title: "Login Failed",
                    description: data.error || "Invalid credentials",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (

            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4 bg-muted/20">
                <div className="w-full max-w-sm space-y-4">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight">Admin Access</h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to access the administrative dashboard.
                        </p>
                    </div>
                    <Card className="border shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl">Login</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        placeholder="admin@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                    </div>
                                    <Input 
                                        id="password" 
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="bg-background"
                                    />
                                </div>
                                <Button className="w-full" type="submit" disabled={isLoading}>
                                    {isLoading ? "Authenticating..." : "Sign In"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
    );
}
