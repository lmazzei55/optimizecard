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

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  // Ensure proper URL configuration for callbacks
  basePath: "/api/auth",
  useSecureCookies: process.env.NODE_ENV === "production",
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Set user ID on initial sign in
      if (user) {
        token.id = user.id
        console.log('🔐 JWT callback - user sign in:', { userId: user.id, email: user.email })
      }
      
      // Load user preferences on sign in or when session is updated
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
            console.log('🔐 JWT callback - loaded preferences:', { 
              userId: token.id, 
              tier: dbUser.subscriptionTier,
              preference: dbUser.rewardPreference 
            })
          } else {
            // Set defaults if user preferences not found
            token.rewardPreference = 'cashback'
            token.pointValue = 0.01
            token.enableSubCategories = false
            token.subscriptionTier = 'free'
            console.log('🔐 JWT callback - using defaults:', { userId: token.id })
          }
        } catch (error) {
          console.error('⚠️ Error loading user preferences in JWT callback:', error)
          // Set defaults if database query fails
          token.rewardPreference = token.rewardPreference || 'cashback'
          token.pointValue = token.pointValue || 0.01
          token.enableSubCategories = token.enableSubCategories || false
          token.subscriptionTier = token.subscriptionTier || 'free'
        }
      }
      
      return token
    },
    async session({ session, token }) {
      // Transfer token data to session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.rewardPreference = token.rewardPreference as string
        session.user.pointValue = token.pointValue as number
        session.user.enableSubCategories = token.enableSubCategories as boolean
        session.user.subscriptionTier = token.subscriptionTier as string
        
        console.log('🔐 Session callback completed:', { 
          userId: session.user.id, 
          email: session.user.email,
          tier: session.user.subscriptionTier,
          hasPreferences: !!session.user.rewardPreference 
        })
      }
      
      return session
    },
    async signIn({ user, account, profile }) {
      try {
        console.log('🔐 NextAuth signIn callback started:', { 
          provider: account?.provider, 
          userId: user?.id, 
          userEmail: user?.email,
          accountType: account?.type
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
          console.log('✅ Resend (email) sign-in allowed')
          return true
        }
        
        // Allow demo credentials in development
        if (process.env.NODE_ENV === "development" && account?.provider === "credentials") {
          console.log('✅ Demo credentials sign-in allowed (development)')
          return true
        }
        
        console.log('❌ Sign-in denied for provider:', account?.provider, 'Available providers:', {
          google: hasGoogleCredentials,
          github: hasGitHubCredentials,
          facebook: hasFacebookCredentials,
          twitter: hasTwitterCredentials,
          resend: hasResendCredentials
        })
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
    async signOut(message) {
      try {
        const userId = 'token' in message ? message.token?.id : undefined
        const userEmail = 'token' in message ? message.token?.email : undefined
        
        console.log('🔐 NextAuth signOut event:', {
          userId,
          userEmail
        })
        
        // Clean up expired database sessions periodically (even with JWT)
        await prisma.session.deleteMany({
          where: {
            expires: {
              lt: new Date()
            }
          }
        })
        console.log('✅ Cleaned up expired database sessions')
      } catch (error) {
        console.error('❌ SignOut event error:', error)
      }
    },
    async createUser({ user }) {
      console.log('🔐 NextAuth createUser event:', { userId: user.id, userEmail: user.email })
    },
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