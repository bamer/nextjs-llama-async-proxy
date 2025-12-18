import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WebSocketProvider } from "../components/websocket/WebSocketManager";
import { ThemeProvider } from "next-themes";
import { MuiThemeProviderWrapper } from "../components/ui/MuiThemeProvider";
import Layout from "../components/layout/Layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Llama Runner Async Proxy",
  description: "Web UI for managing Llama model runners with Ollama and LMStudio support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <WebSocketProvider>
          <ThemeProvider>
            <MuiThemeProviderWrapper>
              <Layout>
                {children}
              </Layout>
            </MuiThemeProviderWrapper>
          </ThemeProvider>
        </WebSocketProvider>
      </body>
    </html>
  );
}