"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Search, ShieldCheck, Award, Settings, LogIn, LogOut, User } from 'lucide-react';
import styles from './Sidebar.module.css';
import { AUTH_CHANGED_EVENT, getMe, isAuthenticated, logout, UserProfile } from '@/lib/api';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { href: '/browse', label: 'Browse', icon: <Search size={20} /> },
  { href: '/escrow', label: 'Escrow History', icon: <ShieldCheck size={20} /> },
  { href: '/badges', label: 'Verified Badges', icon: <Award size={20} /> },
  { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [signedIn, setSignedIn] = React.useState(false);

  React.useEffect(() => {
    const syncAuth = () => {
      const hasToken = isAuthenticated();
      setSignedIn(hasToken);

      if (!hasToken) {
        setUser(null);
        return;
      }

      getMe().then(data => {
        if (data) setUser(data);
      });
    };

    syncAuth();
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuth);
    window.addEventListener('storage', syncAuth);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, [pathname]);

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.userProfile}>
        <div className={styles.avatar}><User size={24} /></div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user ? user.username.replace(/_/g, ' ') : 'Not signed in'}</span>
          <span className={styles.userBadge}>
            {signedIn ? (user?.is_verified ? 'Verified Member' : 'Member workspace') : 'Sign in to access your workspace'}
          </span>
        </div>
      </div>
      <button className={styles.postButton} onClick={() => router.push(signedIn ? '/' : '/login')}>
        + Post New Task
      </button>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      {signedIn ? (
        <div
          className={styles.signOut}
          onClick={() => {
            logout();
            router.push('/login');
          }}
          style={{ cursor: 'pointer' }}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}><LogOut size={16} /></span> Sign Out
        </div>
      ) : (
        <div
          className={styles.signOut}
          onClick={() => router.push('/login')}
          style={{ cursor: 'pointer' }}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}><LogIn size={16} /></span> Sign In
        </div>
      )}
    </aside>
  );
}
