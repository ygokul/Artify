
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isLoggedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/login?redirect=/admin');
        }
    }, [isLoggedIn, router]);

    if (!isLoggedIn) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Redirecting to login...</p>
            </div>
        );
    }

    return <>{children}</>;
}
