import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Facebook from "next-auth/providers/facebook"
import Twitter from "next-auth/providers/twitter"
import Resend from "next-auth/providers/resend"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

// Helper to check if provider credentials are available
const hasGoogleCredentials = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
const hasGitHubCredentials = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
const hasFacebookCredentials = !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET)
const hasTwitterCredentials = !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET)
const hasResendCredentials = !!(process.env.AUTH_RESEND_KEY)

// Build providers array conditionally
const providers = []

// Only add OAuth providers if they have credentials
if (hasGoogleCredentials) {
  providers.push(Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }))
}

if (hasGitHubCredentials) {
  providers.push(GitHub({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  }))
}

if (hasFacebookCredentials) {
  providers.push(Facebook({
    clientId: process.env.FACEBOOK_CLIENT_ID!,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
  }))
}

if (hasTwitterCredentials) {
  providers.push(Twitter({
    clientId: process.env.TWITTER_CLIENT_ID!,
    clientSecret: process.env.TWITTER_CLIENT_SECRET!,
  }))
}

if (hasResendCredentials) {
  providers.push(Resend({
    apiKey: process.env.AUTH_RESEND_KEY!,
    from: process.env.EMAIL_FROM || "noreply@optimizecard.com",
  }))
}

// Always add demo credentials in development
if (process.env.NODE_ENV === "development") {
  providers.push(Credentials({
    name: "Demo Account",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "demo@example.com" },
    },
    async authorize(credentials) {
      if (credentials?.email) {
        try {
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
        } catch (error) {
          console.error('Demo auth error:', error)
          return null
        }
      }
      return null
    }
  }))
}

// Create adapter with error handling
let adapter
try {
  adapter = PrismaAdapter(prisma)
} catch (error) {
  console.error('❌ Failed to initialize Prisma adapter:', error)
  // In production, we'll use JWT-only mode if database is unavailable
  adapter = undefined
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  providers,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
      }
      
      // Load user preferences from database on sign in or when session is updated
      if (trigger === "signIn" || trigger === "update") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              rewardPreference: true,
              pointValue: true,
              enableSubCategories: true,
              subscriptionTier: true,
            }
          })
          
          if (dbUser) {
            token.rewardPreference = dbUser.rewardPreference
            token.pointValue = dbUser.pointValue
            token.enableSubCategories = dbUser.enableSubCategories
            token.subscriptionTier = dbUser.subscriptionTier
          }
        } catch (error) {
          console.error('Error loading user preferences in JWT callback:', error)
          // Set defaults if database is unavailable - use lowercase to match schema
          token.rewardPreference = token.rewardPreference || 'cashback'
          token.pointValue = token.pointValue || 0.01
          token.enableSubCategories = token.enableSubCategories || false
          token.subscriptionTier = token.subscriptionTier || 'free'
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.rewardPreference = token.rewardPreference as string
        session.user.pointValue = token.pointValue as number
        session.user.enableSubCategories = token.enableSubCategories as boolean
        session.user.subscriptionTier = token.subscriptionTier as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      try {
        console.log('🔐 NextAuth signIn callback:', { 
          provider: account?.provider, 
          userId: user?.id, 
          userEmail: user?.email 
        })
        
        // Allow sign in for all configured providers
        if (account?.provider === "google" && hasGoogleCredentials) {
          console.log('✅ Google sign-in allowed')
          return true
        }
        if (account?.provider === "github" && hasGitHubCredentials) {
          console.log('✅ GitHub sign-in allowed')
          return true
        }
        if (account?.provider === "facebook" && hasFacebookCredentials) {
          console.log('✅ Facebook sign-in allowed')
          return true
        }
        if (account?.provider === "twitter" && hasTwitterCredentials) {
          console.log('✅ Twitter sign-in allowed')
          return true
        }
        if (account?.provider === "resend" && hasResendCredentials) {
          console.log('✅ Resend sign-in allowed')
          return true
        }
        
        // Allow demo credentials in development
        if (process.env.NODE_ENV === "development" && account?.provider === "credentials") {
          console.log('✅ Demo credentials sign-in allowed (development)')
          return true
        }
        
        console.log('❌ Sign-in denied for provider:', account?.provider)
        return false
      } catch (error) {
        console.error('❌ Sign in callback error:', error)
        return false
      }
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log('🔐 NextAuth signIn event:', { 
        provider: account?.provider, 
        userId: user?.id, 
        userEmail: user?.email 
      })
    },
    async createUser({ user }) {
      console.log('🔐 NextAuth createUser event:', { userId: user.id, userEmail: user.email })
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
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
      subscriptionTier?: string
    }
  }
} 