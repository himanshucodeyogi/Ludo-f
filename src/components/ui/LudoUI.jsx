import React, { useState } from 'react';
import { Copy, Check, Dices, Crown, Bot, WifiOff, RotateCcw } from 'lucide-react';
import { COLOR_PALETTE } from '../../constants/boardCoordinates';

// Which cells of a 3x3 grid carry a pip for each dice value
const PIP_CELLS = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function DiceFace({ value, rolling }) {
  const pips = rolling || !value ? [] : PIP_CELLS[value] || [];
  return (
    <div
      className={`grid grid-cols-3 grid-rows-3 gap-0.5 p-2 w-12 h-12 sm:w-14 sm:h-14 short:w-11 short:h-11 short:p-1.5 flex-shrink-0 rounded-xl bg-white shadow-lg shadow-black/40 ring-1 ring-black/10 transition-opacity ${
        rolling ? 'animate-spin opacity-80' : !value ? 'opacity-40' : ''
      }`}
      aria-label={value && !rolling ? `Dice shows ${value}` : 'Dice not rolled'}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className={`m-auto w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
            pips.includes(i) ? (value === 1 ? 'bg-rose-500' : 'bg-slate-900') : ''
          }`}
        />
      ))}
    </div>
  );
}

export function LudoUI({
  connected = true,
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
  const turnTheme = COLOR_PALETTE[currentTurnColor];
  const isHost = localPlayer?.isHost;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col hud-safe">
      {/* ======================================================== */}
      {/* TOP BAR: Room Code & Minimalist Player Avatars           */}
      {/* ======================================================== */}
      <header className="flex flex-col sm:flex-row short:flex-row items-center justify-between gap-2 sm:gap-3 short:gap-2 w-full">
        <div className="flex items-center justify-center gap-2 flex-wrap flex-shrink-0">
          {/* Room Code Badge */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 pl-3 pr-1 py-1 sm:py-1.5 rounded-full glass-panel border border-white/10 shadow-lg">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold">Room</span>
            <span className="text-sm font-bold font-mono text-white tracking-widest">{roomId}</span>
            <button
              onClick={copyRoomCode}
              title="Copy Room Code"
              aria-label="Copy room code"
              className="p-2 sm:p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Local Player Color & Identity Badge */}
          {localPlayer && (
            <div
              className="pointer-events-auto flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full glass-panel border shadow-lg"
              style={{
                borderColor: `${COLOR_PALETTE[localPlayer.color]?.primary || '#FFFFFF'}90`,
                boxShadow: `0 0 16px ${COLOR_PALETTE[localPlayer.color]?.primary || '#FFFFFF'}35`,
              }}
            >
              <span className="text-xs text-slate-300 font-medium hidden sm:inline short:hidden">Your Pawns:</span>
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
        <div className="pointer-events-auto no-scrollbar flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full min-w-0 px-1 py-1">
          {players.map((p) => {
            const isTurn = gameStarted && !winner && currentTurnColor === p.color;
            const homeCount = tokens[p.color]?.filter((step) => step === 56).length || 0;
            const theme = COLOR_PALETTE[p.color];

            return (
              <div
                key={p.id}
                className={`relative flex flex-shrink-0 items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full glass-panel transition-all ${
                  isTurn
                    ? 'ring-2 ring-offset-1 sm:ring-offset-2 ring-offset-slate-950 sm:scale-105 shadow-lg'
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
                <span className="text-[11px] sm:text-xs font-medium text-white max-w-[64px] sm:max-w-[90px] truncate">
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
      {/* STATUS BANNERS: flow right under the header (whatever its height) so they never cover the dice / board center */}
      {/* ======================================================== */}
      <div className="pointer-events-none mt-2 flex flex-col items-center gap-2 self-center max-w-full">
        {!connected && (
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 shadow-2xl text-xs sm:text-sm font-semibold text-rose-300 text-center">
            <WifiOff className="w-4 h-4 flex-shrink-0" /> Connection lost. Reconnecting to server...
          </div>
        )}
        {notification && (
          <div className="animate-bounce-subtle px-3 sm:px-4 py-2 rounded-xl glass-panel border border-white/15 shadow-2xl text-xs sm:text-sm font-semibold text-white tracking-wide text-center">
            {notification}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* BOTTOM CONTROL DOCK: Turn Indicator & Roll Action        */}
      {/* ======================================================== */}
      {/* Bottom-center on phones; bottom-right on wide screens so it doesn't cover your home base */}
      {/* Landscape phones: bottom-right as well, to keep the middle of the short screen free */}
      <footer className="mt-auto w-full flex justify-center lg:justify-end short:justify-end">
        <div className="pointer-events-auto max-w-full sm:max-w-md lg:max-w-none">
          {!gameStarted ? (
            /* Lobby Waiting State */
            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl glass-panel border border-white/10 shadow-2xl">
              <span className="text-xs text-slate-400 font-medium text-center">
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
            /* In-Game Turn Card */
            <div
              className="flex items-center gap-3 sm:gap-4 short:gap-2.5 p-2.5 sm:p-3 short:p-2 rounded-2xl glass-panel border shadow-2xl transition-colors"
              style={{
                borderColor: `${turnTheme?.primary || '#FFFFFF'}${isMyTurn ? 'AA' : '33'}`,
                boxShadow: isMyTurn ? `0 0 28px ${turnTheme?.primary}40` : undefined,
              }}
            >
              {/* Last roll shown as a real dice face, so the value is readable at any camera angle */}
              <DiceFace value={diceRolled ? diceValue : null} rolling={isRolling} />

              <div className="flex flex-col gap-2 min-w-0">
                {/* Whose turn */}
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isMyTurn ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: turnTheme?.primary || '#FFFFFF' }}
                  />
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white truncate">
                    {isMyTurn ? 'Your turn' : `${currentPlayer?.name || currentTurnColor}'s turn`}
                  </span>
                </div>

                {/* What to do now */}
                {isMyTurn && canRoll ? (
                  <button
                    onClick={onRollDice}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 short:py-2 min-h-[44px] short:min-h-[40px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                  >
                    <Dices className="w-5 h-5" />
                    <span>Roll Dice</span>
                    <kbd className="hidden sm:inline text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/15 text-blue-100">
                      Space
                    </kbd>
                  </button>
                ) : isMyTurn && diceRolled && validMoves?.length > 0 && !isRolling ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-slate-300">
                      Tap a glowing pawn, or pick one
                      <span className="hidden sm:inline"> (or press its number key)</span>:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {validMoves.map((tokenIdx) => {
                        const isBase = tokens[localPlayer?.color]?.[tokenIdx] === -1;
                        return (
                          <button
                            key={tokenIdx}
                            onClick={() => onMoveToken && onMoveToken(tokenIdx)}
                            className="px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg active:scale-95 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 ring-1 ring-white/25 hover:ring-white/60 hover:brightness-110"
                            style={{ backgroundColor: turnTheme?.primary }}
                          >
                            <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded bg-white/90 text-slate-900">
                              {tokenIdx + 1}
                            </kbd>
                            <span>Pawn {tokenIdx + 1}</span>
                            <span className="text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-semibold">
                              {isBase ? 'Exit base' : `+${diceValue}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm text-slate-300">
                    {isRolling
                      ? 'Rolling...'
                      : diceRolled && validMoves?.length === 0
                        ? `Rolled ${diceValue} • no moves, passing turn`
                        : diceRolled
                          ? `Rolled ${diceValue} • choosing a pawn`
                          : isMyTurn
                            ? 'Get ready...'
                            : 'Waiting for their roll'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* ======================================================== */}
      {/* WINNER MODAL CELEBRATION                                 */}
      {/* ======================================================== */}
      {winner && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="w-full max-w-sm max-h-full overflow-y-auto rounded-3xl glass-panel p-6 short:p-4 text-center border border-white/10 shadow-2xl">
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
