import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { ModalManagerProvider } from "@/contexts/ModalManager";
import { NotificationContainer } from "@/components/NotificationManager";
import { ServiceWorker } from "@/components/ServiceWorker";
import { OfflineBanner } from "@/components/OfflineBanner";
import WebSocketConfig from "@/components/WebSocketConfig";
import { WebSocketWarning } from "@/components/WebSocketWarning";

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
    <html lang="en" suppressHydrationWarning>
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#28599a" />
        <link rel="icon" type="image/png" sizes="32x32" href="/BLogo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/BLogo.png" />
        <link rel="apple-touch-icon" href="/BLogo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="B-READY" />
      </head>
          <body className={inter.className} suppressHydrationWarning>
          <OfflineBanner />
          <AuthProvider>
            <SocketProvider>
              <ModalManagerProvider>
                {children}
                <NotificationContainer />
                <ServiceWorker />
                <WebSocketConfig />
                <WebSocketWarning />
              </ModalManagerProvider>
            </SocketProvider>
          </AuthProvider>
        </body>
    </html>
  );
}
