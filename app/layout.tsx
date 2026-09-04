import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import AuthProvider from "@/components/auth-provider"
import ConditionalNav from "@/components/conditional-nav"
import { ErrorBoundary } from "@/components/error-boundary"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EMI Platform - Electronics on Flexible EMI",
  description: "Shop smartphones, laptops, and electronics with transparent pricing and flexible EMI plans.",
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: "https://images.yourstory.com/cs/images/companies/shoprarerabbitlogo-1719813730851.jpg?fm=auto&ar=1%3A1&mode=fill&fill=solid&fill-color=fff&format=auto&w=192&q=75",
        url: "/logo.png",
        sizes: "32x32",
        type: "image/jpg",
        type: "image/png",
      },
      {
        url: "https://images.yourstory.com/cs/images/companies/shoprarerabbitlogo-1719813730851.jpg?fm=auto&ar=1%3A1&mode=fill&fill=solid&fill-color=fff&format=auto&w=192&q=75",
        url: "/logo.png",
        sizes: "192x192",
        type: "image/jpg",
        type: "image/png",
      },
    ],
    apple: {
      url: "https://images.yourstory.com/cs/images/companies/shoprarerabbitlogo-1719813730851.jpg?fm=auto&ar=1%3A1&mode=fill&fill=solid&fill-color=fff&format=auto&w=192&q=75",
      url: "/logo.png",
      sizes: "180x180",
      type: "image/jpg",
      type: "image/png",
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${_geist.className} antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <ConditionalNav />
            {children}
          </AuthProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
