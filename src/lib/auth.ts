import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"

// Helper to check if provider credentials are available
const hasGoogleCredentials = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
const hasGitHubCredentials = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)

// Build providers array - minimal setup for debugging
const providers = []

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

// Always add demo credentials in development
if (process.env.NODE_ENV === "development") {
  providers.push(Credentials({
    name: "Demo Account",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "demo@example.com" },
    },
    async authorize(credentials) {
      if (credentials?.email) {
        return {
          id: "demo-user",
          email: credentials.email as string,
          name: credentials.email?.toString().split('@')[0] || 'Demo User',
        }
      }
      return null
    }
  }))
}

// Add fallback if no providers
if (providers.length === 0) {
  console.error('🚨 No authentication providers configured!')
  providers.push(Credentials({
    name: "Configuration Error",
    credentials: {},
    async authorize() {
      return null
    }
  }))
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // If this is the first time the jwt callback is invoked, user object will be available
      if (user) {
        token.id = user.id || user.email // Use user.id or fallback to email as ID
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Auto-create user in database when signing in with JWT sessions
      if (user.email) {
        try {
          // Dynamic import to avoid circular dependencies
          const { prisma } = await import('@/lib/prisma')
          
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          })
          
          // Create user if they don't exist
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || user.email.split('@')[0],
                image: user.image,
                rewardPreference: 'cashback', // Default preference
                pointValue: 0.01,
                enableSubCategories: false,
                subscriptionTier: 'free' // Default to free tier
              }
            })
            console.log('✅ Auto-created user in database:', user.email)
          } else {
            console.log('✅ User already exists in database:', user.email)
          }
        } catch (error) {
          console.error('❌ Error auto-creating user:', error)
          // Don't block sign-in if database creation fails
        }
      }
      return true
    }
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