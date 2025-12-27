import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aeon | AI-Powered Website & App Builder",
  description: "Build stunning websites and apps in seconds with Aeon's AI. Just describe what you want and watch it come to life. No coding required.",
  keywords: ["AI website builder", "AI app builder", "no-code", "website generator", "app generator", "Aeon", "AI development", "web development", "instant websites"],
  authors: [{ name: "Aeon Protocol" }],
  creator: "Aeon Protocol",
  publisher: "Aeon Protocol",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aeonprotocol.com",
    siteName: "Aeon",
    title: "Aeon | AI-Powered Website & App Builder",
    description: "Build stunning websites and apps in seconds with Aeon's AI. Just describe what you want and watch it come to life.",
    images: [
      {
        url: "/tmpocncbr5a.png",
        width: 1200,
        height: 630,
        alt: "Aeon - AI Website Builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aeon | AI-Powered Website & App Builder",
    description: "Build stunning websites and apps in seconds with Aeon's AI. No coding required.",
    images: ["/tmpocncbr5a.png"],
    creator: "@aeonprotocol",
  },
  icons: {
    icon: "/aeon_fox.png",
    shortcut: "/aeon_fox.png",
    apple: "/aeon_fox.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
