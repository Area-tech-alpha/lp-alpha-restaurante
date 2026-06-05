import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      return profile?.email?.endsWith("@assessorialpha.com") ?? false
    },
  },
  pages: {
    signIn: "/dashboard/login",
    error: "/dashboard/login",
  },
})
