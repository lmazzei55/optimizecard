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
const isValidCredential = (value: string | undefined): boolean => {
  return !!(value && value !== 'not-configured' && value !== 'undefined' && value.trim().length > 0)
}

const hasGoogleCredentials = isValidCredential(process.env.GOOGLE_CLIENT_ID) && isValidCredential(process.env.GOOGLE_CLIENT_SECRET)
const hasGitHubCredentials = isValidCredential(process.env.GITHUB_CLIENT_ID) && isValidCredential(process.env.GITHUB_CLIENT_SECRET)
const hasFacebookCredentials = isValidCredential(process.env.FACEBOOK_CLIENT_ID) && isValidCredential(process.env.FACEBOOK_CLIENT_SECRET)
const hasTwitterCredentials = isValidCredential(process.env.TWITTER_CLIENT_ID) && isValidCredential(process.env.TWITTER_CLIENT_SECRET)
const hasResendCredentials = isValidCredential(process.env.AUTH_RESEND_KEY)

// Log which providers are available (for debugging)
console.log('🔧 Available OAuth providers:', {
  google: hasGoogleCredentials,
  github: hasGitHubCredentials,
  facebook: hasFacebookCredentials,
  twitter: hasTwitterCredentials,
  resend: hasResendCredentials
})

// Build providers array conditionally
const providers = []

// Only add OAuth providers if they have credentials
if (hasGoogleCredentials) {
  providers.push(Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }))
  console.log('✅ Google OAuth provider added')
}

if (hasGitHubCredentials) {
  providers.push(GitHub({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  }))
  console.log('✅ GitHub OAuth provider added')
}

if (hasFacebookCredentials) {
  providers.push(Facebook({
    clientId: process.env.FACEBOOK_CLIENT_ID!,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
  }))
  console.log('✅ Facebook OAuth provider added')
}

if (hasTwitterCredentials) {
  providers.push(Twitter({
    clientId: process.env.TWITTER_CLIENT_ID!,
    clientSecret: process.env.TWITTER_CLIENT_SECRET!,
  }))
  console.log('✅ Twitter OAuth provider added')
}

if (hasResendCredentials) {
  providers.push(Resend({
    apiKey: process.env.AUTH_RESEND_KEY!,
    from: process.env.EMAIL_FROM || "noreplay@optimizecard.com",
  }))
  console.log('✅ Resend email provider added')
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
  console.log('✅ Demo credentials provider added (development only)')
}

// Log total providers available
console.log(`🔧 Total providers configured: ${providers.length}`)

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
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
      }
      return session
    },
    async signIn({ user, account, profile }) {
      try {
        // Allow sign in for all configured providers
        if (account?.provider === "google" && hasGoogleCredentials) return true
        if (account?.provider === "github" && hasGitHubCredentials) return true
        if (account?.provider === "facebook" && hasFacebookCredentials) return true
        if (account?.provider === "twitter" && hasTwitterCredentials) return true
        if (account?.provider === "resend" && hasResendCredentials) return true
        
        // Allow demo credentials in development
        if (process.env.NODE_ENV === "development" && account?.provider === "credentials") {
          return true
        }
        
        console.error(`❌ Sign in attempted with unconfigured provider: ${account?.provider}`)
        return false
      } catch (error) {
        console.error('Sign in callback error:', error)
        return false
      }
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  
  // Ensure proper configuration
  trustHost: true, // For Vercel deployment
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