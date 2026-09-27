import React, { useState } from 'react';
import { Copy, Check, Dices, Crown, Bot, WifiOff, RotateCcw } from 'lucide-react';
import { COLOR_PALETTE } from '../../constants/boardCoordinates';

export function LudoUI({
  roomState,
  localPlayer,
  isMyTurn,
  canRoll,
  isRolling,
  notification,
  onRollDice,
  onMoveToken,
  onStartGame,
  onRestartGame,
}) {
  const [copied, setCopied] = useState(false);
  const { roomId, players, currentTurnColor, diceValue, diceRolled, gameStarted, winner, tokens, validMoves } = roomState;

  const copyRoomCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPlayer = players.find((p) => p.color === currentTurnColor);
  const isHost = localPlayer?.isHost;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-6">
      {/* ======================================================== */}
      {/* TOP BAR: Room Code & Minimalist Player Avatars           */}
      {/* ======================================================== */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Room Code Badge */}
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-white/10 shadow-lg">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Room</span>
            <span className="text-sm font-bold font-mono text-white tracking-widest">{roomId}</span>
            <button
              onClick={copyRoomCode}
              title="Copy Room Code"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Local Player Color & Identity Badge */}
          {localPlayer && (
            <div
              className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border shadow-lg"
              style={{
                borderColor: `${COLOR_PALETTE[localPlayer.color]?.primary || '#FFFFFF'}90`,
                boxShadow: `0 0 16px ${COLOR_PALETTE[localPlayer.color]?.primary || '#FFFFFF'}35`,
              }}
            >
              <span className="text-xs text-slate-300 font-medium">Your Pawns:</span>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-white/40 animate-pulse shadow-sm"
                  style={{ backgroundColor: COLOR_PALETTE[localPlayer.color]?.primary }}
                />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {localPlayer.color}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Player Avatar Status Pills */}
        <div className="pointer-events-auto flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {players.map((p) => {
            const isTurn = gameStarted && !winner && currentTurnColor === p.color;
            const homeCount = tokens[p.color]?.filter((step) => step === 56).length || 0;
            const theme = COLOR_PALETTE[p.color];

            return (
              <div
                key={p.id}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel transition-all ${
                  isTurn
                    ? 'ring-2 ring-offset-2 ring-offset-slate-950 scale-105 shadow-lg'
                    : 'opacity-85'
                }`}
                style={{
                  borderColor: isTurn ? theme.primary : 'rgba(255,255,255,0.08)',
                  ...(isTurn ? { '--tw-ring-color': theme.primary } : {}),
                }}
              >
                {/* Color Dot / Status */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: theme.primary }}
                />

                {/* Name */}
                <span className="text-xs font-medium text-white max-w-[90px] truncate">
                  {p.name} {p.id === localPlayer?.id && '(You)'}
                </span>

                {/* Bot Icon */}
                {p.isBot && <Bot className="w-3.5 h-3.5 text-slate-400" />}

                {/* Disconnected Icon */}
                {!p.isConnected && !p.isBot && <WifiOff className="w-3.5 h-3.5 text-rose-400" />}

                {/* Home tokens indicator */}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300">
                  {homeCount}/4
                </span>
              </div>
            );
          })}
        </div>
      </header>

      {/* ======================================================== */}
      {/* FLOATING NOTIFICATION TOAST                              */}
      {/* ======================================================== */}
      {notification && (
        <div className="self-center -mt-8 animate-bounce-subtle pointer-events-none">
          <div className="px-4 py-2 rounded-xl glass-panel border border-white/15 shadow-2xl text-xs sm:text-sm font-semibold text-white tracking-wide">
            {notification}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BOTTOM CONTROL DOCK: Turn Indicator & Roll Action        */}
      {/* ======================================================== */}
      <footer className="w-full flex justify-center pb-2">
        <div className="pointer-events-auto">
          {!gameStarted ? (
            /* Lobby Waiting State */
            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl glass-panel border border-white/10 shadow-2xl">
              <span className="text-xs text-slate-400 font-medium">
                {players.length < (roomState.maxPlayers || 4)
                  ? `${players.length}/${roomState.maxPlayers || 4} players joined • Missing slots will become AI bots`
                  : `Room is full (${players.length}/${roomState.maxPlayers || 4} players)! Ready to roll`}
              </span>
              {isHost ? (
                <button
                  onClick={onStartGame}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                >
                  Start Game Now
                </button>
              ) : (
                <div className="px-4 py-2 text-xs font-semibold text-slate-400">
                  Waiting for host to start...
                </div>
              )}
            </div>
          ) : winner ? (
            /* Winner Banner (if modal closed) */
            <button
              onClick={onRestartGame}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Rematch / Play Again
            </button>
          ) : (
            /* In-Game Active Turn Dock */
            <div className="flex items-center gap-3 p-2 rounded-2xl glass-panel border border-white/10 shadow-2xl">
              {isMyTurn ? (
                canRoll ? (
                  <button
                    onClick={onRollDice}
                    disabled={isRolling}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                  >
                    <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
                    <span>{isRolling ? 'Rolling...' : 'Roll Dice'}</span>
                  </button>
                ) : diceRolled && validMoves?.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        Rolled <strong>{diceValue}</strong>! Move your{' '}
                        <span
                          className="uppercase font-bold tracking-wider px-1.5 py-0.5 rounded text-white"
                          style={{ backgroundColor: COLOR_PALETTE[localPlayer?.color]?.primary }}
                        >
                          {localPlayer?.color}
                        </span>{' '}
                        pawn:
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      {validMoves.map((tokenIdx) => {
                        const isBase = tokens[localPlayer?.color]?.[tokenIdx] === -1;
                        return (
                          <button
                            key={tokenIdx}
                            onClick={() => onMoveToken && onMoveToken(tokenIdx)}
                            className="px-3.5 py-1.5 rounded-lg active:scale-95 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 ring-1 ring-white/20 hover:ring-white/40"
                            style={{ backgroundColor: COLOR_PALETTE[localPlayer?.color]?.primary }}
                          >
                            <span>Your Pawn #{tokenIdx + 1}</span>
                            {isBase ? (
                              <span className="text-[10px] bg-black/25 px-1.5 py-0.5 rounded uppercase font-semibold">Exit Base</span>
                            ) : (
                              <span className="text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-semibold">+{diceValue}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-2.5 text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <span className="animate-spin text-blue-400">⏳</span>
                    <span>
                      {diceValue ? `Rolled ${diceValue} • No moves available • Passing turn...` : 'Advancing turn...'}
                    </span>
                  </div>
                )
              ) : (
                /* Opponent Turn Pill */
                <div className="flex items-center gap-2.5 px-5 py-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: COLOR_PALETTE[currentTurnColor]?.primary || '#FFFFFF' }}
                  />
                  <span className="text-sm font-medium text-slate-200">
                    {currentPlayer?.name || currentTurnColor?.toUpperCase()}’s Turn
                    {isRolling ? ' (Rolling...)' : (diceValue ? ` (Rolled ${diceValue})` : '...')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </footer>

      {/* ======================================================== */}
      {/* WINNER MODAL CELEBRATION                                 */}
      {/* ======================================================== */}
      {winner && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl glass-panel p-6 text-center border border-white/10 shadow-2xl">
            <div className="inline-flex p-4 rounded-full bg-amber-400/10 text-amber-400 mb-4 ring-8 ring-amber-400/5">
              <Crown className="w-10 h-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mb-1">VICTORY!</h2>
            <p className="text-sm text-slate-400 mb-6">
              <strong className="text-white font-semibold">
                {players.find((p) => p.color === winner)?.name || winner.toUpperCase()}
              </strong>{' '}
              has successfully guided all 4 pawns home!
            </p>
            <button
              onClick={onRestartGame}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl active:scale-95 transition-all"
            >
              Play Rematch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
