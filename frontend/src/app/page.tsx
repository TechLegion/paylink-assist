"use client";

import React, { useState } from 'react';
import { Shield, FileText, MapPin, DollarSign, Zap, CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Furniture Assembly',
    urgency: 'LOW',
    budget: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
      // Send poster ID 1 (our dummy profile)
      const payload = {
        ...formData,
        poster: 1, 
      };

      const response = await fetch('http://localhost:8000/api/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          title: '',
          description: '',
          category: 'Furniture Assembly',
          urgency: 'LOW',
          budget: '',
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        console.error("Failed to create task", await response.json());
        alert("Error creating task. Check console.");
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {success && (
        <div style={{ backgroundColor: '#10b981', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={20} /> Task created successfully and saved to Django!
        </div>
      )}

      <div className={styles.securityBanner}>
        <Shield size={20} />
        <span>Your payments are secured via PayLink Escrow. Funds are only released when you're satisfied.</span>
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
                <label className={styles.formLabel}>Budget ($)</label>
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
