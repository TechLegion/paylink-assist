"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, MapPin, Clock, MessageSquare, CheckCircle2, Shield, Star } from 'lucide-react';
import { getTask, Task, CATEGORY_COLORS, timeAgo } from '@/lib/api';
import styles from './page.module.css';

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    getTask(id).then(data => {
      setTask(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className={styles.loading}>Loading task...</div>;
  if (!task) return <div className={styles.loading}>Task not found. <button onClick={() => router.push('/browse')}>Go back</button></div>;

  const color = CATEGORY_COLORS[task.category] || '#6b7280';
  const poster = task.poster_details;

  const handleAccept = async () => {
    if (!task) return;
    setAccepted(true);
    try {
      const { fundTask } = await import('@/lib/api');
      const result = await fundTask(task.id);
      if (result && result.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        setTimeout(() => router.push('/dashboard'), 1500);
      }
    } catch (err) {
      console.error(err);
      setTimeout(() => router.push('/dashboard'), 1500);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.escrowBanner}>
        <span className={styles.escrowIcon}><ShieldCheck size={28} /></span>
        <div>
          <strong>ESCROW PROTECTION ACTIVE</strong>
          <p>Your payment is held securely in escrow and only released once you are 100% satisfied with the task completion.</p>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.mainCol}>
          <div className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.badge} style={{ background: color + '20', color }}>Active Listing</span>
              <div className={styles.budget}>
                <span className={styles.budgetLabel}>ESTIMATED BUDGET</span>
                <span className={styles.budgetAmount}>${parseFloat(task.budget).toFixed(2)}</span>
              </div>
            </div>
            <h1 className={styles.title}>{task.title}</h1>
            <div className={styles.meta}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={16} /> {task.location || 'Location TBD'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={16} /> Posted {timeAgo(task.created_at)}</span>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Task Description</h2>
            <p className={styles.description}>{task.description}</p>
            <div className={styles.categoryTag} style={{ background: color + '15', color }}>
              Category: {task.category}
            </div>
            <div className={styles.urgencyTag}>
              Urgency: <strong>{task.urgency}</strong>
            </div>
          </div>
        </div>

        <div className={styles.sideCol}>
          <div className={styles.card}>
            {accepted ? (
              <div className={styles.acceptedMsg}><CheckCircle2 size={20} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Task Accepted! Redirecting to Dashboard...</div>
            ) : (
              <>
                <button className={styles.acceptBtn} onClick={handleAccept}>Accept Task</button>
                <button className={styles.messageBtn}><MessageSquare size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Message Poster</button>
                <p className={styles.acceptNote}>By clicking 'Accept', you agree to the community guidelines and PayLink's secure payment terms.</p>
              </>
            )}
          </div>

          {poster && (
            <div className={styles.card}>
              <span className={styles.postedByLabel}>POSTED BY</span>
              <div className={styles.posterProfile}>
                <div className={styles.posterAvatar} />
                <div>
                  <strong className={styles.posterName}>
                    {poster.username.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </strong>
                  <p className={styles.posterRating}><Star size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', color: '#f59e0b', fill: '#f59e0b', marginRight: '4px' }} /> {poster.rating} ({poster.reviews_count} reviews)</p>
                </div>
              </div>
              <div className={styles.posterBadges}>
                {poster.is_verified && <div className={styles.posterBadge}><CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px', color: '#10b981' }} /> Identity Verified</div>}
                <div className={styles.posterBadge}><ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px', color: '#3b82f6' }} /> Secured Payments</div>
                <div className={styles.posterBadge}><Clock size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Member since 2022</div>
              </div>
            </div>
          )}

          <button className={styles.backBtn} onClick={() => router.push('/browse')}>← Back to Browse</button>
        </div>
      </div>
    </div>
  );
}
