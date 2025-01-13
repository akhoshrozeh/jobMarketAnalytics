import type { Metadata } from "next";
import { Quicksand, Single_Day } from "next/font/google";
import "./globals.css";
import DynamicBlob from "@/app/components/DynamicBlob";
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
      <body className={quicksand.className}>
        <div>
          {/* Background layer */}
          <div className="fixed inset-0 bg-gray-900 -z-20" />
          
          {/* Blob layer */}
          <div className="fixed inset-0 -z-10">
            <DynamicBlob />
          </div>

          {/* Content layer */}
          <div className="relative z-0">
            <Navbar />
            <div className="relative">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
