import type { Metadata } from "next";
import { Montserrat_Alternates } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat_Alternates({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const siteUrl = "https://services.vivereateneo.com";

export const metadata: Metadata = {
  title: "Vivere Services",
  description: "Vivere Services Application",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Vivere Services",
    description: "Vivere Services Application",
    url: siteUrl,
    siteName: "Vivere Services",
    locale: "it_IT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      {" "}
      {/* Importante: lang="it" per la SEO italiana */}
      <body className={`${montserrat.variable} antialiased`}>{children}</body>
    </html>
  );
}
