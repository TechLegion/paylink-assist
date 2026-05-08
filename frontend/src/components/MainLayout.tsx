"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import TopNav from "@/components/TopNav/TopNav";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "@/app/layout.module.css";
import { AUTH_CHANGED_EVENT, isAuthenticated } from '@/lib/api';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const [signedIn, setSignedIn] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const syncAuth = () => setSignedIn(isAuthenticated());

    syncAuth();
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuth);
    window.addEventListener('storage', syncAuth);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, [pathname]);

  // Close mobile menu on path change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Auth pages own their full-screen layout.
  const showNav = !isAuthPage;

  if (!showNav) {
    return <main className={styles.authContainer}>{children}</main>;
  }

  return (
    <div className={styles.appContainer}>
      <TopNav onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
      <div className={styles.mainWrapper}>
        <Sidebar isOpen={isMobileMenuOpen} />
        <main className={styles.pageContainer}>
          {children}
        </main>
      </div>
    </div>
  );
}
