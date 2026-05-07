"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { getEscrows, EscrowTransaction } from '@/lib/api';
import styles from './page.module.css';

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  HELD: { bg: '#fef3c7', color: '#92400e', label: 'Held in Escrow' },
  RELEASED: { bg: '#d1fae5', color: '#065f46', label: 'Released' },
  REFUNDED: { bg: '#fee2e2', color: '#991b1b', label: 'Refunded' },
  DISPUTED: { bg: '#ede9fe', color: '#5b21b6', label: 'In Dispute' },
};

export default function EscrowPage() {
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEscrows().then((data) => {
      setEscrows(data || []);
      setLoading(false);
    });
  }, []);

  const total = escrows.reduce((sum, escrow) => sum + parseFloat(escrow.amount), 0);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Escrow History</h1>
      <p className={styles.subtitle}>All your secured Payaza payments and transaction records.</p>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Transactions</span>
          <span className={styles.statValue}>{escrows.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Amount</span>
          <span className={styles.statValue}>₦{total.toFixed(2)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Protected by Payaza</span>
          <span className={styles.statValue} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            100% <ShieldCheck size={24} color="#10b981" />
          </span>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : escrows.length === 0 ? (
        <div className={styles.empty}>No escrow transactions yet. <Link href="/">Post a task</Link> to get started.</div>
      ) : (
        <div className={styles.list}>
          {escrows.map((escrow) => {
            const task = escrow.task_details;
            const status = STATUS_STYLES[escrow.status] || STATUS_STYLES.HELD;

            return (
              <Link key={escrow.id} href={`/tasks/${escrow.task}`} className={styles.escrowRow}>
                <div className={styles.escrowMain}>
                  <div className={styles.escrowIcon}><Lock size={20} color="#6b7280" /></div>
                  <div className={styles.escrowText}>
                    <strong>{task?.title || `Task #${escrow.task}`}</strong>
                    <span className={styles.description}>{task?.description || 'Open task details'}</span>
                    <span className={styles.ref}>Payaza Ref: {escrow.payaza_reference || 'Pending reference'}</span>
                  </div>
                </div>
                <div className={styles.escrowMeta}>
                  <span className={styles.statusBadge} style={{ background: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                  <span className={styles.amount}>₦{parseFloat(escrow.amount).toFixed(2)}</span>
                  <ArrowRight size={18} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
