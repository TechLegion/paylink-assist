import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav/TopNav";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./layout.module.css";

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
      <body className={styles.appContainer}>
        <TopNav />
        <div className={styles.mainWrapper}>
          <Sidebar />
          <main className={styles.pageContainer}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
