import type { Metadata, Viewport } from "next";
import { Inter, Poppins, Rubik } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#d17eff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "BillKhata - Shared Living Expense Manager",
    template: "%s | BillKhata"
  },
  description: "The ultimate app for managing shared living expenses. Split bills, track meals, and manage finances with roommates easily and transparently.",
  keywords: ["bill splitting", "roommate expenses", "meal tracker", "finance manager", "shared living", "hostel management", "mess manager"],
  authors: [{ name: "BillKhata Team" }],
  creator: "BillKhata",
  publisher: "BillKhata",
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://billkhata.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "BillKhata - Split Bills, Share Meals, Stay Friends",
    description: "Manage shared living expenses, bills, meals, and finances among roommates. The easiest way to keep your shared finances transparent.",
    url: 'https://billkhata.com',
    siteName: 'BillKhata',
    images: [
      {
        url: '/og-image.png', // We will generate this next
        width: 1200,
        height: 630,
        alt: 'BillKhata Dashboard Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "BillKhata - Shared Living Expense Manager",
    description: "Split bills, track meals, and manage finances with roommates easily.",
    creator: '@billkhata',
    images: ['/og-image.png'], // We will generate this next
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BillKhata"
  },
  icons: {
    icon: [
      { url: "/icon.png?v=2" },
      { url: "/icons/icon-192x192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png?v=2", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icons/icon-152x152.png?v=2", sizes: "152x152", type: "image/png" }
    ]
  },
  verification: {
    google: 'i1xPv3xUSFmawFqPGNYjokyGB8SG5A5WWjjUtZ1c2a0',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${poppins.variable} ${rubik.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
