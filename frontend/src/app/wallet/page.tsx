"use client";
import React, { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import styles from './page.module.css';

const transactions = [
  { id: 1, type: 'Deposit', desc: 'Task: Help Moving Furniture', amount: '+$120.00', date: 'May 3, 2026', color: '#10b981' },
  { id: 2, type: 'Withdrawal', desc: 'Payment released to Julian', amount: '-$1,691.25', date: 'Apr 28, 2026', color: '#ef4444' },
  { id: 3, type: 'Deposit', desc: 'Escrow funded: Garden Landscaping', amount: '+$1,200.00', date: 'Apr 20, 2026', color: '#10b981' },
  { id: 4, type: 'Refund', desc: 'Task cancelled: IKEA Assembly', amount: '+$65.00', date: 'Apr 15, 2026', color: '#f59e0b' },
];

export default function WalletPage() {
  const [tab, setTab] = useState<'balance' | 'transactions'>('balance');

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Wallet</h1>

      <div className={styles.balanceCard}>
        <div className={styles.balanceLabel}>Available Balance</div>
        <div className={styles.balanceAmount}>$384.75</div>
        <div className={styles.escrowNote}><Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> $1,691.25 held in escrow</div>
        <div className={styles.walletActions}>
          <button className={styles.primaryBtn} onClick={() => alert('Top up coming soon!')}>+ Add Funds</button>
          <button className={styles.secondaryBtn} onClick={() => alert('Withdrawal coming soon!')}>Withdraw</button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'balance' ? styles.tabActive : ''}`} onClick={() => setTab('balance')}>Overview</button>
        <button className={`${styles.tab} ${tab === 'transactions' ? styles.tabActive : ''}`} onClick={() => setTab('transactions')}>Transactions</button>
      </div>

      {tab === 'balance' && (
        <div className={styles.overviewGrid}>
          <div className={styles.overviewCard}><span className={styles.ocLabel}>Total Deposited</span><span className={styles.ocValue}>$2,450.00</span></div>
          <div className={styles.overviewCard}><span className={styles.ocLabel}>Total Withdrawn</span><span className={styles.ocValue}>$1,691.25</span></div>
          <div className={styles.overviewCard}><span className={styles.ocLabel}>In Escrow</span><span className={styles.ocValue}>$1,691.25</span></div>
          <div className={styles.overviewCard}><span className={styles.ocLabel}>Payaza Protected</span><span className={styles.ocValue} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>100% <ShieldCheck size={20} color="#10b981" /></span></div>
        </div>
      )}

      {tab === 'transactions' && (
        <div className={styles.txList}>
          {transactions.map(tx => (
            <div key={tx.id} className={styles.txRow}>
              <div>
                <strong>{tx.type}</strong>
                <span className={styles.txDesc}>{tx.desc}</span>
              </div>
              <div className={styles.txRight}>
                <span style={{ color: tx.color, fontWeight: 700 }}>{tx.amount}</span>
                <span className={styles.txDate}>{tx.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
