"use client";

import React, { useState } from 'react';
import { Shield, FileText, MapPin, DollarSign, Zap } from 'lucide-react';
import { getMe, isAuthenticated, UserProfile } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Home() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Furniture Assembly',
    urgency: 'LOW',
    budget: '',
    location: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [virtualAccount, setVirtualAccount] = useState<{
    account_name?: string;
    account_number?: string;
    bank_name?: string;
    transaction_amount_payable?: number | string;
    transaction_reference?: string;
    expires_in_minutes?: number | string;
  } | null>(null);
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const router = useRouter();
  const payazaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (success && payazaRef.current) {
      payazaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [success]);

  React.useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }

    getMe().then(data => {
      setUser(data);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUrgencyClick = (level: string) => {
    setFormData({ ...formData, urgency: level });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!user) {
        alert("Please login to post a task.");
        router.push('/login');
        return;
      }

      if (!formData.budget || parseFloat(formData.budget) <= 0) {
        alert("Please enter a valid budget greater than 0.");
        setIsSubmitting(false);
        return;
      }

      // Send actual user profile ID
      const payload = {
        ...formData,
        poster: user.id, 
      };

      const { createTask } = await import('@/lib/api');
      const data = await createTask(payload);

      if (data) {
        setSuccess(true);
        setPaymentStatus(
          data.payaza_reference
            ? `Payaza ${data.payment_status || 'PENDING'} - Ref ${data.payaza_reference}`
            : data.payment_warning || null
        );
        setVirtualAccount(data.virtual_account || null);
        setFormData({
          title: '',
          description: '',
          category: 'Furniture Assembly',
          urgency: 'LOW',
          budget: '',
          location: '',
        });
        
        // Redirect to Payaza if checkout_url is provided
        if (data.checkout_url) {
          setTimeout(() => {
            window.location.href = data.checkout_url!;
          }, 1500);
        } else {
          setTimeout(() => {
            setSuccess(false);
            setPaymentStatus(null);
          }, data.virtual_account ? 30000 : 6000);
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      alert(error instanceof Error ? error.message : "Payaza payment could not be initialized, so the task was not created.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {success && (
        <div className={styles.payazaPanel} ref={payazaRef}>
          <div className={styles.payazaHeader}>
            <div className={styles.payazaMark}>P</div>
            <div>
              <h2 className={styles.payazaTitle}>Payaza payment account</h2>
              <p className={styles.payazaSubtitle}>{paymentStatus || 'Payment pending'}</p>
            </div>
          </div>
          {virtualAccount && (
            <div className={styles.payazaDetails}>
              <div>
                <span>Bank</span>
                <strong>{virtualAccount.bank_name}</strong>
              </div>
              <div>
                <span>Account number</span>
                <strong>{virtualAccount.account_number}</strong>
              </div>
              <div>
                <span>Account name</span>
                <strong>{virtualAccount.account_name}</strong>
              </div>
              <div>
                <span>Amount</span>
                <strong>{virtualAccount.transaction_amount_payable}</strong>
              </div>
              <div>
                <span>Reference</span>
                <strong>{virtualAccount.transaction_reference}</strong>
              </div>
              <div>
                <span>Expires</span>
                <strong>{virtualAccount.expires_in_minutes} minutes</strong>
              </div>
            </div>
          )}
          <div className={styles.payazaActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => {
                const details = [
                  `Bank: ${virtualAccount?.bank_name || ''}`,
                  `Account: ${virtualAccount?.account_number || ''}`,
                  `Name: ${virtualAccount?.account_name || ''}`,
                  `Amount: ${virtualAccount?.transaction_amount_payable || ''}`,
                  `Reference: ${virtualAccount?.transaction_reference || ''}`,
                ].join('\n');
                navigator.clipboard?.writeText(details);
              }}
            >
              Copy details
            </button>
            <button type="button" className={styles.btnPrimary} onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      <div className={styles.securityBanner}>
        <Shield size={20} />
        <span>Your payments are secured via PayLink Escrow. Funds are only released when you&apos;re satisfied.</span>
      </div>

      <div className={styles.stepper}>
        <div className={styles.stepLine}></div>
        <div className={`${styles.step} ${styles.stepActive}`}>
          <div className={styles.stepIcon}><FileText size={18} /></div>
          <span className={styles.stepLabel}>Details</span>
        </div>
        <div className={styles.step}>
          <div className={styles.stepIcon}><MapPin size={18} /></div>
          <span className={styles.stepLabel}>Logistics</span>
        </div>
        <div className={styles.step}>
          <div className={styles.stepIcon}><DollarSign size={18} /></div>
          <span className={styles.stepLabel}>Budget</span>
        </div>
      </div>

      <div className={styles.formCard}>
        <h1 className={styles.formTitle}>Tell us about your task</h1>
        <p className={styles.formSubtitle}>Be descriptive to attract the most qualified community members.</p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Task Title</label>
            <input 
              type="text" 
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={styles.input} 
              placeholder="e.g., Help move furniture to new apartment" 
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.textarea} 
              placeholder="Provide details like tools needed, heavy lifting requirements, etc."
              required
            ></textarea>
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="Furniture Assembly">Furniture Assembly</option>
                  <option value="Moving Help">Moving Help</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Tutoring">Tutoring</option>
                  <option value="Personal Assistant">Personal Assistant</option>
                  <option value="Garden Help">Garden Help</option>
                  <option value="Car Repair">Car Repair</option>
                  <option value="Technology Help">Technology Help</option>
                </select>
              </div>
            </div>
            <div className={styles.col}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Urgency</label>
                <div className={styles.urgencyGroup}>
                  <button type="button" onClick={() => handleUrgencyClick('LOW')} className={`${styles.urgencyBtn} ${formData.urgency === 'LOW' ? styles.urgencyBtnActive : ''}`}>Low</button>
                  <button type="button" onClick={() => handleUrgencyClick('MEDIUM')} className={`${styles.urgencyBtn} ${formData.urgency === 'MEDIUM' ? styles.urgencyBtnActive : ''}`}>Medium</button>
                  <button type="button" onClick={() => handleUrgencyClick('HIGH')} className={`${styles.urgencyBtn} ${formData.urgency === 'HIGH' ? styles.urgencyBtnActive : ''}`}>High</button>
                </div>
              </div>
            </div>
            <div className={styles.col}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Budget (₦)</label>
                <input 
                  type="number" 
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className={styles.input} 
                  placeholder="e.g. 150" 
                  required
                />
              </div>
            </div>
            <div className={styles.col}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Location</label>
                <input 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={styles.input} 
                  placeholder="e.g. Lagos Island" 
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.btnSecondary}>← Cancel</button>
            <button type="submit" disabled={isSubmitting} className={styles.btnPrimary}>
              {isSubmitting ? 'Submitting...' : 'Post Task →'}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.bottomCards}>
        <div className={styles.safetyCard}>
          <div className={styles.safetyIcon}><Shield size={24} /></div>
          <h3 className={styles.safetyTitle}>Safety First</h3>
          <p className={styles.safetyText}>
            Always communicate through the platform to stay protected by our dispute resolution policy.
          </p>
        </div>
        
        <div className={styles.promoCard}>
          <h3 className={styles.promoTitle}>Need it done fast?</h3>
          <p className={styles.promoText}>
            Tasks with detailed descriptions and clear photos receive 40% more offers within the first hour.
          </p>
          <div className={styles.promoBgIcon}><Zap size={64} opacity={0.1} /></div>
        </div>
      </div>
    </>
  );
}
