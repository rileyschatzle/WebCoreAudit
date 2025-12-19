import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Inter_Tight } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WebCore Audit - Find Out What's Wrong With Your Website",
  description:
    "Discover exactly what's holding your website back. Get actionable insights on performance, SEO, security, and UX. Try your first audit free.",
  keywords: [
    "website audit",
    "site analysis",
    "SEO audit",
    "performance check",
    "security scan",
    "website optimization",
  ],
  authors: [{ name: "WebCore Audit" }],
  openGraph: {
    title: "WebCore Audit - Find Out What's Wrong With Your Website",
    description:
      "Stop guessing, start knowing. Get a detailed breakdown of your site's performance, SEO, security, and user experience. Try your first audit free.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "WebCore Audit - Find Out What's Wrong With Your Website",
    description:
      "Stop guessing, start knowing. Get a detailed breakdown of your site's performance, SEO, security, and user experience. Try your first audit free.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
