import React from 'react';
import { ShieldCheck, Lock, Star, Zap, Trophy, Award, CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';

const badges = [
  { icon: <ShieldCheck size={48} color="#10b981" />, name: 'Identity Verified', desc: 'Your government-issued ID has been verified.', earned: true },
  { icon: <Lock size={48} color="#3b82f6" />, name: 'Secure Payer', desc: 'Completed 10+ escrow-protected payments.', earned: true },
  { icon: <Star size={48} color="#f59e0b" />, name: 'Top Rated', desc: 'Maintained a 4.8+ rating across 20 tasks.', earned: true },
  { icon: <Zap size={48} color="#6b7280" />, name: 'Fast Poster', desc: 'Post tasks that receive offers within 1 hour.', earned: false },
  { icon: <Trophy size={48} color="#6b7280" />, name: 'Community Champion', desc: 'Helped 50+ community members complete tasks.', earned: false },
  { icon: <Award size={48} color="#6b7280" />, name: 'Power User', desc: 'Active member for over 12 months.', earned: false },
];

export default function BadgesPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Verified Badges</h1>
      <p className={styles.subtitle}>Earn badges to build trust with the PayLink community and unlock more opportunities.</p>

      <div className={styles.grid}>
        {badges.map(b => (
          <div key={b.name} className={`${styles.badgeCard} ${b.earned ? styles.earned : styles.locked}`}>
            <div className={styles.badgeIcon}>{b.icon}</div>
            <h3 className={styles.badgeName}>{b.name}</h3>
            <p className={styles.badgeDesc}>{b.desc}</p>
            <div className={styles.badgeStatus}>
              {b.earned ? <span className={styles.earnedTag}><CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Earned</span> : <span className={styles.lockedTag}><Lock size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Locked</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
