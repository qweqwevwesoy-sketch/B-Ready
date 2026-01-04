import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { NotificationContainer } from "@/components/NotificationManager";
import { GoogleTranslate } from "@/components/GoogleTranslate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "B-READY - Barangay Disaster Reporting",
  description: "Real-time emergency reporting, community coordination, and rapid response for a safer barangay.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <SocketProvider>
            {children}
            <NotificationContainer />
            <GoogleTranslate />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
