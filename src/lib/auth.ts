import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@example.com" },
      },
      async authorize(credentials) {
        // For demo purposes, accept any email
        if (credentials?.email) {
          // Check if user exists, if not create one
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
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
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