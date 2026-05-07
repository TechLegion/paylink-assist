"use client";
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, MessageSquare, CreditCard, Lock, Star, Clock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { getTasks, getEscrows, updateEscrow, updateTask, getMe, Task, EscrowTransaction, verifyPayment, syncPayaza, regeneratePayment, simulatePayment } from '@/lib/api';
import TimeAgo from '@/components/TimeAgo';
import styles from './page.module.css';

const TIMELINE_STEPS = ['Funds Deposited', 'Task Completed', 'Pending Release', 'Funds Disbursed'];

function DashboardContent() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [me, setMe] = useState<UserProfile | null>(null);
  const [escrow, setEscrow] = useState<EscrowTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [released, setReleased] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [completionNote, setCompletionNote] = useState('');

  const fetchData = useCallback(async () => {
    const [meProfile, allTasks, allEscrows] = await Promise.all([getMe(), getTasks(), getEscrows()]);
    if (!meProfile) {
      setLoading(false);
      return;
    }
    setMe(meProfile);

    const myTasks = (allTasks || []).filter(t => t.poster === meProfile.id || t.worker === meProfile.id);
    
    // Sort: Tasks I'm doing first, then tasks I posted
    myTasks.sort((a, b) => {
      const aIsWorker = a.worker === meProfile.id;
      const bIsWorker = b.worker === meProfile.id;
      if (aIsWorker && !bIsWorker) return -1;
      if (!aIsWorker && bIsWorker) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    setTasks(myTasks);

    // Pick a default task if none selected (following the sorted priority)
    const activeTask = selectedTaskId 
      ? myTasks.find(t => t.id === selectedTaskId) || myTasks[0]
      : myTasks[0];

    if (activeTask) {
      setSelectedTaskId(activeTask.id);
      const activeEscrow = (allEscrows || []).find(e => e.task === activeTask.id);
      setTask(activeTask);
      setEscrow(activeEscrow || null);
      setReleased(activeEscrow?.status === 'RELEASED');
    } else {
      setTask(null);
      setEscrow(null);
    }
    
    setLoading(false);
  }, [selectedTaskId]);

  useEffect(() => {
    const taskId = searchParams.get('task_id');
    const paymentStatus = searchParams.get('payment');

    queueMicrotask(() => {
      if (taskId && paymentStatus === 'success') {
        const id = parseInt(taskId);
        if (!isNaN(id)) {
          setSelectedTaskId(id);
          verifyPayment(id).then(fetchData);
          return;
        }
      }

      fetchData();
    });
  }, [fetchData, searchParams]);

  // Auto-sync Payaza payment + payout status to avoid manual clicks.
  useEffect(() => {
    if (!escrow || !task) return;

    const shouldPollPayment = task.status === 'PENDING_PAYMENT' && Boolean(escrow.payaza_reference);
    const payoutStatus = escrow.payout_status;
    const shouldPollPayout =
      escrow.status === 'RELEASED' &&
      (!payoutStatus || (payoutStatus !== 'SUCCESS' && payoutStatus !== 'FAILED'));

    if (!shouldPollPayment && !shouldPollPayout) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 30; // ~150s with 5s interval
    const intervalMs = 5000;
    const poll = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        await syncPayaza(escrow.id);
        if (!cancelled) await fetchData();
      } catch {
        // Keep polling; transient network/API failures shouldn't kill the demo flow.
      }
      if (attempts >= maxAttempts && !cancelled) {
        window.clearInterval(intervalId);
      }
    };

    // Fire immediately for a more "live" feel.
    poll();
    const intervalId = window.setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [escrow, task, fetchData]);

  const handleRelease = async () => {
    if (!escrow) return;
    const res = await updateEscrow(escrow.id, { status: 'RELEASED' });
    if (res) setReleased(true);
  };

  const handleVerify = async () => {
    if (!task) return;
    setLoading(true);
    await verifyPayment(task.id);
    await fetchData();
  };

  const [newPayment, setNewPayment] = useState<any>(null);
  const newPaymentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (newPayment && newPaymentRef.current) {
      newPaymentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [newPayment]);

  const handlePayNow = async () => {
    if (!task) return;
    setLoading(true);
    const data = await regeneratePayment(task.id);
    if (data && data.checkout_url) {
      window.location.href = data.checkout_url;
    } else if (data && data.virtual_account) {
      setNewPayment(data);
      setLoading(false);
    } else {
      alert("Could not initialize payment. Please try again.");
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (!task) return;
    setLoading(true);
    await simulatePayment(task.id);
    await fetchData();
  };

  const getStep = () => {
    if (released) return escrow?.payout_status === 'SUCCESS' ? 3 : 2;
    if (task?.status === 'COMPLETED') return 2;
    if (task?.status === 'IN_PROGRESS') return 1;
    if (task?.status === 'OPEN') return 0;
    return 0;
  };

  const handleMarkCompleted = async () => {
    if (!task) return;
    const res = await updateTask(task.id, { 
      status: 'COMPLETED',
      completion_note: completionNote 
    });
    if (res) {
      setTask({ ...task, status: 'COMPLETED', completion_note: completionNote });
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 5000);
      await fetchData();
    }
  };

  const currentStep = getStep();
  const serviceRate = task ? parseFloat(task.budget) * 0.025 : 0;
  const materialReimbursement = 0;
  const total = task ? parseFloat(task.budget) - serviceRate : 0;

  if (loading) return <div className={styles.loading}>Loading dashboard...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.escrowBanner}>
        {escrow?.status === 'HELD' ? <ShieldCheck size={24} color="#10b981" /> : <Clock size={24} color="#f59e0b" />}
        <div>
          <strong>{escrow?.status === 'HELD' ? 'PAYMENT HELD IN ESCROW' : 'PAYMENT PENDING'}</strong>
          <span>
            {escrow?.status === 'HELD' 
              ? 'Funds are secured by PayLink Assist and will only be released once you confirm the task is complete.'
              : 'Waiting for Payaza payment verification. Your task will go live once funds are secured.'}
          </span>
        </div>
      </div>

      {justCompleted && (
        <div className={styles.releasedBanner} style={{ marginBottom: '1.5rem', background: '#d1fae5', color: '#065f46', borderColor: '#34d399' }}>
          <CheckCircle2 size={20} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} />
          Task marked as completed! The poster has been notified to release your funds.
        </div>
      )}

      {tasks.length > 0 && (
        <div className={styles.taskNav}>
          {tasks.map(t => (
            <button
              key={t.id}
              className={`${styles.taskPill} ${selectedTaskId === t.id ? styles.taskPillActive : ''}`}
              onClick={() => setSelectedTaskId(t.id)}
            >
              <span className={styles.pillLabel}>{t.poster === me?.id ? 'My Posted Task' : 'Helping With'}</span>
              <span className={styles.pillTitle}>{t.title}</span>
            </button>
          ))}
        </div>
      )}

      {task ? (
        <>
          <div className={styles.mainGrid}>
            <div className={styles.taskCard}>
              <div className={styles.taskBadge}>
                <CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                {task.status === 'COMPLETED' ? 'TASK COMPLETED' : task.status === 'OPEN' ? 'WAITING FOR HELPER' : 'TASK IN PROGRESS'}
              </div>
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
                        <span>
                          <Star size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', color: '#f59e0b', fill: '#f59e0b', marginRight: '4px' }} />
                          {task.worker_details.rating} - <TimeAgo date={task.updated_at} />
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className={styles.msgBtn}><MessageSquare size={18} /></button>
                </div>
              )}
            </div>

            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Payment Summary</h3>
              <div className={styles.summaryRow}><span>Task Rate</span><span>₦{parseFloat(task.budget).toFixed(2)}</span></div>
              <div className={styles.summaryRow}><span>Material Reimbursement</span><span>₦{materialReimbursement.toFixed(2)}</span></div>
              <div className={styles.summaryRow}><span>Service Fee (2.5%)</span><span style={{ color: '#ef4444' }}>-₦{serviceRate.toFixed(2)}</span></div>
              <div className={styles.summaryTotal}>
                <span>TOTAL PAYOUT TO HELPER</span>
                <span className={styles.totalAmount}>₦{total.toFixed(2)}</span>
              </div>
              <div className={styles.fundsNote}>
                <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Your funds are protected. By releasing payment, you acknowledge the work is completed to your satisfaction.
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

          {task.status === 'PENDING_PAYMENT' ? (
            <div className={styles.pendingCard}>
              <h3 onDoubleClick={handleSimulate} style={{ cursor: 'default' }}>Payment Secured in Escrow</h3>
              <p>Your payment is currently pending. Please complete the payment to make your task live.</p>
              
              {newPayment?.virtual_account ? (
                <div ref={newPaymentRef} style={{ background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: '12px', margin: '1rem 0', textAlign: 'left' }}>
                  <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontWeight: 700 }}>New Payment Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                    <div><span style={{ color: 'var(--text-dim)', display: 'block' }}>Bank</span><strong>{newPayment.virtual_account.bank_name}</strong></div>
                    <div><span style={{ color: 'var(--text-dim)', display: 'block' }}>Account</span><strong>{newPayment.virtual_account.account_number}</strong></div>
                    <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--text-dim)', display: 'block' }}>Account Name</span><strong>{newPayment.virtual_account.account_name}</strong></div>
                    <div><span style={{ color: 'var(--text-dim)', display: 'block' }}>Amount</span><strong>₦{newPayment.virtual_account.transaction_amount_payable}</strong></div>
                  </div>
                </div>
              ) : escrow?.payaza_reference ? (
                <p style={{ marginTop: 8 }}>
                  Last Payaza Ref: <span style={{ fontFamily: 'monospace' }}>{escrow.payaza_reference}</span>
                </p>
              ) : null}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button className={styles.releaseBtn} onClick={handlePayNow}>
                  <CreditCard size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
                  Pay Now
                </button>
                <button className={styles.reportBtn} onClick={handleVerify}>
                  Sync Status
                </button>
              </div>
            </div>
          ) : released ? (
            <div className={styles.releasedBanner}>
              {escrow?.payout_status === 'SUCCESS' ? (
                <>
                  <CheckCircle2 size={20} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} />
                  Payout completed! Payment of ₦{total.toFixed(2)} has been released to the worker.
                </>
              ) : escrow?.payout_status === 'FAILED' ? (
                <>
                  <CreditCard size={20} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} />
                  Payout failed (Payaza). We&apos;re keeping your escrow record for support.
                </>
              ) : (
                <>
                  <Lock size={20} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} />
                  Payout initiated. We&apos;re finalizing the disbursement with Payaza...
                </>
              )}
            </div>
          ) : (
            <div className={styles.actions}>
              {task.poster === me?.id ? (
                <>
                  <button className={styles.reportBtn} onClick={() => alert('Issue reported! Our team will contact you within 24 hours.')}>Report an Issue</button>
                  {task.status === 'COMPLETED' && (
                    <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                      {task.completion_note && (
                        <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border)', marginBottom: '1.5rem' }}>
                          <strong style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'block', marginBottom: '0.25rem' }}>HELPER HANDOVER NOTE:</strong>
                          <p style={{ margin: 0, fontSize: '0.875rem' }}>{task.completion_note}</p>
                        </div>
                      )}
                      <button className={styles.releaseBtn} onClick={handleRelease}>
                        <ShieldCheck size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
                        Confirm Completion & Release Payment
                      </button>
                    </div>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <div className={styles.statusInfo}>Helper is currently working on this task.</div>
                  )}
                  {task.status === 'OPEN' && (
                    <div className={styles.statusInfo}>Waiting for someone to accept your task...</div>
                  )}
                </>
              ) : (
                <>
                  <button className={styles.reportBtn} onClick={() => alert('Issue reported!')}>Contact Support</button>
                  {task.status === 'IN_PROGRESS' && (
                    <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', marginBottom: '0.5rem', display: 'block' }}>Handover Note (Proof of Work)</label>
                      <textarea 
                        className={styles.textarea} 
                        placeholder="e.g. Assembled the furniture and placed it in the living room."
                        value={completionNote}
                        onChange={(e) => setCompletionNote(e.target.value)}
                        style={{ minHeight: '80px', marginBottom: '1rem' }}
                      ></textarea>
                      <button className={styles.releaseBtn} onClick={handleMarkCompleted}>
                        <CheckCircle2 size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
                        Mark as Completed
                      </button>
                    </div>
                  )}
                  {task.status === 'COMPLETED' && (
                    <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                      <div className={styles.statusInfo}>Waiting for poster to release funds.</div>
                      {task.completion_note && (
                        <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border)', marginTop: '1rem' }}>
                          <strong style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'block', marginBottom: '0.25rem' }}>HELPER HANDOVER NOTE:</strong>
                          <p style={{ margin: 0, fontSize: '0.875rem' }}>{task.completion_note}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <div className={styles.noTask}>
          <h2>No active escrow tasks</h2>
          <p>Post a task to get started with PayLink Escrow protection.</p>
          <Link href="/" className={styles.postLink}>Post a Task -&gt;</Link>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
