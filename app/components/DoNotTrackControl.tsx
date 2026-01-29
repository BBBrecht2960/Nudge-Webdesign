'use client';

import { useState, useEffect } from 'react';
import { setDoNotTrack, isDoNotTrack } from '@/lib/analytics';

export function DoNotTrackControl() {
  const [optedOut, setOptedOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      setOptedOut(isDoNotTrack());
    });
  }, []);

  const handleOptOut = () => {
    setDoNotTrack(true);
    setOptedOut(true);
  };

  const handleOptIn = () => {
    setDoNotTrack(false);
    setOptedOut(false);
  };

  if (!mounted) return null;

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 mt-4">
      <p className="text-sm font-medium text-foreground mb-2">Analytics (paginaweergaven)</p>
      {optedOut ? (
        <>
          <p className="text-sm text-muted-foreground mb-2">
            Je bezoeken worden niet meegeteld. Alleen nieuwe paginaweergaven vanaf deze browser tellen niet meer mee.
          </p>
          <button
            type="button"
            onClick={handleOptIn}
            className="text-sm text-primary hover:underline"
          >
            Weer meetellen
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-2">
            Wil je dat jouw eigen bezoeken niet in de statistieken terechtkomen?
          </p>
          <button
            type="button"
            onClick={handleOptOut}
            className="text-sm text-primary hover:underline"
          >
            Mijn bezoeken niet meetellen
          </button>
        </>
      )}
    </div>
  );
}
