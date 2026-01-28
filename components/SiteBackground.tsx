import React from 'react';

export default function SiteBackground() {
  return (
    <>
      {/* Layer 1: Blurred background image with gradient overlay */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: 'url("/background.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(4px) brightness(0.7)',
          opacity: 0.3,
          zIndex: 0
        }} 
      />
      
      {/* Layer 2: Linear gradient for depth */}
      <div 
        className="absolute inset-0" 
        style={{
          background: 'linear-gradient(to bottom, transparent 60%, rgba(59, 130, 246, 0.8))',
          zIndex: 0
        }} 
      />
      
      {/* Layer 3: Subtle dot pattern overlay */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          zIndex: 0
        }} 
      />
    </>
  );
}
