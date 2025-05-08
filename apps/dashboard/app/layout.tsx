import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SplashCursor from "@/components/ui/splash-cursor";
import { Toaster } from "sonner";
import CustomQueryClientProvider from "@/providers/QueryClientProvider";

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
    <html lang="en" className="antialiased h-full w-full">
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full w-full`}
      >
        <Toaster
          toastOptions={{
            classNames: {
              success: "bg-green-400",
              error: "bg-red-400",
              warning: "bg-yellow-400",
              info: "bg-blue-400",
            },
          }}
        />
        <CustomQueryClientProvider>{children}</CustomQueryClientProvider>
        <SplashCursor />
      </body>
    </html>
  );
}
