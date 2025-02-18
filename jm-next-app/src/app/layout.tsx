import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import DynamicBlob from "@/app/components/DynamicBlob";
import Navbar from "@/app/components/Navbar";
import Providers from "@/providers/AmplifyProvider";



const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
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
      <body className={plusJakartaSans.className}>
        <div>
          {/* Background layer */}
          <div className="fixed inset-0 bg-gray-900/10 -z-20" />
          
          {/* Blob layer */}
          <div className="fixed inset-0 -z-10">
            <DynamicBlob />
          </div>

          {/* Content layer */}
          <div className="relative z-0">
            <Providers>
              <Navbar />
            </Providers>
              <div className="relative">
                {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
