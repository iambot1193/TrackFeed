'use client'

import { useState, useEffect } from "react";

export function BackgroundEffects() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<{ top: string, left: string, delay: string, opacity: number }[]>([]);

  useEffect(() => {
    // Gerar partículas apenas uma vez no mount
    const newParticles = [...Array(40)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      opacity: Math.random() * 0.5
    }));
    setParticles(newParticles);

    // Handler isolado para o mouse
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth - 0.5) * 50, 
        y: (e.clientY / window.innerHeight - 0.5) * 50 
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020202]">
      {/* NOISE OVERLAY */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] z-[10]" />
      
      {/* GRID DOTS */}
      <div 
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay z-[5]"
        style={{ 
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`
        }}
      />

      {/* NEBULA ORBS */}
      <div 
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.1)` }}
      >
        <div className="absolute -top-[20%] -left-[10%] w-[90vw] h-[90vw] bg-purple-900/[0.12] blur-[220px] rounded-full animate-float-orb mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-blue-900/[0.1] blur-[200px] rounded-full animate-slow-pulse mix-blend-screen" />
        <div className="absolute top-[20%] right-[10%] w-[60vw] h-[60vw] bg-cyan-900/[0.08] blur-[180px] rounded-full animate-float-orb mix-blend-screen" />
      </div>

      {/* PARTÍCULAS FLUTUANTES */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute w-[2px] h-[2px] bg-white rounded-full animate-pulse"
          style={{
            top: p.top,
            left: p.left,
            animationDelay: p.delay,
            opacity: p.opacity,
            transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px)`
          }}
        />
      ))}
    </div>
  );
}
