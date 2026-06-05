import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/login") {
    if (!req.auth) {
      const loginUrl = new URL("/dashboard/login", req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*"],
}
