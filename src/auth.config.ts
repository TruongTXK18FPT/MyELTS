import type { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
// we'll import bcryptjs later in auth.ts, but here it's edge compatible if needed.

export const authConfig = {
  pages: {
    signIn: '/auth/login',
  },
  providers: [], // configured in auth.ts to support prisma
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = (auth?.user as { role?: string } | undefined)?.role;
      const isAdmin = userRole === 'ADMIN';
      const onAdmin = nextUrl.pathname.startsWith('/admin');

      if (isLoggedIn && isAdmin) {
        if (
          nextUrl.pathname.startsWith('/profile') ||
          nextUrl.pathname.startsWith('/dashboard') ||
          nextUrl.pathname.startsWith('/auth/login') ||
          nextUrl.pathname.startsWith('/auth/register')
        ) {
          return Response.redirect(new URL('/admin', nextUrl));
        }
      }

      const onProtected =
        nextUrl.pathname.startsWith('/profile') ||
        nextUrl.pathname.startsWith('/vocab/upload') ||
        nextUrl.pathname.startsWith('/ai-chat') ||
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/workspace');
      
      if (onAdmin) {
        if (isLoggedIn && isAdmin) return true;
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl));
        return false; // Redirect to login
      }

      if (onProtected) {
        if (isLoggedIn) return true;
        return false; // Redirect to unauthenticated page
      } else if (
        isLoggedIn &&
        (nextUrl.pathname.startsWith('/auth/login') || nextUrl.pathname.startsWith('/auth/register'))
      ) {
        return Response.redirect(new URL('/workspace', nextUrl));
      }
      return true;
    },
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    }
  },
  session: { strategy: "jwt" }
} satisfies NextAuthConfig;
