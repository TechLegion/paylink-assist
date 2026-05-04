"use client";
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { getEscrows, getTasks, EscrowTransaction, Task } from '@/lib/api';
import styles from './page.module.css';

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  HELD:     { bg: '#fef3c7', color: '#92400e', label: 'Held in Escrow' },
  RELEASED: { bg: '#d1fae5', color: '#065f46', label: 'Released' },
  REFUNDED: { bg: '#fee2e2', color: '#991b1b', label: 'Refunded' },
  DISPUTED: { bg: '#ede9fe', color: '#5b21b6', label: 'In Dispute' },
};

export default function EscrowPage() {
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEscrows(), getTasks()]).then(([e, t]) => {
      setEscrows(e || []);
      setTasks(t || []);
      setLoading(false);
    });
  }, []);

  const getTask = (id: number) => tasks.find(t => t.id === id);
  const total = escrows.reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Escrow History</h1>
      <p className={styles.subtitle}>All your secured payments and transaction records.</p>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Transactions</span>
          <span className={styles.statValue}>{escrows.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Amount</span>
          <span className={styles.statValue}>${total.toFixed(2)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Protected by Payaza</span>
          <span className={styles.statValue} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>100% <ShieldCheck size={24} color="#10b981" /></span>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : escrows.length === 0 ? (
        <div className={styles.empty}>No escrow transactions yet. <a href="/">Post a task</a> to get started.</div>
      ) : (
        <div className={styles.list}>
          {escrows.map(e => {
            const t = getTask(e.task);
            const s = STATUS_STYLES[e.status] || STATUS_STYLES.HELD;
            return (
              <div key={e.id} className={styles.escrowRow}>
                <div className={styles.escrowMain}>
                  <div className={styles.escrowIcon}><Lock size={20} color="#6b7280" /></div>
                  <div>
                    <strong>{t?.title || `Task #${e.task}`}</strong>
                    <span className={styles.ref}>Ref: {e.payaza_reference || '—'}</span>
                  </div>
                </div>
                <div className={styles.escrowMeta}>
                  <span className={styles.statusBadge} style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  <span className={styles.amount}>${parseFloat(e.amount).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
