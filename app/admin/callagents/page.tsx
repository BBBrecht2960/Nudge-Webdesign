'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Callagents is now a view on the lead-pool. Redirect to lead-pool with preset "new" (nieuw te bellen).
 */
export default function CallagentsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/leads?preset=new');
  }, [router]);
  return (
    <div className="p-8 text-center text-muted-foreground">
      Doorverwijzen naar lead-pool...
    </div>
  );
}
