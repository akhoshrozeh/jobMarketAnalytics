import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

// Components
import Navbar from "@/app/components/Navbar";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
        className={quicksand.className}
      >
        <Navbar />
        <div>
          {children}

        </div>
      </body>
    </html>
  );
}
