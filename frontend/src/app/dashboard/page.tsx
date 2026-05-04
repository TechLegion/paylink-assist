"use client";
import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, MessageSquare, CreditCard, Lock, Star } from 'lucide-react';
import { getTasks, getEscrows, updateEscrow, Task, EscrowTransaction } from '@/lib/api';
import styles from './page.module.css';

const TIMELINE_STEPS = ['Funds Deposited', 'Task Completed', 'Pending Release', 'Funds Disbursed'];

export default function DashboardPage() {
  const [task, setTask] = useState<Task | null>(null);
  const [escrow, setEscrow] = useState<EscrowTransaction | null>(null);
  const [released, setReleased] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTasks(), getEscrows()]).then(([tasks, escrows]) => {
      const completed = (tasks || []).find(t => t.status === 'COMPLETED');
      setTask(completed || null);
      const esc = (escrows || []).find(e => e.task === completed?.id);
      setEscrow(esc || null);
      if (esc?.status === 'RELEASED') setReleased(true);
      setLoading(false);
    });
  }, []);

  const handleRelease = async () => {
    if (!escrow) return;
    await updateEscrow(escrow.id, { status: 'RELEASED' });
    setReleased(true);
  };

  const currentStep = released ? 3 : 2;
  const serviceRate = task ? parseFloat(task.budget) * 0.025 : 0;
  const materialReimbursement = 450;
  const total = task ? parseFloat(task.budget) + materialReimbursement + serviceRate : 0;

  if (loading) return <div className={styles.loading}>Loading dashboard...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.escrowBanner}>
        <ShieldCheck size={24} />
        <div>
          <strong>PAYMENT HELD IN ESCROW</strong>
          <span>Funds are secured by PayLink Assist and will only be released once you confirm the task is complete.</span>
        </div>
      </div>

      {task ? (
        <>
          <div className={styles.mainGrid}>
            <div className={styles.taskCard}>
              <div className={styles.taskBadge}><CheckCircle2 size={14} style={{display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px'}} /> TASK COMPLETED</div>
              <h2 className={styles.taskTitle}>{task.title}</h2>
              <p className={styles.taskDesc}>{task.description}</p>
              {task.worker_details && (
                <div className={styles.workerRow}>
                  <div>
                    <span className={styles.workerLabel}>HELPER</span>
                    <div className={styles.workerInfo}>
                      <div className={styles.workerAvatar} />
                      <div>
                        <strong>{task.worker_details.username.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</strong>
                        <span><Star size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', color: '#f59e0b', fill: '#f59e0b', marginRight: '4px' }} /> {task.worker_details.rating} ({task.worker_details.reviews_count} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <button className={styles.msgBtn}><MessageSquare size={18} /></button>
                </div>
              )}
            </div>

            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Payment Summary</h3>
              <div className={styles.summaryRow}><span>Task Rate</span><span>${parseFloat(task.budget).toFixed(2)}</span></div>
              <div className={styles.summaryRow}><span>Material Reimbursement</span><span>${materialReimbursement.toFixed(2)}</span></div>
              <div className={styles.summaryRow}><span>Service Fee (2.5%)</span><span>${serviceRate.toFixed(2)}</span></div>
              <div className={styles.summaryTotal}>
                <span>TOTAL SECURE PAYMENT</span>
                <span className={styles.totalAmount}>${total.toFixed(2)}</span>
              </div>
              <div className={styles.fundsNote}>
                <Lock size={14} style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px'}} /> Your funds are protected. By releasing payment, you acknowledge the work is completed to your satisfaction.
              </div>
            </div>
          </div>

          <div className={styles.timelineCard}>
            <h3 className={styles.timelineTitle}>ESCROW STATUS TIMELINE</h3>
            <div className={styles.timeline}>
              {TIMELINE_STEPS.map((step, i) => (
                <div key={step} className={styles.timelineItem}>
                  <div className={`${styles.timelineDot} ${i <= currentStep ? styles.dotActive : ''} ${i === currentStep && !released ? styles.dotCurrent : ''}`}>
                    {i < currentStep ? <CheckCircle2 size={16} /> : i === 3 ? <CreditCard size={16} /> : i === 2 ? <ShieldCheck size={16} /> : ''}
                  </div>
                  <span className={`${styles.timelineLabel} ${i === currentStep ? styles.labelActive : ''}`}>{step}</span>
                  {i < TIMELINE_STEPS.length - 1 && <div className={`${styles.timelineLine} ${i < currentStep ? styles.lineActive : ''}`} />}
                </div>
              ))}
            </div>
          </div>

          {released ? (
            <div className={styles.releasedBanner}><CheckCircle2 size={20} style={{display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px'}} /> Payment of ${total.toFixed(2)} has been released to the worker!</div>
          ) : (
            <div className={styles.actions}>
              <button className={styles.reportBtn} onClick={() => alert('Issue reported! Our team will contact you within 24 hours.')}>Report an Issue</button>
              <button className={styles.releaseBtn} onClick={handleRelease}><ShieldCheck size={18} style={{display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px'}} /> Confirm Completion & Release Payment</button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.noTask}>
          <h2>No active escrow tasks</h2>
          <p>Post a task to get started with PayLink Escrow protection.</p>
          <a href="/" className={styles.postLink}>Post a Task →</a>
        </div>
      )}
    </div>
  );
}
