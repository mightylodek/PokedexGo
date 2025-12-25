'use client';

import { useState, useEffect } from 'react';

interface FormattedDateProps {
  date: string | null | undefined;
  fallback?: string;
  format?: 'full' | 'date' | 'time';
}

/**
 * Client-side date formatter to avoid hydration mismatches
 * Only renders the formatted date after component mounts (client-side)
 * This prevents server/client HTML mismatches from locale-dependent date formatting
 */
export function FormattedDate({ date, fallback = '-', format = 'full' }: FormattedDateProps) {
  const [mounted, setMounted] = useState(false);
  const [formatted, setFormatted] = useState<string>(fallback);

  useEffect(() => {
    setMounted(true);
    
    if (!date) {
      setFormatted(fallback);
      return;
    }

    try {
      const dateObj = new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        setFormatted(fallback);
        return;
      }

      let formattedDate: string;
      switch (format) {
        case 'date':
          formattedDate = dateObj.toLocaleDateString();
          break;
        case 'time':
          formattedDate = dateObj.toLocaleTimeString();
          break;
        case 'full':
        default:
          formattedDate = dateObj.toLocaleString();
          break;
      }

      setFormatted(formattedDate);
    } catch (error) {
      setFormatted(fallback);
    }
  }, [date, fallback, format]);

  // During SSR, return the fallback to avoid hydration mismatch
  // After mount, the useEffect will update it with the formatted date
  return <span suppressHydrationWarning>{formatted}</span>;
}

