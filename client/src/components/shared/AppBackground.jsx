import React, { useEffect, useRef } from 'react';

export default function AppBackground() {
  const spotRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      if (!spotRef.current) return;
      spotRef.current.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(30,58,138,0.10) 0%, transparent 70%)`;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <>
      {/* Base ink background */}
      <div className="fixed inset-0 -z-20" style={{ background: '#050505' }} />

      {/* Film grain overlay */}
      <div
        className="fixed inset-0 -z-19 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      {/* Mouse spotlight */}
      <div ref={spotRef} className="fixed inset-0 -z-18 pointer-events-none transition-none" />

      {/* Subtle vignette */}
      <div
        className="fixed inset-0 -z-17 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(3,5,12,0.6) 100%)' }}
      />
    </>
  );
}