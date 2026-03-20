'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const { toast } = useToast();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);

        // Basic client-side validation
        if (!name.trim() || !email.trim() || !password.trim()) {
            toast({
                title: "Registration Failed",
                description: "Please fill in all fields.",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        try {
            const success = await register(name.trim(), email.trim(), password);

            if (success) {
                toast({
                    title: "Registration Successful",
                    description: "Your account has been created! Please log in.",
                });
                router.push('/login');
            } else {
                toast({
                    title: "Registration Failed",
                    description: "An account with this email may already exist, or there was a validation error.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Registration Failed",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <UserPlus className="text-primary" /> Register
          </CardTitle>
          <CardDescription>
            Create an account to start your artistic journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                    id="name" 
                    type="text" 
                    placeholder="Your Name" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  minLength={6}
                  placeholder="At least 6 characters"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
