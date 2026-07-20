import React from 'react';
import { differenceInHours, differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function LiveUpdateBadge({ updated_at, show_dot = true }) {
  if (!updated_at) return null;

  const date = new Date(updated_at);
  const now = new Date();
  const hoursAgo = differenceInHours(now, date);
  const daysAgo = differenceInDays(now, date);

  let label, dotColor;
  if (hoursAgo < 1) {
    label = "Il y a moins d'1h";
    dotColor = 'bg-green-500 animate-pulse';
  } else if (hoursAgo < 24) {
    label = "Aujourd'hui";
    dotColor = 'bg-green-500';
  } else if (daysAgo < 7) {
    label = `Il y a ${daysAgo}j`;
    dotColor = 'bg-orange-400';
  } else {
    label = format(date, 'd MMM yyyy', { locale: fr });
    dotColor = 'bg-gray-400';
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
      {show_dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {label}
    </span>
  );
}