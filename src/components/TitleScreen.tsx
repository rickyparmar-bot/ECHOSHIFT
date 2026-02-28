import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface TitleScreenProps {
  onStart: () => void;
}

const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  const [showControls, setShowControls] = useState(false);
  const [particles] = useState(() =>
    Array.from({ length: 40 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.3 + 0.1,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.3 + 0.1,
    }))
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    },
    [onStart]
  );

  useEffect(() => {
    const timer = setTimeout(() => setShowControls(true), 1500);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden font-mono">
      {/* Ambient particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: `rgba(0, 255, 204, ${p.opacity})`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${3 + p.speed * 10}s`,
          }}
        />
      ))}

      {/* Sonar rings background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`absolute rounded-full border border-[#00ffcc]/15 sonar-ring ${
              i === 1 ? 'sonar-ring-delay-1' : i === 2 ? 'sonar-ring-delay-2' : ''
            }`}
            style={{ width: '700px', height: '700px' }}
          />
        ))}
      </div>

      {/* Grid lines background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,204,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,204,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="relative z-10 text-center"
      >
        {/* Subtitle above */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-[10px] tracking-[0.6em] text-[#00ffcc]/50 uppercase mb-6"
        >
          Antigravity Systems // Sonar Division
        </motion.p>

        {/* Main title */}
        <h1 className="font-display text-6xl md:text-8xl font-black tracking-widest mb-3 animate-flicker select-none">
          <span className="text-white">ECHO</span>
          <span className="text-[#00ffcc]">SHIFT</span>
        </h1>

        {/* Underline accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
          className="mx-auto w-48 h-[1px] bg-gradient-to-r from-transparent via-[#00ffcc]/60 to-transparent mb-4"
        />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-[#00ffcc]/40 text-xs tracking-[0.4em] uppercase mb-16"
        >
          The Abyssal Breach
        </motion.p>

        {/* Start prompt + controls */}
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Start button */}
            <button
              onClick={onStart}
              className="group relative px-10 py-3 border border-[#00ffcc]/30 rounded-sm
                         text-[#00ffcc] text-sm tracking-[0.3em] uppercase
                         hover:bg-[#00ffcc]/10 hover:border-[#00ffcc]/60
                         transition-all duration-300 cursor-pointer pointer-events-auto
                         animate-pulse mb-14"
            >
              <span className="relative z-10">[ Press Enter to Dive ]</span>
            </button>

            {/* Controls grid */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 max-w-xs mx-auto text-[11px]">
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 border border-white/15 rounded text-white/50 text-[10px] mr-2 font-mono">
                  WASD
                </span>
                <span className="text-white/25">Navigate</span>
              </div>
              <div className="text-left">
                <span className="inline-block px-2 py-0.5 border border-white/15 rounded text-white/50 text-[10px] mr-2 font-mono">
                  SPACE
                </span>
                <span className="text-white/25">Sonar</span>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 border border-white/15 rounded text-white/50 text-[10px] mr-2 font-mono">
                  SHIFT
                </span>
                <span className="text-white/25">Stealth</span>
              </div>
              <div className="text-left">
                <span className="inline-block px-2 py-0.5 border border-white/15 rounded text-white/50 text-[10px] mr-2 font-mono">
                  E
                </span>
                <span className="text-white/25">Collect</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Bottom credits */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ delay: 2.5, duration: 1 }}
        className="absolute bottom-6 text-center text-[9px] tracking-[0.3em] text-white/30 uppercase"
      >
        Beneath the Surface Hackathon — Powered by Antigravity
      </motion.div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)]" />

      {/* Scanlines */}
      <div className="absolute inset-0 scanlines pointer-events-none" />
    </div>
  );
};

export default TitleScreen;
