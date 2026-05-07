"use client";
import React, { useEffect, useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Shield, Clock, CheckCircle2, CreditCard } from 'lucide-react';
import { getWalletStats, EscrowTransaction, isAuthenticated } from '@/lib/api';
import { useRouter } from 'next/navigation';
import TimeAgo from '@/components/TimeAgo';
import styles from './page.module.css';

export default function WalletPage() {
  const [stats, setStats] = useState<{
    active_escrow: number;
    pending_earnings: number;
    total_balance: number;
    transactions: EscrowTransaction[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    getWalletStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, [router]);

  if (loading) return <div className={styles.loading}>Loading wallet...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Wallet className={styles.titleIcon} size={32} />
          <div>
            <h1 className={styles.title}>Your Wallet</h1>
            <p className={styles.subtitle}>Manage your escrowed funds and earnings secured by Payaza.</p>
          </div>
        </div>
        <button className={styles.withdrawBtn}>
          <ArrowUpRight size={18} />
          Withdraw Funds
        </button>
      </header>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.primaryCard}`}>
          <div className={styles.statInfo}>
            <span>TOTAL BALANCE</span>
            <h2>₦{stats?.total_balance.toLocaleString()}</h2>
            <p>Available for withdrawal</p>
          </div>
          <CreditCard className={styles.cardIcon} size={48} />
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span>ACTIVE ESCROW</span>
            <h2>₦{stats?.active_escrow.toLocaleString()}</h2>
            <p>Funds locked in tasks you posted</p>
          </div>
          <Shield className={styles.cardIcon} size={48} color="var(--accent)" />
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span>PENDING EARNINGS</span>
            <h2>₦{stats?.pending_earnings.toLocaleString()}</h2>
            <p>Awaiting release from posters</p>
          </div>
          <Clock className={styles.cardIcon} size={48} color="#f59e0b" />
        </div>
      </div>

      <section className={styles.transactionsSection}>
        <h3 className={styles.sectionTitle}>Recent Transactions</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Task</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.transactions.map(tx => (
                <tr key={tx.id}>
                  <td>
                    <div className={styles.dateCell}>
                      <TimeAgo date={tx.created_at} />
                      <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.taskCell}>
                      <strong>{tx.task_details?.title}</strong>
                      <span>{tx.task_details?.category}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.typeTag}>
                      {tx.status === 'RELEASED' ? <ArrowDownLeft size={14} color="#10b981" /> : <Shield size={14} />}
                      {tx.status === 'RELEASED' ? 'Payout' : 'Escrow'}
                    </span>
                  </td>
                  <td>
                    <span className={styles.amount}>₦{parseFloat(tx.amount).toLocaleString()}</span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles['status' + tx.status]}`}>
                      {tx.status === 'HELD' && 'Held'}
                      {tx.status === 'RELEASED' && 'Completed'}
                      {tx.status === 'PENDING' && 'Pending'}
                      {tx.status === 'REFUNDED' && 'Refunded'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats?.transactions || stats.transactions.length === 0) && (
                <tr>
                  <td colSpan={5} className={styles.empty}>No transactions found yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
