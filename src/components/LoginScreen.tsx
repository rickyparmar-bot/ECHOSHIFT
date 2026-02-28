import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (username: string, isNewUser: boolean) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError('USERNAME AND PASSWORD REQUIRED');
            return;
        }

        const key = `echoshift_user_${username.toLowerCase()}`;
        const existingUserData = localStorage.getItem(key);

        if (existingUserData) {
            try {
                const user = JSON.parse(existingUserData);
                if (user.password !== password) {
                    setError('ACCESS DENIED: INVALID PASSWORD');
                    return;
                }
                // Login successful
                onLogin(username, false);
            } catch (err) {
                setError('DATA CORRUPTION ERROR');
            }
        } else {
            // Create new user (stats are initialized in SonarGame)
            const newUser = {
                password: password,
                maxDepth: 0,
                totalCores: 0
            };
            localStorage.setItem(key, JSON.stringify(newUser));
            onLogin(username, true);
        }
    };

    return (
        <div className="relative w-full h-screen bg-black flex items-center justify-center font-mono overflow-hidden scanlines">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,30,40,0.8)_0%,rgba(0,0,0,1)_100%)]" />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 glass-panel p-10 flex flex-col items-center w-full max-w-md"
            >
                <h1 className="font-display text-4xl font-bold tracking-widest text-white mb-2 shadow-text-cyan">
                    SYSTEM_LOGIN
                </h1>
                <p className="text-cyan-400/60 mb-8 text-sm tracking-widest uppercase">
                    Enter credentials or register new agent
                </p>

                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-500">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => { setUsername(e.target.value); setError(''); }}
                            className="w-full bg-black/40 border border-cyan-500/30 text-white placeholder-cyan-500/50 rounded block pl-10 p-3 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                            placeholder="AGENT ID"
                            maxLength={16}
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-500">
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            className="w-full bg-black/40 border border-cyan-500/30 text-white placeholder-cyan-500/50 rounded block pl-10 p-3 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                            placeholder="PASSCODE"
                        />
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-red-500 text-sm font-bold tracking-wider text-center bg-red-950/30 border border-red-500/30 py-2 rounded"
                        >
                            {error}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        className="w-full relative mt-2 px-8 py-3 bg-cyan-900/40 text-cyan-400 border border-cyan-500/50 rounded font-bold tracking-widest hover:bg-cyan-800/60 hover:text-white transition-all shadow-btn active:scale-95 group overflow-hidden"
                    >
                        <span className="relative z-10">AUTHENTICATE</span>
                        <div className="absolute inset-0 w-0 bg-cyan-500/20 group-hover:w-full transition-all duration-300 ease-out" />
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default LoginScreen;
