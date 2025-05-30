import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Facebook from "next-auth/providers/facebook"
import Twitter from "next-auth/providers/twitter"
import Resend from "next-auth/providers/resend"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // GitHub OAuth
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    // Meta (Facebook) OAuth
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),

    // X (Twitter) OAuth
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),

    // Resend Email (Magic Links)
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY!,
      from: process.env.EMAIL_FROM || "noreply@creditcardoptimizer.com",
    }),

    // Keep demo credentials for development/testing
    ...(process.env.NODE_ENV === "development" ? [
      Credentials({
        name: "Demo Account",
        credentials: {
          email: { label: "Email", type: "email", placeholder: "demo@example.com" },
        },
        async authorize(credentials) {
          if (credentials?.email) {
            let user = await prisma.user.findUnique({
              where: { email: credentials.email as string }
            })
            
            if (!user) {
              user = await prisma.user.create({
                data: {
                  email: credentials.email as string,
                  name: credentials.email?.toString().split('@')[0] || 'Demo User',
                  emailVerified: new Date(),
                }
              })
            }
            
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            }
          }
          return null
        }
      })
    ] : []),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        
        // Add custom user fields to session
        const userData = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            rewardPreference: true,
            pointValue: true,
            enableSubCategories: true,
          },
        })
        if (userData) {
          session.user.rewardPreference = userData.rewardPreference
          session.user.pointValue = userData.pointValue
          session.user.enableSubCategories = userData.enableSubCategories
        }
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Allow sign in for OAuth providers and email
      if (account?.provider === "google" || account?.provider === "github" || 
          account?.provider === "facebook" || account?.provider === "twitter" || 
          account?.provider === "resend") {
        return true
      }
      // Allow demo credentials in development
      if (process.env.NODE_ENV === "development" && account?.provider === "credentials") {
        return true
      }
      return false
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
})

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      rewardPreference?: string
      pointValue?: number
      enableSubCategories?: boolean
    }
  }
} 