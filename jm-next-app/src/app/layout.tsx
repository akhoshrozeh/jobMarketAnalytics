import type { Metadata } from "next";
import { Geist, Geist_Mono, Lexend, Roboto } from "next/font/google";
import "./globals.css";

// Components
import Navbar from "@/app/components/Navbar";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
}); 
 const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
 });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobTrendr | Job Market Tools",
  description: "Gain insights into the job market and make informed decisions about your career.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lexend.variable} ${roboto.variable} antialiased`}
      >
        <Navbar />
        <div>
          {children}

        </div>
      </body>
    </html>
  );
}
