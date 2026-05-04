"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, HelpCircle } from 'lucide-react';
import styles from './TopNav.module.css';

const navLinks = [
  { href: '/dashboard', label: 'Home' },
  { href: '/browse', label: 'Browse' },
  { href: '/', label: 'Post' },
  { href: '/escrow', label: 'Tasks' },
  { href: '/wallet', label: 'Wallet' },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className={styles.topNav}>
      <div className={styles.logo}>PayLink Assist</div>
      <nav className={styles.navLinks}>
        {navLinks.map(({ href, label }) => (
          <Link
            key={label}
            href={href}
            className={`${styles.navLink} ${pathname === href ? styles.activeLink : ''}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className={styles.actions}>
        <button className={styles.iconButton} aria-label="Notifications" onClick={() => alert('No new notifications.')}>
          <Bell size={20} />
        </button>
        <button className={styles.iconButton} aria-label="Help" onClick={() => alert('Help center coming soon!')}>
          <HelpCircle size={20} />
        </button>
        <Link href="/settings"><div className={styles.avatar} title="Profile" /></Link>
      </div>
    </header>
  );
}
