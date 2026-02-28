import { Battery, Wind, Compass, Target, ShieldAlert, Volume2 } from 'lucide-react';

interface GameStats {
    battery: number;
    oxygen: number;
    depth: number;
    cores: number;
    totalCores: number;
    time: number;
    creatureNearby: boolean;
    stealthActive: boolean;
    noiseLevel: number;
}

interface HUDProps {
    stats: GameStats;
}

const HUD: React.FC<HUDProps> = ({ stats }) => {
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const batteryColor =
        stats.battery > 50 ? '#00ffcc' : stats.battery > 20 ? '#ffcc00' : '#ff3355';
    const oxygenColor =
        stats.oxygen > 50 ? '#4dc9f6' : stats.oxygen > 20 ? '#ffcc00' : '#ff3355';

    return (
        <div className="absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col justify-between z-40 font-mono text-white">
            {/* ===== TOP BAR ===== */}
            <div className="flex justify-between items-start gap-4">
                {/* Left: Resources */}
                <div className="glass rounded-lg p-3 md:p-4 flex items-center gap-4 md:gap-6 min-w-0">
                    {/* Battery */}
                    <div className="flex flex-col min-w-[90px]">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Battery
                                className="w-3.5 h-3.5 shrink-0"
                                style={{ color: batteryColor }}
                            />
                            <span className="text-[9px] uppercase tracking-[0.15em]" style={{ color: batteryColor }}>
                                Battery
                            </span>
                        </div>
                        <div className="resource-bar">
                            <div
                                className="resource-bar-fill"
                                style={{
                                    width: `${stats.battery}%`,
                                    backgroundColor: batteryColor,
                                    color: batteryColor,
                                }}
                            />
                        </div>
                        <span className="text-[10px] text-white/40 mt-1 tabular-nums">{Math.floor(stats.battery)}%</span>
                    </div>

                    <div className="h-8 w-px bg-white/10" />

                    {/* Oxygen */}
                    <div className="flex flex-col min-w-[90px]">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Wind
                                className="w-3.5 h-3.5 shrink-0"
                                style={{ color: oxygenColor }}
                            />
                            <span className="text-[9px] uppercase tracking-[0.15em]" style={{ color: oxygenColor }}>
                                O₂ Supply
                            </span>
                        </div>
                        <div className="resource-bar">
                            <div
                                className="resource-bar-fill"
                                style={{
                                    width: `${stats.oxygen}%`,
                                    backgroundColor: oxygenColor,
                                    color: oxygenColor,
                                }}
                            />
                        </div>
                        <span className="text-[10px] text-white/40 mt-1 tabular-nums">{Math.floor(stats.oxygen)}%</span>
                    </div>
                </div>

                {/* Right: Depth + Time */}
                <div className="glass rounded-lg p-3 md:p-4 text-right">
                    <span className="text-[9px] text-[#00ffcc]/50 uppercase tracking-[0.15em] block">Depth</span>
                    <div className="text-xl md:text-2xl font-display font-bold tracking-tight tabular-nums">
                        {Math.abs(stats.depth).toLocaleString()}
                        <span className="text-xs text-white/30 ml-0.5">m</span>
                    </div>
                    <div className="text-[9px] text-white/25 mt-1 tracking-wider">
                        SECTOR: ABYSS-{String(Math.floor(Math.abs(stats.depth) / 500) + 1).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] text-white/20 mt-0.5 tabular-nums">{formatTime(stats.time)}</div>
                </div>
            </div>

            {/* ===== BOTTOM BAR ===== */}
            <div className="flex justify-between items-end gap-4">
                {/* Left: Status badges + stress */}
                <div className="space-y-3">
                    {/* Creature warning */}
                    {stats.creatureNearby && (
                        <div className="glass-danger rounded-lg px-3 py-2 flex items-center gap-2 animate-pulse">
                            <ShieldAlert className="w-4 h-4 text-[#ff3355]" />
                            <span className="text-[10px] text-[#ff3355] uppercase tracking-widest font-bold">
                                Hostile Detected
                            </span>
                        </div>
                    )}

                    {/* Stress Monitor */}
                    <div className="glass rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Volume2 className="w-3 h-3 text-[#ff3355]/60" />
                            <span className="text-[9px] text-white/40 uppercase tracking-[0.15em]">Noise Level</span>
                        </div>
                        <div className="flex items-end gap-[2px] h-6">
                            {Array.from({ length: 24 }).map((_, i) => {
                                const baseNoise = stats.creatureNearby
                                    ? 60 + Math.random() * 40
                                    : stats.stealthActive
                                        ? Math.random() * 15
                                        : Math.random() * 30 + 5;
                                const bumpBoost = stats.noiseLevel * (0.6 + Math.random() * 0.4);
                                const intensity = Math.min(100, baseNoise + bumpBoost);
                                return (
                                    <div
                                        key={i}
                                        className="w-[3px] rounded-sm transition-all duration-150"
                                        style={{
                                            height: `${intensity}%`,
                                            backgroundColor: intensity > 70 ? '#ff3355' : intensity > 40 ? '#ffcc00' : '#00ffcc',
                                            opacity: 0.6 + (stats.noiseLevel > 30 ? 0.3 : 0),
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex gap-2">
                        <div
                            className={`px-2.5 py-1 rounded text-[10px] uppercase tracking-wider border ${stats.battery > 10
                                ? 'bg-[#00ffcc]/10 text-[#00ffcc]/80 border-[#00ffcc]/30 animate-pulse'
                                : 'bg-[#ff3355]/10 text-[#ff3355]/80 border-[#ff3355]/30'
                                }`}
                        >
                            {stats.battery > 10 ? '◉ Sonar Ready' : '◎ Sonar Offline'}
                        </div>
                        <div
                            className={`px-2.5 py-1 rounded text-[10px] uppercase tracking-wider border ${stats.stealthActive
                                ? 'bg-[#00ffcc]/10 text-[#00ffcc]/80 border-[#00ffcc]/30'
                                : 'bg-white/5 text-white/30 border-white/10'
                                }`}
                        >
                            {stats.stealthActive ? '◉ Stealth' : '◎ Normal'}
                        </div>
                    </div>
                </div>

                {/* Center: Cores */}
                <div className="glass rounded-lg p-3 flex flex-col items-center">
                    <span className="text-[9px] text-[#ffcc00]/50 uppercase tracking-[0.15em] mb-2">Data Cores</span>
                    <div className="flex gap-1.5">
                        {Array.from({ length: stats.totalCores }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all duration-300 ${i < stats.cores
                                    ? 'bg-[#ffcc00]/20 border-[#ffcc00]/60 shadow-[0_0_8px_rgba(255,204,0,0.3)]'
                                    : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                {i < stats.cores && (
                                    <Target className="w-2.5 h-2.5 text-[#ffcc00]" />
                                )}
                            </div>
                        ))}
                    </div>
                    <span className="text-[11px] text-white/40 mt-1.5 font-bold tabular-nums">
                        {stats.cores}/{stats.totalCores}
                    </span>
                </div>

                {/* Right: Compass */}
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border border-white/10 glass relative flex items-center justify-center">
                        <div className="absolute inset-1 rounded-full border border-white/5" />
                        <div className="absolute inset-0 rounded-full border-t-2 border-[#00ffcc]/40 animate-spin-slow" />
                        <Compass className="w-8 h-8 text-white/20" />
                        <div className="absolute top-1.5 text-[7px] text-white/30 font-bold">N</div>
                        <div className="absolute bottom-1.5 text-[7px] text-white/20">S</div>
                        <div className="absolute left-1.5 text-[7px] text-white/20">W</div>
                        <div className="absolute right-1.5 text-[7px] text-white/20">E</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HUD;
