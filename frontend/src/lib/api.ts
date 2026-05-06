const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
  bio: string;
  rating: string;
  reviews_count: number;
}

export interface EscrowTransaction {
  id: number;
  task: number;
  amount: string;
  status: 'HELD' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
  payaza_reference: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  budget: string;
  location: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  poster: number;
  worker: number | null;
  created_at: string;
  updated_at: string;
  poster_details: UserProfile | null;
  worker_details: UserProfile | null;
  escrow: EscrowTransaction | null;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const headers: Record<string, string> = { ...((options?.headers as Record<string, string>) || {}) };
    
    // Only access localStorage if we're in the browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const res = await fetch(`${API_BASE}${path}`, { 
      cache: 'no-store', 
      ...options,
      headers
    });
    
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const getTasks = () => apiFetch<Task[]>('/tasks/');
export const getTask = (id: string | number) => apiFetch<Task>(`/tasks/${id}/`);
export const getEscrows = () => apiFetch<EscrowTransaction[]>('/escrows/');
export const getProfiles = () => apiFetch<UserProfile[]>('/profiles/');
export const getMe = () => apiFetch<UserProfile>('/profiles/me/');

export const createTask = (data: Record<string, unknown>) =>
  apiFetch<Task>('/tasks/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const updateTask = (id: number, data: Record<string, unknown>) =>
  apiFetch<Task>(`/tasks/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const updateEscrow = (id: number, data: Record<string, unknown>) =>
  apiFetch<EscrowTransaction>(`/escrows/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const fundTask = (id: number) =>
  apiFetch<{ status: string, checkout_url: string, reference: string }>(`/tasks/${id}/fund_task/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Moving & Packing': '#8b5cf6',
  'Shopping': '#06b6d4',
  'Assembly': '#f59e0b',
  'Furniture Assembly': '#f59e0b',
  'Cleaning': '#10b981',
  'Landscaping': '#22c55e',
  'Delivery': '#3b82f6',
  'Maintenance': '#ef4444',
};
