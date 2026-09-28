import React, { useState } from 'react';
import { Users, Play, LogIn, Sparkles } from 'lucide-react';

export function RoomModal({ onCreateRoom, onJoinRoom, isConnecting, notice }) {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    setError(null);
    try {
      await onCreateRoom(playerName.trim(), maxPlayers);
    } catch (err) {
      setError(err.message || 'Failed to create room');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomId.trim()) {
      setError('Please enter the Room Code');
      return;
    }
    setError(null);
    try {
      await onJoinRoom(roomId.trim().toUpperCase(), playerName.trim());
    } catch (err) {
      setError(err.message || 'Failed to join room');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto p-4 hud-safe bg-slate-950/80 backdrop-blur-md">
      <div className="m-auto w-full max-w-md rounded-2xl glass-panel p-5 sm:p-6 short:p-4 shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Subtle Decorative Gradient Orb */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-5 sm:mb-6 short:mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Real-time 3D Ludo
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">LUDO MULTIPLAYER</h1>
          <p className="text-sm text-slate-400 mt-1 short:hidden">Jump into high-fidelity, real-time board gameplay</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex p-1 bg-slate-900/80 rounded-xl mb-5 sm:mb-6 short:mb-3 border border-white/5">
          <button
            type="button"
            onClick={() => { setActiveTab('create'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Play className="w-4 h-4" /> Create Room
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('join'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'join'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LogIn className="w-4 h-4" /> Join Room
          </button>
        </div>

        {/* Server Notice Banner (e.g. previous room was lost) */}
        {notice && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-center font-medium">
            {notice}
          </div>
        )}

        {/* Form Error Banner */}
        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Form Body */}
        {activeTab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4 short:space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Your Name</label>
              <input
                type="text"
                placeholder="e.g. MasterStrategist"
                maxLength={16}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Total Players</label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPlayers(num)}
                    className={`py-2.5 sm:py-2 text-xs font-semibold rounded-xl border transition-all ${
                      maxPlayers === num
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-sm'
                        : 'border-white/10 bg-slate-900/60 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    {num} Players
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isConnecting}
              className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
            >
              {isConnecting ? 'Creating...' : 'Create & Host Room'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4 short:space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Your Name</label>
              <input
                type="text"
                placeholder="e.g. Challenger"
                maxLength={16}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Room Code</label>
              <input
                type="text"
                placeholder="5-CHARACTER CODE"
                maxLength={8}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-white placeholder-slate-500 text-base sm:text-sm uppercase tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isConnecting}
              className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
            >
              {isConnecting ? 'Joining...' : 'Enter Room'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
