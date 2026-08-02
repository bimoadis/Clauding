'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const prompt = searchParams.get('prompt') || '';
    router.replace(`/dashboard?prompt=${encodeURIComponent(prompt)}`);
  }, [router, searchParams]);

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#FAFAF8', fontFamily: 'system-ui, sans-serif' }}>
      <h3>Redirecting to Unified Builder Console...</h3>
    </div>
  );
}

export default function CompilePageRedirect() {
  return (
    <Suspense fallback={
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#FAFAF8', fontFamily: 'system-ui, sans-serif' }}>
        <h3>Redirecting...</h3>
      </div>
    }>
      <RedirectContent />
    </Suspense>
  );
}
