import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Skull, Trophy, RotateCcw } from 'lucide-react';

interface GameStats {
    battery: number;
    oxygen: number;
    depth: number;
    cores: number;
    totalCores: number;
    time: number;
}

interface GameOverScreenProps {
    victory: boolean;
    stats: GameStats;
    onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ victory, stats, onRestart }) => {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.code === 'KeyR' || e.code === 'Enter') {
                onRestart();
            }
        },
        [onRestart]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden font-mono">
            {/* Background noise */}
            {!victory && (
                <div className="absolute inset-0 opacity-5">
                    {Array.from({ length: 200 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute bg-white"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                width: `${Math.random() * 3 + 1}px`,
                                height: `${Math.random() * 3 + 1}px`,
                                opacity: Math.random(),
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Victory glow */}
            {victory && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[600px] h-[600px] rounded-full bg-[#00ffcc]/5 blur-3xl" />
                </div>
            )}

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative z-10 text-center"
            >
                {/* Icon */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="mb-6"
                >
                    {victory ? (
                        <Trophy className="w-16 h-16 mx-auto text-[#ffcc00] drop-shadow-[0_0_20px_rgba(255,204,0,0.5)]" />
                    ) : (
                        <Skull className="w-16 h-16 mx-auto text-[#ff3355] drop-shadow-[0_0_20px_rgba(255,51,85,0.5)]" />
                    )}
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className={`font-display text-5xl md:text-6xl font-black tracking-widest mb-2 ${victory ? 'text-[#00ffcc] animate-flicker' : 'text-[#ff3355]'
                        }`}
                >
                    {victory ? 'EXTRACTED' : 'SIGNAL LOST'}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="text-xs tracking-[0.4em] text-white/40 uppercase mb-12"
                >
                    {victory ? 'All data cores recovered successfully' : 'Connection terminated — Drone offline'}
                </motion.p>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="glass rounded-lg p-6 max-w-sm mx-auto mb-10"
                >
                    <div className="text-[10px] text-[#00ffcc]/50 uppercase tracking-[0.3em] mb-4">
                        Mission Report
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-left text-white/30">Depth Reached</div>
                        <div className="text-right text-white font-bold">{Math.abs(stats.depth).toLocaleString()}m</div>

                        <div className="text-left text-white/30">Cores Recovered</div>
                        <div className="text-right">
                            <span className={`font-bold ${stats.cores === stats.totalCores ? 'text-[#ffcc00]' : 'text-white'}`}>
                                {stats.cores}
                            </span>
                            <span className="text-white/30">/{stats.totalCores}</span>
                        </div>

                        <div className="text-left text-white/30">Time Survived</div>
                        <div className="text-right text-white font-bold">{formatTime(stats.time)}</div>

                        <div className="text-left text-white/30">Battery Remaining</div>
                        <div className="text-right text-white font-bold">{Math.floor(stats.battery)}%</div>
                    </div>
                </motion.div>

                {/* Restart */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.6 }}
                >
                    <button
                        onClick={onRestart}
                        className="group flex items-center gap-3 mx-auto px-8 py-3
                       border border-white/20 rounded-sm text-white/60 text-sm
                       tracking-[0.2em] uppercase cursor-pointer
                       hover:bg-white/5 hover:border-[#00ffcc]/40 hover:text-[#00ffcc]
                       transition-all duration-300"
                    >
                        <RotateCcw className="w-4 h-4 group-hover:rotate-[-180deg] transition-transform duration-500" />
                        Press R to Retry
                    </button>
                </motion.div>
            </motion.div>

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

            {/* Scanlines */}
            <div className="absolute inset-0 scanlines pointer-events-none" />
        </div>
    );
};

export default GameOverScreen;
