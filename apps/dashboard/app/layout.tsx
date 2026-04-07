import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import CustomQueryClientProvider from "@/providers/QueryClientProvider";
import { SocketProvider } from "@/providers/socket-provider";
import { DeviceProvider } from "@/providers/device-provider";
import { AgoraOtoscopyProvider } from "@/providers/agora-otoscopy-provider";
import DemoAccountBanner from "@/components/ui/demo-account-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Omni Dashboard",
  description: "Omni Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased h-full w-full" suppressHydrationWarning>
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <body
        className={`${geistSans.variable} ${geistMono.variable}  antialiased h-full w-full`}
        suppressHydrationWarning
      >
        <Toaster />
        <CustomQueryClientProvider>
          <SocketProvider>
            <DeviceProvider>
             
                <AgoraOtoscopyProvider>
                  <DemoAccountBanner />
                  {children}
                </AgoraOtoscopyProvider>
             
            </DeviceProvider>
          </SocketProvider>
        </CustomQueryClientProvider>
      </body>
    </html>
  );
}
