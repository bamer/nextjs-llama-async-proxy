import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/providers/app-provider";
import { APP_CONFIG } from "@/config/app.config";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { initDatabase, setMetadata } from "@/lib/database";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Initialize database on server startup (runs once)
let dbInitialized = false;
if (!dbInitialized && typeof window === "undefined") {
  try {
    const db = initDatabase();
    setMetadata("server_start_time", Date.now().toString());
    console.log("[Database] Database initialized successfully");
    db.close();
    dbInitialized = true;
  } catch (error) {
    console.error("[Database] Failed to initialize database:", error);
  }
}

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  keywords: ["Llama", "AI", "Model Management", "Ollama", "LMStudio"],
  authors: [{ name: "Llama Runner Team" }],
  creator: "Llama Runner Team",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://llama-runner.example.com",
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    siteName: APP_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    creator: "@llamarunner",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3B82F6" },
    { media: "(prefers-color-scheme: dark)", color: "#1E293B" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
         <AppRouterCacheProvider>
           <AppProvider>{children}</AppProvider>
         </AppRouterCacheProvider>
       </body>
    </html>
  );
}
