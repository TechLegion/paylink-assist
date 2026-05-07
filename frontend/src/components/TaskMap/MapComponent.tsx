"use client";
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Task } from '@/lib/api';
import styles from './TaskMap.module.css';
import Link from 'next/link';

// Fix for default marker icons in React-Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Generate fake coordinates based on task ID so they are consistent but spread out
// Base coordinates (e.g., somewhere central like NYC)
const BASE_LAT = 40.7128;
const BASE_LNG = -74.0060;

function generateCoords(taskId: number) {
  // A pseudo-random spread of about 5-10 miles
  const latOffset = (Math.sin(taskId) * 0.05);
  const lngOffset = (Math.cos(taskId) * 0.05);
  return [BASE_LAT + latOffset, BASE_LNG + lngOffset] as [number, number];
}

interface MapProps {
  tasks: Task[];
}

// Component to dynamically fit map to bounds
function FitBounds({ tasks }: { tasks: Task[] }) {
  const map = useMap();
  useEffect(() => {
    if (tasks.length > 0) {
      const bounds = L.latLngBounds(tasks.map(t => generateCoords(t.id)));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [tasks, map]);
  return null;
}

export default function MapComponent({ tasks }: MapProps) {
  return (
    <div className={styles.mapContainer}>
      <MapContainer center={[BASE_LAT, BASE_LNG]} zoom={11} style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {tasks.map(task => {
          const coords = generateCoords(task.id);
          return (
            <Marker key={task.id} position={coords}>
              <Popup>
                <h4 className={styles.popupTitle}>{task.title}</h4>
                <p className={styles.popupBudget}>₦{parseFloat(task.budget).toFixed(2)}</p>
                <Link href={`/tasks/${task.id}`} className={styles.popupLink}>
                  View Task
                </Link>
              </Popup>
            </Marker>
          );
        })}
        <FitBounds tasks={tasks} />
      </MapContainer>
    </div>
  );
}
