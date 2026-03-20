import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { ArtworksProvider } from '@/context/artworks-context';
import { ContestsProvider } from '@/context/contests-context';
import { MessagingProvider } from '@/context/messaging-context';
import { CollaborationProvider } from '@/context/collaboration-context';
import { BlogProvider } from '@/context/blog-context';
import { Toaster } from '@/components/ui/toaster';
import { AppLayout } from '@/components/app-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Vibe Studio',
  description: 'Creative digital art platform with AI generation and collaboration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ArtworksProvider>
            <ContestsProvider>
              <MessagingProvider>
                <CollaborationProvider>
                  <BlogProvider>
                    <AppLayout>
                      {children}
                    </AppLayout>
                    <Toaster />
                  </BlogProvider>
                </CollaborationProvider>
              </MessagingProvider>
            </ContestsProvider>
          </ArtworksProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
