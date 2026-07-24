import React from 'react';

export default function BottomGradientBlur() {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 h-20 pointer-events-none w-full"
      style={{
        // 1. We apply a strong backdrop blur
        backdropFilter: 'blur(16px)',
        // 2. We use webkit/standard mask-image to fade the blur out from bottom to top
        WebkitMaskImage: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0) 100%)',
        maskImage: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0) 100%)',
      }}
    >
      {/* Optional: Add a very subtle dark or light gradient background beneath the blur 
          to improve text readability of content passing behind it */}
      <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent" />
    </div>
  );
}