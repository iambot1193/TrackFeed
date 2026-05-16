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
        x: (e.clientX / window.innerWidth - 0.5) * 400, 
        y: (e.clientY / window.innerHeight - 0.5) * 550 
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

      {/* NEBULA ORBS (Multi-Layered 3D Parallax) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Orb 1: Purple (Top-Left / Left - 1.5x speed) */}
        <div 
          className="absolute -top-[20%] -left-[5%] w-[100vw] h-[100vw] bg-purple-900/[0.14] blur-[220px] rounded-full animate-float-orb mix-blend-screen transition-transform duration-500 ease-out"
          style={{ transform: `translate(${mousePos.x * 1.5}px, ${mousePos.y * 1.5}px) scale(1.15)` }}
        />
        {/* Orb 2: Blue (Bottom-Right / Right - 1.5x speed) */}
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[85vw] h-[85vw] bg-blue-900/[0.12] blur-[200px] rounded-full animate-slow-pulse mix-blend-screen transition-transform duration-500 ease-out"
          style={{ transform: `translate(${mousePos.x * 1.5}px, ${mousePos.y * 1.5}px) scale(1.1)` }}
        />
        {/* Orb 3: Cyan (Mid-Right / Center - 1.2x speed) */}
        <div 
          className="absolute top-[10%] right-[5%] w-[70vw] h-[70vw] bg-cyan-900/[0.1] blur-[180px] rounded-full animate-float-orb mix-blend-screen transition-transform duration-500 ease-out"
          style={{ transform: `translate(${mousePos.x * 1.2}px, ${mousePos.y * 1.2}px) scale(1.1)` }}
        />
        {/* Orb 4: Magenta (Top-Center / Upper - 1.8x speed) */}
        <div 
          className="absolute -top-[10%] left-[20%] w-[60vw] h-[60vw] bg-pink-900/[0.07] blur-[160px] rounded-full animate-slow-pulse mix-blend-screen transition-transform duration-500 ease-out"
          style={{ transform: `translate(${mousePos.x * 1.8}px, ${mousePos.y * 1.8}px) scale(1.1)` }}
        />
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
