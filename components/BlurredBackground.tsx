import Image from 'next/image';

interface BlurredBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export default function BlurredBackground({ children, className = '' }: BlurredBackgroundProps): JSX.Element {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Blurred blue blended background.jpg"
          alt="Blurred blue blended background"
          fill
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          priority={false}
          quality={75}
          className="opacity-30"
        />
        {/* Overlay to match the radial gradient effect */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            zIndex: 1
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}