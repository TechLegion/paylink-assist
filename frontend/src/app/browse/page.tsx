"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Clock, CheckCircle2, LayoutGrid, Map as MapIcon, Filter } from 'lucide-react';
import { getTasks, Task, CATEGORY_COLORS, timeAgo } from '@/lib/api';
import TaskMap from '@/components/TaskMap/TaskMap';
import styles from './page.module.css';

const FILTERS = ['All', 'Delivery', 'Maintenance', 'Moving', 'Cleaning', 'Assembly'];

export default function BrowsePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    getTasks().then((data) => {
      setTasks(data || []);
      setLoading(false);
    });
  }, []);

  const openTasks = tasks.filter(t => t.status === 'OPEN');
  const filtered = filter === 'All'
    ? openTasks
    : openTasks.filter(t => t.category.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Available Tasks</h1>
          <span className={styles.count}>{openTasks.length} tasks nearby</span>
        </div>
        <div className={styles.viewToggle}>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('list')}
          >
            <LayoutGrid size={18} /> List
          </button>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'map' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('map')}
          >
            <MapIcon size={18} /> Map
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
          >
            {f === 'All' ? <><Filter size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/> All Filters</> : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No tasks found for this filter.</div>
      ) : viewMode === 'map' ? (
        <TaskMap tasks={filtered} />
      ) : (
        <div className={styles.taskGrid}>
          {filtered.map(task => {
            const color = CATEGORY_COLORS[task.category] || '#6b7280';
            return (
              <div key={task.id} className={styles.taskCard}>
                <div className={styles.cardTop}>
                  <span className={styles.categoryBadge} style={{ backgroundColor: color + '20', color }}>
                    {task.category.toUpperCase()}
                  </span>
                  <div className={styles.budgetBlock}>
                    <span className={styles.budget}>${parseFloat(task.budget).toFixed(2)}</span>
                    <span className={styles.budgetLabel}>Fixed Price</span>
                  </div>
                </div>
                <h3 className={styles.taskTitle}>{task.title}</h3>
                <p className={styles.taskDesc}>{task.description.slice(0, 100)}...</p>
                <div className={styles.taskMeta}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {task.location || '—'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {timeAgo(task.created_at)}</span>
                </div>
                <div className={styles.cardFooter}>
                  <div className={styles.posterInfo}>
                    <div className={styles.smallAvatar} />
                    <span>{task.poster_details?.username?.replace('_', ' ') || 'User'}</span>
                    {task.poster_details?.is_verified && <CheckCircle2 size={14} color="#10b981" style={{ marginLeft: '4px' }}/>}
                  </div>
                  <Link href={`/tasks/${task.id}`} className={styles.viewBtn}>View Details</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

