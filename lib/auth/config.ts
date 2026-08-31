import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { queryOne } from '@/lib/db';
import type { User } from '@/types';

// Database user type with password
interface DbUser extends User {
  password: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log("Raw credentials:", credentials);
          let email: string | undefined = undefined;
          let password: string | undefined = undefined;

          if (credentials) {
            if (typeof (credentials as any).get === 'function') {
              email = (credentials as any).get('email') as string;
              password = (credentials as any).get('password') as string;
            } else {
              email = (credentials as any).email as string;
              password = (credentials as any).password as string;
            }
          }

          console.log("Login attempt for email:", email);

          if (!email || !password) {
            console.log("Missing email or password in credentials");
            return null;
          }

          const user = await queryOne<DbUser>(
            'SELECT id, email, name, password, role, mobile, active FROM users WHERE email = ? AND active = 1',
            [email]
          );

          if (!user) {
            console.log("User not found or inactive in DB");
            return null;
          }

          let isPasswordValid = await compare(password, user.password);
          if (!isPasswordValid && password !== password.toLowerCase()) {
            isPasswordValid = await compare(password.toLowerCase(), user.password);
          }
          
          // Fallback: If someone manually set a plain text password in the database
          if (!isPasswordValid && password === user.password) {
            isPasswordValid = true;
          }
          
          console.log("Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            mobile: user.mobile,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mobile = user.mobile;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.mobile = token.mobile as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

// Type for session - this will be inferred from the NextAuth configuration
export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    mobile?: string;
  };
}
