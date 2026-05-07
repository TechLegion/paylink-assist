"use client";
import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';

import { AUTH_CHANGED_EVENT, getMe, updateProfile, UserProfile } from '@/lib/api';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ name: '', bio: '', notifications: true, escrowAlerts: true });

  React.useEffect(() => {
    getMe().then(data => {
      if (data) {
        setUser(data);
        setForm(f => ({ ...f, name: data.username, bio: data.bio || '' }));
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;

    setSaving(true);
    const res = await updateProfile(user.id, {
      username: form.name,
      bio: form.bio,
    });

    setSaving(false);
    if (res) {
      setSaved(true);
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert("Failed to update profile. Please try again.");
    }
  };

  if (loading) return <div className={styles.page}>Loading settings...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>

      {saved && <div className={styles.successBanner}><CheckCircle2 size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} /> Settings saved successfully!</div>}

      <form onSubmit={handleSave}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input className={styles.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email (Read-only)</label>
              <input className={styles.input} type="email" value={user?.email || ''} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Bio</label>
            <textarea className={styles.textarea} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} placeholder="Tell the community about yourself..." />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Notifications</h2>
          <div className={styles.toggle}>
            <div>
              <strong>Task Notifications</strong>
              <p>Get notified when someone accepts or messages about your task.</p>
            </div>
            <button type="button" className={`${styles.toggleBtn} ${form.notifications ? styles.toggleOn : ''}`} onClick={() => setForm({...form, notifications: !form.notifications})}>
              {form.notifications ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className={styles.toggle}>
            <div>
              <strong>Escrow Alerts</strong>
              <p>Get notified on every escrow status change.</p>
            </div>
            <button type="button" className={`${styles.toggleBtn} ${form.escrowAlerts ? styles.toggleOn : ''}`} onClick={() => setForm({...form, escrowAlerts: !form.escrowAlerts})}>
              {form.escrowAlerts ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Payment</h2>
          <p className={styles.payDesc}>Payments are securely processed by <strong>Payaza</strong>. Your escrow funds are always protected.</p>
          <button type="button" className={styles.outlineBtn} onClick={() => alert('Payment settings via Payaza dashboard coming soon!')}>Manage Payment Methods →</button>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
