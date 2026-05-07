export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-e0c6.up.railway.app/api';
export const AUTH_CHANGED_EVENT = 'paylink-auth-changed';

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
  task_details?: {
    id: number;
    title: string;
    description: string;
    status: Task['status'];
    category: string;
    created_at: string;
  };
  amount: string;
  status: 'PENDING' | 'HELD' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
  payaza_reference: string;
  payout_reference?: string | null;
  payout_status?: 'PENDING' | 'SUCCESS' | 'FAILED' | null;
  created_at: string;
  updated_at: string;
  payaza_last_payment_check?: string;
  payaza_last_payout_check?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  budget: string;
  location: string;
  status: 'OPEN' | 'PENDING_PAYMENT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  poster: number;
  worker: number | null;
  created_at: string;
  updated_at: string;
  poster_details: UserProfile | null;
  worker_details: UserProfile | null;
  escrow: EscrowTransaction | null;
  checkout_url?: string;
  payaza_reference?: string;
  payment_status?: string;
  payment_warning?: string;
  virtual_account?: {
    account_name?: string;
    account_number?: string;
    bank_name?: string;
    transaction_amount_payable?: number | string;
    transaction_reference?: string;
    expires_in_minutes?: number | string;
  };
  completion_note?: string;
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

export async function apiFetchStrict<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...((options?.headers as Record<string, string>) || {}) };

  if (typeof window !== 'undefined') {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    cache: 'no-store',
    ...options,
    headers,
  });

  const rawText = await res.text().catch(() => '');
  let data = null;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    // If not JSON, it might be a 500 HTML page
  }

  if (!res.ok) {
    let message = data?.error || data?.detail || '';
    
    // Handle Django field-level validation errors (object of arrays)
    if (!message && data && typeof data === 'object') {
      message = Object.entries(data)
        .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
        .join(' | ');
    }
    
    const payazaMessage = data?.details?.message || data?.details?.details?.message;
    
    // If we have no structured message, fall back to the raw text (truncated) or status
    const fallbackMessage = rawText ? rawText.substring(0, 150) + '...' : `HTTP ${res.status} ${res.statusText}`;
    
    const finalMessage = [message || fallbackMessage, payazaMessage]
      .filter(Boolean)
      .join(' | ');
      
    throw new Error(finalMessage);
  }

  return data as T;
}

export const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

export const isAuthenticated = () => Boolean(getAccessToken());

export const storeTokens = (access: string, refresh?: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', access);
  if (refresh) {
    localStorage.setItem('refresh_token', refresh);
  }
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const getTasks = () => apiFetch<Task[]>('/tasks/');
export const getTask = (id: string | number) => apiFetch<Task>(`/tasks/${id}/`);
export const getEscrows = () => isAuthenticated() ? apiFetch<EscrowTransaction[]>('/escrows/') : Promise.resolve([]);
export const getProfiles = () => apiFetch<UserProfile[]>('/profiles/');
export const getMe = () => isAuthenticated() ? apiFetch<UserProfile>('/profiles/me/') : Promise.resolve(null);
export const getWalletStats = () => isAuthenticated() ? apiFetch<{
  active_escrow: number;
  pending_earnings: number;
  total_balance: number;
  transactions: EscrowTransaction[];
}>('/profiles/wallet_stats/') : Promise.resolve(null);
export const updateProfile = (id: number, data: Record<string, unknown>) =>
  apiFetch<UserProfile>(`/profiles/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const createTask = (data: Record<string, unknown>) =>
  apiFetchStrict<Task>('/tasks/', {
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

export const regeneratePayment = (taskId: number) =>
  apiFetch<{
    payaza_reference: string;
    payment_status: string;
    virtual_account: any;
    checkout_url: string;
  }>(`/tasks/${taskId}/regenerate_payment/`, {
    method: 'POST',
  });

export const simulatePayment = (taskId: number) =>
  apiFetch<{ status: string; message: string }>(`/tasks/${taskId}/simulate_payment_success/`, {
    method: 'POST',
  });

export const updateEscrow = (id: number, data: Record<string, unknown>) =>
  apiFetch<EscrowTransaction>(`/escrows/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const syncPayaza = (escrowId: number) =>
  apiFetch<EscrowTransaction>(`/escrows/${escrowId}/sync_payaza/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

export const acceptTask = (id: number) =>
  apiFetch<{ message: string, status: string }>(`/tasks/${id}/accept_task/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

export const verifyPayment = (id: number) =>
  apiFetch<{ message: string }>(`/tasks/${id}/verify_payment/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
};

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
  'Moving Help': '#8b5cf6',
  'Moving & Packing': '#8b5cf6',
  'Shopping': '#06b6d4',
  'Assembly': '#f59e0b',
  'Furniture Assembly': '#f59e0b',
  'Cleaning': '#10b981',
  'Landscaping': '#22c55e',
  'Garden Help': '#22c55e',
  'Delivery': '#3b82f6',
  'Maintenance': '#ef4444',
  'Plumbing': '#0ea5e9',
  'Electrical': '#fbbf24',
  'Tutoring': '#6366f1',
  'Personal Assistant': '#ec4899',
  'Car Repair': '#4b5563',
  'Technology Help': '#14b8a6',
};
