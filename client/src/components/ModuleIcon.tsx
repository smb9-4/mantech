import React, { useEffect, useState } from 'react';
import { IconNotifications } from './ModuleIcons';

// Optional drop-in artwork: put image files in client/public/icons/tiles/ and list
// them in manifest.json ({ "students": "students.png", ... }). Any tile without a
// file keeps its built-in icon, so this is safe to leave empty.
let manifestPromise: Promise<Record<string, string>> | null = null;
const loadManifest = () => {
  if (!manifestPromise) {
    manifestPromise = fetch('/icons/tiles/manifest.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((j) => (j && typeof j === 'object' ? (j as Record<string, string>) : {}))
      .catch(() => ({}));
  }
  return manifestPromise;
};

interface NavLike { id: string; icon: any; iconSrc?: string; targetTab?: string }

const STUDENT_SECTION_ICONS: Record<string, string> = {
  dashboard: '/sidebar-icons/dashboard.png',
  'dashboard-home': '/sidebar-icons/dashboard.png',
  announcements: '/student-section-icons/announcements.png',
  tests: '/student-section-icons/exams.png',
  notes: '/student-section-icons/notes.png',
  materials: '/student-section-icons/materials.png',
  reports: '/student-section-icons/results.png',
  timetable: '/student-section-icons/timetable.png',
  'college-calendar': '/student-section-icons/calendar.png',
  college_calendar: '/student-section-icons/calendar.png',
  complaints: '/student-section-icons/complaints.png',
  attendance: '/student-section-icons/attendance.png',
  'parent-connect': '/student-section-icons/parent-connect.png',
  parent_connect: '/student-section-icons/parent-connect.png',
};

export const ModuleIcon: React.FC<{ item: NavLike; className?: string }> = ({ item, className = 'w-10 h-10' }) => {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => { let on = true; loadManifest().then((m) => on && setMap(m)); return () => { on = false; }; }, []);

  if (item?.iconSrc) {
    return <img src={item.iconSrc} alt="" className={`${className} object-contain`} draggable={false} />;
  }

  const key = item.icon === IconNotifications ? 'notifications' : item.id;
  const file = map[key];
  if (file) return <img src={`/icons/tiles/${file}`} alt="" className={`${className} object-contain`} draggable={false} />;

  const Fallback = item.icon;
  if (!Fallback) {
    const studentIcon = STUDENT_SECTION_ICONS[item.id] || (item.targetTab && STUDENT_SECTION_ICONS[item.targetTab]);
    if (studentIcon) return <img src={studentIcon} alt="" className={`${className} object-contain`} draggable={false} />;
    return null;
  }
  return <Fallback className={className} />;
};

export default ModuleIcon;
