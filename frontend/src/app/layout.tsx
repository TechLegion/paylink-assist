import type { Metadata } from "next";
import "./globals.css";
import MainLayout from "@/components/MainLayout";

export const metadata: Metadata = {
  title: "PayLink Assist",
  description: "Secure escrow payments for your tasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}
