import type { Metadata } from 'next';
import './globals.css';
import { MainLayout } from '@/components/layout/MainLayout';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/providers/session-provider';
import { MusicProvider } from '@/providers/MusicContext';

export const metadata: Metadata = {
  title: 'MyELTS - AI Powered IELTS Learning Platform',
  description: 'The smart AI-powered platform to master your IELTS skills.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <AuthProvider>
          <MusicProvider>
            <MainLayout>{children}</MainLayout>
            <Toaster />
          </MusicProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

