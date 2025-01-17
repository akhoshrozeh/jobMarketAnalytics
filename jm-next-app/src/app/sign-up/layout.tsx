import React, { Suspense } from 'react';

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      {children}
    </Suspense>
  );
}