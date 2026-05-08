"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './TopNav.module.css';
import { Bell, HelpCircle, LogIn, UserPlus, User, LogOut, ShieldCheck, CheckCircle2, Menu, X } from 'lucide-react';
import { AUTH_CHANGED_EVENT, isAuthenticated, logout } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';

const navLinks = [
  { href: '/dashboard', label: 'Home' },
  { href: '/browse', label: 'Browse' },
  { href: '/', label: 'Post' },
  { href: '/escrow', label: 'Tasks' },
  { href: '/wallet', label: 'Wallet' },
];

const mobileNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: <Menu size={20} /> },
  { href: '/browse', label: 'Browse Tasks', icon: <Menu size={20} /> },
  { href: '/escrow', label: 'Escrow History', icon: <Menu size={20} /> },
  { href: '/badges', label: 'Verified Badges', icon: <Menu size={20} /> },
  { href: '/settings', label: 'Settings', icon: <Menu size={20} /> },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'Payment Secured', desc: '₦15,000 held in escrow for Furniture Assembly.', icon: <ShieldCheck size={16} color="#3b82f6" />, time: '2m ago' },
  { id: 2, title: 'Task Accepted', desc: 'Helper found for "Fix leaking tap".', icon: <CheckCircle2 size={16} color="#10b981" />, time: '1h ago' },
  { id: 3, title: 'Identity Verified', desc: 'Your account is now fully verified.', icon: <ShieldCheck size={16} color="#10b981" />, time: '2h ago' },
];

export default function TopNav({ onMenuToggle, isMenuOpen }: { onMenuToggle: () => void, isMenuOpen: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signedIn, setSignedIn] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

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

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className={styles.topNav}>
      <div className={styles.left}>
        <button 
          className={styles.menuToggle} 
          onClick={onMenuToggle}
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className={styles.logo} onClick={() => router.push('/')}>PayLink Assist</div>
      </div>

      <div className={styles.actions}>
        <div className={styles.notificationWrapper}>
          <button 
            className={`${styles.iconButton} ${showNotifications ? styles.iconButtonActive : ''}`} 
            aria-label="Notifications" 
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {signedIn && <span className={styles.badgeDot} />}
          </button>
          
          {showNotifications && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                Notifications
                <button onClick={() => setShowNotifications(false)}>Close</button>
              </div>
              <div className={styles.dropdownList}>
                {MOCK_NOTIFICATIONS.map(n => (
                  <div key={n.id} className={styles.notificationItem}>
                    <div className={styles.notificationIcon}>{n.icon}</div>
                    <div className={styles.notificationContent}>
                      <strong>{n.title}</strong>
                      <p>{n.desc}</p>
                      <span>{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.dropdownFooter}>
                View all notifications
              </div>
            </div>
          )}
        </div>

        <div className={styles.themeToggleWrapper}>
          <ThemeToggle />
        </div>

        <button className={styles.iconButton} aria-label="Help" onClick={() => alert('Help center coming soon!')}>
          <HelpCircle size={20} />
        </button>
        
        {signedIn ? (
          <>
            <Link href="/settings" aria-label="Profile" className={styles.avatar} title="Profile">
              <User size={20} />
            </Link>
            <button className={styles.iconButton} aria-label="Sign Out" title="Sign Out" onClick={handleSignOut}>
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <div className={styles.authActions}>
            <Link href="/login" className={styles.authLink}>
              <LogIn size={16} />
              <span>Log in</span>
            </Link>
            <Link href="/signup" className={styles.authPrimary}>
              <UserPlus size={16} />
              <span>Sign up</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
