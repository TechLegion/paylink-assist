"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Search, ShieldCheck, Award, Settings, LogOut } from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { href: '/browse', label: 'Browse', icon: <Search size={20} /> },
  { href: '/escrow', label: 'Escrow History', icon: <ShieldCheck size={20} /> },
  { href: '/badges', label: 'Verified Badges', icon: <Award size={20} /> },
  { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    import('@/lib/api').then(({ getMe }) => {
      getMe().then(data => setUser(data));
    });
  }, []);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>PayLink Assist</div>
      <div className={styles.userProfile}>
        <div className={styles.avatar} />
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user?.username?.replace(/_/g, ' ') || 'Loading...'}</span>
          <span className={styles.userBadge}>{user?.is_verified ? 'Verified Member' : 'Member'}</span>
        </div>
      </div>
      <button className={styles.postButton} onClick={() => router.push('/')}>
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
      <div 
        className={styles.signOut} 
        onClick={() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.push('/login');
        }}
        style={{ cursor: 'pointer' }}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}><LogOut size={16} /></span> Sign Out
      </div>
    </aside>
  );
}
