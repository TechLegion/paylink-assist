"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { Task } from '@/lib/api';

// Dynamically import the map to completely disable SSR, avoiding "window is not defined" errors
const MapDynamic = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div style={{ height: '500px', width: '100%', backgroundColor: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading interactive map...</div>
});

export default function TaskMap({ tasks }: { tasks: Task[] }) {
  return <MapDynamic tasks={tasks} />;
}
