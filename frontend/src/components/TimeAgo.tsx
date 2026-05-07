import { timeAgo } from '@/lib/api';

export default function TimeAgo({ date }: { date: string }) {
  return <span>{timeAgo(date) || 'Just now'}</span>;
}
